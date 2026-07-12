"""
Enterprise CMMS — Replace thin maintenance_requests with full CMMS schema.
Adds: maintenance_attachments, maintenance_comments, maintenance_status_logs tables.
Drops and recreates: maintenance_requests.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Step 1: Drop old thin maintenance_requests table ─────────────────────
    op.drop_table('maintenance_requests')

    # ── Step 2: Create full enterprise MaintenanceRequest table ──────────────
    op.create_table(
        'maintenance_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending_approval'),

        # Classification
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('maintenance_type', sa.String(50), nullable=False, server_default='corrective'),
        sa.Column('priority', sa.String(20), nullable=False, server_default='medium'),
        sa.Column('category_tag', sa.String(100), nullable=True),

        # Asset link
        sa.Column('asset_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('assets.id', ondelete='CASCADE'), nullable=False),

        # People
        sa.Column('requested_by_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=True),
        sa.Column('approved_by_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=True),
        sa.Column('assigned_technician_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('vendor_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('vendors.id', ondelete='SET NULL'), nullable=True),

        # SLA & timing
        sa.Column('sla_due_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('actual_start_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('actual_end_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('scheduled_date', sa.DateTime(timezone=True), nullable=True),

        # Downtime
        sa.Column('downtime_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('downtime_end', sa.DateTime(timezone=True), nullable=True),

        # Cost & labor
        sa.Column('estimated_cost', sa.Numeric(15, 2), nullable=False, server_default='0.00'),
        sa.Column('actual_cost', sa.Numeric(15, 2), nullable=False, server_default='0.00'),
        sa.Column('labor_hours', sa.Numeric(8, 2), nullable=False, server_default='0.00'),

        # Resolution
        sa.Column('resolution_notes', sa.Text, nullable=True),
        sa.Column('rejection_reason', sa.Text, nullable=True),
        sa.Column('cancellation_reason', sa.Text, nullable=True),

        # Parts (JSONB)
        sa.Column('parts_required', postgresql.JSONB, nullable=False, server_default='[]'),

        # Recurring
        sa.Column('is_recurring', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('recurrence_rule', postgresql.JSONB, nullable=True),
        sa.Column('parent_request_id', postgresql.UUID(as_uuid=True), nullable=True),

        # Audit mixin columns
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_deleted', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('version_number', sa.Integer, nullable=False, server_default='1'),
    )

    # Indexes
    op.create_index('ix_maintenance_requests_asset_id', 'maintenance_requests', ['asset_id'])
    op.create_index('ix_maintenance_requests_technician_id', 'maintenance_requests', ['assigned_technician_id'])
    op.create_index('ix_maintenance_requests_sla_due_at', 'maintenance_requests', ['sla_due_at'])
    op.create_index('ix_maintenance_status_priority', 'maintenance_requests', ['status', 'priority'])
    op.create_index('ix_maintenance_asset_status', 'maintenance_requests', ['asset_id', 'status'])

    # ── Step 3: Create maintenance_attachments table ──────────────────────────
    op.create_table(
        'maintenance_attachments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='active'),
        sa.Column('maintenance_request_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('maintenance_requests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('uploaded_by_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_url', sa.String(512), nullable=False),
        sa.Column('file_type', sa.String(50), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('file_size_kb', sa.Integer, nullable=True),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_deleted', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('version_number', sa.Integer, nullable=False, server_default='1'),
    )
    op.create_index('ix_maintenance_attachments_request_id', 'maintenance_attachments',
                    ['maintenance_request_id'])

    # ── Step 4: Create maintenance_comments table ─────────────────────────────
    op.create_table(
        'maintenance_comments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='active'),
        sa.Column('maintenance_request_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('maintenance_requests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('author_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('body', sa.Text, nullable=False),
        sa.Column('is_internal', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_deleted', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('version_number', sa.Integer, nullable=False, server_default='1'),
    )
    op.create_index('ix_maintenance_comments_request_id', 'maintenance_comments',
                    ['maintenance_request_id'])

    # ── Step 5: Create maintenance_status_logs table ──────────────────────────
    op.create_table(
        'maintenance_status_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='active'),
        sa.Column('maintenance_request_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('maintenance_requests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('changed_by_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('from_status', sa.String(50), nullable=True),
        sa.Column('to_status', sa.String(50), nullable=False),
        sa.Column('reason', sa.Text, nullable=True),
        sa.Column('metadata_snapshot', postgresql.JSONB, nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_deleted', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('version_number', sa.Integer, nullable=False, server_default='1'),
    )
    op.create_index('ix_maintenance_status_logs_request_id', 'maintenance_status_logs',
                    ['maintenance_request_id'])


def downgrade() -> None:
    op.drop_table('maintenance_status_logs')
    op.drop_table('maintenance_comments')
    op.drop_table('maintenance_attachments')
    op.drop_table('maintenance_requests')
