# VEDANT AI

A mobile-friendly bilingual (Hindi + English) AI assistant starter project using the Google Gemini API.

**Owner:** `VIKAS_HINDU`  
**Repository name:** `vedant-ai`  
**Configured model:** `gemini-3.1-pro-preview` (verify current API availability in Google AI Studio)

## Features

- Responsive chat UI for mobile and desktop
- Hindi, Hinglish, and English conversations
- Short in-memory chat history in the browser
- PDF text extraction and document Q&A (text-based PDFs, max 8 MB)
- API key kept on the server in `.env`
- Basic security headers and API rate limiting
- Health endpoint to check whether an API key is configured

## Run locally

Requires Node.js 20 or newer.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env`.

3. Add your Google AI Studio API key to `.env`:

   ```env
   GEMINI_API_KEY=your_real_api_key
   GEMINI_MODEL=gemini-3.1-pro-preview
   PORT=3000
   ```

4. Start the server:

   ```bash
   npm start
   ```

5. Open `http://localhost:3000`.

## Create the GitHub repository

1. Sign in to GitHub as `VIKAS_HINDU`.
2. Open GitHub's new repository page: https://github.com/new
3. Repository name: `vedant-ai`
4. Choose Public or Private as you prefer.
5. **Do not** initialize with a README, `.gitignore`, or license because these are already included.
6. Upload the files from this project ZIP, or use Git:

   ```bash
   git init
   git add .
   git commit -m "Initial VEDANT AI project"
   git branch -M main
   git remote add origin https://github.com/VIKAS_HINDU/vedant-ai.git
   git push -u origin main
   ```

If GitHub says the repository URL does not exist, create the repository first or check the exact username.

## Important API-key security

- Never paste your real API key into source code, chat messages, screenshots, or GitHub.
- `.env` is ignored by Git. Commit `.env.example` only.
- If a real key is accidentally published, revoke it and create a new one immediately.
- API availability, model naming, and billing depend on the Google account and current Gemini API terms. Check Google AI Studio before deploying.

## Current MVP limitations

- No login/authentication yet; do not use it for private user data as-is.
- Browser chat history is temporary and is not saved to a database.
- PDF support extracts text; scanned/image-only PDFs need OCR.
- No payments, CRM, WhatsApp, admin dashboard, or production deployment configuration yet.
- Add authentication, persistent storage, upload scanning, monitoring, and stricter per-user quotas before public launch.

## Project structure

```text
vedant-ai/
├── public/
│   ├── app.js
│   ├── index.html
│   └── style.css
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```
