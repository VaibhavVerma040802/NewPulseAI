import logging
import smtplib
from email.message import EmailMessage
from core.config import get_settings
from jose import jwt
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)
settings = get_settings()

def create_verification_token(email: str) -> str:
    """Generate a JWT token for email verification."""
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode = {"sub": email, "exp": expire, "type": "email_verification"}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> str | None:
    """Decode and verify the email verification token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "email_verification":
            return None
        return payload.get("sub")
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return None

def send_verification_email(email: str, token: str):
    """Send verification email containing the token link."""
    if not settings.MAIL_SERVER or not settings.MAIL_USERNAME:
        logger.warning("SMTP settings not configured. Cannot send email.")
        return False
        
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    
    msg = EmailMessage()
    msg["Subject"] = "Verify your NewsPulse AI Account"
    msg["From"] = settings.MAIL_FROM or settings.MAIL_USERNAME
    msg["To"] = email
    
    body = f"""
    Welcome to NewsPulse AI!
    
    Please verify your email address by clicking the link below:
    {verification_url}
    
    This link will expire in 24 hours.
    If you did not register for an account, please ignore this email.
    """
    msg.set_content(body)
    
    html_body = f"""
    <html>
      <body>
        <h2>Welcome to NewsPulse AI!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="{verification_url}" style="display:inline-block;padding:10px 20px;background-color:#2563eb;color:white;text-decoration:none;border-radius:5px;">Verify Email</a>
        <p>Or click this link: <a href="{verification_url}">{verification_url}</a></p>
        <p><small>This link will expire in 24 hours. If you did not register, please ignore this email.</small></p>
      </body>
    </html>
    """
    msg.add_alternative(html_body, subtype='html')

    try:
        # Use smtplib
        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT) as server:
            if settings.MAIL_STARTTLS:
                server.starttls()
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.send_message(msg)
            
        logger.info(f"Verification email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {email}: {e}")
        
        # LOCAL DEV FALLBACK: Many local ISPs and firewalls block outgoing SMTP ports (587/465).
        # Write the link to a local file so the developer can still verify their account!
        try:
            fallback_file = "/app/LATEST_VERIFICATION_LINK.txt"
            with open(fallback_file, "w") as f:
                f.write(f"Email sending failed due to network blocks.\n\n")
                f.write(f"Your verification link for {email} is:\n")
                f.write(f"{verification_url}\n")
            logger.info(f"Wrote verification link to {fallback_file}")
            
            # Also write to host directory if mounted
            import os
            host_fallback = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "LATEST_VERIFICATION_LINK.txt")
            with open(host_fallback, "w") as f:
                f.write(f"Email sending failed due to network blocks.\n\n")
                f.write(f"Your verification link for {email} is:\n")
                f.write(f"{verification_url}\n")
        except Exception as file_e:
            logger.error(f"Failed to write fallback file: {file_e}")
            
        return False
