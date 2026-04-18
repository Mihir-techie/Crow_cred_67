from flask_mail import Message
from flask import render_template


def send_welcome_email(user_email, user_name):
    # from backend.app import mail
    from app import mail


    subject = "Welcome to CrowCred 🎉"

    try:
        # Render your HTML file with dynamic data
        html_body = render_template(
            "welcome_email.html", 
            user_name=user_name    
        )

        msg = Message(subject, recipients=[user_email])
        msg.body = f"Hello {user_name}, Welcome to CrowCred!"  
        msg.html = html_body  

        mail.send(msg)

    except Exception as e:
        print(f"Failed to send email: {e}")

def send_login_email(user_email, user_name):
    from backend.app import mail
    subject = "New Login Detected - CrowCred"
    body = f"Hello {user_name},\n\nWe noticed a new login to your CrowCred account.\nIf this was you, you can ignore this email. If not, please secure your account immediately.\n\nTeam CrowCred"
    try:
        msg = Message(subject, recipients=[user_email])
        msg.body = body
        mail.send(msg)
    except Exception as e:
        print(f"Failed to send login email: {e}")

def send_course_enrollment_email(user_email, course_title):
    from backend.app import mail
    subject = "Course Enrollment Confirmed"
    body = f"You are successfully enrolled in:\n{course_title}\n\nStart learning now on CrowCred."
    try:
        msg = Message(subject, recipients=[user_email])
        msg.body = body
        mail.send(msg)
    except Exception as e:
        print(e)

def send_hackathon_registration_email(user_email):
    from backend.app import mail
    subject = "Hackathon Registration Successful"
    body = "Thank you for enrolling in CrowCred Hackathon.\nOur team will contact you shortly.\nPrepare and give your best.\n\nTeam CrowCred"
    try:
        msg = Message(subject, recipients=[user_email])
        msg.body = body
        mail.send(msg)
    except Exception as e:
        print(e)

def send_certificate_email(user_email, course_title):
    from backend.app import mail
    subject = f"Certificate Generated: {course_title}"
    body = f"Congratulations! Your certificate for completing {course_title} has been generated."
    try:
        msg = Message(subject, recipients=[user_email])
        msg.body = body
        mail.send(msg)
    except Exception as e:
        print(e)
