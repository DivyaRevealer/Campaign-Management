from sqlalchemy import Column, Integer, String
from database import Base

class Geography(Base):
    __tablename__ = 'geography'

    id     = Column(Integer, primary_key=True, index=True)
    branch = Column(String(100), nullable=False)
    city   = Column(String(100), nullable=False)
    state  = Column(String(100), nullable=False)