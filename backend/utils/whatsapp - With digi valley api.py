import os
import re
import requests

API_VERSION = "v1.0"

def _get_wbbox_credentials():
    """
    Required env vars (set these for Wbbox):
      - WBOX_API_DOMAIN   e.g. cloudapi.wbbox.in
      - WBOX_CHANNEL_NUMBER your channel number (WABA number)
      - WBOX_API_KEY      your Wbbox API key
    """
    api_domain = os.getenv("WBOX_API_DOMAIN", "cloudapi.wbbox.in")
    channel_number = os.getenv("WBOX_CHANNEL_NUMBER") or os.getenv("WBOX_WABA_NUMBER", "2136388930124270")
    api_key = os.getenv("WBOX_API_KEY") or os.getenv("WBOX_TOKEN") or os.getenv("WHATSAPP_PERMANENT_TOKEN")
    
    if not api_key:
        raise EnvironmentError("Set WBOX_API_KEY for Wbbox API auth")
    if not channel_number:
        raise EnvironmentError("Set WBOX_CHANNEL_NUMBER for Wbbox API")
    
    return api_domain, channel_number, api_key

# def send_whatsapp_message(to: str, body: str) -> dict:
#     """
#     Required env:
#       WBOX_API_BASE   -> e.g. https://cloudapi.wbbox.in/api/v1.0   (NO /Web/Panel)
#       WBOX_TOKEN      -> your Wbbox User API Key
#     Optional:
#       WBOX_AUTH_HEADER -> "Authorization" or "x-api-key"  (default: x-api-key)
#       WBOX_AUTH_PREFIX -> e.g. "Bearer" or ""             (default: "" for x-api-key)
#     """
#     base = os.environ["WBOX_API_BASE"].rstrip("/")
#     token = os.environ["WBOX_TOKEN"].strip()

#     header_name  = os.getenv("WBOX_AUTH_HEADER", "x-api-key")
#     header_prefix = os.getenv("WBOX_AUTH_PREFIX", "")

#     # Build auth header value
#     auth_value = f"{header_prefix} {token}".strip() if header_prefix else token

#     url = f"{base}/messages/send-text"
#     payload = {
#         "messaging_product": "whatsapp",
#         "recipient_type": "individual",
#         "to": re.sub(r"\D", "", str(to)),  # E.164 digits only
#         "type": "text",
#         "text": {"preview_url": False, "body": body},
#     }
#     headers = {
#         header_name: auth_value,
#         "Content-Type": "application/json",
#     }

#     r = requests.post(url, headers=headers, json=payload, timeout=30)

#     # Quick diagnostics if you still hit the portal / wrong host
#     ct = (r.headers.get("Content-Type") or "").lower()
#     if "text/html" in ct:
#         raise RuntimeError(
#             "Got HTML (login page). Use the API base (no /Web/Panel) and the correct API key/header."
#         )

#     # Let you see Wbbox's JSON errors clearly
#     if not r.ok:
#         raise RuntimeError(f"Wbbox error {r.status_code}: {r.text}")

#     return r.json() if r.content else {"ok": True, "status_code": r.status_code}

#def send_whatsapp_message(waba_number=None, message=None, recipient_number=None, api_key=None):
# def send_whatsapp_message(channel_number: str, api_key: str, recipient_number: str, message: str) -> dict:
#     """
#     Send a WhatsApp text message via Wbbox API.

#     Args:
#         channel_number (str): Your Wbbox channel number (e.g. 917123456789)
#         api_key (str): Your Wbbox API key (User API Key from portal)
#         recipient_number (str): Recipient phone number in E.164 format (digits only, e.g. 919812345678)
#         message (str): The text message body

#     Returns:
#         dict: JSON response from Wbbox API
#     """

#     print("channel_number------------ ",channel_number, flush=True)
#     print("api_key--------------- ",api_key, flush=True)
#     print("recipient_number-------------- ",recipient_number, flush=True)
#     print("message-------------- ",message, flush=True)

   
#     # Build URL with channel number
#     url = f"https://cloudapi.wbbox.in/api/v1.0/messages/send-template/{channel_number}"

   
#     headers = {
#         "Authorization": f"Bearer {api_key}",
#         "Content-Type": "application/json",
#         "apikey": f"{api_key}"
#     }

   

#     # Ensure number is only digits
#     clean_recipient = re.sub(r"\D", "", str(recipient_number))

#     # payload = {
#     #     "messaging_product": "whatsapp",
#     #     "recipient_type": "individual",
#     #     "to": clean_recipient,
#     #     "type": "text",
#     #     "text": {
#     #         "preview_url": False,
#     #         "body": message
#     #     }
#     # }

#     payload = {
#             "messaging_product": "whatsapp",
#             "recipient_type": "individual",
#             "to": clean_recipient,
#             "type": "template",
#             "template": {
#                 "name": "test_123",
#                 "language": {
#                 "code": "en"
#                 },
#                 "components": []
#             }
#     }

#     try:
#         resp = requests.post(url, headers=headers, json=payload, timeout=30)
#         resp.raise_for_status()
#         return resp.json()
#     except requests.RequestException as e:
#         print(f"Error sending message: {e}")
#         if e.response is not None:
#             print(f"Status: {e.response.status_code}")
#             print(f"Content: {e.response.text}")
#         raise


def send_whatsapp_message(channel_number: str, api_key: str, recipient_number: str, message:str) -> dict:
    """
    Send a WhatsApp template message with header + body parameters via Wbbox API.
    """
    # url = f"https://cloudapi.wbbox.in/api/v1.0/messages/send-template/{channel_number}"

    # headers = {
    #     "Authorization": f"Bearer {api_key}",
    #     "Content-Type": "application/json",
    #     "apikey": api_key,
    # }

    # clean_recipient = re.sub(r"\D", "", str(recipient_number))

    # payload = {
    #     "messaging_product": "whatsapp",
    #     "recipient_type": "individual",
    #     "to": clean_recipient,
    #     "type": "template",
    #     "template": {
    #         "name": "test_11",         # ✅ must match approved template name
    #         "language": { "code": "en" },
    #         "components": [
    #             {
    #                 "type": "header",
    #                 "parameters": [
    #                     {
    #                         "type": "image",
    #                         "image": {
    #                             "link": "https://www.thedigivalley.com/img/logo.png"
    #                         }
    #                     }
    #                 ]
    #             },
    #             {
    #                 "type": "body",
    #                 "parameters": [
    #                     {
    #                         "type": "text",
    #                         "text": "Divya"   # ✅ variable text
    #                     }
    #                 ]
    #             }
    #         ]
    #     }
    # }

    # print("URL:", url)
    # print("HEADERS:", headers)
    # print("PAYLOAD:", payload)

    # try:
    #     resp = requests.post(url, headers=headers, json=payload, timeout=30)
    #     resp.raise_for_status()
    #     return resp.json()
    # except requests.RequestException as e:
    #     print(f"Error sending message: {e}")
    #     if e.response is not None:
    #         print(f"Status: {e.response.status_code}")
    #         print(f"Content: {e.response.text}")
    #     raise

    url = "https://cloudapi.wbbox.in/api/v1.0/messages/send-template/917996666220"
    clean_recipient = re.sub(r"\D", "", str(recipient_number))
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": clean_recipient,
        "type": "template",
        "template": {
            "name": "test_11",
            "language": {
                "code": "en"
            },
            "components": [
                {
                    "type": "header",
                    "parameters": [
                        {
                            "type": "image",
                            "image": {
                                "link": "https://www.thedigivalley.com/img/logo.png"
                            }
                        }
                    ]
                },
                {
                    "type": "body",
                    "parameters": [
                        {
                            "type": "text",
                            "text": "Divya"
                        }
                    ]
                }
            ]
        }
    }

    # headers = {
    #     "Content-Type": "application/json",
    #     "apikey": "skI7lyZ0g0qj4dHDvwJ5k",
    #     "Authorization": "Bearer skI7lyZ0g0qj4dHDvwJ5k"
    # }

    headers = {
        "Content-Type": "application/json",
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}",
    }


    try:
        resp = requests.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        print(f"Error sending message: {e}")
        if e.response is not None:
            print(f"Status: {e.response.status_code}")
            print(f"Content: {e.response.text}")
        raise

    