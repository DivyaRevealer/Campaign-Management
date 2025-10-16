from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric
from database import Base


class CRMAnalysis(Base):
    __tablename__ = "crm_analysis"

    CUST_MOBILENO       = Column('CUST_MOBILENO', String(60), primary_key=True)
    CUSTOMER_NAME       = Column('CUSTOMER_NAME', String(255), nullable=True)
    DOB                 = Column('DOB', Date, nullable=True)
    ANNIV_DT            = Column('ANNIV_DT', Date, nullable=True)
    FIN_CLOSE_DT        = Column('FIN_CLOSE_DT', Date, nullable=True)
    EMI_CLOSE_DT        = Column('EMI_CLOSE_DT', Date, nullable=True)

    R_VALUE             = Column('R_VALUE', Integer, default=0)
    F_VALUE             = Column('F_VALUE', Integer, default=0)
    M_VALUE             = Column('M_VALUE', Integer, default=0)
    R_SCORE             = Column('R_SCORE', Integer, default=0)
    F_SCORE             = Column('F_SCORE', Integer, default=0)
    M_SCORE             = Column('M_SCORE', Integer, default=0)

    RFM_SCORE           = Column('RFM_SCORE', String(20), nullable=True)
    SEGMENT_MAP         = Column('SEGMENT_MAP', String(255), nullable=True)
    NO_OF_ITEMS         = Column('NO_OF_ITEMS', Integer, default=0)
    TOTAL_SALES         = Column('TOTAL_SALES', Numeric(53,2), default=0.00)

    FIRST_IN_DATE       = Column('FIRST_IN_DATE', Date, nullable=True)
    PREV_IN_DATE        = Column('PREV_IN_DATE', Date, nullable=True)
    LAST_IN_DATE        = Column('LAST_IN_DATE', Date, nullable=True)

    LAST_IN_STORE_CODE  = Column('LAST_IN_STORE_CODE', String(255), nullable=True)
    LAST_IN_STORE_NAME  = Column('LAST_IN_STORE_NAME', String(255), nullable=True)
    LAST_IN_STORE_CITY  = Column('LAST_IN_STORE_CITY', String(255), nullable=True)
    LAST_IN_STORE_STATE = Column('LAST_IN_STORE_STATE', String(255), nullable=True)

    DAYS                = Column('DAYS', Integer, default=0)
    FIRST_YR_COUNT      = Column('FIRST_YR_COUNT', Integer, default=0)
    SECOND_YR_COUNT     = Column('SECOND_YR_COUNT', Integer, default=0)
    THIRD_YR_COUNT      = Column('THIRD_YR_COUNT', Integer, default=0)
    FOURTH_YR_COUNT     = Column('FOURTH_YR_COUNT', Integer, default=0)
    FIFTH_YR_COUNT      = Column('FIFTH_YR_COUNT', Integer, default=0)

    DATA_UPDATED_TIME   = Column('DATA_UPDATED_TIME', DateTime, nullable=True)