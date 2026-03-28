"""Applications router — form submission and tracking."""
from fastapi import APIRouter, HTTPException
from datetime import date, timedelta
from app.models import ApplyRequest, ConfirmFormRequest, ApplicationResponse
from app.services import supabase_db as db
from app.services.pdf_generator import generate_pdf, calculate_pmy_contribution
import base64

router = APIRouter()

@router.post("/submit")
async def submit_application(req: ConfirmFormRequest):
    """Generate PDF and create application record."""
    if not req.confirmed:
        raise HTTPException(status_code=400, detail="Not confirmed")
    
    # Determine scheme acronym from scheme_id
    session = db.get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get scheme details
    from app.services.supabase_db import get_db
    scheme_r = get_db().table("schemes").select("*").eq("id", req.scheme_id).execute()
    if not scheme_r.data:
        raise HTTPException(status_code=404, detail="Scheme not found")
    
    scheme = scheme_r.data[0]
    acronym = scheme.get("acronym", "")
    
    # Add calculated fields
    form_data = dict(req.form_data)
    if acronym and "PM-KMY" in acronym:
        age = session.get("profile", {}).get("age", 30)
        form_data["monthly_contribution"] = calculate_pmy_contribution(age)
        form_data["pension_amount"] = 3000
    
    # Generate PDF
    try:
        pdf_bytes = generate_pdf(acronym, form_data)
        pdf_b64 = base64.b64encode(pdf_bytes).decode()
    except FileNotFoundError:
        pdf_b64 = None
    
    # Create application record
    app_record = db.create_application(
        session_id=req.session_id,
        scheme_id=req.scheme_id,
        scheme_name=scheme.get("name_english", ""),
        form_data=form_data,
        user_id=session.get("user_id"),
    )
    
    return {
        "reference_number": app_record["reference_number"],
        "scheme_name": scheme.get("name_english"),
        "status": "submitted",
        "submitted_at": app_record["submitted_at"],
        "expected_state_verify_date": app_record.get("expected_state_verify_date"),
        "expected_central_date": app_record.get("expected_central_date"),
        "expected_benefit_date": app_record.get("expected_benefit_date"),
        "pdf_b64": pdf_b64,
        "portal_url": scheme.get("portal_url"),
        "apisetu_note": "Portal submission will be enabled after APISetu registration",
    }

@router.get("/track/{reference_number}")
async def track_application(reference_number: str):
    """Get application status by reference number."""
    app = db.get_application(reference_number)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app

@router.get("/session/{session_id}")
async def get_session_applications(session_id: str):
    """Get all applications for a session."""
    return db.get_session_applications(session_id)
