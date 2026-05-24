import os
from dotenv import load_dotenv
from langchain_community.document_loaders import BSHTMLLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

load_dotenv()

CHROMA_DIR = "./chroma_db"

# Load HTML knowledge base
loader = BSHTMLLoader(os.path.join(os.path.dirname(__file__), '../../frontend/knowledge-base.html'))
docs = loader.load()

# Split documents into chunks
text_splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=40)
splits = text_splitter.split_documents(docs)

# Create Chroma vector store
vectorstore = Chroma.from_documents(
    documents=splits,
    embedding=HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2"),
    persist_directory=CHROMA_DIR
)

print(f"Chroma DB created and persisted at {CHROMA_DIR}")

print(vectorstore._collection.count()) 
