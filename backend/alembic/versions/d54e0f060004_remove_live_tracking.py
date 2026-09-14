"""Remove retired vessel positions from existing operational snapshots."""
from alembic import op

revision = "d54e0f060004"
down_revision = "c43d9e050003"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        UPDATE frontend_operational_state
        SET payload = payload - 'vesselPositions',
            revision = revision + 1,
            updated_at = NOW()
        WHERE payload ? 'vesselPositions'
    """)


def downgrade():
    # Removed coordinates cannot be recovered; restore only an empty field.
    op.execute("""
        UPDATE frontend_operational_state
        SET payload = payload || '{"vesselPositions": []}'::jsonb,
            revision = revision + 1,
            updated_at = NOW()
    """)
