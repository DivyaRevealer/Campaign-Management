import os
import re
import requests
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from controllers.auth import get_current_user
from models.user import User
from database import get_db
from utils.file_server import upload_image_to_api
from utils.file_server import upload_video_to_api
from utils.api_endpoints import (
    create_template_url,
    sync_templates_url,
    sync_template_name_url,
    templates_url,
    send_template_message_url,
    uploads_url,
)
from dotenv import load_dotenv
from models.campaign.template_detail_model import template_details
from sqlalchemy.orm import Session

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
        # saveSuccess=save_template_details(
        #                 db=db,
        #                 template_name=payload.get("name"),                       
        #                 template_type="text",
        #                 media_type=""
        #             )
    
        
    except requests.HTTPError as e:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()
    #return "success"


@router.post("/sync-template")
async def sync_template(req: Request,current_user: User = Depends(get_current_user)):
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
async def list_templates(current_user: User = Depends(get_current_user)):
    
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
async def sendWatsAppText(req: Request,db: Session = Depends(get_db)):
    data = await req.json()
    #numbers_str = data.get("phone_numbers", "")
    template_name = data.get("template_name")
    basedon=data.get("basedon_value")
    campaign_id=data.get("campaign_id")

    # requestParams = await req.json()
    # #api_key = "skI7lyZ0g0qj4dHDvwJ5k"
    
    # API_KEY = os.getenv("API_KEY")
    # CHANNEL_NUMBER = os.getenv("CHANNEL_NUMBER")        
    # print("API_KEY---------------- ",API_KEY)
    # url = f"https://cloudapi.wbbox.in/api/v1.0/send-template/{CHANNEL_NUMBER}"
    
   # headers = {"Authorization": f"Bearer {API_KEY}"}
    if(basedon == "upload"):
        numbers_str = data.get("phone_numbers", "")
    else:
        numbers_obj = get_eligible_customers(campaign_id, basedon, db)
        numbers_str = numbers_obj["numbers"]   # extract the string

    print("numbers_str---------------- ",numbers_str)

    if not numbers_str or not template_name:
        raise HTTPException(status_code=400, detail="phone_numbers and template_name are required")
    
    #numbers_str1=get_eligible_customers(campaign_id,basedon,db)
    if numbers_str:
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
    else:
        return "No customer matched"
    
@router.post("/create-text-template")
async def create_text_template(req: Request,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    # """Proxy endpoint dedicated for text templates."""
    # return await create_template(req)
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
        saveSuccess=save_template_details(
                        db=db,
                        template_name=payload.get("name"),                       
                        template_type="text",
                        media_type=""
                    )
    
        
    except requests.HTTPError as e:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()



@router.post("/create-image-template")
async def create_image_template(
    name: str = Form(...),
    language: str = Form(...),
    category: str = Form(...),
    body: str = Form(...),
    footer: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    image_url = responsefromapi["data"]["ImageUrl"]
   
    if hvalue_url and image_url:
         # Save details to DB
        saveSuccess=save_template_details(
                        db=db,
                        template_name=name,
                        file_url=image_url,
                        file_hvalue=hvalue_url,
                        template_type="media",
                        media_type="image"
                    )
    
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
    body: str = Form(...),
    footer: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    video_url = responsefromapi["data"]["ImageUrl"]
   
    if hvalue_url and video_url:
         # Save details to DB
        saveSuccess=save_template_details(
                        db=db,
                        template_name=name,
                        file_url=video_url,
                        file_hvalue=hvalue_url,
                        template_type="media",
                        media_type="video"
                    )
    

    payload = {
        "name": name,
        "language": language,
        "category": category,
        "components": [
            {
                "type": "HEADER",
                "format": "VIDEO",
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
async def sendWatsAppImage(req: Request,db: Session = Depends(get_db)):
    data = await req.json()
   # numbers_str = data.get("phone_numbers", "")
    template_name = data.get("template_name")
    basedon=data.get("basedon_value")
    campaign_id=data.get("campaign_id")
    # video_url = data.get("video_url")  # expect client to pass the video link
    # body_text = data.get("body_text", "Welcome to Whatsapp Api!!")
    # footer_text = data.get("footer_text", "Thanks")

    #image_url="https://scontent.whatsapp.net/v/t61.29466-34/538401456_1453332132639720_6031891967003430650_n.mp4?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=UKYMs7EobOEQ7kNvwGB8UrX&_nc_oc=AdlJMTICIuScQzID-7Wd0hi6z7lshJ8MyMGp6JESPILUgsGG27fVWDiXu0J1ord92Bo&_nc_zt=28&_nc_ht=scontent.whatsapp.net&edm=AIJs65cEAAAA&_nc_gid=9mecET9dkeGvK54-GhgK6A&oh=01_Q5Aa2QGaN1eeEj8TkOEE94uP16NUCavPj9tcQ5_vGHgJSKY9eA&oe=68DFA10D"
    
    template = db.query(template_details).filter(template_details.template_name == template_name).first()
    if not template or not template.file_url:
        raise HTTPException(
            status_code=404,
            detail=f"No file_url found for template {template_name}"
        )

    image_url = template.file_url

    if(basedon == "upload"):
        numbers_str = data.get("phone_numbers", "")
    else:
        numbers_obj = get_eligible_customers(campaign_id, basedon, db)
        numbers_str = numbers_obj["numbers"]   # extract the string
    
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
                            "image": {"link": image_url}
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


@router.post("/sendWatsAppVideo")
async def sendWatsAppVideo(req: Request,db: Session = Depends(get_db)):
    data = await req.json()
#    numbers_str = data.get("phone_numbers", "")
    template_name = data.get("template_name")
    basedon=data.get("basedon_value")
    campaign_id=data.get("campaign_id")
    # video_url = data.get("video_url")  # expect client to pass the video link
    # body_text = data.get("body_text", "Welcome to Whatsapp Api!!")
    # footer_text = data.get("footer_text", "Thanks")

    #image_url="https://scontent.whatsapp.net/v/t61.29466-34/538401456_1453332132639720_6031891967003430650_n.mp4?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=UKYMs7EobOEQ7kNvwGB8UrX&_nc_oc=AdlJMTICIuScQzID-7Wd0hi6z7lshJ8MyMGp6JESPILUgsGG27fVWDiXu0J1ord92Bo&_nc_zt=28&_nc_ht=scontent.whatsapp.net&edm=AIJs65cEAAAA&_nc_gid=9mecET9dkeGvK54-GhgK6A&oh=01_Q5Aa2QGaN1eeEj8TkOEE94uP16NUCavPj9tcQ5_vGHgJSKY9eA&oe=68DFA10D"
    
    template = db.query(template_details).filter(template_details.template_name == template_name).first()
    if not template or not template.file_url:
        raise HTTPException(
            status_code=404,
            detail=f"No file_url found for template {template_name}"
        )

    video_url = template.file_url
    if(basedon == "upload"):
        numbers_str = data.get("phone_numbers", "")
    else:
        numbers_obj = get_eligible_customers(campaign_id, basedon, db)
        numbers_str = numbers_obj["numbers"]   # extract the string

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
                            "type": "video",
                            "video": {"link": video_url}
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
    

def save_template_details(
    db: Session,
    template_name: str,
    file_url: str = None,
    file_hvalue: str = None,
    template_type: str = None,
    media_type: str = None
):
    """
    Insert or update template details in the database.
    """
    try:
        template = db.query(template_details).filter(template_details.template_name == template_name).first()

        if template:
            # Update existing
            template.file_url = file_url
            template.file_hvalue = file_hvalue
            template.template_type = template_type
            template.media_type = media_type
        else:
            # Insert new
            template = template_details(
                template_name=template_name,
                file_url=file_url,
                file_hvalue=file_hvalue,
                template_type=template_type,
                media_type=media_type,
            )
            db.add(template)

        db.commit()
        return True
    except Exception as e:
        db.rollback()  # rollback on error
        print(f"Error saving template details: {e}")
        return False


@router.get("/{template_name}/details")
async def get_template_details(template_name: str, db: Session = Depends(get_db)):
    template = (
        db.query(template_details)
        .filter(template_details.template_name == template_name)
        .first()
    )

    print("template----------- ",template)

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return {
        "template_name": template.template_name,
        "template_type": template.template_type,
        "media_type": template.media_type,
    }

def get_eligible_customers(campaign_id: int, basedon:str,db: Session = Depends(get_db)):
    print("campaign_id------ ",campaign_id)
    sql = text("""
        SELECT 
            ca.CUST_MOBILENO
        FROM campaigns c
        JOIN crm_analysis ca 
            ON 1=1
        LEFT JOIN crm_sales cs 
            ON cs.CUST_MOBILENO = ca.CUST_MOBILENO
        WHERE 
            c.id = :campaign_id
            AND (
                (
                    c.rfm_segments IS NOT NULL 
                    AND JSON_CONTAINS(c.rfm_segments, JSON_QUOTE(ca.SEGMENT_MAP), '$')
                )
                OR (
                    (c.r_score IS NULL OR JSON_CONTAINS(c.r_score, JSON_ARRAY(ca.R_SCORE), '$'))
                    AND (c.f_score IS NULL OR JSON_CONTAINS(c.f_score, JSON_ARRAY(ca.F_SCORE), '$'))
                    AND (c.m_score IS NULL OR JSON_CONTAINS(c.m_score, JSON_ARRAY(ca.M_SCORE), '$'))
                    AND (c.recency_min IS NULL OR c.recency_max IS NULL OR (ca.DAYS BETWEEN c.recency_min AND c.recency_max))
                    AND (c.frequency_min IS NULL OR c.frequency_max IS NULL OR (ca.F_VALUE BETWEEN c.frequency_min AND c.frequency_max))
                    AND (c.monetary_min IS NULL OR c.monetary_max IS NULL OR (ca.M_VALUE BETWEEN c.monetary_min AND c.monetary_max))
                )
            )
            AND (c.branch IS NULL OR JSON_CONTAINS(c.branch, JSON_QUOTE(ca.LAST_IN_STORE_CODE), '$'))
            AND (c.city IS NULL OR JSON_CONTAINS(c.city, JSON_QUOTE(ca.LAST_IN_STORE_CITY), '$'))
            AND (c.state IS NULL OR JSON_CONTAINS(c.state, JSON_QUOTE(ca.LAST_IN_STORE_STATE), '$'))
            AND (c.section IS NULL OR JSON_CONTAINS(c.section, JSON_QUOTE(cs.SECTION), '$'))
            AND (c.product IS NULL OR JSON_CONTAINS(c.product, JSON_QUOTE(cs.PRODUCT), '$'))
            AND (c.model IS NULL OR JSON_CONTAINS(c.model, JSON_QUOTE(cs.MODELNO), '$'))
            AND (c.item IS NULL OR JSON_CONTAINS(c.item, JSON_QUOTE(cs.ITEM_DESCRIPTION), '$'))
    """)

    #result = db.execute(sql, {"campaign_id": campaign_id}).fetchall()
    result = db.execute(sql, {"campaign_id": campaign_id}).fetchall()

    if not result:
        # raise HTTPException(status_code=404, detail="No eligible customers found")
        numbers_str=""
    else:
    # format numbers with 91 prefix and comma separator
        numbers = [f"91{row.CUST_MOBILENO}" for row in result if row.CUST_MOBILENO]
        numbers_str = ",".join(numbers)
        print("numbers_str--------------- ",numbers_str)
    

    return {"campaign_id": campaign_id, "numbers": numbers_str}