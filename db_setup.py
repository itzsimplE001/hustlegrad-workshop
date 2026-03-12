import os
import time
from dotenv import load_dotenv
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.permission import Permission
from appwrite.role import Role

# Load environment variables
load_dotenv()

APPWRITE_ENDPOINT = os.getenv("APPWRITE_ENDPOINT")
APPWRITE_PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID")
APPWRITE_API_KEY = os.getenv("APPWRITE_API_KEY")

if not all([APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY]):
    print(" Missing Appwrite environment variables in .env")
    exit(1)

client = Client()
client.set_endpoint(APPWRITE_ENDPOINT)
client.set_project(APPWRITE_PROJECT_ID)
client.set_key(APPWRITE_API_KEY)

databases = Databases(client)

DATABASE_NAME = "workshop_db"
DATABASE_ID = "main"

TICKETS_COLLECTION_NAME = "Tickets"
TICKETS_COLLECTION_ID = "tickets"

ORDERS_COLLECTION_NAME = "Orders"
ORDERS_COLLECTION_ID = "orders"

def setup_database():
    try:
        # 1. Create Database
        print(f"Creating database '{DATABASE_NAME}'...")
        try:
            databases.create(DATABASE_ID, DATABASE_NAME)
        except Exception as e:
            if 'already exists' in str(e).lower():
                print(" Database already exists.")
            else:
                raise e

        # 2. Setup Tickets Collection
        print(f"Setting up '{TICKETS_COLLECTION_NAME}' collection...")
        try:
            databases.create_collection(DATABASE_ID, TICKETS_COLLECTION_ID, TICKETS_COLLECTION_NAME, 
                                        permissions=[Permission.read(Role.any())])
        except Exception as e:
            if 'already exists' in str(e).lower():
                print(" Tickets collection already exists.")
            else:
                raise e

        # Attributes for Tickets
        attributes = [
            {"key": "type", "type": "string", "size": 50, "required": True},
            {"key": "price", "type": "integer", "required": True},
            {"key": "limit", "type": "integer", "required": True},
            {"key": "sold", "type": "integer", "required": False, "default": 0},
        ]

        for attr in attributes:
            try:
                if attr["type"] == "string":
                    databases.create_string_attribute(DATABASE_ID, TICKETS_COLLECTION_ID, attr["key"], attr["size"], attr["required"])
                elif attr["type"] == "integer":
                    databases.create_integer_attribute(DATABASE_ID, TICKETS_COLLECTION_ID, attr["key"], attr["required"], default=attr.get("default"))
                print(f"  - Attribute '{attr['key']}' created.")
            except Exception as e:
                if 'already exists' in str(e).lower():
                    pass
                else:
                    print(f"  - Error creating '{attr['key']}': {e}")

        # Wait for index to build
        print("Waiting for attributes to normalize (this can take 30-60 seconds)...")
        time.sleep(15) # Increased wait time

        # Seed Tickets
        print("Seeding tickets...")
        tickets_data = [
            {"type": "EARLY_BIRD", "price": 29900, "limit": 7, "sold": 0},
            {"type": "STANDARD", "price": 49900, "limit": 100, "sold": 0}
        ]
        for t in tickets_data:
            try:
                # Use 'type' value as document ID
                doc_id = t["type"].lower().replace("_", "-")
                databases.create_document(DATABASE_ID, TICKETS_COLLECTION_ID, doc_id, t)
                print(f"  - Seeded {t['type']}")
            except Exception as e:
                if 'already exists' in str(e).lower():
                    print(f"  - {t['type']} already seeded.")
                else:
                    print(f"  - Error seeding {t['type']}: {e}")

        # 3. Setup Orders Collection
        print(f"Setting up '{ORDERS_COLLECTION_NAME}' collection...")
        try:
            databases.create_collection(DATABASE_ID, ORDERS_COLLECTION_ID, ORDERS_COLLECTION_NAME)
        except Exception as e:
            if 'already exists' in str(e).lower():
                print("✅ Orders collection already exists.")
            else:
                raise e

        # Attributes for Orders
        order_attributes = [
            {"key": "firstName", "type": "string", "size": 100, "required": True},
            {"key": "lastName", "type": "string", "size": 100, "required": True},
            {"key": "email", "type": "string", "size": 255, "required": True},
            {"key": "phone", "type": "string", "size": 20, "required": True},
            {"key": "college", "type": "string", "size": 255, "required": True},
            {"key": "year", "type": "string", "size": 50, "required": True},
            {"key": "orderId", "type": "string", "size": 100, "required": True},
            {"key": "status", "type": "string", "size": 20, "required": False, "default": "pending"},
            {"key": "amount", "type": "integer", "required": True},
        ]

        for attr in order_attributes:
            try:
                if attr["type"] == "string":
                    databases.create_string_attribute(DATABASE_ID, ORDERS_COLLECTION_ID, attr["key"], attr["size"], attr["required"], default=attr.get("default"))
                elif attr["type"] == "integer":
                    databases.create_integer_attribute(DATABASE_ID, ORDERS_COLLECTION_ID, attr["key"], attr["required"])
                print(f"  - Attribute '{attr['key']}' created.")
            except Exception as e:
                if 'already exists' in str(e).lower():
                    pass
                else:
                    print(f"  - Error creating '{attr['key']}': {e}")

        print("\n Appwrite Database Setup Complete!")

    except Exception as e:
        print(f"\n Critical Error: {e}")

if __name__ == "__main__":
    setup_database()
