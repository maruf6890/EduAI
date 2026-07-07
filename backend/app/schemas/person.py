from pydantic import BaseModel
from typing import List, Optional

class Person(BaseModel):
    id: str
    full_name: str
    email: str
    role: str  # "Teacher" or "Student"

class PeopleResponse(BaseModel):
    teacher: Person
    students: List[Person]