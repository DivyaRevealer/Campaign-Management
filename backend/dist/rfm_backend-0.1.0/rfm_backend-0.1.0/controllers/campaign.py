from fastapi import APIRouter, Depends
from typing import Any, Dict

from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session

from database import get_db
from models.crm_analysis import CRMAnalysis as CRMAnalysisModel

from schemas.campaign import CampaignOptions

router = APIRouter(prefix="/campaign", tags=["campaign"])


def _distinct(db: Session, column):
    if column is None:
        return []
    return [value for (value,) in db.query(column).filter(column.isnot(None)).distinct().all()]


def _get_column(*names):
    for name in names:
        col = getattr(CRMAnalysisModel, name, None)
        if col is not None:
            return col
    return None


@router.get("/options", response_model=CampaignOptions)
def get_campaign_options(db: Session = Depends(get_db)) -> CampaignOptions:
    """Return distinct values for campaign configuration filters."""

    return {
        "segments": _distinct(db, _get_column("SEGMENT_MAP", "SEGMENT")),
        "branches": _distinct(db, _get_column("BRANCH", "BRANCH_NAME")),
        "cities": _distinct(db, _get_column("CITY", "CITY_NAME")),
        "states": _distinct(db, _get_column("STATE", "STATE_NAME")),
        "sections": _distinct(db, _get_column("SECTION", "SECTION_NAME")),
        "products": _distinct(db, _get_column("PRODUCT", "PRODUCT_NAME")),
    }