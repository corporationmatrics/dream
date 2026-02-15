from typing import Dict, Any


class OCRService:
    def __init__(self):
        # placeholder for reader/ML model initialization
        self.reader = None

    def extract_invoice_data(self, contents: bytes) -> Dict[str, Any]:
        return {"text": ""}

    def extract_receipt_data(self, contents: bytes) -> Dict[str, Any]:
        return {"text": ""}

    def read_barcode(self, contents: bytes) -> Dict[str, Any]:
        return {"barcode": None}

    def extract_product_info(self, contents: bytes) -> Dict[str, Any]:
        return {"product": None}

    def extract_text_from_image(self, contents: bytes) -> str:
        return ""

    def process_pdf_document(self, contents: bytes) -> Dict[str, Any]:
        return {"pages": []}


ocr_service = OCRService()
