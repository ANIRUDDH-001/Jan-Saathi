from pydantic import BaseModel, validator, Field
import re
from typing import Optional, List, Dict, Any

# --- Request models ---

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=0, max_length=1000)
    session_id: str = Field(..., min_length=1, max_length=100)
    language: str = Field(default="hi", pattern="^[a-z]{2}$")

    @validator('message')
    def sanitize_message(cls, v):
        v = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', v)
        return v.strip()
    
    @validator('session_id')
    def validate_session_id(cls, v):
        v = v.strip()
        if not re.match(r'^[a-zA-Z0-9\-]+$', v):
            raise ValueError('Invalid session_id format')
        return v

class VoiceRequest(BaseModel):
    session_id: str
    language_hint: str = Field(default="hi-IN", pattern="^[a-z]{2}-[A-Z]{2}$")
    # Audio sent as multipart form-data separately

class ApplyRequest(BaseModel):
    session_id: str
    scheme_id: str

class ConfirmFormRequest(BaseModel):
    session_id: str
    scheme_id: str
    form_data: Dict[str, Any]
    confirmed: bool

# --- Response models ---

class ChatResponse(BaseModel):
    reply: str                          # Plain text for display
    audio_b64: Optional[str] = None     # Base64 WAV for TTS playback
    state: str                          # intake/match/guide/form_fill
    profile: Dict[str, Any] = {}        # Current collected profile
    schemes: List[Dict[str, Any]] = []  # Matched schemes
    gap_value: int = 0                  # Total monetary gap
    session_id: str
    language: str = "hi"
    silence_reset: bool = True          # Frontend resets silence timer on each response

class VoiceResponse(BaseModel):
    transcript: str
    language_code: str                  # e.g. "hi-IN"
    language_short: str                 # e.g. "hi"
    confidence: Optional[float] = None

class SchemeResult(BaseModel):
    id: str
    name_english: str
    name_hindi: Optional[str]
    acronym: Optional[str]
    level: str
    state: str
    ministry: Optional[str]
    has_monetary_benefit: bool
    benefit_annual_inr: int
    benefit_description: Optional[str]
    eligibility_summary: Optional[str]
    spoken_content: Dict[str, Any] = {}
    form_field_mapping: Dict[str, Any] = {}
    portal_url: Optional[str]
    form_pdf_url: Optional[str]
    helpline_number: Optional[str]
    similarity: float
    demo_ready: bool

class ApplicationResponse(BaseModel):
    reference_number: str
    scheme_name: str
    status: str
    submitted_at: str
    expected_state_verify_date: Optional[str]
    expected_central_date: Optional[str]
    expected_benefit_date: Optional[str]
    pdf_download_url: Optional[str]
    portal_url: Optional[str]
