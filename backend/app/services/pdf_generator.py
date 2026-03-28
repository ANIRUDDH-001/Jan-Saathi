"""PDF form generation using ReportLab — with clean fallback."""
import base64
import io
import logging
import os
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

logger = logging.getLogger(__name__)

# Field coordinates for each form (x_mm, y_mm from bottom-left)
# These coordinates are measured from the actual PDF forms
PM_KISAN_FIELDS = {
    "name":         (40, 230),  # Full name field
    "father_name":  (40, 215),
    "dob":          (40, 200),
    "gender":       (110, 200),
    "category":     (150, 200),
    "aadhaar":      (40, 185),
    "mobile":       (110, 185),
    "state":        (40, 170),
    "district":     (110, 170),
    "sub_district": (40, 155),
    "village":      (110, 155),
    "bank_account": (40, 140),
    "bank_ifsc":    (110, 140),
    "bank_branch":  (40, 125),
    "land_area_hectares": (110, 125),
}

PM_KMY_FIELDS = {
    "name":             (45, 242),
    "dob":              (45, 225),
    "age":              (120, 225),
    "gender":           (155, 225),
    "category":         (45, 208),
    "marital_status":   (45, 192),
    "spouse_name":      (120, 192),
    "nominee_name":     (45, 175),
    "nominee_relation": (120, 175),
    "bank_account":     (45, 145),
    "bank_ifsc":        (120, 145),
    "bank_name":        (45, 128),
    "mobile":           (45, 111),
}

KCC_FIELDS = {
    "name":           (55, 232),
    "bank_account":   (55, 215),
    "village":        (30, 180),
    "land_area_hectares": (120, 180),
    "crop_type":      (165, 168),
}

FORM_FIELD_MAP = {
    "PM-KISAN": PM_KISAN_FIELDS,
    "PM-KMY":   PM_KMY_FIELDS,
    "KCC":      KCC_FIELDS,
}

# Relative to where uvicorn is run (backend/)
FORM_PDF_PATHS = {
    "PM-KISAN": "assets/forms/pm_kisan_registration.pdf",
    "PM-KMY":   "assets/forms/pm_kmy_mandate.pdf",
    "KCC":      "assets/forms/kcc_application.pdf",
}

SCHEME_DISPLAY_NAMES = {
    "PM-KISAN": "PM Kisan Samman Nidhi — Registration Form",
    "PM-KMY":   "PM Kisan Maan Dhan Yojana — Mandate Form",
    "KCC":      "Kisan Credit Card — Application Form",
}

FIELD_LABELS = {
    "name":               "Full Name / पूरा नाम",
    "father_name":        "Father's Name / पिता का नाम",
    "state":              "State / राज्य",
    "district":           "District / जिला",
    "sub_district":       "Sub-district / तहसील",
    "village":            "Village / गाँव",
    "mobile":             "Mobile / मोबाइल",
    "aadhaar":            "Aadhaar / आधार",
    "bank_account":       "Bank Account / बैंक खाता",
    "bank_ifsc":          "IFSC Code",
    "bank_name":          "Bank Name / बैंक नाम",
    "land_area_hectares": "Land (hectares) / भूमि (हेक्टेयर)",
    "land_area_acres":    "Land (acres) / भूमि (एकड़)",
    "age":                "Age / उम्र",
    "dob":                "Date of Birth / जन्मतिथि",
    "gender":             "Gender / लिंग",
    "category":           "Category / श्रेणी",
    "marital_status":     "Marital Status / वैवाहिक स्थिति",
    "spouse_name":        "Spouse Name / पति/पत्नी का नाम",
    "nominee_name":       "Nominee / नामांकित व्यक्ति",
    "nominee_relation":   "Nominee Relation / नामांकन संबंध",
    "crop_type":          "Crop Type / फसल",
    "income_annual_inr":  "Annual Income / वार्षिक आय (₹)",
    "occupation":         "Occupation / व्यवसाय",
    "monthly_contribution": "Monthly Contribution / मासिक योगदान (₹)",
    "pension_amount":     "Pension Amount / पेंशन राशि (₹/month)",
}


def generate_pdf(scheme_acronym: str, form_data: dict) -> bytes:
    """
    Fill a government form PDF with farmer data.
    Tries template overlay first; falls back to a clean branded PDF.
    Always returns PDF bytes — never raises.
    """
    try:
        return _overlay_on_template(scheme_acronym, form_data)
    except Exception as e:
        logger.warning("Template overlay failed for %s: %s — using clean fallback", scheme_acronym, e)
        return _generate_clean_pdf(scheme_acronym, form_data)


def _overlay_on_template(scheme_acronym: str, form_data: dict) -> bytes:
    """Overlay text onto the real government PDF template."""
    from pypdf import PdfReader, PdfWriter

    fields = FORM_FIELD_MAP.get(scheme_acronym)
    pdf_path = FORM_PDF_PATHS.get(scheme_acronym)

    if not fields or not pdf_path:
        raise ValueError(f"Unknown scheme: {scheme_acronym}")
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"Template not found: {pdf_path}")

    overlay_buffer = io.BytesIO()
    c = canvas.Canvas(overlay_buffer, pagesize=A4)
    c.setFont("Helvetica", 10)
    c.setFillColorRGB(0, 0, 0.5)  # Navy blue ink

    for field_key, (x_mm, y_mm) in fields.items():
        value = form_data.get(field_key, "")
        if value:
            c.drawString(x_mm * mm, y_mm * mm, str(value))

    c.save()
    overlay_buffer.seek(0)

    original = PdfReader(pdf_path)
    overlay = PdfReader(overlay_buffer)
    writer = PdfWriter()

    for i, page in enumerate(original.pages):
        if i < len(overlay.pages):
            page.merge_page(overlay.pages[i])
        writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def _generate_clean_pdf(scheme_acronym: str, form_data: dict) -> bytes:
    """Generate a clean Jan Saathi branded PDF with all form data."""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # ── Header bar (saffron) ──────────────────────────────────────────────────
    c.setFillColor(colors.HexColor("#FF9933"))
    c.rect(0, height - 72, width, 72, fill=True, stroke=False)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(36, height - 38, "Jan Saathi")
    c.setFont("Helvetica", 11)
    c.drawString(36, height - 56, "जन साथी — Powered by Team Algomind")

    # Scheme title
    c.setFillColor(colors.HexColor("#000080"))
    c.setFont("Helvetica-Bold", 13)
    title = SCHEME_DISPLAY_NAMES.get(scheme_acronym, f"{scheme_acronym} Application Form")
    c.drawString(36, height - 98, title)

    # Divider (tricolor stripe: saffron already done, white, green)
    c.setFillColor(colors.white)
    c.rect(0, height - 106, width, 4, fill=True, stroke=False)
    c.setFillColor(colors.HexColor("#138808"))
    c.rect(0, height - 110, width, 4, fill=True, stroke=False)

    # ── Form fields ───────────────────────────────────────────────────────────
    y = height - 140

    # Which fields to show — use the scheme field map keys, plus any extras in form_data
    scheme_fields = list(FORM_FIELD_MAP.get(scheme_acronym, {}).keys())
    # Add any extra keys from form_data that have labels and values
    extra_keys = [k for k in form_data if k not in scheme_fields and k in FIELD_LABELS and form_data[k]]
    all_keys = scheme_fields + extra_keys

    for field_key in all_keys:
        value = form_data.get(field_key, "")
        if not value:
            value = "________________"

        label = FIELD_LABELS.get(field_key, field_key.replace("_", " ").title())

        # Label
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(colors.HexColor("#555555"))
        c.drawString(36, y, label + ":")

        # Value
        c.setFont("Helvetica", 10)
        c.setFillColor(colors.black)
        c.drawString(220, y, str(value))

        # Underline
        c.setStrokeColor(colors.HexColor("#CCCCCC"))
        c.setLineWidth(0.4)
        c.line(210, y - 3, width - 36, y - 3)

        y -= 26
        if y < 100:
            c.showPage()
            y = height - 60

    # ── Footer ────────────────────────────────────────────────────────────────
    c.setFillColor(colors.HexColor("#888888"))
    c.setFont("Helvetica", 8)
    c.drawString(36, 54, "Generated by Jan Saathi | Team Algomind")
    c.drawString(36, 40, "For official submission, visit your nearest CSC centre or the official portal.")
    c.drawString(36, 26, f"Generated: {datetime.now().strftime('%d/%m/%Y %H:%M')}")

    c.save()
    buffer.seek(0)
    return buffer.getvalue()


def generate_pdf_b64(scheme_acronym: str, form_data: dict) -> str:
    """Return base64-encoded PDF string. Never raises."""
    return base64.b64encode(generate_pdf(scheme_acronym, form_data)).decode()


def profile_to_form_data(profile: dict, scheme_acronym: str) -> dict:
    """Map AppContext profile fields to PDF form fields for the given scheme."""
    aadhaar_raw = str(profile.get("aadhaar", ""))
    aadhaar_display = ("XXXX-XXXX-" + aadhaar_raw[-4:]) if len(aadhaar_raw) >= 4 else aadhaar_raw

    income = profile.get("income_annual_inr", 0)
    income_str = f"Rs. {int(income):,}" if income else ""

    land_ha = profile.get("land_area_hectares", "")
    land_ac = profile.get("land_area_acres", "")
    if not land_ha and land_ac:
        try:
            land_ha = round(float(land_ac) * 0.404686, 2)
        except (TypeError, ValueError):
            land_ha = ""

    return {
        "name":               str(profile.get("name", "")),
        "father_name":        str(profile.get("father_name", "")),
        "state":              str(profile.get("state", "")),
        "district":           str(profile.get("district", "")),
        "sub_district":       str(profile.get("sub_district", "")),
        "village":            str(profile.get("village", "")),
        "mobile":             str(profile.get("mobile", "")),
        "aadhaar":            aadhaar_display,
        "bank_account":       str(profile.get("bank_account", "")),
        "bank_ifsc":          str(profile.get("bank_ifsc", "")),
        "bank_name":          str(profile.get("bank_name", "")),
        "land_area_hectares": str(land_ha),
        "land_area_acres":    str(land_ac),
        "age":                str(profile.get("age", "")),
        "dob":                str(profile.get("dob", "")),
        "gender":             str(profile.get("gender", "")),
        "category":           str(profile.get("caste_category", profile.get("category", ""))),
        "income_annual_inr":  income_str,
        "occupation":         str(profile.get("occupation", "")),
        "crop_type":          str(profile.get("crop_type", "")),
        "marital_status":     str(profile.get("marital_status", "")),
        "spouse_name":        str(profile.get("spouse_name", "")),
        "nominee_name":       str(profile.get("nominee_name", "")),
        "nominee_relation":   str(profile.get("nominee_relation", "")),
    }


def calculate_pmy_contribution(age: int) -> int:
    """Calculate PM-KMY monthly contribution based on farmer's age."""
    contribution_table = {
        18: 55, 19: 58, 20: 61, 21: 64, 22: 68, 23: 72, 24: 76,
        25: 80, 26: 85, 27: 90, 28: 95, 29: 100, 30: 105, 31: 110,
        32: 120, 33: 130, 34: 140, 35: 150, 36: 160, 37: 170, 38: 180,
        39: 190, 40: 200
    }
    age = max(18, min(40, age))
    return contribution_table.get(age, 100)
