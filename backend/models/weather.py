class AdvisoryResponse(BaseModel):
    generated_at: datetime


class CoolingCenterTriggerRequest(BaseModel):
    location_name: str
    severity: str
    htsi: float = Field(ge=0, le=100)
    requester: str = "command deck"


class CoolingCenterTriggerResponse(BaseModel):
    trigger_id: str
    location_name: str
    status: str
    message: str
    created_at: datetime