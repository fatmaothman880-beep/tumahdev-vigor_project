"""Site registry and operational action checklist.

Revision ID: b32c8d040002
Revises: a21b7c930001
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as pg

revision = "b32c8d040002"
down_revision = "a21b7c930001"
branch_labels = depends_on = None


def upgrade():
    op.create_table("site_configuration",
        sa.Column("key", sa.String(50), primary_key=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("berth_id", pg.UUID(as_uuid=True), sa.ForeignKey("berths.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("berth_label", sa.String(150), nullable=False))
    op.create_table("site_vessels",
        sa.Column("key", sa.String(50), primary_key=True),
        sa.Column("site_key", sa.String(50), sa.ForeignKey("site_configuration.key", ondelete="RESTRICT"), nullable=False),
        sa.Column("vessel_id", pg.UUID(as_uuid=True), sa.ForeignKey("vessels.id", ondelete="RESTRICT"), nullable=False, unique=True),
        sa.Column("reported_cargo_t", sa.Numeric(12,2)),
        sa.Column("temporary_label", sa.Boolean(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.CheckConstraint("reported_cargo_t IS NULL OR reported_cargo_t > 0", name="ck_site_vessel_reported_cargo"))
    op.create_table("operational_tasks",
        sa.Column("id", pg.UUID(as_uuid=True), primary_key=True),
        sa.Column("visit_id", pg.UUID(as_uuid=True), sa.ForeignKey("vessel_visits.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("template_key", sa.String(50)),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("owner_name", sa.String(150)),
        sa.Column("due_at", sa.DateTime(timezone=True)),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("blocks_departure", sa.Boolean(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("evidence_reference", sa.String(500), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("visit_id", "template_key", name="uq_visit_task_template"),
        sa.CheckConstraint("status IN ('NOT_STARTED','IN_PROGRESS','BLOCKED','COMPLETED','NOT_APPLICABLE')", name="ck_operational_task_status"),
        sa.CheckConstraint("(status = 'COMPLETED' AND completed_at IS NOT NULL) OR (status <> 'COMPLETED' AND completed_at IS NULL)", name="ck_operational_task_completed"))
    op.create_index("ix_operational_tasks_visit_id", "operational_tasks", ["visit_id"])
    op.create_index("ix_operational_tasks_due_at", "operational_tasks", ["due_at"])
    op.create_table("task_history",
        sa.Column("id", pg.UUID(as_uuid=True), primary_key=True),
        sa.Column("task_id", pg.UUID(as_uuid=True), sa.ForeignKey("operational_tasks.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("performed_by", sa.String(150), nullable=False),
        sa.Column("task_version", sa.Integer(), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("old_value", pg.JSONB()),
        sa.Column("new_value", pg.JSONB(), nullable=False),
        sa.UniqueConstraint("task_id", "task_version", name="uq_task_history_version"))
    op.create_index("ix_task_history_task_id", "task_history", ["task_id"])


def downgrade():
    op.drop_table("task_history")
    op.drop_table("operational_tasks")
    op.drop_table("site_vessels")
    op.drop_table("site_configuration")
