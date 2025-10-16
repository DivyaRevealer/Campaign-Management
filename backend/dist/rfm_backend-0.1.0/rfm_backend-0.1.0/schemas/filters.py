from typing import List
from pydantic import BaseModel


class FilterOptions(BaseModel):
    phones: List[str]
    names: List[str]
    r_values: List[int]
    f_values: List[int]
    m_values: List[int]