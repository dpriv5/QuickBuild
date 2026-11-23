
# QuickBuild

A full-stack task management application built with React, FastAPI and PostgreSQL. QuickBuild helps users organise tasks, monitor progress and manage their daily workload through a modern dashboard.

## Tech Stack

**Frontend**
- React
- JavaScript
- CSS
- Vite

**Backend**
- Python
- FastAPI
- SQLAlchemy

**Database**
- PostgreSQL

**Version Control**
- Git and GitHub

## Features

- Create tasks with titles and optional descriptions
- View tasks in an interactive dashboard
- Mark tasks as completed or pending
- Delete tasks
- Search and filter tasks
- Monitor task completion statistics
- Persist task data using PostgreSQL
- Communicate between the frontend and backend through a REST API

## Project Structure

```text
QuickBuild/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Python
- Node.js and npm
- PostgreSQL

### 1. Clone the repository

```bash
git clone https://github.com/dpriv5/QuickBuild.git
cd QuickBuild
```

### 2. Set up the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a PostgreSQL database named `quickbuild`.

Configure the database connection in `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg:///quickbuild
```

Start the backend:

```bash
uvicorn main:app --reload
```

Backend: http://localhost:8000

API documentation: http://localhost:8000/docs

### 3. Set up the frontend

Open another terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## Future Improvements

- Task priorities
- Task deadlines
- User authentication
- Automated testing
- Cloud deployment

## Project Status

Active development.

## Author

Developed by [dpriv5](https://github.com/dpriv5).

