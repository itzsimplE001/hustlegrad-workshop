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
    result = databases.list_collections('main')
    print("Collections found in 'main':")
    for col in result['collections']:
        print(f"ID: {col['$id']}, Name: {col['name']}")
except Exception as e:
    print(f"Error: {e}")
