from typing import List
from pydantic import BaseModel


class CampaignOptions(BaseModel):
    segments: List[str]
    branches: List[str]
    cities: List[str]
    states: List[str]
    sections: List[str]
    products: List[str]