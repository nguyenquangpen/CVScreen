from fastapi import FastAPI
from pydantic import BaseModel

class myItem(BaseModel):
    name: str
    price: float
    ready: bool

app = FastAPI()

@app.get("/")
async def home():
    return "this is the home page"

@app.post("/submit")
async def submit(item: myItem):
    return "Data submitted successfully"