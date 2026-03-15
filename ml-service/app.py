"""
Smart Doubt Exchange — Similar Doubts ML Service
Uses TF-IDF + Cosine Similarity to find semantically similar doubts.
Run: python app.py  (default port 5001)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re
import os

app = Flask(__name__)
CORS(app, origins=[os.getenv("CLIENT_ORIGIN", "http://localhost:5000")])

# ---------------------------------------------------------------------------
# Text helpers
# ---------------------------------------------------------------------------

STOP_WORDS = "english"

def clean(text: str) -> str:
    """Lowercase, strip HTML-ish chars, collapse whitespace."""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def combined_text(title: str, content: str = "", subject: str = "") -> str:
    """Combine fields, weight title 3× (repeat it) for better matching."""
    parts = [title] * 3
    if subject:
        parts.append(subject)
    if content:
        # Only first 300 chars of content to keep vectors light
        parts.append(content[:300])
    return clean(" ".join(parts))

# ---------------------------------------------------------------------------
# Core similarity
# ---------------------------------------------------------------------------

def find_similar(query_title: str,
                 query_content: str,
                 query_subject: str,
                 doubts: list,
                 top_n: int = 5,
                 threshold: float = 0.25) -> list:
    """
    doubts: list of dicts with keys: _id, title, content, subject, status, answerCount
    Returns: list of similar doubts sorted by similarity score desc, score >= threshold
    """
    if not doubts:
        return []

    query_text = combined_text(query_title, query_content, query_subject)
    corpus_texts = [combined_text(d.get("title",""), d.get("content",""), d.get("subject",""))
                    for d in doubts]

    all_texts = [query_text] + corpus_texts

    vectorizer = TfidfVectorizer(
        stop_words=STOP_WORDS,
        ngram_range=(1, 2),   # unigrams + bigrams
        max_features=10_000,
        sublinear_tf=True,    # log-scale TF dampening
    )

    try:
        tfidf_matrix = vectorizer.fit_transform(all_texts)
    except ValueError:
        # Can happen if vocabulary is empty after stop-word removal
        return []

    query_vec = tfidf_matrix[0]
    corpus_vecs = tfidf_matrix[1:]

    scores = cosine_similarity(query_vec, corpus_vecs).flatten()

    results = []
    for idx, score in enumerate(scores):
        if float(score) >= threshold:
            doubt = doubts[idx]
            results.append({
                "_id":        doubt.get("_id"),
                "title":      doubt.get("title"),
                "subject":    doubt.get("subject"),
                "status":     doubt.get("status", "open"),
                "answerCount":doubt.get("answerCount", 0),
                "score":      round(float(score), 4),
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_n]

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "Similar Doubts ML"})


@app.route("/similar", methods=["POST"])
def similar():
    """
    Body (JSON):
    {
        "title":   "how does photosynthesis work",
        "content": "(optional) longer description",
        "subject": "(optional) Biology",
        "doubts":  [ { "_id", "title", "content", "subject", "status", "answerCount" }, ... ],
        "top_n":   5,       // optional, default 5
        "threshold": 0.25   // optional, default 0.25
    }
    """
    body = request.get_json(force=True, silent=True) or {}

    query_title   = body.get("title",   "").strip()
    query_content = body.get("content", "").strip()
    query_subject = body.get("subject", "").strip()
    doubts        = body.get("doubts",  [])
    top_n         = int(body.get("top_n", 5))
    threshold     = float(body.get("threshold", 0.25))

    if not query_title:
        return jsonify({"error": "title is required"}), 400

    similar_doubts = find_similar(
        query_title, query_content, query_subject,
        doubts, top_n, threshold
    )

    return jsonify({
        "query":   query_title,
        "similar": similar_doubts,
        "count":   len(similar_doubts),
    })


if __name__ == "__main__":
    port = int(os.getenv("ML_PORT", 5001))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    print(f"🤖 ML Service running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)