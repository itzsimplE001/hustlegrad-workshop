import os
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query

load_dotenv()

client = Client()
client.set_endpoint(os.getenv("APPWRITE_ENDPOINT"))
client.set_project(os.getenv("APPWRITE_PROJECT_ID"))
client.set_key(os.getenv("APPWRITE_API_KEY"))

databases = Databases(client)
DB_ID = "main"
COLL_ID = "orders"

try:
    result = databases.list_documents(DB_ID, COLL_ID, queries=[Query.limit(5), Query.order_desc("$createdAt")])
    for doc in result['documents']:
        print(f"Order: {doc['orderId']} | Email: {doc['email']} | Status: {doc['status']} | Amount: {doc['amount']}")
except Exception as e:
    print(f"Error checking orders: {e}")
