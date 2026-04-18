from flask import Blueprint
from services.email_service import send_welcome_email

test_bp = Blueprint("test", __name__)

@test_bp.route("/test-email")
def test_email():
    send_welcome_email("mihirkumarpanigrahi2002@gmail.com", "Test User")
    return "Email sent (check inbox)"