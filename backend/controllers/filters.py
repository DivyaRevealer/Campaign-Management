from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.crm_analysis import CRMAnalysis as CRMAnalysisModel
from schemas.filters import FilterOptions

router = APIRouter(prefix="/filters", tags=["filters"])


# @router.get("/", response_model=FilterOptions)
@router.get("", response_model=FilterOptions)
def get_filter_options(db: Session = Depends(get_db)) -> FilterOptions:
    """Return distinct field values used for dashboard filters."""

    def distinct(column):
        return [value for (value,) in db.query(column).filter(column.isnot(None)).distinct().all()]

    return {
        "phones": distinct(CRMAnalysisModel.CUST_MOBILENO),
        "names": distinct(CRMAnalysisModel.CUSTOMER_NAME),
        "r_values": distinct(CRMAnalysisModel.R_SCORE),
        "f_values": distinct(CRMAnalysisModel.F_SCORE),
        "m_values": distinct(CRMAnalysisModel.M_SCORE),
    }