"""Persist frontend planning fields and distinguish berthed/delayed statuses.

Revision ID: a21b7c930001
Revises: 937231985be4
"""
from alembic import op
import sqlalchemy as sa

revision = "a21b7c930001"
down_revision = "937231985be4"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("vessel_visits", sa.Column("planned_unload_start", sa.DateTime(timezone=True)))
    op.add_column("vessel_visits", sa.Column("planned_completion", sa.DateTime(timezone=True)))
    op.add_column("vessel_visits", sa.Column("planned_rate_tph", sa.Numeric(10, 2)))
    op.execute("ALTER TYPE visit_status ADD VALUE IF NOT EXISTS 'BERTHED'")
    op.execute("ALTER TYPE visit_status ADD VALUE IF NOT EXISTS 'DELAYED'")


def downgrade():
    # Lossy rollback is intentionally refused if new statuses are in use.
    op.execute("""DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM vessel_visits WHERE status::text IN ('BERTHED','DELAYED')) THEN
        RAISE EXCEPTION 'Resolve BERTHED/DELAYED visits before downgrading';
      END IF;
    END $$""")
    op.execute("ALTER TYPE visit_status RENAME TO visit_status_extended")
    op.execute("CREATE TYPE visit_status AS ENUM ('PLANNED','ARRIVED','UNLOADING','COMPLETED','DEPARTED','CANCELLED')")
    op.execute("ALTER TABLE vessel_visits ALTER COLUMN status TYPE visit_status USING status::text::visit_status")
    op.execute("DROP TYPE visit_status_extended")
    op.drop_column("vessel_visits", "planned_rate_tph")
    op.drop_column("vessel_visits", "planned_completion")
    op.drop_column("vessel_visits", "planned_unload_start")
