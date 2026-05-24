import os
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from flask import Flask, request, jsonify

load_dotenv()

CHROMA_DIR = "./chroma_db"

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

vectorstore = Chroma(
    persist_directory=CHROMA_DIR,
    embedding_function=embeddings
)

print(vectorstore._collection.count())

retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

def format_docs(docs):
    return "\n".join([doc.page_content for doc in docs])

prompt = PromptTemplate(
    input_variables=["context", "question"],
    template="""
You are a customer support assistant.
Use the following context to answer the question.
If unsure, say "I don't know".
Keep answers short (max 3 sentences).

Context:
{context}

Question:
{question}

Answer:
""",
)

model = ChatGroq(
    api_key=os.environ.get("GROQ_API_KEY"),
    model_name="llama-3.3-70b-versatile"
)

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | model
    | StrOutputParser()
)

app = Flask(__name__)

@app.route("/rag-chat", methods=["POST"])
def rag_endpoint():
    user_message = request.json.get("message")
    reply = rag_chain.invoke(user_message)
    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(debug=True, port=5000)