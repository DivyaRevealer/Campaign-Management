from sqlalchemy import TEXT, Column, Integer, Date, DateTime, DECIMAL,String, JSON, func
from database import Base

class template_details(Base):
    __tablename__ = 'template_details'

    template_name       = Column(String(250), primary_key=True)
    file_url  = Column(String(500))
    file_hvalue  = Column(TEXT)
    template_type  = Column(String(50), nullable=False)
    media_type  = Column(String(50))
    uploaded_at   = Column(DateTime, server_default=func.now())