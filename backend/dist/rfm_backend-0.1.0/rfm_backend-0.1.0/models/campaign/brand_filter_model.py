from sqlalchemy import Column, Integer, String
from database import Base


class CampaignBrandFilter(Base):
    """Represents available brand hierarchy options for campaigns."""

    __tablename__ = "campaign_brand_filter"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String(100), nullable=False)
    section = Column(String(100), nullable=False)
    product = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    item = Column(String(100), nullable=False)