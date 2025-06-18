from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='static')
CORS(app)

# Load and parse knowledge base
def load_knowledge_base(path='knowledge_base.txt'):
    entries = []
    with open(path, encoding='utf-8') as f:
        for line in f:
            if line.strip():
                entries.append(line.strip())
    return entries

kb_entries = load_knowledge_base()
vectorizer = TfidfVectorizer().fit(kb_entries)

# Groq client
client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ.get("GROQ_API_KEY")
)

print("GROQ_API_KEY:", os.environ.get("GROQ_API_KEY"))

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message', '')
    if not user_message:
        return jsonify({'response': 'Please ask a question.'})

    # Find most relevant KB entry
    user_vec = vectorizer.transform([user_message])
    kb_vecs = vectorizer.transform(kb_entries)
    sims = cosine_similarity(user_vec, kb_vecs)[0]
    idx = sims.argmax()
    context = kb_entries[idx] if sims[idx] > 0.2 else ""

    # Compose prompt for LLM
    system_prompt = (
        f"You are BidGPT. Always be concise. You are an expert in tender and bid related queries. Be professional.Use the following knowledge base.\n"
        f"Knowledge base: {context}\n"
        f"User question: {user_message}"
    )

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    )
    answer = completion.choices[0].message.content
    return jsonify({'response': answer})

# Serve static files (frontend)
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(debug=True)