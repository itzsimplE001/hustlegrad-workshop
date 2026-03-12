import os
from dotenv import load_dotenv
import razorpay

load_dotenv()

try:
    client = razorpay.Client(auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET")))
    # Try to fetch orders to see if keys are valid
    orders = client.order.all()
    print("Razorpay connection: SUCCESS")
except Exception as e:
    print(f"Razorpay connection: FAILED - {e}")
