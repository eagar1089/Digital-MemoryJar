"""
TEXT PREPROCESSING & CLEANING MODULE
=====================================

This module implements the complete text preprocessing pipeline using spaCy:
1. Load NLP Pipeline (spaCy model)
2. Normalize Text (lowercase, remove special chars, URLs)
3. Tokenize & Analyze (break into words, POS tags)
4. Lemmatize & Clean (reduce to base forms, remove stopwords)
5. Store cleaned text & metadata in MongoDB
6. Feed to downstream AI models

Pipeline Flow:
User Input → Normalize → Tokenize → Lemmatize → Store → AI Models
"""

import re
import string
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import logging

try:
    import spacy
    from spacy.language import Language
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    logging.warning("**************************************spaCy not installed. Install with: pip install spacy**************************************")
    logging.warning("**************************************Then download model: python -m spacy download en_core_web_sm**************************************")

from backend.connection import get_collection

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global cache for spaCy model (load once, reuse)
_nlp_model: Optional[Language] = None


def load_nlp_pipeline() -> Language:
    """
    Load and cache spaCy NLP pipeline.
    
    Downloads en_core_web_sm on first run.
    Uses cache on subsequent calls for performance.
    
    Returns:
        spacy Language model instance
    """
    global _nlp_model
    
    if _nlp_model is not None:
        return _nlp_model
    
    if not SPACY_AVAILABLE:
        raise RuntimeError("spaCy not installed. Run: pip install spacy")
    
    try:
        # Try to load the model
        _nlp_model = spacy.load("en_core_web_sm")
        logger.info("✓ Loaded spaCy model: en_core_web_sm")
        return _nlp_model
    except OSError:
        # Model not found, try to download
        logger.info("Downloading en_core_web_sm model...")
        ################################################################################3
        # import subprocess
        # subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"], check=True)
        import sys, subprocess
        subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], check=True)

        _nlp_model = spacy.load("en_core_web_sm")
        logger.info("✓ Downloaded and loaded en_core_web_sm")
        return _nlp_model


class TextPreprocessor:
    """Complete text preprocessing pipeline."""
    
    def __init__(self):
        """Initialize preprocessor with spaCy pipeline."""
        self.nlp = load_nlp_pipeline()
        self.stop_words = self.nlp.Defaults.stop_words
    
    def normalize_text(self, text: str) -> str:
        """
        Step 1: Normalize Text
        
        Operations:
        - Convert to lowercase
        - Remove URLs (https://..., http://...)
        - Remove email addresses
        - Remove special characters except apostrophes
        - Remove extra whitespace
        
        Example:
            Input:  "Check out https://example.com! I'm feeling GREAT!"
            Output: "check out i m feeling great"
        """
        if not text:
            return ""
        
        # Remove URLs
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)
        
        # Remove mentions (@user) and hashtags (#hashtag)
        text = re.sub(r'@\w+|#\w+', '', text)
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters but keep spaces and apostrophes
        text = re.sub(r"[^\w\s']", '', text)
        
        # Remove extra whitespace and tabs
        text = ' '.join(text.split())
        
        return text
    
    def tokenize_and_analyze(self, text: str) -> Tuple[List[str], List[Tuple[str, str]]]:
        """
        Step 2: Tokenize & Analyze
        
        Operations:
        - Break text into individual tokens (words, punctuation)
        - Identify POS tags (Part-of-Speech)
        - Extract linguistic features
        
        Returns:
            - tokens: List of token texts
            - pos_tags: List of (token, POS_tag) tuples
        
        Example:
            Input:  "I am feeling grateful"
            Tokens: ["I", "am", "feeling", "grateful"]
            POS:    [("I", "PRON"), ("am", "AUX"), ("feeling", "VERB"), ("grateful", "ADJ")]
        """
        if not text:
            return [], []
        
        doc = self.nlp(text)
        
        tokens = [token.text for token in doc]
        pos_tags = [(token.text, token.pos_) for token in doc]
        
        return tokens, pos_tags
    
    def lemmatize_and_clean(self, text: str, remove_stopwords: bool = True,remove_punctuation: bool = True) -> Tuple[str, Dict]:
        """
        Step 3: Lemmatize & Clean
        
        Operations:
        - Lemmatize: Reduce words to base form (feeling → feel, happily → happy)
        - Remove stopwords (the, is, a, etc.)
        - Remove punctuation
        - Extract linguistic metadata
        
        Args:
            text: Input text
            remove_stopwords: If True, filter out common words
            remove_punctuation: If True, remove punctuation tokens
        
        Returns:
            - cleaned_text: Lemmatized, cleaned text
            - metadata: Dict with preprocessing stats
        
        Example:
            Input:  "I am feeling very grateful and happy!"
            Output: "feeling grateful happy"
                    metadata: {
                        "lemmas": ["i", "be", "feel", "very", "grateful", "happy"],
                        "original_tokens": 7,
                        "cleaned_tokens": 3,
                        "removed_stopwords": 4,
                        "pos_distribution": {"VERB": 1, "ADJ": 2}
                    }
        """
        if not text:
            return "", {}
        
        doc = self.nlp(text)
        
        lemmas = []
        pos_distribution = {}
        removed_stopwords = 0
        original_count = 0
        
        for token in doc:
            original_count += 1
            
            # Count POS tags
            pos = token.pos_
            pos_distribution[pos] = pos_distribution.get(pos, 0) + 1
            
            # Skip stopwords
            if remove_stopwords and token.is_stop:
                removed_stopwords += 1
                continue
            
            # Skip punctuation
            if remove_punctuation and token.is_punct:
                continue
            
            # Get lemma (base form)
            lemma = token.lemma_.lower()
            
            # Skip single characters (unless important)
            if len(lemma) < 2 and token.pos_ not in ["NOUN", "VERB", "ADJ", "ADV"]:
                continue
            
            lemmas.append(lemma)
        
        cleaned_text = ' '.join(lemmas)
        
        metadata = {
            "original_token_count": original_count,
            "cleaned_token_count": len(lemmas),
            "removed_stopwords": removed_stopwords,
            "pos_distribution": pos_distribution,
            "compression_ratio": round(len(lemmas) / original_count, 2) if original_count > 0 else 0,
        }
        # for analization 
        return cleaned_text, metadata
    
    def extract_keywords(self, text: str, top_n: int = 10) -> List[str]:
        """
        Extract important keywords using noun chunks and POS tagging.
        
        Strategy:
        - Extract noun phrases (noun chunks)
        - Filter by part-of-speech (NOUN, VERB, ADJ)
        - Rank by frequency
        - Return top N
        """
        if not text:
            return []
        
        doc = self.nlp(text)
        
        # Extract noun chunks
        noun_chunks = [chunk.text.lower() for chunk in doc.noun_chunks]
        
        # Extract high-value POS (nouns, verbs, adjectives)
        important_tokens = [
            token.text.lower() 
            for token in doc 
            if token.pos_ in ["NOUN", "VERB", "ADJ", "ADV"] 
            and not token.is_stop
            and len(token.text) > 2
        ]
        
        # Combine and deduplicate
        all_keywords = list(set(noun_chunks + important_tokens))
        
        # Sort by frequency in text
        keyword_freq = {}
        for keyword in all_keywords:
            keyword_freq[keyword] = text.lower().count(keyword)
        
        sorted_keywords = sorted(
            keyword_freq.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        return [kw for kw, _ in sorted_keywords[:top_n]]
    
    def preprocess(self, text: str) -> Dict:
        """
        Complete preprocessing pipeline: all steps in sequence.
        
        Returns dict with:
        - original: Original input
        - normalized: After step 1 (normalize)
        - tokens: After step 2 (tokenize)
        - cleaned: After step 3 (lemmatize & clean)
        - keywords: Extracted keywords
        - metadata: Preprocessing statistics
        """
        if not text:
            return {
                "original": "",
                "normalized": "",
                "tokens": [],
                "pos_tags": [],
                "cleaned": "",
                "keywords": [],
                "metadata": {},
            }
        
        # Step 1: Normalize
        normalized = self.normalize_text(text)
        
        # Step 2: Tokenize
        tokens, pos_tags = self.tokenize_and_analyze(normalized)
        
        # Step 3: Lemmatize & Clean
        cleaned, metadata = self.lemmatize_and_clean(normalized)
        
        # Extract keywords
        keywords = self.extract_keywords(normalized)
        
        return {
            "original": text,
            "normalized": normalized,
            "tokens": tokens,
            "pos_tags": pos_tags,
            "cleaned": cleaned,
            "keywords": keywords,
            "metadata": metadata,
        }


def store_preprocessing_results(memory_id: str, preprocessing_results: Dict) -> bool:
    """
    Step 4: Store cleaned text & metadata in MongoDB.
    
    Stores the preprocessing output with the memory for downstream use.
    """
    col = get_collection("memories")
    
    try:
        update_data = {
            "preprocessing": {
                "normalized": preprocessing_results.get("normalized"),
                "cleaned": preprocessing_results.get("cleaned"),
                "tokens": preprocessing_results.get("tokens"),
                "keywords": preprocessing_results.get("keywords"),
                "metadata": preprocessing_results.get("metadata"),
            },
            "updated_at": datetime.utcnow(),
        }
        
        result = col.update_one(
            {"_id": __import__("bson").ObjectId(memory_id)},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Failed to store preprocessing results: {e}")
        return False


def preprocess_unprocessed_memories(batch_size: int = 50) -> Dict:
    """
    Process unprocessed memories through the preprocessing pipeline.
    
    Step 1 in the full NLP workflow.
    Subsequent steps (emotion analysis, embeddings) use cleaned text.
    """
    col = get_collection("memories")
    preprocessor = TextPreprocessor()
    
    # Find memories without preprocessing
    unprocessed = list(col.find(
        {"preprocessing": {"$exists": False}}
    ).limit(batch_size))
    
    processed_count = 0
    failed_count = 0
    errors = []
    
    for memory in unprocessed:
        try:
            memory_id = str(memory["_id"])
            content = memory.get("content", "")
            
            if not content:
                continue
            
            logger.info(f"Preprocessing memory {memory_id}...")
            
            # Run preprocessing pipeline
            results = preprocessor.preprocess(content)
            
            # Store results
            if store_preprocessing_results(memory_id, results):
                processed_count += 1
                logger.info(f"✓ Preprocessed {memory_id}")
            else:
                failed_count += 1
                errors.append(f"Failed to store preprocessing for {memory_id}")
        
        except Exception as e:
            failed_count += 1
            error_msg = f"Error preprocessing {memory.get('_id')}: {str(e)}"
            errors.append(error_msg)
            logger.error(error_msg)
    
    return {
        "total": len(unprocessed),
        "processed": processed_count,
        "failed": failed_count,
        "errors": errors,
    }


# Test the preprocessor
if __name__ == "__main__":
    preprocessor = TextPreprocessor()
    
    sample_text = """
    Today was a mix of productivity and much-needed relaxation! 
    I checked https://example.com for work, then took a 10-minute walk to clear my head.
    Feeling grateful and peaceful. Contact me at test@example.com if you need anything!
    """
    
    result = preprocessor.preprocess(sample_text)
    
    print("\n" + "="*60)
    print("TEXT PREPROCESSING PIPELINE OUTPUT")
    print("="*60)
    print(f"\nOriginal:\n{result['original']}")
    print(f"\nNormalized:\n{result['normalized']}")
    print(f"\nTokens: {result['tokens']}")
    print(f"\nPOS Tags: {result['pos_tags']}")
    print(f"\nCleaned:\n{result['cleaned']}")
    print(f"\nKeywords: {result['keywords']}")
    print(f"\nMetadata: {result['metadata']}")
    print("\n" + "="*60)
