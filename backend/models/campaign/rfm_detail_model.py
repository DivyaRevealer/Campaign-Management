from sqlalchemy import Column, Integer, Date, DateTime, DECIMAL,String, JSON, func
from database import Base

class RFMDetail(Base):
    __tablename__ = 'rfm_details'

    id       = Column(Integer, primary_key=True, index=True)
    r_score  = Column(Integer, nullable=False)
    f_score  = Column(Integer, nullable=False)
    m_score  = Column(Integer, nullable=False)
    segment  = Column(String(50), nullable=False)