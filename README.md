# AI Customer Support System

A multi-stack AI-powered customer support system with RAG and feedback collection.

## Tech Stack
- Node.js (Express, Supabase)
- Python (LangChain, OpenAI, Google Gemini)
- HTML/CSS/JS (Frontend)
- ChromaDB (Vector DB)

## Project Structure
```
backend/
  faqs.json
  server.js
  rag/
    build_Chroma.py
    rag.py
    requirements.txt
    chroma_db/
    db/
frontend/
  index.html
  knowledge-base.html
package.json
.env.example
.gitignore
README.md
```

## Setup Instructions

### 1. Clone the repository
```sh
git clone <repo-url>
cd AI Customer Support System
```

### 2. Environment Variables
- Copy `.env.example` to `.env` and fill in your keys:
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - OPENAI_API_KEY
  - GEMINI_API_KEY
  - GROQ_API_KEY

### 3. Backend Setup
#### Node.js (Express)
- Install dependencies:
  ```sh
  cd backend
  npm install
  ```
- Start the server:
  ```sh
  node server.js
  ```

#### Python (RAG Service)
- Create a virtual environment and activate it:
  ```sh
  cd backend/rag
  python -m venv venv
  venv\Scripts\activate  # On Windows
  # or
  source venv/bin/activate  # On Mac/Linux
  ```
- Install Python dependencies:
  ```sh
  pip install -r requirements.txt
  ```
- Run the RAG service as needed:
  ```sh
  python rag.py
  ```

### 4. Frontend
- Open `frontend/index.html` in your browser.

---

**Note:**
- The `.env` file is required for both backend and Python services. Do not commit your real `.env` file; use `.env.example` as a template.
- Ignore folders like `node_modules/`, `chroma_db/`, `venv/`, `.venv/`, `backend/rag/venv/`, `backend/rag/db/`, `__pycache__/`, and `*.pyc` files as per `.gitignore`.
