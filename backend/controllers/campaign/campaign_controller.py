import csv
from decimal import Decimal
from io import BytesIO, StringIO
from fastapi.responses import StreamingResponse
import pandas as pd
import math
from fastapi import HTTPException
from sqlalchemy.dialects import mysql
from sqlalchemy import text
from sqlalchemy.orm import Session
from models.campaign.campaign_model import Campaign
from models.campaign.upload_contact_model import CampaignUpload
from models.campaign.brand_detail_model import  BrandDetail
from models.campaign.brand_filter_model import CampaignBrandFilter
from models.campaign.geography_model import Geography
from models.campaign.rfm_detail_model import RFMDetail
from schemas.campaign.campaign_schema import CampaignCreate
from models.crm_analysis import CRMAnalysis as CRMAnalysisModel
from schemas.crm_analysis import CRMAnalysis as CRMAnalysisSchema

#from schemas.campaign.campaign_schema import CampaignOptions
# from schemas.campaign.campaign_schema import CampaignCreate, CampaignOptions
from schemas.campaign.campaign_schema import (
    CampaignCreate,
    CampaignOptions,
    CampaignRunDetails,
)

def _to_float(x):
    if x is None: 
        return None
    return float(x) if isinstance(x, (int, float, Decimal)) else x

def get_campaign_options(db: Session) -> CampaignOptions:
    # 1. RFM details
    # r_scores     = [r[0] for r in db.query(RFMDetail.r_score).distinct().order_by(RFMDetail.r_score)]
    # f_scores     = [r[0] for r in db.query(RFMDetail.f_score).distinct().order_by(RFMDetail.f_score)]
    # m_scores     = [r[0] for r in db.query(RFMDetail.m_score).distinct().order_by(RFMDetail.m_score)]
    # segments     = [r[0] for r in db.query(RFMDetail.segment).distinct().order_by(RFMDetail.segment)]

     # 1. RFM details – now pulled from crm_analysis
    r_scores = [
        row[0]
        for row in db
            .query(CRMAnalysisModel.R_SCORE)
            .distinct()
            .order_by(CRMAnalysisModel.R_SCORE)
            .all()
    ]
    f_scores = [
        row[0]
        for row in db
            .query(CRMAnalysisModel.F_SCORE)
            .distinct()
            .order_by(CRMAnalysisModel.F_SCORE)
            .all()
    ]
    m_scores = [
        row[0]
        for row in db
            .query(CRMAnalysisModel.M_SCORE)
            .distinct()
            .order_by(CRMAnalysisModel.M_SCORE)
            .all()
    ]
    segments = [
        row[0]
        for row in db
            .query(CRMAnalysisModel.SEGMENT_MAP)
            .distinct()
            .order_by(CRMAnalysisModel.SEGMENT_MAP)
            .all()
    ]

    # 2. Geography: branch → cities, states
    # geo_rows     = db.query(Geography.branch, Geography.city, Geography.state).all()
    # branches     = sorted({g.branch for g in geo_rows})
    # branch_city  = {}
    # branch_state = {}
    # for b, c, s in geo_rows:
    #     branch_city.setdefault(b, set()).add(c)
    #     branch_state.setdefault(b, set()).add(s)
    # branch_city_map  = {b: sorted(list(cs)) for b, cs in branch_city.items()}
    # branch_state_map = {b: sorted(list(ss)) for b, ss in branch_state.items()}

    # 2. Geography: branch → cities, states (from crm_analysis)
    geo_rows = (
        db.query(
            CRMAnalysisModel.LAST_IN_STORE_NAME,
            CRMAnalysisModel.LAST_IN_STORE_CITY,
            CRMAnalysisModel.LAST_IN_STORE_STATE,
        )
        .distinct()
        .all()
    )

    branches = sorted({row[0] for row in geo_rows if row[0]})
    branch_city_map = {
        b: sorted({city for branch, city, _ in geo_rows if branch == b and city})
        for b in branches
    }
    branch_state_map = {
        b: sorted({state for branch, _, state in geo_rows if branch == b and state})
        for b in branches
    }

    # # 3. Brand details: section, product, model, item
    # bd_rows      = db.query(
    #                   BrandDetail.section,
    #                   BrandDetail.product,
    #                   BrandDetail.model,
    #                   BrandDetail.item
    #                ).all()
    # 3. Brand hierarchy: brand → section → product → model → item
    bd_rows = db.query(
        CampaignBrandFilter.brand,
        CampaignBrandFilter.section,
        CampaignBrandFilter.product,
        CampaignBrandFilter.model,
        CampaignBrandFilter.item,
    ).all()
   # brands = sorted({r.brand for r in bd_rows})
    brands   = sorted({r.brand   for r in bd_rows if r.brand   is not None})
    sections = sorted({r.section for r in bd_rows if r.section is not None})
    products = sorted({r.product for r in bd_rows if r.product is not None})
    models   = sorted({r.model   for r in bd_rows if r.model   is not None})
    items    = sorted({r.item    for r in bd_rows if r.item    is not None})

    # ✅ NEW: full hierarchy objects (filter out completely empty rows)
    brand_hierarchy = [
        {
            "brand":   r.brand,
            "section": r.section,
            "product": r.product,
            "model":   r.model,
            "item":    r.item,
        }
        for r in bd_rows
        if any([r.brand, r.section, r.product, r.model, r.item])
    ]
   
   # print("brand_hierarchy------------",brand_hierarchy)
    return CampaignOptions(
      r_scores=r_scores,
      f_scores=f_scores,
      m_scores=m_scores,
      rfm_segments=segments,

      branches=branches,
      branch_city_map=branch_city_map,
      branch_state_map=branch_state_map,
      

      brands=brands,
      sections=sections,
      products=products,
      models=models,
      items=items,
      brand_hierarchy=brand_hierarchy,
    )

def create_campaign(db: Session, data: CampaignCreate) -> Campaign:
    print("inside create campaign -----------------", data.dict(by_alias=False, exclude_unset=True))
    db_obj = Campaign(**data.dict(by_alias=False))
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def list_campaigns(db: Session):
    """Return all campaigns."""
    return db.query(Campaign).order_by(Campaign.id.desc()).all()

def get_campaign(db: Session, campaign_id: int):
    """Fetch a single campaign by ID."""
    return db.query(Campaign).filter(Campaign.id == campaign_id).first()

def update_campaign(db: Session, campaign_id: int, data: CampaignCreate):
    """Update an existing campaign."""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        return None
    for field, value in data.dict().items():
        setattr(campaign, field, value)
    db.commit()
    db.refresh(campaign)
    return campaign

def clean_value(val):
    if val is None:
        return None
    # handle pandas NaN
    if isinstance(val, float) and math.isnan(val):
        return None
    return val


# def save_upload_contacts(db: Session, campaign_id: int, contacts: list[dict]):
#     db.query(CampaignUpload).filter(CampaignUpload.campaign_id == campaign_id).delete()
#     objs = [
#         CampaignUpload(
#             campaign_id=campaign_id,
#             name=contact.get("name"),
#             mobile_no=str(contact.get("mobile_no")),
#             email_id=contact.get("email_id"),
#         )
#         for contact in contacts
#         if contact.get("mobile_no") is not None
#     ]
#     if objs:
#         db.bulk_save_objects(objs)
#         db.commit()

def save_upload_contacts(db: Session, campaign_id: int, contacts: list[dict]):
    db.query(CampaignUpload).filter(CampaignUpload.campaign_id == campaign_id).delete()
    objs = [
        CampaignUpload(
            campaign_id=campaign_id,
            name=clean_value(contact.get("name")),
            mobile_no=str(contact.get("mobile_no")),
            email_id=clean_value(contact.get("email_id")),
        )
        for contact in contacts
        if contact.get("mobile_no") is not None
    ]
    if objs:
        db.bulk_save_objects(objs)
        db.commit()

def export_upload_contacts(db: Session, campaign_id: int) -> BytesIO:
    rows = (
        db.query(CampaignUpload)
        .filter(CampaignUpload.campaign_id == campaign_id)
        .all()
    )
    df = pd.DataFrame(
        [
            {"name": r.name, "mobile_no": r.mobile_no, "email_id": r.email_id}
            for r in rows
        ]
    )
    buffer = BytesIO()
    df.to_excel(buffer, index=False)
    buffer.seek(0)
    return buffer


def generate_upload_template() -> BytesIO:
    df = pd.DataFrame(columns=["name", "mobile_no", "email_id"])
    buffer = BytesIO()
    df.to_excel(buffer, index=False)
    buffer.seek(0)
    return buffer


def get_campaign_run_details11(db: Session, campaign_id: int) -> CampaignRunDetails | None:
    """Return run-time details for a campaign."""
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
        # id=camp.id,
        # name=camp.name,
        # rfm_segment_label=rfm_segment_label or "-",
        # brand_label=brand_label or "-",
        # value_threshold=float(camp.value_threshold) if camp.value_threshold is not None else None,
        # shortlisted_count=shortlisted_count,
        id=camp.id,
        name=camp.name,

        # new pass-through fields
        start_date=camp.start_date,
        end_date=camp.end_date,
        based_on=camp.based_on,
        recency_op=camp.recency_op,
        recency_min=camp.recency_min,
        recency_max=camp.recency_max,
        frequency_op=camp.frequency_op,
        frequency_min=camp.frequency_min,
        frequency_max=camp.frequency_max,
        monetary_op=camp.monetary_op,
        monetary_min=_to_float(camp.monetary_min),
        monetary_max=_to_float(camp.monetary_max),
        r_score=camp.r_score,
        f_score=camp.f_score,
        m_score=camp.m_score,
        rfm_segments=camp.rfm_segments,
        branch=camp.branch,
        city=camp.city,
        state=camp.state,
        birthday_start=camp.birthday_start,
        birthday_end=camp.birthday_end,
        anniversary_start=camp.anniversary_start,
        anniversary_end=camp.anniversary_end,
        purchase_type=camp.purchase_type,
        purchase_brand=camp.purchase_brand,
        section=camp.section,
        product=camp.product,
        model=camp.model,
        item=camp.item,
        value_threshold=_to_float(camp.value_threshold),
        created_at=camp.created_at,
        updated_at=camp.updated_at,

        # already existing UI fields
        rfm_segment_label=rfm_segment_label or "-",
        brand_label=brand_label or "-",
        shortlisted_count=shortlisted_count,
    )

def export_crm_numbers(db: Session, campaign_id: int) -> BytesIO:
    """Export distinct phone numbers from crm_sales for a campaign."""
    camp: Campaign = db.query(Campaign).get(campaign_id)
    if not camp:
        raise HTTPException(404, "Campaign not found")

    sql_numbers = text(
        """
        SELECT s.CUST_MOBILENO AS mobile_no
        FROM crm_sales s
        """
    )

    rows = db.execute(sql_numbers).fetchall()
    df = pd.DataFrame([{"mobile_no": r.mobile_no} for r in rows])

    buffer = BytesIO()
    df.to_excel(buffer, index=False)
    buffer.seek(0)
    return buffer

def get_mobile_numbers(db: Session, filters) -> list[str]:
    """Fetch mobile numbers based on provided campaign filters.
    Filters tied to product hierarchy (brand/section/product/model/item/valueThreshold)
    query ``crm_sales``. Geography/RFM filters query ``crm_analysis``. If both
    groups of filters are supplied, the two tables are joined on mobile number.
    """

    params = {}
    sales_clauses = []
    analysis_clauses = []

    # --- Sales filters ---
    if getattr(filters, "purchaseBrand", None):
        sales_clauses.append("s.BRAND IN :brands")
        params["brands"] = tuple(filters.purchaseBrand)
    if getattr(filters, "section", None):
        sales_clauses.append("s.SECTION IN :sections")
        params["sections"] = tuple(filters.section)
    if getattr(filters, "product", None):
        sales_clauses.append("s.PRODUCT IN :products")
        params["products"] = tuple(filters.product)
    if getattr(filters, "model", None):
        sales_clauses.append("s.MODEL IN :models")
        params["models"] = tuple(filters.model)
    if getattr(filters, "item", None):
        sales_clauses.append("s.ITEM IN :items")
        params["items"] = tuple(filters.item)
    if getattr(filters, "valueThreshold", None) is not None:
        sales_clauses.append("s.VALUE >= :val_threshold")
        params["val_threshold"] = filters.valueThreshold

    # --- Analysis filters ---
    if getattr(filters, "branch", None):
        analysis_clauses.append("a.LAST_IN_STORE_NAME IN :branch")
        params["branch"] = tuple(filters.branch)
    if getattr(filters, "city", None):
        analysis_clauses.append("a.LAST_IN_STORE_CITY IN :city")
        params["city"] = tuple(filters.city)
    if getattr(filters, "state", None):
        analysis_clauses.append("a.LAST_IN_STORE_STATE IN :state")
        params["state"] = tuple(filters.state)
    if getattr(filters, "rfmSegment", None):
        analysis_clauses.append("a.SEGMENT_MAP IN :segment")
        params["segment"] = tuple(filters.rfmSegment)
    if getattr(filters, "rScore", None):
        analysis_clauses.append("a.R_SCORE IN :rscore")
        params["rscore"] = tuple(filters.rScore)

    op_map = {"=": "=", ">=": ">=", "<=": "<="}
    if getattr(filters, "recencyOp", None) and getattr(filters, "recencyMin", None) is not None:
        if filters.recencyOp == "between" and getattr(filters, "recencyMax", None) is not None:
            analysis_clauses.append("a.DAYS BETWEEN :rmin AND :rmax")
            params["rmin"] = filters.recencyMin
            params["rmax"] = filters.recencyMax
        else:
            op = op_map.get(filters.recencyOp)
            if op:
                analysis_clauses.append(f"a.DAYS {op} :rmin")
                params["rmin"] = filters.recencyMin

    if getattr(filters, "frequencyOp", None) and getattr(filters, "frequencyMin", None) is not None:
        if filters.frequencyOp == "between" and getattr(filters, "frequencyMax", None) is not None:
            analysis_clauses.append("a.F_VALUE BETWEEN :fmin AND :fmax")
            params["fmin"] = filters.frequencyMin
            params["fmax"] = filters.frequencyMax
        else:
            op = op_map.get(filters.frequencyOp)
            if op:
                analysis_clauses.append(f"a.F_VALUE {op} :fmin")
                params["fmin"] = filters.frequencyMin

    if getattr(filters, "monetaryOp", None) and getattr(filters, "monetaryMin", None) is not None:
        if filters.monetaryOp == "between" and getattr(filters, "monetaryMax", None) is not None:
            analysis_clauses.append("a.M_VALUE BETWEEN :mmin AND :mmax")
            params["mmin"] = filters.monetaryMin
            params["mmax"] = filters.monetaryMax
        else:
            op = op_map.get(filters.monetaryOp)
            if op:
                analysis_clauses.append(f"a.M_VALUE {op} :mmin")
                params["mmin"] = filters.monetaryMin

    # --- Build SQL ---
    if sales_clauses and analysis_clauses:
        sql = (
            "SELECT DISTINCT s.CUST_MOBILENO,a.customer_name,a.segment_map FROM crm_sales s "
            "JOIN crm_analysis a ON s.CUST_MOBILENO = a.CUST_MOBILENO"
        )
        where = sales_clauses + analysis_clauses
    elif sales_clauses:
        sql = "SELECT DISTINCT s.CUST_MOBILENO FROM crm_sales s"
        where = sales_clauses
    else:
        sql = "SELECT DISTINCT a.CUST_MOBILENO,a.customer_name,a.segment_map FROM crm_analysis a"
        where = analysis_clauses

    if where:
        sql += " WHERE " + " AND ".join(where)

    
    rows = db.execute(text(sql), params)
    #.all()
    
    # rows = db.execute(text("""
    #     SELECT CUST_MOBILENO,CUSTOMER_NAME,SEGMENT_MAP FROM crm_analysis_tcm
    #     WHERE LAST_IN_STORE_CITY = :city 
    # """), {"city": "COIMBATORE"})

    #return [r[0] for r in rows if r[0]]
    return rows


def get_mobile_numbers1(db: Session, filters) -> list[str]:
    query = text("SELECT * FROM your_table WHERE some_filter = :val")
    rows = db.execute(query, {"val": "SOME_VALUE"})

    def iter_csv():
        output = StringIO()
        writer = csv.writer(output)
        # Write header
        writer.writerow(rows.keys())
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)

        # Write rows
        for row in rows:
            writer.writerow(row)
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

    headers = {"Content-Disposition": "attachment; filename=export.csv"}
    return StreamingResponse(iter_csv(), headers=headers, media_type="text/csv")

def expand_sql_with_params(sql, params, db):
    """Expand a SQLAlchemy text() query with parameter values for debugging only."""
    compiled = sql.compile(db.bind, compile_kwargs={"literal_binds": True})
    final_sql = str(compiled)

    for k, v in params.items():
        placeholder = f":{k}"

        if isinstance(v, tuple):
            # Convert tuple into SQL IN list: ('A','B','C')
            val = "(" + ",".join(f"'{x}'" if isinstance(x, str) else str(x) for x in v) + ")"
        elif isinstance(v, str):
            val = f"'{v}'"
        elif v is None:
            val = "NULL"
        else:
            val = str(v)

        final_sql = final_sql.replace(placeholder, val)

    return final_sql

def get_campaign_run_details(db: Session, campaign_id: int) -> CampaignRunDetails | None:
    """Return run-time details for a campaign, joined with crm_sales and crm_analysis."""
    camp: Campaign = db.query(Campaign).get(campaign_id)
    if not camp:
        raise HTTPException(404, "Campaign not found")

    # Labels for UI
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

    # --- Build SQL dynamically ---
    clauses = ["c.id = :cid"]
    params = {"cid": campaign_id}

    # Geography filters
    if camp.branch:
        clauses.append("a.LAST_IN_STORE_CODE IN :branch")
        params["branch"] = tuple(camp.branch)
    if camp.city:
        clauses.append("a.LAST_IN_STORE_CITY IN :city")
        params["city"] = tuple(camp.city)
    if camp.state:
        clauses.append("a.LAST_IN_STORE_STATE IN :state")
        params["state"] = tuple(camp.state)

    # Recency
    if camp.recency_op and camp.recency_min is not None:
        if camp.recency_op == ">=":
            clauses.append("a.DAYS >= :rmin")
        elif camp.recency_op == "<=":
            clauses.append("a.DAYS <= :rmin")
        elif camp.recency_op == "=":
            clauses.append("a.DAYS = :rmin")
        params["rmin"] = camp.recency_min

    # Frequency
    if camp.frequency_op and camp.frequency_min is not None:
        if camp.frequency_op == ">=":
            clauses.append("a.F_VALUE >= :fmin")
        elif camp.frequency_op == "<=":
            clauses.append("a.F_VALUE <= :fmin")
        elif camp.frequency_op == "=":
            clauses.append("a.F_VALUE = :fmin")
        params["fmin"] = camp.frequency_min

    # Monetary
    if camp.monetary_op and camp.monetary_min is not None:
        if camp.monetary_op == ">=":
            clauses.append("a.M_VALUE >= :mmin")
        elif camp.monetary_op == "<=":
            clauses.append("a.M_VALUE <= :mmin")
        elif camp.monetary_op == "=":
            clauses.append("a.M_VALUE = :mmin")
        params["mmin"] = camp.monetary_min

    # RFM Scores
    if camp.r_score:
        clauses.append("a.R_SCORE IN :r_score")
        params["r_score"] = tuple(camp.r_score)
    if camp.f_score:
        clauses.append("a.F_SCORE IN :f_score")
        params["f_score"] = tuple(camp.f_score)
    if camp.m_score:
        clauses.append("a.M_SCORE IN :m_score")
        params["m_score"] = tuple(camp.m_score)

    # Product hierarchy
    if brand_label:
        clauses.append("s.BRAND = :brand")
        params["brand"] = brand_label
    if camp.section:
        clauses.append("s.SECTION IN :section")
        params["section"] = tuple(camp.section)
    if camp.product:
        clauses.append("s.PRODUCT IN :product")
        params["product"] = tuple(camp.product)
    if camp.model:
        clauses.append("s.MODELNO IN :model")
        params["model"] = tuple(camp.model)
    if camp.item:
        clauses.append("s.ITEM_CODE IN :item")
        params["item"] = tuple(camp.item)

    # Value threshold
    if camp.value_threshold is not None:
        clauses.append("s.TOTAL_SALES >= :val_threshold")
        params["val_threshold"] = camp.value_threshold

    # Birthday / Anniversary
    if camp.birthday_start and camp.birthday_end:
        clauses.append("a.DOB BETWEEN :bday_start AND :bday_end")
        params["bday_start"] = camp.birthday_start
        params["bday_end"] = camp.birthday_end

    if camp.anniversary_start and camp.anniversary_end:
        clauses.append("a.ANNIV_DT BETWEEN :anniv_start AND :anniv_end")
        params["anniv_start"] = camp.anniversary_start
        params["anniv_end"] = camp.anniversary_end

    # --- Final SQL ---
    base_sql = f"""
        SELECT COUNT(DISTINCT a.CUST_MOBILENO) AS cnt
        FROM campaigns c
        JOIN crm_sales s 
          ON s.INVOICE_DATE BETWEEN c.start_date AND c.end_date
        JOIN crm_analysis a
          ON a.CUST_MOBILENO = s.CUST_MOBILENO
        WHERE {" AND ".join(clauses)}
    """

    sql = text(base_sql)

    # Debug print with expanded values
    debug_sql = expand_sql_with_params(sql, params, db)
    print("Final SQL with values →")
    print(debug_sql)

    # Execute query
    row = db.execute(sql, params).first()
    shortlisted_count = int(row.cnt) if row and row.cnt is not None else 0

    # Return object
    return CampaignRunDetails(
        id=camp.id,
        name=camp.name,
        start_date=camp.start_date,
        end_date=camp.end_date,
        based_on=camp.based_on,
        recency_op=camp.recency_op,
        recency_min=camp.recency_min,
        recency_max=camp.recency_max,
        frequency_op=camp.frequency_op,
        frequency_min=camp.frequency_min,
        frequency_max=camp.frequency_max,
        monetary_op=camp.monetary_op,
        monetary_min=_to_float(camp.monetary_min),
        monetary_max=_to_float(camp.monetary_max),
        r_score=camp.r_score,
        f_score=camp.f_score,
        m_score=camp.m_score,
        rfm_segments=camp.rfm_segments,
        branch=camp.branch,
        city=camp.city,
        state=camp.state,
        birthday_start=camp.birthday_start,
        birthday_end=camp.birthday_end,
        anniversary_start=camp.anniversary_start,
        anniversary_end=camp.anniversary_end,
        purchase_type=camp.purchase_type,
        purchase_brand=camp.purchase_brand,
        section=camp.section,
        product=camp.product,
        model=camp.model,
        item=camp.item,
        value_threshold=_to_float(camp.value_threshold),
        created_at=camp.created_at,
        updated_at=camp.updated_at,
        rfm_segment_label=rfm_segment_label or "-",
        brand_label=brand_label or "-",
        shortlisted_count=shortlisted_count,
    )

def get_campaign_run_count_from_request(db: Session, filters: dict) -> int:
    """
    Return count of distinct customers from crm_sales + crm_analysis
    based only on request filter parameters (no campaigns table join).
    """

    clauses = []
    params = {}

    # --- Geography filters ---
    if filters.get("branch"):
        clauses.append("a.LAST_IN_STORE_CODE IN :branch")
        params["branch"] = tuple(filters["branch"])
    if filters.get("city"):
        clauses.append("a.LAST_IN_STORE_CITY IN :city")
        params["city"] = tuple(filters["city"])
    if filters.get("state"):
        clauses.append("a.LAST_IN_STORE_STATE IN :state")
        params["state"] = tuple(filters["state"])

    # --- Recency ---
    if filters.get("recency_op") and filters.get("recency_min") is not None:
        op = filters["recency_op"]
        if op in (">=", "<=", "="):
            clauses.append(f"a.DAYS {op} :rmin")
            params["rmin"] = filters["recency_min"]

    # --- Frequency ---
    if filters.get("frequency_op") and filters.get("frequency_min") is not None:
        op = filters["frequency_op"]
        if op in (">=", "<=", "="):
            clauses.append(f"a.F_VALUE {op} :fmin")
            params["fmin"] = filters["frequency_min"]

    # --- Monetary ---
    if filters.get("monetary_op") and filters.get("monetary_min") is not None:
        op = filters["monetary_op"]
        if op in (">=", "<=", "="):
            clauses.append(f"a.M_VALUE {op} :mmin")
            params["mmin"] = filters["monetary_min"]

    # --- RFM Scores ---
    if filters.get("r_score"):
        clauses.append("a.R_SCORE IN :r_score")
        params["r_score"] = tuple(filters["r_score"])
    if filters.get("f_score"):
        clauses.append("a.F_SCORE IN :f_score")
        params["f_score"] = tuple(filters["f_score"])
    if filters.get("m_score"):
        clauses.append("a.M_SCORE IN :m_score")
        params["m_score"] = tuple(filters["m_score"])

    # --- Product hierarchy ---
    if filters.get("brand"):
        clauses.append("s.BRAND = :brand")
        params["brand"] = filters["brand"]
    if filters.get("section"):
        clauses.append("s.SECTION IN :section")
        params["section"] = tuple(filters["section"])
    if filters.get("product"):
        clauses.append("s.PRODUCT IN :product")
        params["product"] = tuple(filters["product"])
    if filters.get("model"):
        clauses.append("s.MODELNO IN :model")
        params["model"] = tuple(filters["model"])
    if filters.get("item"):
        clauses.append("s.ITEM_CODE IN :item")
        params["item"] = tuple(filters["item"])

    # --- Value Threshold ---
    if filters.get("value_threshold") is not None:
        clauses.append("s.TOTAL_SALES >= :val_threshold")
        params["val_threshold"] = filters["value_threshold"]

    # --- Birthday ---
    if filters.get("birthday_start") and filters.get("birthday_end"):
        clauses.append("a.DOB BETWEEN :bday_start AND :bday_end")
        params["bday_start"] = filters["birthday_start"]
        params["bday_end"] = filters["birthday_end"]

    # --- Anniversary ---
    if filters.get("anniversary_start") and filters.get("anniversary_end"):
        clauses.append("a.ANNIV_DT BETWEEN :anniv_start AND :anniv_end")
        params["anniv_start"] = filters["anniversary_start"]
        params["anniv_end"] = filters["anniversary_end"]

    # --- Final SQL ---
    where_clause = " AND ".join(clauses) if clauses else "1=1"

    
    shortlisted_sql = text(f"""
        SELECT COUNT(DISTINCT a.CUST_MOBILENO) AS cnt
        FROM crm_sales s
        JOIN crm_analysis a
        ON a.CUST_MOBILENO = s.CUST_MOBILENO
        WHERE {where_clause}
    """)

    total_sql = text("""
        SELECT COUNT(DISTINCT a.CUST_MOBILENO) AS cnt
        FROM crm_sales s
        JOIN crm_analysis a
        ON a.CUST_MOBILENO = s.CUST_MOBILENO
    """)

    # Debug print
    debug_sql = expand_sql_with_params(shortlisted_sql, params, db)
    print("Final SQL with values →")
    print(debug_sql)

    # Execute queries
    shortlisted_row = db.execute(shortlisted_sql, params).first()
    total_row = db.execute(total_sql).first()

    return {
        "total_customers": int(total_row.cnt) if total_row and total_row.cnt is not None else 0,
        "shortlisted_customers": int(shortlisted_row.cnt) if shortlisted_row and shortlisted_row.cnt is not None else 0,
    }
