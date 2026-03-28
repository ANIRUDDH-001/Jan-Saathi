from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# --- Request models ---

class ChatRequest(BaseModel):
    message: str
    session_id: str
    language: str = "hi"

class VoiceRequest(BaseModel):
    session_id: str
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
