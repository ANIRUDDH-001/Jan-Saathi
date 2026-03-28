"""Admin router — stats, pipeline, sessions, users, APISetu panel."""
from fastapi import APIRouter, Depends
from app.routers.auth import require_admin
from app.services import supabase_db as db

router = APIRouter(dependencies=[Depends(require_admin)])

@router.get("/stats")
async def get_stats():
    return db.get_admin_stats()

@router.get("/sessions")
async def get_sessions(limit: int = 50):
    return db.get_all_sessions(limit)

@router.get("/users")
async def get_users(limit: int = 50):
    return db.get_all_users(limit)

@router.get("/pipeline")
async def get_pipeline_queue(status: str = "pending"):
    return db.get_pipeline_queue(status)

@router.get("/integrations")
async def get_integrations():
    """APISetu integration status panel."""
    return {
        "apis": [
            {
                "name": "MyScheme API",
                "provider": "APISetu / MeitY",
                "description": "Live scheme discovery from government database",
                "status": "pending_registration",
                "endpoint": "https://api.apisetu.gov.in/myscheme/v1/schemes",
                "mock_response": {
                    "schemes": [{"id": "PM-KISAN", "name": "Pradhan Mantri Kisan Samman Nidhi"}]
                },
                "registration_url": "https://apisetu.gov.in",
                "requires": ["GSTIN", "PAN", "Certificate of Incorporation"],
            },
            {
                "name": "PM-KISAN Beneficiary Status",
                "provider": "Ministry of Agriculture",
                "description": "Check if farmer is already registered on PM-KISAN",
                "status": "available",  # This one works without registration
                "endpoint": "https://pmkisan.gov.in/BeneficiaryStatus_New.aspx",
                "note": "Public endpoint, no API key needed",
            },
            {
                "name": "DigiLocker Document Fetch",
                "provider": "APISetu / MeitY",
                "description": "Auto-fetch Aadhaar, land records from DigiLocker",
                "status": "pending_registration",
                "endpoint": "https://api.apisetu.gov.in/digilocker/v1/documents",
                "requires": ["GSTIN", "PAN", "Certificate of Incorporation"],
            },
        ],
        "registration_note": "Register org at apisetu.gov.in with GSTIN to activate live APIs",
        "gstin_registration_url": "https://directory.apisetu.gov.in/api-collection/myscheme",
    }
