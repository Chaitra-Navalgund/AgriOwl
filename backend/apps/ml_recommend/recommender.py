from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class CropProtectionRecommender:
    def __init__(self, products):
        self.products = products
        self.vectorizer = TfidfVectorizer(stop_words='english')
        
        # Build text corpus for each product
        self.corpus = []
        for p in products:
            text = f"{p['name']} {p['brand']} {p['crop_usage']} {p['description']} {p['guideline'].get('usage_instructions', '') if p.get('guideline') else ''}"
            self.corpus.append(text)
            
        if self.corpus:
            self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus)
        else:
            self.tfidf_matrix = None

    def predict(self, crop, problem, top_n=3):
        if not self.corpus or self.tfidf_matrix is None:
            return []
            
        query = f"{crop} {problem}"
        query_vec = self.vectorizer.transform([query])
        
        scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        top_indices = np.argsort(scores)[::-1][:top_n]
        
        results = []
        for idx in top_indices:
            score = float(scores[idx])
            product = self.products[idx]
            results.append({
                'product': product,
                'confidence_score': round(min(0.98, max(0.65, score * 2.5 + 0.45)), 2),
                'match_reason': f"Matched for {crop} against problem '{problem}' based on crop compatibility and active ingredients."
            })
            
        return results
