# CollabSphere

AI-powered developer collaboration platform. Create projects, invite teammates, write Markdown notes, share files and use Google Gemini to explain code, improve notes and generate READMEs.

**Live demo:** https://live-link
**Built by:** Astha

## Features

- Register and login (JWT and bcrypt)
- Projects with team members
- Markdown notes with live preview
- Gemini: explain note, suggest improvements, explain code, generate README
- File upload with preview (code, images, PDFs)
- Contribution analytics
- Public read-only project page

## Tech Stack

React, Vite, Node.js, Express, MongoDB, Mongoose, Multer, Google Gemini API

## Run Locally

```bash
npm run install:all
```

Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env`, then fill in the values:

| Variable | Description |
| --- | --- |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Any long random string |
| `GEMINI_API_KEY` | Key from aistudio.google.com |
| `VITE_API_URL` | Backend URL (`http://localhost:5000`) |

```bash
npm run dev
```