from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy import text
from sqlalchemy.orm import Session
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import os
from io import StringIO
import csv
# from controllers.campaign.campaign_controller import create_campaign
from models import crm_analysis
from models.campaign.campaign_model import Campaign
from models.campaign.upload_contact_model import CampaignUpload
from controllers.campaign.campaign_controller import (
    create_campaign,
    get_campaign_options,
    list_campaigns,
    get_campaign,
    update_campaign,
    get_campaign_run_details,
    save_upload_contacts,
    export_upload_contacts,
    export_crm_numbers,
    generate_upload_template,
    get_mobile_numbers,
)
from schemas.campaign.campaign_schema import (
    CampaignCreate,
    Campaign as CampaignOut,
    CampaignListOut,
    CampaignOptions,
    CampaignRunDetails,
    )
from database import SessionLocal
from typing import List, Optional
from utils.whatsapp import send_whatsapp_message
import pandas as pd




class NumberDownloadFilters(BaseModel):
    purchaseBrand: Optional[List[str]] = None
    section: Optional[List[str]] = None
    product: Optional[List[str]] = None
    model: Optional[List[str]] = None
    item: Optional[List[str]] = None
    valueThreshold: Optional[float] = None
    branch: Optional[List[str]] = None
    city: Optional[List[str]] = None
    state: Optional[List[str]] = None
    rfmSegment: Optional[List[str]] = None
    rScore: Optional[List[int]] = None
    recencyOp: Optional[str] = None
    recencyMin: Optional[int] = None
    recencyMax: Optional[int] = None
    frequencyOp: Optional[str] = None
    frequencyMin: Optional[int] = None
    frequencyMax: Optional[int] = None
    monetaryOp: Optional[str] = None
    monetaryMin: Optional[float] = None
    monetaryMax: Optional[float] = None




router = APIRouter(prefix="/campaign", tags=["campaign"])

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/upload/template")
def download_upload_template_route():
    buffer = generate_upload_template()
    headers = {
        "Content-Disposition": "attachment; filename=campaign_upload_template.xlsx"
    }
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )



@router.get("/{campaign_id}/upload/download")
def download_campaign_contacts(
    campaign_id: int, db: Session = Depends(get_db)
):
    buffer = export_upload_contacts(db, campaign_id)
    headers = {
        "Content-Disposition": f"attachment; filename=campaign_{campaign_id}_contacts.xlsx"
    }
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )

@router.get("/{campaign_id}/upload/numbers")
def get_upload_numbers_route(campaign_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(CampaignUpload.mobile_no)
        .filter(CampaignUpload.campaign_id == campaign_id)
        .all()
    )
    numbers = [r[0] for r in rows]
    return {"phone_numbers": ",".join(numbers)}




@router.get("/options", response_model=CampaignOptions)
def read_campaign_options(db: Session = Depends(get_db)):
    return get_campaign_options(db)

@router.post("/createCampaign", response_model=CampaignOut)
def create_campaign_route(
    campaign: CampaignCreate,
    db: Session = Depends(get_db)
):
    try:
        return create_campaign(db, campaign)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Optional: also delete contacts tied to this campaign
    # db.query(campaign_controller.CampaignUpload).filter(
    #     campaign_controller.CampaignUpload.campaign_id == campaign_id
    # ).delete()

    db.delete(campaign)
    db.commit()
    return {"message": "Campaign deleted successfully"}



@router.get("", response_model=list[CampaignOut])
def read_campaigns(db: Session = Depends(get_db)):
    return list_campaigns(db)


@router.get("/{campaign_id}", response_model=CampaignOut)
def read_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.get("/run/{campaign_id}", response_model=CampaignRunDetails)
def read_campaign_run_details(campaign_id: int, db: Session = Depends(get_db)):
    details = get_campaign_run_details(db, campaign_id)
    if not details:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return details



@router.put("/{campaign_id}", response_model=CampaignOut)
def update_campaign_route(
    campaign_id: int,
    campaign: CampaignCreate,
    db: Session = Depends(get_db),
):
    updated = update_campaign(db, campaign_id, campaign)
    if not updated:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return updated

@router.post("/{campaign_id}/upload")
def upload_campaign_contacts(
    campaign_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        df = pd.read_excel(file.file)
        contacts = df.to_dict(orient="records")
        save_upload_contacts(db, campaign_id, contacts)
        return {"rows": len(contacts)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/run/list", response_model=List[CampaignListOut])
def list_campaigns_for_run(
    from_date: Optional[date] = Query(None),
    to_date:   Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Campaign)
    if from_date:
        q = q.filter(Campaign.start_date >= from_date)
    if to_date:
        q = q.filter(Campaign.end_date <= to_date)
    # if neither provided, you can default to "active now"
    if not from_date and not to_date:
        today = date.today()
        q = q.filter(Campaign.start_date <= today, Campaign.end_date >= today)
    return q.order_by(Campaign.start_date.desc()).all()

@router.get("/run/{campaign_id}/details", response_model=CampaignRunDetails)
def campaign_run_details(campaign_id: int, db: Session = Depends(get_db)):
    camp: Campaign = db.query(Campaign).get(campaign_id)
    if not camp:
        raise HTTPException(404, "Campaign not found")

    # Labels for the UI (not used in the count logic)
    rfm_segment_label = None
    if isinstance(camp.rfm_segments, list) and camp.rfm_segments:
        rfm_segment_label = camp.rfm_segments[0]
    elif isinstance(camp.rfm_segments, dict) and "label" in camp.rfm_segments:
        rfm_segment_label = camp.rfm_segments["label"]

    brand_label = None
    if isinstance(camp.purchase_brand, list) and camp.purchase_brand:
        brand_label = camp.purchase_brand[0]
    elif isinstance(camp.purchase_brand, str):
        brand_label = camp.purchase_brand

    # Count distinct customers in crm_sales during the campaign window,
    # optionally restricted by campaign.purchase_brand (JSON array)
    sql_count = text("""
        SELECT COUNT(DISTINCT s.CUST_MOBILENO) AS cnt
        FROM crm_sales s
        JOIN (
          SELECT start_date, end_date, purchase_brand
          FROM campaigns
          WHERE id = :cid
        ) c
          ON s.INVOICE_DATE BETWEEN c.start_date AND c.end_date
        WHERE
          (c.purchase_brand IS NULL OR JSON_LENGTH(c.purchase_brand) = 0
           OR JSON_CONTAINS(c.purchase_brand, JSON_QUOTE(s.BRAND)))
          -- AND (s.TXN_FLAG IS NULL OR s.TXN_FLAG = 'S')  -- uncomment if you want sales-only
    """)

    row = db.execute(sql_count, {"cid": campaign_id}).first()
    shortlisted_count = int(row.cnt) if row and row.cnt is not None else 0

       # Debug print
    print("Campaign Details →")
    print(f"  id                = {camp.id}")
    print(f"  name              = {camp.name}")
    print(f"  rfm_segment_label = {rfm_segment_label or '-'}")
    print(f"  brand_label       = {brand_label or '-'}")
    print(f"  value_threshold   = {float(camp.value_threshold) if camp.value_threshold is not None else None}")
    print(f"  shortlisted_count = {shortlisted_count}")


    return CampaignRunDetails(
        id=camp.id,
        name=camp.name,
        based_on=camp.based_on,
        rfm_segment_label=rfm_segment_label or "-",
        brand_label=brand_label or "-",
        value_threshold=float(camp.value_threshold) if camp.value_threshold is not None else None,
        shortlisted_count=shortlisted_count,
    )

class WhatsAppMessage(BaseModel):
    to: str
    body: str

@router.post("/send-whatsapp")
def send_whatsapp(req: WhatsAppMessage):
    channel_number = os.getenv("WBOX_CHANNEL_NUMBER")
    api_key = os.getenv("WBOX_TOKEN")

    print("watsapp Details →")
   

    if not channel_number or not api_key:
        raise HTTPException(
            status_code=500,
            detail="WBOX_CHANNEL_NUMBER or WBOX_TOKEN not set in environment"
        )

    try:
        return send_whatsapp_message(
            channel_number=channel_number,
            api_key=api_key,
            recipient_number=req.to,
            message=req.body
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    

@router.get("/run/{campaign_id}/numbers/download")
def download_campaign_numbers(campaign_id: int, db: Session = Depends(get_db)):
    buffer = export_crm_numbers(db, campaign_id)
    headers = {
        "Content-Disposition": f"attachment; filename=campaign_{campaign_id}_numbers.xlsx"
    }
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


@router.post("/download-numbers")
def download_numbers_route(filters: NumberDownloadFilters, db: Session = Depends(get_db)):

    rows = get_mobile_numbers(db, filters)
  

    def iter_csv():
        buffer = StringIO(newline="")
        writer = csv.writer(buffer)

        # header
       # writer.writerow(["mobile_no", "name", "segment"])
        writer.writerow(rows.keys())
        yield buffer.getvalue()
        buffer.seek(0)
        buffer.truncate(0)

        # rows in batches
        batch = []
        for r in rows:
            #batch.append([r[0], r[1], r[2]])
            batch.append(list(r))  # row as list of values
            if len(batch) >= 1000:  # flush every 1000 rows
                writer.writerows(batch)
                yield buffer.getvalue()
                buffer.seek(0)
                buffer.truncate(0)
                batch = []

        # flush remaining
        if batch:
            writer.writerows(batch)
            yield buffer.getvalue()

    headers = {"Content-Disposition": "attachment; filename=numbers.csv"}
    return StreamingResponse(
        iter_csv(),
        media_type="text/csv",
        headers=headers
    )

    