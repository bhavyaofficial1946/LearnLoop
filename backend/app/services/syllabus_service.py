import re
import io
import logging
from typing import List, Dict, Any, Tuple
from pypdf import PdfReader
from sqlalchemy.orm import Session
from backend.app.schemas.syllabus import SyllabusUnitInput, SyllabusExtractResponse
from backend.app.models.topic import Topic
from backend.app.models.subject import Subject

logger = logging.getLogger("learnloop.syllabus")

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")

class SyllabusService:
    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        """Extract plain text from uploaded PDF bytes."""
        if not file_bytes:
            raise ValueError("Uploaded file is empty")
        
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            if len(reader.pages) == 0:
                raise ValueError("PDF contains no pages")
            
            extracted_pages = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    extracted_pages.append(text)
            
            full_text = "\n".join(extracted_pages).strip()
            if not full_text:
                raise ValueError("Could not extract any readable text from this PDF (it may be scanned or image-only)")
            return full_text
        except Exception as e:
            if "Could not extract" in str(e) or "empty" in str(e) or "no pages" in str(e):
                raise
            raise ValueError(f"Invalid or corrupted PDF file: {str(e)}")

    @staticmethod
    def parse_syllabus_text(text: str) -> List[SyllabusUnitInput]:
        """
        Parse raw syllabus text into structured units and topic lists using
        robust academic unit/module patterns.
        """
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        if not lines:
            return []

        # Unit header regex patterns (e.g. Unit 1, Module 1, Chapter 1, Section 1, Part 1)
        unit_pattern = re.compile(r"^(?:unit|module|chapter|section|part)\s*([0-9ivxlcdm]+|\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\b)[\s:\.\-—]*(.*)$", re.IGNORECASE)
        
        units: List[SyllabusUnitInput] = []
        current_unit_name = ""
        current_topics: List[str] = []
        
        def push_current_unit():
            nonlocal current_unit_name, current_topics
            if current_unit_name or current_topics:
                unit_label = current_unit_name if current_unit_name else f"Unit {len(units) + 1}"
                # Clean and deduplicate topics while preserving order
                seen = set()
                cleaned_topics = []
                for t in current_topics:
                    t_clean = re.sub(r"^[\d\.\-\*\•\–\—\)\(]+\s*", "", t).strip()
                    if t_clean and len(t_clean) >= 2 and t_clean.lower() not in seen:
                        seen.add(t_clean.lower())
                        cleaned_topics.append(t_clean)
                
                if cleaned_topics:
                    units.append(SyllabusUnitInput(
                        name=unit_label,
                        order_index=len(units),
                        topics=cleaned_topics
                    ))
                current_topics = []

        for line in lines:
            unit_match = unit_pattern.match(line)
            if unit_match:
                push_current_unit()
                unit_num = unit_match.group(1).strip()
                unit_title = unit_match.group(2).strip()
                if unit_title:
                    current_unit_name = f"Unit {unit_num}: {unit_title}"
                else:
                    current_unit_name = f"Unit {unit_num}"
                continue

            # Check if line has multiple topics separated by commas or semicolons
            if "," in line or ";" in line:
                parts = [p.strip() for p in re.split(r"[,;]", line) if p.strip()]
                # If each part looks like a topic name
                if len(parts) > 1 and all(len(p) <= 80 for p in parts):
                    for p in parts:
                        current_topics.append(p)
                    continue

            # Standard topic line (strip bullet points or numbers)
            cleaned_line = re.sub(r"^[\d\.\-\*\•\–\—\)\(]+\s*", "", line).strip()
            if cleaned_line and len(cleaned_line) <= 120:
                current_topics.append(cleaned_line)

        push_current_unit()

        # Fallback if no units were detected
        if not units and lines:
            # Group lines into a default unit
            fallback_topics = []
            for line in lines:
                cleaned = re.sub(r"^[\d\.\-\*\•\–\—\)\(]+\s*", "", line).strip()
                if cleaned and len(cleaned) <= 100:
                    fallback_topics.append(cleaned)
            
            if fallback_topics:
                # Divide into units of ~5-7 topics if very long, or single unit
                if len(fallback_topics) > 7:
                    chunk_size = 5
                    for i in range(0, len(fallback_topics), chunk_size):
                        chunk = fallback_topics[i:i + chunk_size]
                        units.append(SyllabusUnitInput(
                            name=f"Unit {len(units) + 1}",
                            order_index=len(units),
                            topics=chunk
                        ))
                else:
                    units.append(SyllabusUnitInput(
                        name="Unit 1: Core Topics",
                        order_index=0,
                        topics=fallback_topics
                    ))

        return units

    @classmethod
    def process_pdf_syllabus(cls, file_bytes: bytes, filename: str) -> SyllabusExtractResponse:
        """Full pipeline for PDF syllabus processing."""
        raw_text = cls.extract_text_from_pdf(file_bytes)
        parsed_units = cls.parse_syllabus_text(raw_text)
        
        total_topics = sum(len(u.topics) for u in parsed_units)
        warnings = []
        if total_topics == 0:
            warnings.append("No distinct topics could be structured from this syllabus. You can edit or enter topics manually.")

        return SyllabusExtractResponse(
            units=parsed_units,
            total_units=len(parsed_units),
            total_topics=total_topics,
            source_filename=filename,
            extraction_method="pdf_extractor",
            warnings=warnings
        )
