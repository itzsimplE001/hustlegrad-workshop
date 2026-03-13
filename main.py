from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv
import time
import razorpay
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Request
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query  
from typing import Literal
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

import logging

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Rate Limiter Setup
limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS=
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://itzsimple001.github.io",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class OrderRequest(BaseModel):
    firstName: str
    lastName: str
    email: str
    phone: str
    college: str
    year: str
    ticketType: Literal["early-bird", "standard"]

class VerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    ticketType: Literal["early-bird", "standard"]    # so that no manippolation 


#rp
client_rp = razorpay.Client(auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET")))

#aw
client_aw = Client()
client_aw.set_endpoint(os.getenv("APPWRITE_ENDPOINT"))
client_aw.set_project(os.getenv("APPWRITE_PROJECT_ID"))
client_aw.set_key(os.getenv("APPWRITE_API_KEY"))

#someshit
databases = Databases(client_aw)
DB_ID = "main"
TICKETS_COLL = "tickets"
ORDERS_COLL = "orders"

app.mount("/static", StaticFiles(directory="."), name="static")

@app.get("/")
async def read_root():
    return FileResponse('index.html')

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "FastAPI backend is running!"}

@app.post("/api/create-order")
@limiter.limit("5/minute")
async def create_order(req: OrderRequest, request: Request):
    try:
        ticket = databases.get_document(DB_ID, TICKETS_COLL, req.ticketType)
        
        if ticket['sold'] >= ticket['limit']:
            logger.warning(f"SOLD OUT hit: {req.ticketType} for {req.email}")
            raise HTTPException(status_code=400, detail="Ticket is sold out") 

        logger.info(f"Creating order for {req.email} ({req.ticketType})")
        
        data = {
            "amount": ticket['price'],
            "currency": "INR",
            "receipt": f"rcpt_{int(time.time())}_{os.urandom(4).hex()}"
        }
        razorpay_order = client_rp.order.create(data=data)


        databases.create_document(DB_ID, ORDERS_COLL, os.urandom(8).hex(), {
            "firstName": req.firstName,
            "lastName": req.lastName,
            "email": req.email,
            "phone": req.phone,
            "college": req.college,
            "year": req.year,
            "orderId": razorpay_order['id'],
            "status": "pending",
            "amount": ticket['price']
        })


        return {
            "orderId": razorpay_order['id'],
            "amount": razorpay_order['amount'],
            "currency": razorpay_order['currency'],
            "key": os.getenv("RAZORPAY_KEY_ID")
        }
    except Exception as e:
        logger.error(f"Order Creation Error: {str(e)}")
        # If it's already an HTTPException, re-raise it
        if isinstance(e, HTTPException):
            raise e
        # Otherwise wrap it
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/verify-payment")
@limiter.limit("10/minute")
async def verify_payment(req: VerifyRequest, request: Request):
    try:
        client_rp.utility.verify_payment_signature(dict(req))
    except Exception as e:
        logger.error(f"SIG VERIFY FAIL: {req.razorpay_order_id} - {str(e)}")
        raise HTTPException(status_code=400, detail="Payment verification failed!")

    order_doc = databases.list_documents(
        DB_ID, 
        ORDERS_COLL, 
        queries=[Query.equal("orderId", req.razorpay_order_id)]
    )

    if order_doc['total'] > 0:
        doc = order_doc['documents'][0]
        
        if doc['status'] == "paid":
            return {"status": "success"}

        payment = client_rp.payment.fetch(req.razorpay_payment_id)
        if payment['amount'] != doc['amount']:
             logger.error(f"AMOUNT MISMATCH: Expected {doc['amount']}, Got {payment['amount']}")
             raise HTTPException(status_code=400, detail="Payment amount mismatch!")


        if payment['order_id'] != req.razorpay_order_id:
            raise HTTPException(status_code=400, detail="Invalid payment order")

        doc_id = doc['$id']
        databases.update_document(DB_ID, ORDERS_COLL, doc_id, {"status": "paid"})

        ticket = databases.get_document(DB_ID, TICKETS_COLL, req.ticketType)

        # SECURITY: Ensure the ticket type matches what was actually paid for
        if ticket['price'] != doc['amount']:
            logger.error(f"TICKET TYPE MISMATCH: Order {req.razorpay_order_id} paid {doc['amount']}, but claimed {req.ticketType} ({ticket['price']})")
            raise HTTPException(status_code=400, detail="Ticket type mismatch")

        if ticket['sold'] >= ticket['limit']:
            raise HTTPException(status_code=400, detail="Ticket limit exceeded")

        new_sold = ticket['sold'] + 1

        if new_sold > ticket['limit']:
            raise HTTPException(status_code=400, detail="Ticket limit exceeded")

        databases.update_document(
            DB_ID,
            TICKETS_COLL,
            req.ticketType,
            {"sold": new_sold}
        )
        logger.info(f"PAYMENT SUCCESS: {req.razorpay_order_id} | {req.ticketType}")
    
    return {"status": "success"}

@app.post("/webhooks/razorpay")
async def razorpay_webhook(request: Request):
    payload = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")
    
    try:
        pass 
    except:
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    return {"status": "ok"}

@app.get("/api/tickets")
async def get_tickets():
    result = databases.list_documents(DB_ID, TICKETS_COLL)
    return result['documents']
        