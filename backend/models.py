from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, func
from database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, server_default=func.now())
    priority = Column(String(10), nullable=False, default="Medium")
    due_date = Column(Date, nullable=True)