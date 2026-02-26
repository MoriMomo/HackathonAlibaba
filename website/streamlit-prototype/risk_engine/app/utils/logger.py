import sys

from loguru import logger

from app.config import settings


def setup_logger() -> None:
    logger.remove()
    logger.add(sys.stdout, level=settings.LOG_LEVEL)
