from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re
import os

app = Flask(__name__)
CORS(app)

STOP_WORDS = "english"

def clean(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def combined_text(title, content="", subject=""):
    parts = [title] * 3
    if subject:
        parts.append(subject)
    if content:
        parts.append(content[:300])
    return clean(" ".join(parts))

def find_similar(query_title, query_content, query_subject, doubts, top_n=5, threshold=0.25):
    if not doubts:
        return []
    query_text = combined_text(query_title, query_content, query_subject)
    corpus_texts = [combined_text(d.get("title",""), d.get("content",""), d.get("subject","")) for d in doubts]
    all_texts = [query_text] + corpus_texts
    vectorizer = TfidfVectorizer(stop_words=STOP_WORDS, ngram_range=(1,2), max_features=10000, sublinear_tf=True)
    try:
        tfidf_matrix = vectorizer.fit_transform(all_texts)
    except ValueError:
        return []
    scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    results = []
    for idx, score in enumerate(scores):
        if float(score) >= threshold:
            doubt = doubts[idx]
            results.append({
                "_id": doubt.get("_id"),
                "title": doubt.get("title"),
                "subject": doubt.get("subject"),
                "status": doubt.get("status", "open"),
                "answerCount": doubt.get("answerCount", 0),
                "score": round(float(score), 4),
            })
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_n]

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "Similar Doubts ML"})

@app.route("/similar", methods=["POST"])
def similar():
    body = request.get_json(force=True, silent=True) or {}
    query_title   = body.get("title", "").strip()
    query_content = body.get("content", "").strip()
    query_subject = body.get("subject", "").strip()
    doubts        = body.get("doubts", [])
    top_n         = int(body.get("top_n", 5))
    threshold     = float(body.get("threshold", 0.25))
    if not query_title:
        return jsonify({"error": "title is required"}), 400
    similar_doubts = find_similar(query_title, query_content, query_subject, doubts, top_n, threshold)
    return jsonify({"query": query_title, "similar": similar_doubts, "count": len(similar_doubts)})

print("🤖 ML Service running on http://localhost:5001")
app.run(host="0.0.0.0", port=5001, debug=False)
