from typing import List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from fastapi import Query

from database import get_db
from models.crm_analysis import CRMAnalysis as CRMAnalysisModel
from schemas.crm_analysis import CRMAnalysis as CRMAnalysisSchema

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/", response_model=List[CRMAnalysisSchema])
# def get_dashboard_data(db: Session = Depends(get_db)):
#     """Fetch all dashboard records from the CRM analysis table."""
#     return db.query(CRMAnalysisModel).all()

def get_dashboard_data(
    start_date: date | None = Query(None, description="Start of transaction date range"),
    end_date:   date | None = Query(None, description="End of transaction date range"),
    phone: str | None = None,
    name: str | None = None,
    r_score: int | None = None,
    f_score: int | None = None,
    m_score: int | None = None,
    db: Session = Depends(get_db),
):
    """Fetch dashboard records filtered by optional query parameters."""

    query = db.query(CRMAnalysisModel)
     # date filters (use whichever date field makes sense – e.g. FIRST_IN_DATE)
    if start_date:
        query = query.filter(CRMAnalysisModel.FIRST_IN_DATE >= start_date)
    if end_date:
        query = query.filter(CRMAnalysisModel.FIRST_IN_DATE <= end_date)
    if phone:
        query = query.filter(CRMAnalysisModel.CUST_MOBILENO == phone)
    if name:
        query = query.filter(CRMAnalysisModel.CUSTOMER_NAME == name)
    if r_score is not None:
        query = query.filter(CRMAnalysisModel.R_SCORE == r_score)
    if f_score is not None:
        query = query.filter(CRMAnalysisModel.F_SCORE == f_score)
    if m_score is not None:
        query = query.filter(CRMAnalysisModel.M_SCORE == m_score)
    
    # sql = query.statement.compile(
    #     compile_kwargs={"literal_binds": True}
    # )
    # print(str(sql))   # ← this will print something like below

    # return query.all()

    

    sql = query.statement.compile(compile_kwargs={"literal_binds": True})
    print(str(sql))

    return query.all()


@router.get("/last_three_charts")
def get_last_three_charts(
    start_date: date | None = Query(None, description="Start of transaction date range"),
    end_date: date | None = Query(None, description="End of transaction date range"),
    phone: str | None = None,
    name: str | None = None,
    r_score: int | None = None,
    f_score: int | None = None,
    m_score: int | None = None,
    db: Session = Depends(get_db),
):
    """Return aggregated data used by the last three dashboard charts."""

    query = db.query(CRMAnalysisModel)
    if start_date:
        query = query.filter(CRMAnalysisModel.FIRST_IN_DATE >= start_date)
    if end_date:
        query = query.filter(CRMAnalysisModel.FIRST_IN_DATE <= end_date)
    if phone:
        query = query.filter(CRMAnalysisModel.CUST_MOBILENO == phone)
    if name:
        query = query.filter(CRMAnalysisModel.CUSTOMER_NAME == name)
    if r_score is not None:
        query = query.filter(CRMAnalysisModel.R_SCORE == r_score)
    if f_score is not None:
        query = query.filter(CRMAnalysisModel.F_SCORE == f_score)
    if m_score is not None:
        query = query.filter(CRMAnalysisModel.M_SCORE == m_score)

    rows = query.all()

    # Total Customer by Segment
    segment_counts: Dict[str, int] = {}
    for r in rows:
        seg = r.SEGMENT_MAP or "Unknown"
        segment_counts[seg] = segment_counts.get(seg, 0) + 1
    segment_data = [{"name": name, "value": count} for name, count in segment_counts.items()]

    # Days to Return Bucket
    buckets = {
        "1 Month": 0,
        "1-2 Month": 0,
        "2-3 Month": 0,
        "3-6 Month": 0,
        "6 Month-1 Yr": 0,
        "1-2 Yr": 0,
        ">2 Yr": 0,
    }
    for r in rows:
        days = r.DAYS or 0
        if days <= 30:
            buckets["1 Month"] += 1
        elif days <= 60:
            buckets["1-2 Month"] += 1
        elif days <= 90:
            buckets["2-3 Month"] += 1
        elif days <= 180:
            buckets["3-6 Month"] += 1
        elif days <= 365:
            buckets["6 Month-1 Yr"] += 1
        elif days <= 730:
            buckets["1-2 Yr"] += 1
        else:
            buckets[">2 Yr"] += 1
    days_bucket_data = [{"bucket": b, "value": v} for b, v in buckets.items()]

    # Current Vs New Customer % (FY)
    year_totals = {
        "2020": sum(r.FIFTH_YR_COUNT or 0 for r in rows),
        "2021": sum(r.FOURTH_YR_COUNT or 0 for r in rows),
        "2022": sum(r.THIRD_YR_COUNT or 0 for r in rows),
        "2023": sum(r.SECOND_YR_COUNT or 0 for r in rows),
        "2024": sum(r.FIRST_YR_COUNT or 0 for r in rows),
    }
    cumulative_old = 0
    customer_percent_data = []
    for year in ["2020", "2021", "2022", "2023", "2024"]:
        new = year_totals[year]
        total = new + cumulative_old
        if total:
            new_pct = round(new / total * 100, 2)
            old_pct = round(cumulative_old / total * 100, 2)
        else:
            new_pct = old_pct = 0.0
        customer_percent_data.append(
            {"year": year, "newCustomer": new_pct, "oldCustomer": old_pct}
        )
        cumulative_old += new

    return {
        "segmentData": segment_data,
        "daysBucketData": days_bucket_data,
        "customerPercentData": customer_percent_data,
    }