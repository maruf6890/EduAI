# EduAI Frontend

EduAI is an AI-powered learning platform for classrooms, assignments, quizzes, discussions, and student support. This repository contains the Next.js frontend that powers the learner and instructor experience, including the public landing page, authentication flows, and protected classroom views.

## Overview

The frontend is built with Next.js and React and uses a modern component stack to deliver a polished classroom experience. It includes:

- A public landing page that introduces the product and its core value proposition.
- Authentication screens for sign in and registration.
- Protected classroom areas for dashboards, calendars, quizzes, community spaces, and profiles.
- Shared UI components, theme helpers, and app-level actions for communicating with the backend.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI and shadcn-style components
- Framer Motion
- Sonner for toast notifications
- Leaflet and React Leaflet for map-based experiences

## Prerequisites

- Node.js 20 or newer
- npm, pnpm, yarn, or bun
- A running EduAI backend API

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file named `.env.local` in the `frontend` folder and set the backend URL:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - start the development server
- `npm run build` - create a production build
- `npm run start` - run the production server
- `npm run lint` - run ESLint checks

## Project Structure

- `src/app` - application routes, layouts, and pages
- `src/components` - reusable UI and feature components
- `src/actions` - frontend API helpers and upload utilities
- `src/lib` - shared constants, utilities, and type helpers
- `public` - static assets

## Key Routes

- `/` - marketing landing page
- `/login` - sign-in flow
- `/register` - account registration
- `/dashboard` - authenticated classroom dashboard

## Backend Integration

API requests are routed through the backend URL defined by `NEXT_PUBLIC_BACKEND_URL` in `src/lib/constant.ts`. Make sure the backend service is running before testing flows that depend on user data, classrooms, quizzes, messages, or uploads.

## Deployment

This app can be deployed like any standard Next.js frontend. Set `NEXT_PUBLIC_BACKEND_URL` in the target environment so the frontend can reach the backend API, then build and start the app with the scripts above.
