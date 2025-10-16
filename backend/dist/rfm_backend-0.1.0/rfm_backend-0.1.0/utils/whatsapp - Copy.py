import os
import re
import requests

API_VERSION = "v1.0"

def _get_wbbox_credentials():
    """
    Required env vars (set these for Wbbox):
      - WBOX_API_BASE   e.g. https://wbbox.in/Web/Panel/api/v1.0   (or your tenant base)
      - WBOX_TOKEN      your Wbbox API token/key
    Optional (defaults shown):
      - WBOX_AUTH_HEADER = "Authorization"   # or "x-api-key" if Wbbox uses that
      - WBOX_AUTH_PREFIX = "Bearer"          # or "" when using x-api-key
    """
    base = os.getenv("WBOX_API_BASE", "https://wbbox.in/Web/Panel/api/v1.0").rstrip("/")
    token = os.getenv("WBOX_CHANNEL_NUMBER") or os.getenv("WHATSAPP_PERMANENT_TOKEN")
    #token = os.getenv("WBOX_TOKEN") or os.getenv("WHATSAPP_PERMANENT_TOKEN")  # fallback if you reused the var
    auth_header = os.getenv("WBOX_AUTH_HEADER", "Authorization")
    auth_prefix = os.getenv("WBOX_AUTH_PREFIX", "Bearer")
    if not token:
        raise EnvironmentError("Set WBOX_TOKEN (or WHATSAPP_PERMANENT_TOKEN) for Wbbox API auth")
    return base, token, auth_header, auth_prefix

# def send_whatsapp_message(to: str, body: str) -> dict:
#     """
#     Send a WhatsApp text via Wbbox.
#     - 'to' should be E.164 digits (we'll strip non-digits).
#     """
#     base, token, auth_header, auth_prefix = _get_wbbox_credentials()
#     url = f"{base}/messages/send-text"

#     headers = {
#         auth_header: f"{auth_prefix} {token}".strip(),
#         "Content-Type": "application/json",
#     }
#     payload = {
#         "messaging_product": "whatsapp",
#         "recipient_type": "individual",
#         "to": re.sub(r"\D", "", str(to)),  # keep digits only
#         "type": "text",
#         "text": {
#             "preview_url": False,
#             "body": body,
#         },
#     }

#     resp = requests.post(url, headers=headers, json=payload, timeout=30)
#     # If you accidentally hit a portal URL without API auth, Wbbox may return HTML (login page)
#     ct = (resp.headers.get("Content-Type") or "").lower()
#     if "text/html" in ct:
#         raise RuntimeError("Received HTML (likely login page). Use the API base + API token, not the portal session.")
#     resp.raise_for_status()
#     return resp.json() if resp.content else {"ok": True, "status_code": resp.status_code}


def send_text_message(waba_number, message, recipient_number, api_key):
    waba_number="2136388930124270"
    url = f"https://cloudapi.wbbox.in/api/v1.0/messages/send-text/{waba_number}"
    api_key="skI7lyZ0g0qj4dHDvwJ5kA"
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}',  # Adjust based on their auth method
    }
    recipient_number="9742743197"
    message="Hello"
    payload = {
        'to': recipient_number,
        'text': message,
        # Add other required fields
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        return response.json()
    except Exception as e:
        print(f"Error: {e}")

# Usage
send_text_message('your_waba_number', 'Hello World!', '+1234567890', 'your_api_key')