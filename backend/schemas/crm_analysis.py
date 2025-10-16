from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class CRMAnalysis(BaseModel):
    CUST_MOBILENO: Optional[str] = None
    CUSTOMER_NAME: Optional[str] = None
    DOB: Optional[date] = None
    ANNIV_DT: Optional[date] = None
    FIN_CLOSE_DT: Optional[date] = None
    EMI_CLOSE_DT: Optional[date] = None

    R_VALUE: int = 0
    F_VALUE: int = 0
    M_VALUE: int = 0
    R_SCORE: int = 0
    F_SCORE: int = 0
    M_SCORE: int = 0

    RFM_SCORE: Optional[str] = None
    SEGMENT_MAP: Optional[str] = None
    NO_OF_ITEMS: int = 0
    TOTAL_SALES: float = 0.0

    FIRST_IN_DATE: Optional[date] = None
    PREV_IN_DATE: Optional[date] = None
    LAST_IN_DATE: Optional[date] = None

    LAST_IN_STORE_CODE: Optional[str] = None
    LAST_IN_STORE_NAME: Optional[str] = None
    LAST_IN_STORE_CITY: Optional[str] = None
    LAST_IN_STORE_STATE: Optional[str] = None

    DAYS: int = 0
    FIRST_YR_COUNT: int = 0
    SECOND_YR_COUNT: int = 0
    THIRD_YR_COUNT: int = 0
    FOURTH_YR_COUNT: int = 0
    FIFTH_YR_COUNT: int = 0

    Data_Updated_Time: Optional[datetime] = None

    class Config:
        orm_mode = True