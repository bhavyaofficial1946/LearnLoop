"""Add Phase 2 Diagnostic Assessment and Topic Mastery

Revision ID: a1b2c3d4e5f6
Revises: f0c883b5e4dd
Create Date: 2026-09-09 14:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f0c883b5e4dd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Diagnostic Questions
    op.create_table(
        'diagnostic_questions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('topic_id', sa.String(length=36), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('difficulty', sa.String(length=50), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_diagnostic_questions_topic_id'), 'diagnostic_questions', ['topic_id'], unique=False)

    # 2. Diagnostic Options
    op.create_table(
        'diagnostic_options',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('question_id', sa.String(length=36), nullable=False),
        sa.Column('option_text', sa.Text(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_correct', sa.Boolean(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['question_id'], ['diagnostic_questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_diagnostic_options_question_id'), 'diagnostic_options', ['question_id'], unique=False)

    # 3. Diagnostic Assessments
    op.create_table(
        'diagnostic_assessments',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('student_subject_id', sa.String(length=36), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='in_progress'),
        sa.Column('total_questions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['student_subject_id'], ['student_subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_diagnostic_assessments_student_subject_id'), 'diagnostic_assessments', ['student_subject_id'], unique=False)

    # 4. Diagnostic Responses
    op.create_table(
        'diagnostic_responses',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('assessment_id', sa.String(length=36), nullable=False),
        sa.Column('question_id', sa.String(length=36), nullable=False),
        sa.Column('selected_option_id', sa.String(length=36), nullable=True),
        sa.Column('is_correct', sa.Boolean(), nullable=True),
        sa.Column('answered_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['assessment_id'], ['diagnostic_assessments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['diagnostic_questions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['selected_option_id'], ['diagnostic_options.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_diagnostic_responses_assessment_id'), 'diagnostic_responses', ['assessment_id'], unique=False)
    op.create_index(op.f('ix_diagnostic_responses_question_id'), 'diagnostic_responses', ['question_id'], unique=False)

    # 5. Topic Mastery
    op.create_table(
        'topic_mastery',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('student_subject_id', sa.String(length=36), nullable=False),
        sa.Column('topic_id', sa.String(length=36), nullable=False),
        sa.Column('understanding_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='not_assessed'),
        sa.Column('evidence_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('correct_answers', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('incorrect_answers', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_assessed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['student_subject_id'], ['student_subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_subject_id', 'topic_id', name='uq_workspace_topic_mastery')
    )
    op.create_index(op.f('ix_topic_mastery_student_subject_id'), 'topic_mastery', ['student_subject_id'], unique=False)
    op.create_index(op.f('ix_topic_mastery_topic_id'), 'topic_mastery', ['topic_id'], unique=False)

def downgrade() -> None:
    op.drop_table('topic_mastery')
    op.drop_table('diagnostic_responses')
    op.drop_table('diagnostic_assessments')
    op.drop_table('diagnostic_options')
    op.drop_table('diagnostic_questions')
