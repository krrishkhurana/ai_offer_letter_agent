import os
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.vectorstores import InMemoryVectorStore
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", handlers=[logging.StreamHandler()])
logger = logging.getLogger(__name__)

# Configuration from environment variables with defaults
INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "offer-letter-index")
CLOUD_PROVIDER = os.getenv("PINECONE_CLOUD", "aws")
REGION = os.getenv("PINECONE_REGION", "us-west-2")

def get_embeddings():
    """Initialize HuggingFaceEmbeddings using local cached model first for instant loading."""
    try:
        return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2", model_kwargs={"local_files_only": True})
    except Exception as e:
        logger.info(f"Local files not found ({e}), downloading HuggingFace model...")
        return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def get_vectorstore(docs=None):
    """
    Initialize and return a vector store with HuggingFace embeddings.
    Uses Pinecone if PINECONE_API_KEY is configured; otherwise uses InMemoryVectorStore.
    
    Args:
        docs (list, optional): List of documents to embed and store.
    
    Returns:
        VectorStore: The initialized vector store.
    """
    try:
        embed = get_embeddings()
        logger.info("HuggingFaceEmbeddings initialized successfully for vector storage with model: all-MiniLM-L6-v2")
        
        # Check if Pinecone is configured
        api_key = os.getenv("PINECONE_API_KEY")
        if api_key:
            try:
                from pinecone import Pinecone, ServerlessSpec
                pc = Pinecone(api_key=api_key)
                existing_indexes = [index.name for index in pc.list_indexes()]
                
                # Check for Pinecone vectorstore in langchain
                try:
                    from langchain_pinecone import PineconeVectorStore
                    if INDEX_NAME not in existing_indexes:
                        if docs:
                            sample_embedding = embed.embed_query("sample text")
                            dimension = len(sample_embedding)
                            pc.create_index(
                                name=INDEX_NAME,
                                dimension=dimension,
                                metric="cosine",
                                spec=ServerlessSpec(cloud=CLOUD_PROVIDER, region=REGION)
                            )
                            return PineconeVectorStore.from_texts(docs, embed, index_name=INDEX_NAME)
                    else:
                        return PineconeVectorStore.from_existing_index(INDEX_NAME, embed)
                except ImportError:
                    logger.warning("langchain-pinecone not available, will use in-memory vector store")
            except Exception as pe:
                logger.warning(f"Pinecone initialization failed: {pe}, falling back to in-memory store")

        # In-memory vector store (always works, fast, local)
        logger.info("Using InMemoryVectorStore for document retrieval")
        if docs:
            return InMemoryVectorStore.from_texts(docs, embed)
        return InMemoryVectorStore(embed)

    except Exception as e:
        logger.error(f"Failed to get vectorstore: {str(e)}")
        raise RuntimeError(f"Vectorstore initialization failed: {str(e)}")
