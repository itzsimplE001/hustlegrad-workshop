import os
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.databases import Databases

load_dotenv()

client = Client()
client.set_endpoint(os.getenv("APPWRITE_ENDPOINT"))
client.set_project(os.getenv("APPWRITE_PROJECT_ID"))
client.set_key(os.getenv("APPWRITE_API_KEY"))

databases = Databases(client)
DB_ID = "main"
COLL_ID = "tickets"

try:
    doc = databases.get_document(DB_ID, COLL_ID, "early-bird")
    print(f"EARLY BIRD DB STATUS: Sold: {doc['sold']}, Limit: {doc['limit']}, Price: {doc['price']}")
except Exception as e:
    print(f"Error checking early-bird: {e}")
