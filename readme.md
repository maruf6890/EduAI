# EduAI

EduAI is an AI-powered classroom platform with a Next.js frontend and a FastAPI backend. The site supports student and instructor workflows such as authentication, classrooms, assignments, quizzes, announcements, discussion spaces, chat, calendars, and shared learning materials.

## Repository Layout

- `backend/` - FastAPI API, PostgreSQL access layer, migrations, and AI agent logic
- `frontend/` - Next.js app with the public landing page and authenticated classroom experience

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Backend: FastAPI, PostgreSQL, psycopg2, Pydantic
- UI and interactions: Radix UI, shadcn-style components, Framer Motion, Sonner
- Maps and visuals: Leaflet, React Leaflet, XYFlow

## Core Features

- User authentication and session management
- Classroom creation and enrollment
- Assignments, quizzes, and grading workflows
- Announcements, discussions, and messaging
- Calendar and schedule views
- Material upload and learning resource organization
- AI-assisted learning and classroom productivity tools

## Prerequisites

- Node.js 20 or newer
- Python 3.11 or newer
- PostgreSQL
- npm, pnpm, yarn, or bun for the frontend
- pip for the backend

## Local Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
psql -U postgres -d ai_classroom -f migrations/001_create_users.sql
python main.py
```

Backend API docs will be available at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install
```

Create a `frontend/.env.local` file and point it to the backend API:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Environment Variables

### Backend

- `SECRET_KEY` - JWT signing secret
- Database credentials required by the backend `.env` file

### Frontend

- `NEXT_PUBLIC_BACKEND_URL` - Base URL of the backend API

## Available Scripts

### Frontend

- `npm run dev` - start the development server
- `npm run build` - create a production build
- `npm run start` - run the production server
- `npm run lint` - run ESLint checks

### Backend

- `python main.py` - start the FastAPI application

## API Overview

The backend exposes REST endpoints under `/api/v1`. The authentication routes include register, login, refresh, logout, and profile management. Additional routers cover classrooms, assignments, announcements, calendar, discussions, materials, quizzes, people, chat, and classroom requests.

## Development Notes

- Run the backend before using frontend flows that depend on live data.
- Keep the backend URL in sync between the frontend environment file and the API server port.
- Apply database migrations before testing authentication or classroom flows.

## Deployment

Deploy the backend and frontend as separate services or as a coordinated monorepo release. Make sure the frontend environment points to the production backend URL, and provision PostgreSQL with the required schema before starting the API.
