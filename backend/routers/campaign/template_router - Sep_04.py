import os
import re
import requests
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from utils.file_server import upload_image_to_api
from utils.file_server import upload_video_to_api
from dotenv import load_dotenv

# Load environment variables from .env
# load_dotenv()



#router = APIRouter(tags=["templates"])
router = APIRouter(prefix="/campaign/templates", tags=["templates"])

#@router.post("/templates")
@router.post("/create-template")
async def create_template(req: Request):
    payload = await req.json()
    #api_key = "skI7lyZ0g0qj4dHDvwJ5k"
    #channel = payload.pop("channel", os.getenv("CHANNEL_NUMBER", "917996666220"))
    #channel = "917996666220"
    API_KEY = os.getenv("API_KEY")
    CHANNEL_NUMBER = os.getenv("CHANNEL_NUMBER")     
    url = f"https://cloudapi.wbbox.in/api/v1.0/create-templates/{CHANNEL_NUMBER}"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        print("response------ ",response)
        
    except requests.HTTPError as e:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()
    #return "success"


@router.post("/sync-template")
async def sync_template(req: Request):
    payload = await req.json()
    print("payload------------ ",payload.get("name"))
    #api_key = "skI7lyZ0g0qj4dHDvwJ5k"
    #channel = payload.pop("channel", os.getenv("CHANNEL_NUMBER", "917996666220"))
    #channel = "917996666220"
    API_KEY = os.getenv("API_KEY")
    CHANNEL_NUMBER = os.getenv("CHANNEL_NUMBER")     
    url = f"https://cloudapi.wbbox.in/api/v1.0/sync-templates/{CHANNEL_NUMBER}"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        
        template_name = payload.get("name")
        if not template_name:
            raise HTTPException(status_code=400, detail="Template name missing")

        sync_url = f"https://cloudapi.wbbox.in/api/v1.0/sync-templates/{template_name}"
        sync_resp = requests.get(sync_url, headers={"Authorization": f"Bearer {API_KEY}"})
        sync_resp.raise_for_status()

        return {
            "success": True,
            "sync_status": sync_resp.json(),
        }
    except requests.HTTPError as e:
        raise HTTPException(status_code=sync_resp.status_code, detail=sync_resp.text)
    #return response.json()

@router.get("/getAlltemplates")
async def list_templates():
    
    #api_key = "skI7lyZ0g0qj4dHDvwJ5k"
    
    API_KEY = os.getenv("API_KEY")
    CHANNEL_NUMBER = os.getenv("CHANNEL_NUMBER")        
    print("API_KEY---------------- ",API_KEY)
    url = "https://cloudapi.wbbox.in/api/v1.0/templates"
    headers = {"Authorization": f"Bearer {API_KEY}"}
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
    except requests.HTTPError as e:
        
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()


@router.post("/sendWatsAppText")
async def sendWatsAppText(req: Request):
    data = await req.json()
    numbers_str = data.get("phone_numbers", "")
    template_name = data.get("template_name")

    # requestParams = await req.json()
    # #api_key = "skI7lyZ0g0qj4dHDvwJ5k"
    
    # API_KEY = os.getenv("API_KEY")
    # CHANNEL_NUMBER = os.getenv("CHANNEL_NUMBER")        
    # print("API_KEY---------------- ",API_KEY)
    # url = f"https://cloudapi.wbbox.in/api/v1.0/send-template/{CHANNEL_NUMBER}"
    
   # headers = {"Authorization": f"Bearer {API_KEY}"}

    if not numbers_str or not template_name:
        raise HTTPException(status_code=400, detail="phone_numbers and template_name are required")

    API_KEY = os.getenv("API_KEY")
    CHANNEL_NUMBER = os.getenv("CHANNEL_NUMBER")
    url = f"https://cloudapi.wbbox.in/api/v1.0/messages/send-template/{CHANNEL_NUMBER}"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "apikey": "{API_KEY}",
        "Content-Type": "application/json",
    }

    
     # Clean and join the numbers into a single comma-separated string
    cleaned_numbers = [re.sub(r"\D", "", n) for n in numbers_str.split(",")]
    recipients = ",".join(filter(None, cleaned_numbers))

    if not recipients:
        raise HTTPException(status_code=400, detail="No valid phone numbers provided")

    payload = {
        "messaging_product": "whatsapp",
        "to": recipients,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "en"},
        },
        "components": []
    }
    try:
        resp = requests.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()
    except requests.HTTPError:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    
@router.post("/create-text-template")
async def create_text_template(req: Request):
    """Proxy endpoint dedicated for text templates."""
    return await create_template(req)


# @router.post("/create-image-template")
# async def create_image_template(
#     name: str = Form(...),
#     language: str = Form(...),
#     category: str = Form(...),
#     header: str = Form(""),
#     body: str = Form(...),
#     footer: str = Form(""),
#     file: UploadFile = File(...),
# ):
#     contents = await file.read()
#     if len(contents) > 4 * 1024 * 1024:
#         raise HTTPException(status_code=400, detail="Image must be less than 4MB")
    
#     # If FastAPI is running on Windows server
#     if os.getenv("WINDOWS_SERVER_HOST", "") == "":
#         public_url = f"http://{os.getenv('SERVER_IP', '127.0.0.1')}:8000/static/{file.filename}"
#     else:
#         # If remote, the file is on another machine – URL must point to that machine’s FastAPI/static
#         public_url = f"http://{os.getenv('WINDOWS_SERVER_HOST')}:8000/static/{file.filename}"

#     save_to_windows_server(contents, file.filename,public_url)
#     payload = {
#         "name": name,
#         "language": language,
#         "category": category,
#         "components": [
#             {"type": "HEADER", "format": "IMAGE"},
#             {"type": "BODY", "text": body},
#             {"type": "FOOTER", "text": footer},
#         ],
#     }
#     API_KEY = os.getenv("API_KEY")
#     CHANNEL_NUMBER = os.getenv("CHANNEL_NUMBER")
#     url = f"https://cloudapi.wbbox.in/api/v1.0/create-templates/{CHANNEL_NUMBER}"
#     headers = {
#         "Authorization": f"Bearer {API_KEY}",
#         "Content-Type": "application/json",
#     }
#     try:
#         response = requests.post(url, json=payload, headers=headers)
#         response.raise_for_status()
#     except requests.HTTPError as e:
#         raise HTTPException(status_code=response.status_code, detail=response.text)
#     return response.json()


@router.post("/create-image-template")
async def create_image_template(
    name: str = Form(...),
    language: str = Form(...),
    category: str = Form(...),
    body: str = Form(...),
    footer: str = Form(""),
    file: UploadFile = File(...),
):
    contents = await file.read()
    if len(contents) > 4 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be less than 4MB")

    # Save image to server
    
    # if os.getenv("WINDOWS_SERVER_HOST", "") == "":
    #     public_url = f"http://{os.getenv('SERVER_IP', '127.0.0.1')}:8000/static/{file.filename}"
    # else:
    #     public_url = f"http://{os.getenv('WINDOWS_SERVER_HOST')}:8000/static/{file.filename}"

    API_KEY = os.getenv("API_KEY")
    CHANNEL_NUMBER = os.getenv("CHANNEL_NUMBER")
    upload_url = f"https://cloudapi.wbbox.in/api/v1.0/uploads/{CHANNEL_NUMBER}"
    #save_to_windows_server(contents, file.filename)
    responsefromapi=upload_image_to_api(upload_url,API_KEY,contents,file.filename)
    hvalue_url = responsefromapi["data"]["HValue"]
    
    print("==========================   ",hvalue_url)
    # Build payload with HEADER, BODY, FOOTER, BUTTONS (like your example)
    payload = {
        "name": name,
        "language": language,
        "category": category,
        "components": [
            {
                "type": "HEADER",
                "format": "IMAGE",
                "example": {"header_handle": [hvalue_url]}
            },
            {
                "type": "BODY",
                "text": body,
            },
            {
                "type": "FOOTER",
                "text": footer,
            }
           
        ]
    }

    # API_KEY = os.getenv("API_KEY")
    # CHANNEL_NUMBER = os.getenv("CHANNEL_NUMBER")
    url = f"https://cloudapi.wbbox.in/api/v1.0/create-templates/{CHANNEL_NUMBER}"
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
    except requests.HTTPError:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()


@router.post("/create-video-template")
async def create_video_template(
    name: str = Form(...),
    language: str = Form(...),
    category: str = Form(...),
  #  header: str = Form(""),
    body: str = Form(...),
    footer: str = Form(""),
    file: UploadFile = File(...),
):
    contents = await file.read()
    if len(contents) > 9 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Video must be less than 9MB")
    
    API_KEY = os.getenv("API_KEY")
    CHANNEL_NUMBER = os.getenv("CHANNEL_NUMBER")
    upload_url = f"https://cloudapi.wbbox.in/api/v1.0/uploads/{CHANNEL_NUMBER}"
    #save_to_windows_server(contents, file.filename)
    responsefromapi=upload_video_to_api(upload_url,API_KEY,contents,file.filename)
    print("==========================   ",responsefromapi)
    hvalue_url = responsefromapi["data"]["HValue"]
    #responsefromapi["data"]["HValue"]

    payload = {
        "name": name,
        "language": language,
        "category": category,
        "components": [
            {
                "type": "HEADER",
                "format": "IMAGE",
                "example": {"header_handle": [hvalue_url]}
            },
            {
                "type": "BODY",
                "text": body,
            },
            {
                "type": "FOOTER",
                "text": footer,
            }
           
        ]
    }
    
    url = f"https://cloudapi.wbbox.in/api/v1.0/create-templates/{CHANNEL_NUMBER}"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
    except requests.HTTPError as e:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()


@router.post("/sendWatsAppImage")
async def sendWatsAppImage(req: Request):
    data = await req.json()
    numbers_str = data.get("phone_numbers", "")
    template_name = data.get("template_name")
    # video_url = data.get("video_url")  # expect client to pass the video link
    # body_text = data.get("body_text", "Welcome to Whatsapp Api!!")
    # footer_text = data.get("footer_text", "Thanks")

    video_url="https://scontent.whatsapp.net/v/t61.29466-34/538401456_1453332132639720_6031891967003430650_n.mp4?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=UKYMs7EobOEQ7kNvwGB8UrX&_nc_oc=AdlJMTICIuScQzID-7Wd0hi6z7lshJ8MyMGp6JESPILUgsGG27fVWDiXu0J1ord92Bo&_nc_zt=28&_nc_ht=scontent.whatsapp.net&edm=AIJs65cEAAAA&_nc_gid=9mecET9dkeGvK54-GhgK6A&oh=01_Q5Aa2QGaN1eeEj8TkOEE94uP16NUCavPj9tcQ5_vGHgJSKY9eA&oe=68DFA10D"
    if not numbers_str or not template_name:
        raise HTTPException(
            status_code=400,
            detail="phone_numbers, template_name and video_url are required"
        )

    API_KEY = os.getenv("API_KEY")
    CHANNEL_NUMBER = os.getenv("CHANNEL_NUMBER")
    url = f"https://cloudapi.wbbox.in/api/v1.0/messages/send-template/{CHANNEL_NUMBER}"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "apikey": f"{API_KEY}",
        "Content-Type": "application/json",
    }

    # Clean and join the numbers into a single comma-separated string
    cleaned_numbers = [re.sub(r"\D", "", n) for n in numbers_str.split(",")]
    recipients = ",".join(filter(None, cleaned_numbers))

    if not recipients:
        raise HTTPException(status_code=400, detail="No valid phone numbers provided")

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": recipients,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "en"},
            "components": [
                {
                    "type": "header",
                    "parameters": [
                        {
                            "type": "image",
                            "image": {"link": video_url}
                        }
                    ]
                }
            ]
        }
    }

    try:
        resp = requests.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()
    except requests.HTTPError:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)