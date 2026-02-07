from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from ocr_service import ocr_service
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

load_dotenv()

app = FastAPI(
    title="ERP ML Services",
    description="Machine Learning models for ERP Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models for request/response
class OCRResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@app.get("/")
async def root():
    return {"message": "ERP ML Services API"}


@app.get("/health")
async def health():
    return {"status": "ok", "ocr_enabled": ocr_service.reader is not None}


@app.post("/predict")
async def predict(data: dict):
    """
    Prediction endpoint for ML models
    """
    return {"prediction": None, "confidence": 0}


# ==================== OCR ENDPOINTS ====================

@app.post("/ocr/invoice", response_model=OCRResponse)
async def extract_invoice(file: UploadFile = File(...)):
    """Extract data from invoice image"""
    try:
        contents = await file.read()
        result = ocr_service.extract_invoice_data(contents)
        return OCRResponse(success=True, data=result)
    except Exception as e:
        return OCRResponse(success=False, error=str(e))


@app.post("/ocr/receipt", response_model=OCRResponse)
async def extract_receipt(file: UploadFile = File(...)):
    """Extract data from receipt image for order verification"""
    try:
        contents = await file.read()
        result = ocr_service.extract_receipt_data(contents)
        return OCRResponse(success=True, data=result)
    except Exception as e:
        return OCRResponse(success=False, error=str(e))


@app.post("/ocr/barcode", response_model=OCRResponse)
async def scan_barcode(file: UploadFile = File(...)):
    """Read barcode from image"""
    try:
        contents = await file.read()
        result = ocr_service.read_barcode(contents)
        return OCRResponse(success=True, data=result)
    except Exception as e:
        return OCRResponse(success=False, error=str(e))


@app.post("/ocr/product", response_model=OCRResponse)
async def extract_product(file: UploadFile = File(...)):
    """Extract product information from image"""
    try:
        contents = await file.read()
        result = ocr_service.extract_product_info(contents)
        return OCRResponse(success=True, data=result)
    except Exception as e:
        return OCRResponse(success=False, error=str(e))


@app.post("/ocr/text", response_model=OCRResponse)
async def extract_text(file: UploadFile = File(...)):
    """Extract raw text from document image"""
    try:
        contents = await file.read()
        text = ocr_service.extract_text_from_image(contents)
        return OCRResponse(success=True, data={"text": text})
    except Exception as e:
        return OCRResponse(success=False, error=str(e))


@app.post("/ocr/pdf", response_model=OCRResponse)
async def process_pdf(file: UploadFile = File(...)):
    """Process PDF document and extract text"""
    try:
        if file.content_type != "application/pdf":
            raise ValueError("File must be a PDF")
        contents = await file.read()
        result = ocr_service.process_pdf_document(contents)
        return OCRResponse(success=True, data=result)
    except Exception as e:
        return OCRResponse(success=False, error=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
