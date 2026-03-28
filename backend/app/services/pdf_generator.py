"""PDF form generation using ReportLab."""
import io, os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from pypdf import PdfReader, PdfWriter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

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
    # khasra_number: intentionally skipped (user fills at CSC)
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
    "bank_account":   (55, 215),  # PM-KISAN account
    "village":        (30, 180),
    "land_area_hectares": (120, 180),
    "crop_type":      (165, 168),
}

FORM_FIELD_MAP = {
    "PM-KISAN": PM_KISAN_FIELDS,
    "PM-KMY":   PM_KMY_FIELDS,
    "KCC":      KCC_FIELDS,
}

FORM_PDF_PATHS = {
    "PM-KISAN": "assets/forms/pm_kisan_registration.pdf",
    "PM-KMY":   "assets/forms/pm_kmy_mandate.pdf",
    "KCC":      "assets/forms/kcc_application.pdf",
}

def generate_pdf(scheme_acronym: str, form_data: dict) -> bytes:
    """Fill a government form PDF with farmer data. Returns PDF bytes."""
    fields = FORM_FIELD_MAP.get(scheme_acronym, {})
    pdf_path = FORM_PDF_PATHS.get(scheme_acronym)
    
    if not pdf_path or not os.path.exists(pdf_path):
        raise FileNotFoundError(f"Form template not found: {pdf_path}")
    
    # Create overlay with field values
    overlay_buffer = io.BytesIO()
    c = canvas.Canvas(overlay_buffer, pagesize=A4)
    c.setFont("Helvetica", 10)
    c.setFillColorRGB(0, 0, 0.5)  # Navy blue ink
    
    page_width, page_height = A4
    
    for field_key, (x_mm, y_mm) in fields.items():
        value = form_data.get(field_key, "")
        if value:
            # Convert mm to points, flip y axis (PDF origin is bottom-left)
            x = x_mm * mm
            y = y_mm * mm
            c.drawString(x, y, str(value))
    
    c.save()
    overlay_buffer.seek(0)
    
    # Merge overlay onto original PDF
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


def calculate_pmy_contribution(age: int) -> int:
    """Calculate PM-KMY monthly contribution based on farmer's age."""
    # Official government table
    contribution_table = {
        18: 55, 19: 58, 20: 61, 21: 64, 22: 68, 23: 72, 24: 76,
        25: 80, 26: 85, 27: 90, 28: 95, 29: 100, 30: 105, 31: 110,
        32: 120, 33: 130, 34: 140, 35: 150, 36: 160, 37: 170, 38: 180,
        39: 190, 40: 200
    }
    age = max(18, min(40, age))  # Clamp to scheme age range
    return contribution_table.get(age, 100)
