"""Shim — re-export request + action schemas for legacy imports."""
from app.modules.approvals.approval_action.schemas import (
    ApprovalActionRequest,
    ApprovalActionResponse,
    CommentRequest,
    MessageResponse,
)
from app.modules.approvals.request.schemas import (
    ApprovalRequestCreate,
    ApprovalRequestDetailResponse,
    ApprovalRequestResponse,
)

__all__ = [
    "MessageResponse",
    "ApprovalRequestCreate",
    "ApprovalActionRequest",
    "CommentRequest",
    "ApprovalActionResponse",
    "ApprovalRequestResponse",
    "ApprovalRequestDetailResponse",
]
