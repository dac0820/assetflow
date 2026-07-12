# ---------------------------------------------------------------------------
# MODEL REGISTRY
# Import all models here in dependency order so SQLAlchemy can resolve every
# cross-model relationship reference before any mapper tries to configure.
# Always import this module before using any ORM query.
# ---------------------------------------------------------------------------

from app.models.base import Base          # noqa: F401
from app.models.user import (             # noqa: F401
    Permission, Role, User,
    UserSession, FailedLoginAttempt, LoginHistory,
    Device, PasswordReset, EmailVerification,
)
from app.models.org import (              # noqa: F401
    Department, Employee, Location, Vendor,
)
from app.models.asset import (            # noqa: F401
    AssetCategory, Asset,
    Warranty, QRCode, AssetDocument, SystemSetting,
)
from app.models.operations import (       # noqa: F401
    AssetAllocation, TransferRequest, Booking, Maintenance,
)
from app.models.audit import (            # noqa: F401
    AuditCycle, AuditResult,
)
from app.models.log import (              # noqa: F401
    Notification, ActivityLog,
)
