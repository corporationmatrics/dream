"""
OCR Service for handling invoices, receipts, barcodes, and documents
"""

import io
import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from PIL import Image
import cv2
import numpy as np

try:
    import easyocr
except ImportError:
    easyocr = None

try:
    import pytesseract
    from pytesseract import Output
except ImportError:
    pytesseract = None

try:
    from pyzbar.pyzbar import decode as decode_barcode
except ImportError:
    decode_barcode = None

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

logger = logging.getLogger(__name__)


class OCRService:
    """Service for OCR operations on various document types"""

    def __init__(self):
        self.reader = None
        self.initialize_ocr()

    def initialize_ocr(self):
        """Initialize OCR engine (EasyOCR preferred)"""
        try:
            if easyocr:
                # Initialize EasyOCR reader for English
                self.reader = easyocr.Reader(['en'], gpu=False)
                logger.info("EasyOCR initialized successfully")
            elif pytesseract:
                logger.info("Tesseract available as fallback")
            else:
                logger.warning("No OCR engine available")
        except Exception as e:
            logger.error(f"Failed to initialize OCR: {e}")

    def extract_text_from_image(self, image_data: bytes) -> str:
        """Extract text from image using OCR"""
        try:
            image = Image.open(io.BytesIO(image_data))
            image_array = np.array(image)

            if self.reader:
                # Use EasyOCR
                results = self.reader.readtext(image_array, detail=0)
                text = '\n'.join(results)
            elif pytesseract:
                # Fallback to Tesseract
                text = pytesseract.image_to_string(image)
            else:
                raise ValueError("No OCR engine available")

            return text
        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            raise

    def extract_invoice_data(self, image_data: bytes) -> Dict[str, Any]:
        """Extract structured data from invoice image"""
        try:
            text = self.extract_text_from_image(image_data)
            
            # Parse invoice data using simple pattern matching
            invoice_data = {
                'raw_text': text,
                'vendor_name': self._extract_vendor(text),
                'invoice_number': self._extract_invoice_number(text),
                'invoice_date': self._extract_date(text),
                'total_amount': self._extract_amount(text),
                'items': self._extract_line_items(text),
                'confidence': 'medium',  # Placeholder
                'extracted_at': datetime.utcnow().isoformat()
            }
            return invoice_data
        except Exception as e:
            logger.error(f"Error extracting invoice data: {e}")
            raise

    def extract_receipt_data(self, image_data: bytes) -> Dict[str, Any]:
        """Extract data from receipt for order verification"""
        try:
            text = self.extract_text_from_image(image_data)
            
            receipt_data = {
                'raw_text': text,
                'vendor': self._extract_vendor(text),
                'receipt_number': self._extract_receipt_number(text),
                'transaction_date': self._extract_date(text),
                'amount': self._extract_amount(text),
                'items': self._extract_line_items(text),
                'payment_method': self._extract_payment_method(text),
                'extracted_at': datetime.utcnow().isoformat()
            }
            return receipt_data
        except Exception as e:
            logger.error(f"Error extracting receipt data: {e}")
            raise

    def read_barcode(self, image_data: bytes) -> Dict[str, Any]:
        """Read barcode from image"""
        try:
            if not decode_barcode:
                raise ValueError("pyzbar not available for barcode reading")

            image = Image.open(io.BytesIO(image_data))
            barcodes = decode_barcode(image)

            if not barcodes:
                return {
                    'found': False,
                    'barcode_data': None,
                    'barcode_type': None,
                    'message': 'No barcode detected'
                }

            # Return first barcode found
            barcode = barcodes[0]
            return {
                'found': True,
                'barcode_data': barcode.data.decode('utf-8'),
                'barcode_type': barcode.type,
                'extracted_at': datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error reading barcode: {e}")
            return {
                'found': False,
                'error': str(e),
                'extracted_at': datetime.utcnow().isoformat()
            }

    def extract_product_info(self, image_data: bytes) -> Dict[str, Any]:
        """Extract product information from image (for catalog upload)"""
        try:
            text = self.extract_text_from_image(image_data)
            
            product_info = {
                'raw_text': text,
                'product_name': self._extract_product_name(text),
                'sku': self._extract_sku(text),
                'price': self._extract_amount(text),
                'description': text[:200],  # First 200 chars as description
                'extracted_at': datetime.utcnow().isoformat()
            }
            return product_info
        except Exception as e:
            logger.error(f"Error extracting product info: {e}")
            raise

    def process_pdf_document(self, pdf_data: bytes) -> Dict[str, Any]:
        """Process PDF document and extract all text"""
        try:
            if not pdfplumber:
                raise ValueError("pdfplumber not available for PDF processing")

            pdf_file = io.BytesIO(pdf_data)
            all_text = []
            page_count = 0

            with pdfplumber.open(pdf_file) as pdf:
                page_count = len(pdf.pages)
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        all_text.append(text)

            combined_text = '\n\n'.join(all_text)
            
            return {
                'document_type': 'pdf',
                'page_count': page_count,
                'total_text': combined_text,
                'extracted_at': datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error processing PDF: {e}")
            raise

    # Helper methods for data extraction
    def _extract_vendor(self, text: str) -> Optional[str]:
        """Extract vendor/company name from text"""
        # Simple heuristic: usually first few meaningful lines
        lines = text.split('\n')
        for line in lines[:5]:
            if len(line.strip()) > 3:
                return line.strip()
        return None

    def _extract_invoice_number(self, text: str) -> Optional[str]:
        """Extract invoice number from text"""
        import re
        # Look for patterns like INV-123, Invoice #123, etc.
        patterns = [
            r'INV[:\s-]*(\d+)',
            r'Invoice\s*#?\s*(\d+)',
            r'Invoice\s*Number[:\s]*(\w+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        return None

    def _extract_receipt_number(self, text: str) -> Optional[str]:
        """Extract receipt number from text"""
        import re
        patterns = [
            r'Receipt\s*#?\s*(\w+)',
            r'REC[:\s-]*(\d+)',
            r'Transaction\s*ID[:\s]*(\w+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        return None

    def _extract_date(self, text: str) -> Optional[str]:
        """Extract date from text"""
        import re
        from dateutil import parser
        
        # Look for date patterns
        patterns = [
            r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',
            r'\d{4}-\d{1,2}-\d{1,2}',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    # Try to parse the date
                    date_obj = parser.parse(match.group(0))
                    return date_obj.isoformat()
                except:
                    continue
        return None

    def _extract_amount(self, text: str) -> Optional[float]:
        """Extract monetary amount from text"""
        import re
        # Look for currency patterns
        patterns = [
            r'\$[\d,]+\.?\d{0,2}',
            r'[\d,]+\.?\d{0,2}\s*(?:USD|dollars)',
            r'(?:Total|Amount|Price)[:\s]*\$?([\d,]+\.?\d{0,2})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Extract number and convert
                amount_str = re.sub(r'[^\d.]', '', match.group(0))
                try:
                    return float(amount_str)
                except ValueError:
                    continue
        return None

    def _extract_line_items(self, text: str) -> List[Dict[str, Any]]:
        """Extract line items (products) from invoice/receipt"""
        import re
        items = []
        lines = text.split('\n')
        
        for line in lines:
            # Look for lines with quantity, description, and price
            # Pattern: qty description price
            match = re.search(r'(\d+)\s+(.+?)\s+\$?([\d.]+)', line)
            if match:
                items.append({
                    'quantity': int(match.group(1)),
                    'description': match.group(2).strip(),
                    'price': float(match.group(3))
                })
        
        return items

    def _extract_payment_method(self, text: str) -> Optional[str]:
        """Extract payment method from receipt text"""
        payment_keywords = ['credit card', 'cash', 'debit', 'check', 'paypal', 'apple pay']
        text_lower = text.lower()
        
        for method in payment_keywords:
            if method in text_lower:
                return method
        return None

    def _extract_product_name(self, text: str) -> Optional[str]:
        """Extract product name from image text"""
        # Usually first meaningful line or after keywords
        lines = text.split('\n')
        for line in lines:
            if len(line.strip()) > 3 and not any(
                skip in line.lower() for skip in ['price', 'qty', 'total', 'amount']
            ):
                return line.strip()
        return None

    def _extract_sku(self, text: str) -> Optional[str]:
        """Extract SKU from product image"""
        import re
        # Look for SKU patterns
        patterns = [
            r'SKU[:\s]*(\w+)',
            r'(?:Product\s*)?Code[:\s]*(\w+)',
            r'(?:Item|Part)\s*#[:\s]*(\w+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        return None


# Global OCR service instance
ocr_service = OCRService()
