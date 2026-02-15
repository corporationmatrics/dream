from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import os
from .ocr_service import ocr_service
from .models import OCRResponse

app = FastAPI(
    title="ERP ML Services",
    description="Machine Learning models for ERP Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "ERP ML Services API"}


@app.get("/health")
async def health():
    return {"status": "ok", "ocr_enabled": ocr_service.reader is not None}


@app.post("/ocr/invoice", response_model=OCRResponse)
async def extract_invoice(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = ocr_service.extract_invoice_data(contents)
        return OCRResponse(success=True, data=result)
    except Exception as e:
        return OCRResponse(success=False, error=str(e))
