from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric
from database import Base


class CRMAnalysis(Base):
    __tablename__ = "crm_analysis_backup"

    CUST_MOBILENO = Column(String(60), primary_key=True, index=True, nullable=True)
    CUSTOMER_NAME = Column(String(60))
    R_VALUE = Column(Integer, default=0)
    F_VALUE = Column(Integer, default=0)
    M_VALUE = Column(Integer, default=0)
    R_SCORE = Column(Integer, default=0)
    F_SCORE = Column(Integer, default=0)
    M_SCORE = Column(Integer, default=0)
    RFM_SCORE = Column(String(20))
    SEGMENT_MAP = Column(String(255))
    NO_OF_ITEMS = Column(Integer, default=0)
    GROSS_PROFIT = Column(Numeric(16, 2), default=0.0)
    FIRST_IN_DATE = Column(Date)
    PREV_IN_DATE = Column(Date)
    LAST_IN_DATE = Column(Date)
    DAYS = Column(Integer, default=0)
    FIRST_YR_COUNT = Column(Integer, default=0)
    SECOND_YR_COUNT = Column(Integer, default=0)
    THIRD_YR_COUNT = Column(Integer, default=0)
    FOURTH_YR_COUNT = Column(Integer, default=0)
    FIFTH_YR_COUNT = Column(Integer, default=0)
    Data_Updated_Time = Column(DateTime)