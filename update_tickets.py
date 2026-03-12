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

tickets = [
    {"id": "early-bird", "price": 29900, "limit": 30},
    {"id": "standard", "price": 49900, "limit": 100}
]

for t in tickets:
    try:
        databases.update_document(DB_ID, COLL_ID, t['id'], {
            "price": t['price'],
            "limit": t['limit']
        })
        print(f"Updated {t['id']}: Price ₹{t['price']/100}, Limit {t['limit']}")
    except Exception as e:
        print(f"Error updating {t['id']}: {e}")
