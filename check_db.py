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
    result = databases.list()
    print("Databases found:")
    for db in result['databases']:
        print(f"ID: {db['$id']}, Name: {db['name']}")
except Exception as e:
    print(f"Error: {e}")
