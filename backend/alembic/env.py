import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# Ensure app path is in system paths and remove only the bare home directory to prevent app.py name clashes
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path = [p for p in sys.path if p.rstrip("\\/").lower() != "c:\\users\\lenovo"]
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Import Base and import all domain models to populate the Metadata registry
from app.models.base import Base
from app.models.user import User, Role, Permission, UserSession, FailedLoginAttempt, LoginHistory, Device, PasswordReset, EmailVerification
from app.models.org import Department, Employee, Location, Vendor
from app.models.asset import AssetCategory, Asset, Warranty, QRCode, AssetDocument, SystemSetting
from app.models.operations import AssetAllocation, TransferRequest, Booking, Maintenance
from app.models.audit import AuditCycle, AuditResult
from app.models.log import Notification, ActivityLog

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Read environment variable for connection if present, overriding ini setting
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = os.getenv("DATABASE_URL", configuration.get("sqlalchemy.url"))
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
