"""Pydantic request/response models for the ML service API."""
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

Priority = Literal["Low", "Medium", "High", "Critical"]
Sentiment = Literal["Positive", "Neutral", "Negative"]


class ClassifyRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw support ticket text to classify")


class ClassifyResponse(BaseModel):
    category: str
    priority: Priority
    sentiment: Sentiment
    suggested_team: str


class TrainingSample(BaseModel):
    text: str
    category: str
    priority: Priority


class RetrainRequest(BaseModel):
    samples: List[TrainingSample]


class RetrainResponse(BaseModel):
    trained_on: int
    category_accuracy: float
    priority_accuracy: float
    categories: List[str]
    message: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
