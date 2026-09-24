import redis
from dotenv import load_dotenv
from app.core.config import settings
import os

load_dotenv()

redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    username=settings.REDIS_USER,
    password=settings.REDIS_PASSWORD,
    decode_responses=True
)

try:
    redis_client.ping()
except redis.exceptions.ConnectionError:
    raise Exception("Redis server is not reachable")


async def get_redis_client():
    return redis_client