# AI Customer Support System

An AI-powered customer support chatbot that combines a RAG (Retrieval-Augmented Generation) pipeline with a fast FAQ lookup layer to resolve customer queries — and escalates to a human agent when it can't.

---

## How it works

When a user opens the chat, they're shown a set of common issue buttons (where, late, refund, quality, etc.). If they pick one, the system does an **O(1) HashMap lookup** against 17 pre-loaded FAQ entries — no AI call needed, instant response.

If the issue isn't in the FAQ, the user types freely. The message goes to a **RAG pipeline** — it retrieves the 3 most relevant chunks from a ChromaDB vector store built on the knowledge base, then passes them as context to a **Groq-hosted LLaMA 3.3 70B model** to generate a response.

After every response, the user can say Yes (resolved) or No (not helpful). If they say No 5 times in a row, the system automatically connects them to a human agent.

Every conversation — message, response, source, feedback, attempt count — is saved to **Supabase PostgreSQL** for analytics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| RAG Pipeline | Python, LangChain, ChromaDB, HuggingFace Embeddings |
| LLM | Groq (llama-3.3-70b-versatile) |
| Backend | Node.js, Express |
| Database | Supabase PostgreSQL |
| Frontend | HTML, CSS, Vanilla JS |
| Knowledge Base | HTML document (17 support categories) |

---

## Project Structure

```
AI Customer Support System/
├── backend/
│   ├── rag/
│   │   ├── build_Chroma.py       # builds ChromaDB vector store from knowledge base
│   │   ├── rag.py                # Flask RAG service (port 5000)
│   │   └── requirements.txt
│   ├── faqs.json                 # 17 FAQ entries loaded into HashMap
│   └── server.js                 # Node.js backend (port 3000)
├── frontend/
│   ├── index.html                # chat UI
│   └── knowledge-base.html       # source document for RAG
├── .env.example
├── .gitignore
└── README.md
```

---

## Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- A Supabase account
- A Groq API key (free at console.groq.com)

### 1. Clone the repo
```bash
git clone https://github.com/Ving1552/ai-customer-support-system.git
cd ai-customer-support-system
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Fill in your keys in `.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

### 3. Create the Supabase table
Run this in your Supabase SQL editor:
```sql
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_message TEXT,
  ai_response TEXT,
  source TEXT,
  keyword TEXT,
  user_feedback BOOLEAN,
  attempts_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversations_session_created 
ON conversations(session_id, created_at);
```

### 4. Set up Python environment
```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Mac/Linux
pip install -r backend/rag/requirements.txt
```

### 5. Build the ChromaDB vector store
Open `frontend/knowledge-base.html` with Live Server in VS Code first (must be on port 5500), then:
```bash
python backend/rag/build_Chroma.py
```
You should see `Chroma DB created` and a chunk count of ~22.

### 6. Run the project (3 terminals)

**Terminal 1 — RAG service:**
```bash
.venv\Scripts\activate
python backend/rag/rag.py
```

**Terminal 2 — Node backend:**
```bash
node backend/server.js
```

**Terminal 3 — Frontend:**
Open `frontend/index.html` with Live Server in VS Code.

---
