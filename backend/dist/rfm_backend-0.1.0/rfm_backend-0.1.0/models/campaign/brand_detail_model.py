from sqlalchemy import Column, Integer, String
from database import Base

class BrandDetail(Base):
    __tablename__ = 'brand_details'

    id       = Column(Integer, primary_key=True, index=True)
    section  = Column(String(100), nullable=False)
    product  = Column(String(100), nullable=False)
    model    = Column(String(100), nullable=False)
    item     = Column(String(100), nullable=False)
