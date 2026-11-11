from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import BigInteger, CheckConstraint, Date, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Owner(Base):
    __tablename__ = "owner"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    soon_days: Mapped[int] = mapped_column(default=7)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Kolkata")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Card(Base):
    __tablename__ = "card"
    __table_args__ = (
        CheckConstraint("network in ('visa','mastercard','rupay','amex','other')", name="card_network"),
        CheckConstraint("status in ('active','inactive')", name="card_status"),
        CheckConstraint("last_four is null or last_four ~ '^[0-9]{4}$'", name="card_last_four"),
        CheckConstraint("credit_limit_paise is null or credit_limit_paise > 0", name="card_limit"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("owner.id"))
    issuer: Mapped[str] = mapped_column(String(120))
    nickname: Mapped[str] = mapped_column(String(80))
    network: Mapped[str] = mapped_column(String(20))
    last_four: Mapped[str | None] = mapped_column(String(4), nullable=True)
    credit_limit_paise: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    cycle_start_day: Mapped[int | None] = mapped_column(nullable=True)
    cycle_end_day: Mapped[int | None] = mapped_column(nullable=True)
    statement_day: Mapped[int | None] = mapped_column(nullable=True)
    due_day: Mapped[int | None] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="active")
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Category(Base):
    __tablename__ = "category"
    __table_args__ = (UniqueConstraint("owner_id", "name", name="category_name"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("owner.id"))
    name: Mapped[str] = mapped_column(String(80))
    is_system: Mapped[bool] = mapped_column(default=False)
    hidden: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Statement(Base):
    __tablename__ = "statement"
    __table_args__ = (
        CheckConstraint("total_due_paise >= 0", name="statement_total"),
        CheckConstraint("minimum_due_paise is null or minimum_due_paise >= 0", name="statement_minimum"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("owner.id"))
    card_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("card.id"))
    period_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    period_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    statement_date: Mapped[date] = mapped_column(Date)
    due_date: Mapped[date] = mapped_column(Date)
    total_due_paise: Mapped[int] = mapped_column(BigInteger)
    minimum_due_paise: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Transaction(Base):
    __tablename__ = "transaction"
    __table_args__ = (
        CheckConstraint("amount_paise > 0", name="transaction_amount"),
        CheckConstraint("type in ('purchase','refund','fee','interest','reversal')", name="transaction_type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("owner.id"))
    card_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("card.id"))
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("category.id"))
    statement_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("statement.id"), nullable=True)
    merchant: Mapped[str] = mapped_column(String(160))
    amount_paise: Mapped[int] = mapped_column(BigInteger)
    transacted_on: Mapped[date] = mapped_column(Date)
    type: Mapped[str] = mapped_column(String(16))
    description: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Payment(Base):
    __tablename__ = "payment"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("owner.id"))
    paid_on: Mapped[date] = mapped_column(Date)
    amount_paise: Mapped[int] = mapped_column(BigInteger)
    note: Mapped[str] = mapped_column(Text, default="")
    idempotency_key: Mapped[str] = mapped_column(String(80), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Allocation(Base):
    __tablename__ = "payment_allocation"
    __table_args__ = (CheckConstraint("amount_paise > 0", name="allocation_amount"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    payment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("payment.id"))
    statement_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("statement.id"))
    amount_paise: Mapped[int] = mapped_column(BigInteger)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("owner.id"))
    entity: Mapped[str] = mapped_column(String(40))
    entity_id: Mapped[uuid.UUID] = mapped_column()
    action: Mapped[str] = mapped_column(String(40))
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
