"""fix_booking_employee_id_and_status

Revision ID: a1b2c3d4e5f6
Revises: e5b414ac8730
Create Date: 2026-07-12 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'e5b414ac8730'
branch_labels = None
depends_on = None


def upgrade():
    # Drop old user_id FK constraint and column from bookings
    with op.batch_alter_table('bookings') as batch_op:
        # Add employee_id column
        batch_op.add_column(
            sa.Column('employee_id', postgresql.UUID(as_uuid=True), nullable=True)
        )
        # Add status column
        batch_op.add_column(
            sa.Column('status', sa.String(50), nullable=True, server_default='approved')
        )

    # Copy user_id -> employee_id where possible (best effort)
    op.execute("""
        UPDATE bookings SET employee_id = user_id WHERE employee_id IS NULL
    """)

    # Set NOT NULL now that data is filled
    op.execute("ALTER TABLE bookings ALTER COLUMN employee_id SET NOT NULL")
    op.execute("ALTER TABLE bookings ALTER COLUMN status SET NOT NULL")
    op.execute("ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'approved'")

    # Add FK constraint on employee_id
    op.create_foreign_key(
        'fk_bookings_employee_id',
        'bookings', 'employees',
        ['employee_id'], ['id'],
        ondelete='CASCADE'
    )

    # Drop old user_id FK and column
    with op.batch_alter_table('bookings') as batch_op:
        batch_op.drop_column('user_id')


def downgrade():
    with op.batch_alter_table('bookings') as batch_op:
        batch_op.add_column(
            sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True)
        )
        batch_op.drop_constraint('fk_bookings_employee_id', type_='foreignkey')
        batch_op.drop_column('employee_id')
        batch_op.drop_column('status')
