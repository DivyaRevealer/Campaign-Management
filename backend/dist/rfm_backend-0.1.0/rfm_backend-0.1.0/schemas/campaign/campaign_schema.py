from datetime import date, datetime
from typing import List, Optional, Dict,Any
from pydantic import BaseModel

class CampaignBase(BaseModel):
    name:             str
    start_date:       date
    end_date:         date
    based_on:         Optional[str]= None
    recency_op:       Optional[str]= None
    recency_min:      Optional[int]= None
    recency_max:      Optional[int]= None
    frequency_op:     Optional[str]= None
    frequency_min:    Optional[int]= None
    frequency_max:    Optional[int]= None
    monetary_op:      Optional[str]= None
    monetary_min:     Optional[float]= None
    monetary_max:     Optional[float]= None
    r_score:          Optional[List[int]]= None
    f_score:          Optional[List[int]]= None
    m_score:          Optional[List[int]]= None
    rfm_segments:     Optional[List[str]] = None
    branch:           Optional[List[str]]= None
    city:             Optional[List[str]]= None
    state:            Optional[List[str]]= None
    birthday_start:     Optional[date]= None
    birthday_end:       Optional[date]= None
    anniversary_start:  Optional[date]= None
    anniversary_end:    Optional[date]= None
    purchase_type: Optional[str] = None
    purchase_brand:  Optional[List[str]]= None
    section:          Optional[List[str]]= None
    product:          Optional[List[str]]= None
    model:            Optional[List[str]]= None
    item:             Optional[List[str]]= None
    value_threshold:  Optional[float]= None
    class Config:
        from_attributes = True

class CampaignCreate(CampaignBase):
    pass

class Campaign(CampaignBase):
    id:               int
    created_at:       datetime
    updated_at:       datetime

    class Config:
        from_attributes = True

class CampaignOptions(BaseModel):
    r_scores:         List[int]
    f_scores:         List[int]
    m_scores:         List[int]
    rfm_segments:     List[str]

    branches:         List[str]
    branch_city_map:  Dict[str, List[str]]
    branch_state_map: Dict[str, List[str]]

    brands:         List[str]
    sections:         List[str]
    products:         List[str]
    models:           List[str]
    items:            List[str]
    brand_hierarchy:  List[Dict[str, Optional[str]]]

    class Config:
        from_attributes = True

class CampaignRunDetails(BaseModel):
    # id: int
    # name: str
    # rfm_segment_label: str
    # brand_label: str
    # value_threshold: Optional[float] = None
    # shortlisted_count: int
 
    id: int
    name: str
    based_on: str | None = None
    # NEW: raw campaign filters/metadata
    start_date: date
    end_date: date
    recency_op: Optional[Any] = None
    recency_min: Optional[int] = None
    recency_max: Optional[int] = None
    frequency_op: Optional[Any] = None
    frequency_min: Optional[int] = None
    frequency_max: Optional[int] = None
    monetary_op: Optional[Any] = None
    monetary_min: Optional[float] = None
    monetary_max: Optional[float] = None
    r_score: Optional[Any] = None
    f_score: Optional[Any] = None
    m_score: Optional[Any] = None
    rfm_segments: Optional[Any] = None
    branch: Optional[List[str]] = None
    city: Optional[List[str]] = None
    state: Optional[List[str]] = None
    birthday_start: Optional[date] = None
    birthday_end: Optional[date] = None
    anniversary_start: Optional[date] = None
    anniversary_end: Optional[date] = None
    purchase_type: Optional[str] = None
    purchase_brand: Optional[Any] = None
    section: Optional[Any] = None
    product: Optional[Any] = None
    model: Optional[Any] = None
    item: Optional[Any] = None
    value_threshold: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # already shown on the UI
    rfm_segment_label: str
    brand_label: str
    shortlisted_count: int
class Config:
    from_attributes = True

class CampaignListOut(BaseModel):
    id: int
    name: str
    start_date: date
    end_date: date
    class Config:
        from_attributes = True
