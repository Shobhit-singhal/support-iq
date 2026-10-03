"""Train the TF-IDF + Logistic Regression pipelines for category and priority.

Two independent pipelines are trained (one per label) rather than a single
multi-output model because scikit-learn's LogisticRegression is a plain
binary/multiclass classifier -- keeping two simple pipelines is more
"explainable" (per the course spec) than reaching for a multi-output wrapper.

This module exposes `train_and_save()` so it can be reused both by the
one-off `python training/train.py` script and by the FastAPI `/retrain`
endpoint (same code path -> no drift between the two).
"""
import os
import sys

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(THIS_DIR)
MODEL_DIR = os.path.join(ROOT_DIR, "model")
CATEGORY_MODEL_PATH = os.path.join(MODEL_DIR, "category_model.pkl")
PRIORITY_MODEL_PATH = os.path.join(MODEL_DIR, "priority_model.pkl")


def build_pipeline() -> Pipeline:
    return Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, stop_words="english")),
        ("clf", LogisticRegression(max_iter=1000)),
    ])


def train_and_save(samples, model_dir: str = MODEL_DIR):
    """Train category + priority pipelines on `samples` and persist them.

    `samples` is a list of dicts/objects with .text/.category/.priority
    (or ["text"]/["category"]/["priority"] keys). Returns a metrics dict.
    """
    def get(s, key):
        return s[key] if isinstance(s, dict) else getattr(s, key)

    texts = [get(s, "text") for s in samples]
    categories = [get(s, "category") for s in samples]
    priorities = [get(s, "priority") for s in samples]

    if len(samples) < 10:
        raise ValueError("Need at least 10 samples to train a meaningful model")

    # Stratify by category (well balanced by construction); priority classes
    # can be too sparse per-class to stratify safely, so split once and reuse
    # the same indices for both labels to keep train/test aligned.
    indices = list(range(len(samples)))
    try:
        train_idx, test_idx = train_test_split(
            indices, test_size=0.2, random_state=42, stratify=categories
        )
    except ValueError:
        # Fallback if some category has too few members to stratify.
        train_idx, test_idx = train_test_split(indices, test_size=0.2, random_state=42)

    def subset(lst, idx):
        return [lst[i] for i in idx]

    x_train, x_test = subset(texts, train_idx), subset(texts, test_idx)
    cat_train, cat_test = subset(categories, train_idx), subset(categories, test_idx)
    pri_train, pri_test = subset(priorities, train_idx), subset(priorities, test_idx)

    category_pipeline = build_pipeline()
    category_pipeline.fit(x_train, cat_train)
    category_accuracy = accuracy_score(cat_test, category_pipeline.predict(x_test))

    priority_pipeline = build_pipeline()
    priority_pipeline.fit(x_train, pri_train)
    priority_accuracy = accuracy_score(pri_test, priority_pipeline.predict(x_test))

    os.makedirs(model_dir, exist_ok=True)
    joblib.dump(category_pipeline, os.path.join(model_dir, "category_model.pkl"))
    joblib.dump(priority_pipeline, os.path.join(model_dir, "priority_model.pkl"))

    return {
        "trained_on": len(samples),
        "category_accuracy": round(float(category_accuracy), 4),
        "priority_accuracy": round(float(priority_accuracy), 4),
        "categories": sorted(set(categories)),
    }


if __name__ == "__main__":
    sys.path.insert(0, ROOT_DIR)
    from training.seed_data import SEED_DATA

    metrics = train_and_save(SEED_DATA)
    print(f"Trained on {metrics['trained_on']} samples")
    print(f"Category model held-out accuracy: {metrics['category_accuracy']}")
    print(f"Priority model held-out accuracy: {metrics['priority_accuracy']}")
    print(f"Categories: {metrics['categories']}")
    print(f"Saved: {CATEGORY_MODEL_PATH}")
    print(f"Saved: {PRIORITY_MODEL_PATH}")
