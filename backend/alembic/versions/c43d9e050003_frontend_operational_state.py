"""Persist the full-cycle frontend operational state.

Revision ID: c43d9e050003
Revises: b32c8d040002
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as pg


revision = "c43d9e050003"
down_revision = "b32c8d040002"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "frontend_operational_state",
        sa.Column("key", sa.String(50), primary_key=True),
        sa.Column("payload", pg.JSONB(), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade():
    op.drop_table("frontend_operational_state")
