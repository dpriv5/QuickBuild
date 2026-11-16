from pydantic import BaseModel
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Create the QuickBuild API
app = FastAPI(
    title="QuickBuild API",
    description="Backend API for the QuickBuild task management application",
    version="1.0.0"
)

# Allow our React frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Welcome endpoint
@app.get("/")
def home():
    return {
        "message": "Welcome to QuickBuild API"
    }

# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "QuickBuild"
    }

# Task data model
class Task(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False

# Temporary task storage
tasks = []
next_task_id = 1

# Create a new task
@app.post("/tasks", status_code=201)
def create_task(task: Task):
    global next_task_id

    new_task = {
        "id": next_task_id,
        "title": task.title,
        "description": task.description,
        "completed": task.completed
    }

    tasks.append(new_task)
    next_task_id += 1

    return new_task

# Retrieve all tasks
@app.get("/tasks")
def get_tasks():
    return tasks
# Update an existing task
@app.put("/tasks/{task_id}")
def update_task(task_id: int, updated_task: Task):
    for task in tasks:
        if task["id"] == task_id:
            task["title"] = updated_task.title
            task["description"] = updated_task.description
            task["completed"] = updated_task.completed

            return task

    raise HTTPException(
        status_code=404,
        detail="Task not found"
    )
    # Delete an existing task
@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    for task in tasks:
        if task["id"] == task_id:
            tasks.remove(task)

            return {
                "message": "Task deleted successfully"
            }

    raise HTTPException(
        status_code=404,
        detail="Task not found"
    )