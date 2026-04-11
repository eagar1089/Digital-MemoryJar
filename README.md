# Digital Memory Jar

Digital Memory Jar is an AI-powered journaling platform that helps users record thoughts, emotions, and reflections, then turns those entries into useful insights through NLP, analytics, and mood-aware recommendations.

## Overview

The project is split into two main parts:

### UI
- Built with Next.js 14, React, TypeScript, and Tailwind CSS.
- Provides a glassmorphic interface for journaling, analytics, timeline browsing, and the AI companion.
- Includes PWA support with a manifest, service worker, and offline page.
- Supports text entry, voice input, memory browsing, dashboard analytics, and Spotify-based mood suggestions.

### Backend
- Built with FastAPI and Python.
- Handles authentication, memory CRUD, AI analysis, weekly reflection, mood anomaly detection, companion chat, and Spotify suggestions.
- Uses a background NLP scheduler for asynchronous processing of memories.
- Runs a multilingual NLP pipeline for preprocessing, emotion scoring, keyword extraction, topic classification, and embedding generation.

## Hosted Setup

- Frontend: hosted on Vercel
- Backend: hosted on Hugging Face Spaces
- Database: MongoDB Atlas

## Key Features

- Secure Firebase-based authentication
- Create, update, delete, and browse journal memories
- AI memory analysis with mood detection, keywords, topics, and summaries
- Weekly reflection and mood anomaly insights
- AI companion chat grounded in past memories
- Spotify music suggestions based on emotional context
- Timeline and analytics dashboards
- Voice input for journaling
- Progressive Web App support

## Technology Stack

### UI
- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Recharts for analytics visualizations

### Backend
- FastAPI
- APScheduler for background jobs
- Hugging Face inference APIs
- Firebase Admin SDK for token verification
- Python NLP utilities and preprocessing

### Data and Services
- MongoDB Atlas
- Spotify Web API
- Hugging Face Spaces
- Vercel

## Architecture

1. The user writes a memory in the UI.
2. The frontend sends the entry to the FastAPI backend.
3. The backend stores the memory in MongoDB.
4. The NLP pipeline processes the entry asynchronously.
5. Enriched insights are returned to analytics, timeline, and companion screens.
6. Spotify suggestions are generated from mood and context signals.

## Local Development

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Environment Notes

- Set `NEXT_PUBLIC_API_URL` for the frontend.
- Set `MONGO_URI` for MongoDB.
- Set Firebase credentials for authentication.
- Set Hugging Face and Spotify secrets where needed.

## Project Goal

The goal of Digital Memory Jar is to combine journaling, affective computing, and multilingual NLP into a practical wellness tool with a modern user experience and a production-oriented backend.
