from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base


class CampaignUpload(Base):
    __tablename__ = "campaign_uploads"

    campaign_id = Column(Integer, ForeignKey("campaigns.id"), primary_key=True)
    mobile_no = Column(String(50), primary_key=True)
    name = Column(String(255))
    email_id = Column(String(255))