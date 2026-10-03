"""Rule/lexicon-based sentiment scoring.

Scope note: sentiment is intentionally NOT a trained ML classifier. We have
no labeled sentiment data for this course project (the seed dataset only
labels category/priority), and hand-labeling one just to train a third
pipeline would add effort without improving reliability over a well-tested
lexicon approach. VADER (a rule-based lexicon + heuristics model tuned for
short, informal text) is a good fit for ticket-length text and needs no
training data.
"""

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_analyzer = SentimentIntensityAnalyzer()

# VADER's own recommended thresholds on the compound score.
POSITIVE_THRESHOLD = 0.05
NEGATIVE_THRESHOLD = -0.05


def analyze_sentiment(text: str) -> str:
    scores = _analyzer.polarity_scores(text or "")
    compound = scores["compound"]
    if compound >= POSITIVE_THRESHOLD:
        return "Positive"
    if compound <= NEGATIVE_THRESHOLD:
        return "Negative"
    return "Neutral"
