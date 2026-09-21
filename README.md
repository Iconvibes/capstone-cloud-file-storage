# CloudFileStorageApp

Secure cloud file storage — upload, organize, download and share files.

## Structure

```text
backend/   Express, Mongoose, authentication, storage, and API scaffold
frontend/  React UI scaffold
```

## Run locally

Install and start the backend:

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Install and start the frontend in a second terminal:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

The backend runs on `http://localhost:5000` by default. Vite prints the frontend URL after startup.
