import os
import requests
from fastapi import APIRouter, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

#router = APIRouter(tags=["templates"])
router = APIRouter(prefix="/campaign/templates", tags=["templates"])

#@router.post("/templates")
@router.post("/create-template")
async def create_template(req: Request):
    payload = await req.json()
    api_key = "skI7lyZ0g0qj4dHDvwJ5k"
    #channel = payload.pop("channel", os.getenv("CHANNEL_NUMBER", "917996666220"))
    channel = "917996666220"
    url = f"https://cloudapi.wbbox.in/api/v1.0/create-templates/{channel}"
    headers = {
        "Authorization": f"Bearer {api_key}",
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
    api_key = "skI7lyZ0g0qj4dHDvwJ5k"
    #channel = payload.pop("channel", os.getenv("CHANNEL_NUMBER", "917996666220"))
    channel = "917996666220"
    url = f"https://cloudapi.wbbox.in/api/v1.0/sync-templates/{channel}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    try:
        
        template_name = payload.get("name")
        if not template_name:
            raise HTTPException(status_code=400, detail="Template name missing")

        sync_url = f"https://cloudapi.wbbox.in/api/v1.0/sync-templates/{template_name}"
        sync_resp = requests.get(sync_url, headers={"Authorization": f"Bearer {api_key}"})
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
    api_key = "skI7lyZ0g0qj4dHDvwJ5k"
    url = "https://cloudapi.wbbox.in/api/v1.0/templates"
    headers = {"Authorization": f"Bearer {api_key}"}
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
    except requests.HTTPError as e:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return response.json()