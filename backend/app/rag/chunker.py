from typing import List, Dict, Any


class PagePreservingChunker:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_document(
        self,
        document_id: str,
        pages_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Split page-by-page extracted text into overlapping chunks,
        strictly maintaining the exact source page number for each chunk.
        """
        chunks = []
        global_chunk_index = 0

        for page in pages_data:
            page_number = page["page_number"]
            page_text = page["text"].strip()
            
            if not page_text:
                continue

            # If text length is smaller than or equal to chunk_size, create a single chunk
            if len(page_text) <= self.chunk_size:
                chunk_id = f"{document_id}#p{page_number}#c{global_chunk_index}"
                chunks.append({
                    "chunk_id": chunk_id,
                    "document_id": document_id,
                    "page_number": page_number,
                    "chunk_index": global_chunk_index,
                    "text": page_text,
                    "char_start": 0,
                    "char_end": len(page_text),
                })
                global_chunk_index += 1
                continue

            # Otherwise, perform overlapping sliding-window chunking within the page
            start = 0
            text_len = len(page_text)

            while start < text_len:
                end = min(start + self.chunk_size, text_len)
                
                # If we're not at the very end of the page, try to split at a sentence or newline boundary
                if end < text_len:
                    # Look backwards for a natural break: period, question mark, or newline
                    break_point = max(
                        page_text.rfind(". ", start, end),
                        page_text.rfind("\n", start, end),
                        page_text.rfind("; ", start, end)
                    )
                    if break_point != -1 and break_point > start + (self.chunk_size // 2):
                        end = break_point + 1  # include the punctuation

                chunk_text = page_text[start:end].strip()
                if chunk_text:
                    chunk_id = f"{document_id}#p{page_number}#c{global_chunk_index}"
                    chunks.append({
                        "chunk_id": chunk_id,
                        "document_id": document_id,
                        "page_number": page_number,
                        "chunk_index": global_chunk_index,
                        "text": chunk_text,
                        "char_start": start,
                        "char_end": end,
                    })
                    global_chunk_index += 1

                # Advance start by chunk_size - chunk_overlap
                step = self.chunk_size - self.chunk_overlap
                start += step
                if start >= text_len:
                    break

        return chunks


chunker = PagePreservingChunker(chunk_size=1000, chunk_overlap=200)
