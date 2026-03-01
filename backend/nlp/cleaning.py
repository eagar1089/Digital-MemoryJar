from backend.text_preprocessor import TextPreprocessor


def clean_text(text: str) -> str:
    preprocessor = TextPreprocessor()
    result = preprocessor.preprocess(text)
    return result["cleaned"]
