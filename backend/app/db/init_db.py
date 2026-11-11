import logging
from sqlalchemy.orm import Session
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.user import User
from app.models.document import Document, DocumentStatus
from app.models.chat import ChatSession, Message
from app.models.citation import Citation, Summary
from app.core.security import get_password_hash

logger = logging.getLogger("papermind.init_db")


def init_db():
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully.")

    # Seed default demo researcher account if database is empty
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == "researcher@papermind.ai").first()
        if not user:
            demo_user = User(
                email="researcher@papermind.ai",
                full_name="Dr. Eleanor Vance",
                hashed_password=get_password_hash("ResearchPass2026!"),
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            logger.info("Seeded initial demo researcher user: researcher@papermind.ai")


if __name__ == "__main__":
    init_db()
