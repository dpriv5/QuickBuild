
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models import Task


# Create the QuickBuild API
app = FastAPI(
    title="QuickBuild API",
    description="Backend API for the QuickBuild task management application",
    version="1.0.0"
)


# Allow React frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Task validation schema
class TaskSchema(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    completed: bool = False


# Welcome endpoint
@app.get("/")
def home():
    return {"message": "Welcome to QuickBuild API"}


# Health check
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "QuickBuild"
    }


# CREATE a task
@app.post("/tasks", status_code=201)
def create_task(task: TaskSchema, db: Session = Depends(get_db)):
    new_task = Task(
        title=task.title,
        description=task.description,
        completed=task.completed
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task


# READ all tasks
@app.get("/tasks")
def get_tasks(db: Session = Depends(get_db)):
    return db.query(Task).order_by(Task.id).all()


# UPDATE a task
@app.put("/tasks/{task_id}")
def update_task(
    task_id: int,
    updated_task: TaskSchema,
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id).first()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    task.title = updated_task.title
    task.description = updated_task.description
    task.completed = updated_task.completed

    db.commit()
    db.refresh(task)

    return task


# DELETE a task
@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()

    return {"message": "Task deleted successfully"}
