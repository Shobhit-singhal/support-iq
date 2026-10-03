"""FastAPI ML microservice: ticket category/priority classification,
rule-based sentiment, and team suggestion, for the TicketFlow AI project.
"""
import logging
import os

import joblib
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from model.schema import (
    ClassifyRequest,
    ClassifyResponse,
    HealthResponse,
    RetrainRequest,
    RetrainResponse,
)
from model.sentiment import analyze_sentiment
from model.team_mapping import suggest_team
from training.train import CATEGORY_MODEL_PATH, PRIORITY_MODEL_PATH, train_and_save

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml-service")

app = FastAPI(title="TicketFlow AI - ML Service", version="1.0.0")

# Server-to-server calls from the Node backend don't need CORS, but permissive
# CORS is enabled anyway so the API can be exercised directly from a browser
# or the Swagger UI during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

_category_model = None
_priority_model = None


def _load_models():
    """Load model artifacts from disk into module-level globals.

    Failure to load is logged clearly but does not crash the process --
    /classify will return a 503 until a valid model is trained/restored,
    which keeps /health and /retrain usable for recovery.
    """
    global _category_model, _priority_model
    try:
        _category_model = joblib.load(CATEGORY_MODEL_PATH)
        _priority_model = joblib.load(PRIORITY_MODEL_PATH)
        logger.info("Loaded category and priority models from disk.")
    except FileNotFoundError as exc:
        _category_model = None
        _priority_model = None
        logger.error(
            "Model artifacts not found (%s). Run `python training/train.py` "
            "to generate model/category_model.pkl and model/priority_model.pkl.",
            exc,
        )
    except Exception:
        _category_model = None
        _priority_model = None
        logger.exception("Failed to load model artifacts.")


@app.on_event("startup")
def on_startup():
    _load_models()


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        model_loaded=_category_model is not None and _priority_model is not None,
    )


@app.post("/classify", response_model=ClassifyResponse)
def classify(payload: ClassifyRequest):
    if _category_model is None or _priority_model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Run training/train.py or call /retrain first.",
        )

    text = payload.text
    category = str(_category_model.predict([text])[0])
    priority = str(_priority_model.predict([text])[0])
    sentiment = analyze_sentiment(text)
    team = suggest_team(category)

    return ClassifyResponse(
        category=category,
        priority=priority,
        sentiment=sentiment,
        suggested_team=team,
    )


@app.post("/retrain", response_model=RetrainResponse)
def retrain(payload: RetrainRequest):
    if len(payload.samples) < 10:
        raise HTTPException(
            status_code=400,
            detail="At least 10 labeled samples are required to retrain.",
        )

    try:
        metrics = train_and_save(payload.samples)
    except Exception as exc:
        logger.exception("Retraining failed.")
        raise HTTPException(status_code=500, detail=f"Retraining failed: {exc}") from exc

    # Reload the freshly saved artifacts into memory so subsequent /classify
    # calls use the newly retrained model without needing a process restart.
    _load_models()

    return RetrainResponse(
        trained_on=metrics["trained_on"],
        category_accuracy=metrics["category_accuracy"],
        priority_accuracy=metrics["priority_accuracy"],
        categories=metrics["categories"],
        message="Model retrained and saved successfully.",
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
