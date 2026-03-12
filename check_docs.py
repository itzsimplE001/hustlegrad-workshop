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

try:
    result = databases.list_documents('main', 'tickets')
    print("Documents found in 'tickets':")
    for doc in result['documents']:
        print(f"ID: {doc['$id']}, Type: {doc['type']}, Sold: {doc['sold']}")
except Exception as e:
    print(f"Error: {e}")
