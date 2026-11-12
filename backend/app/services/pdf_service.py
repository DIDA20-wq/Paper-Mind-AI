import os
import hashlib
from typing import Dict, List, Any, Tuple
try:
    import pymupdf as fitz
except ImportError:
    import fitz  # PyMuPDF


class PDFService:
    @staticmethod
    def validate_pdf(file_bytes: bytes, max_size_mb: int = 30) -> Tuple[bool, str]:
        """Validate PDF magic bytes, non-emptiness, and file size."""
        if not file_bytes:
            return False, "File is empty."
        
        size_mb = len(file_bytes) / (1024 * 1024)
        if size_mb > max_size_mb:
            return False, f"File size ({size_mb:.1f} MB) exceeds maximum allowed limit of {max_size_mb} MB."
        
        # Check PDF magic header %PDF-
        if not file_bytes.startswith(b"%PDF-"):
            return False, "Invalid file format. The file is not a valid PDF document."
        
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            if len(doc) == 0:
                doc.close()
                return False, "The PDF file is empty or contains no pages."
            doc.close()
        except Exception:
            return False, "The PDF file is corrupted and could not be parsed."
        
        return True, ""

    @staticmethod
    def compute_sha256(file_bytes: bytes) -> str:
        """Compute SHA-256 checksum for deduplication and integrity check."""
        return hashlib.sha256(file_bytes).hexdigest()

    @staticmethod
    def extract_text_by_page(file_path_or_bytes: Any) -> List[Dict[str, Any]]:
        """
        Extract text page-by-page preserving 1-indexed original page numbers.
        Returns a list of dicts: [{'page_number': int, 'text': str, 'char_count': int}]
        """
        if isinstance(file_path_or_bytes, bytes):
            doc = fitz.open(stream=file_path_or_bytes, filetype="pdf")
        else:
            doc = fitz.open(file_path_or_bytes)

        pages_data = []
        try:
            for page_index in range(len(doc)):
                page = doc[page_index]
                page_number = page_index + 1  # 1-indexed page number
                text = page.get_text("text") or ""
                
                # Clean up text: normalize carriage returns and consecutive whitespaces
                cleaned_lines = []
                for line in text.split("\n"):
                    stripped = line.strip()
                    if stripped:
                        cleaned_lines.append(stripped)
                cleaned_text = "\n".join(cleaned_lines)

                pages_data.append({
                    "page_number": page_number,
                    "text": cleaned_text,
                    "char_count": len(cleaned_text),
                })
        finally:
            doc.close()

        return pages_data

    @staticmethod
    def extract_document_title(pages_data: List[Dict[str, Any]], fallback_filename: str) -> str:
        """
        Extract title candidate from the first page header or fallback to filename.
        """
        if not pages_data:
            return fallback_filename

        first_page_text = pages_data[0]["text"]
        lines = [line.strip() for line in first_page_text.split("\n") if len(line.strip()) > 3]

        # Use the first substantive line (up to 200 chars) as candidate title
        for line in lines[:5]:
            # Skip common academic headers like arXiv IDs or page numbers
            if "arxiv:" in line.lower() or "vol." in line.lower() or line.isdigit():
                continue
            if len(line) >= 5 and len(line) <= 200:
                return line

        clean_name = os.path.splitext(fallback_filename)[0].replace("-", " ").replace("_", " ")
        return clean_name.title()


pdf_service = PDFService()
