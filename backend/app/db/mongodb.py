"""MongoDB Motor Async Connection Setup & Repository (Alternative Database Option).
Allows storing the National Onion Intelligence Dataset in MongoDB documents using Motor.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from ..config import settings

# Lazy motor import with graceful fallback if motor is not installed in the environment
try:
    from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
    MOTOR_AVAILABLE = True
except ImportError:
    AsyncIOMotorClient = None
    AsyncIOMotorDatabase = None
    MOTOR_AVAILABLE = False

class MongoManager:
    """Manages asynchronous MongoDB connection via Motor."""
    def __init__(self):
        self.client: Optional[Any] = None
        self.db: Optional[Any] = None

    def connect(self, uri: str = settings.MONGODB_URI, db_name: str = settings.MONGODB_DB_NAME):
        if not MOTOR_AVAILABLE:
            raise RuntimeError("Motor is not installed. Run `pip install motor` to use MongoDB.")
        self.client = AsyncIOMotorClient(uri)
        self.db = self.client[db_name]

    def close(self):
        if self.client:
            self.client.close()

mongo_manager = MongoManager()

class MongoInspectionRepository:
    """Repository implementation using MongoDB collection for National Onion Intelligence Dataset."""

    @staticmethod
    def get_collection():
        if mongo_manager.db is None:
            mongo_manager.connect()
        return mongo_manager.db["inspection_records"]

    @classmethod
    async def create_inspection(
        cls,
        inspection_id: str,
        original_image_path: str,
        geographic_source: str = "Maharashtra",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Inserts a new inspection document into MongoDB."""
        coll = cls.get_collection()
        doc = {
            "inspection_id": inspection_id,
            "timestamp": datetime.now(timezone.utc),
            "inspector_id": None,
            "geographic_source": geographic_source,
            "original_image_path": original_image_path,
            "ai_predictions": None,
            "is_human_verified": False,
            "verified_data": None,
            "metadata": metadata or {}
        }
        await coll.insert_one(doc)
        return doc

    @classmethod
    async def update_ai_predictions(
        cls,
        inspection_id: str,
        ai_predictions: Dict[str, Any]
    ):
        coll = cls.get_collection()
        await coll.update_one(
            {"inspection_id": inspection_id},
            {"$set": {"ai_predictions": ai_predictions}}
        )

    @classmethod
    async def verify_inspection(
        cls,
        inspection_id: str,
        inspector_id: str,
        verified_data: Dict[str, Any]
    ):
        coll = cls.get_collection()
        await coll.update_one(
            {"inspection_id": inspection_id},
            {"$set": {
                "is_human_verified": True,
                "inspector_id": inspector_id,
                "verified_data": verified_data
            }}
        )

    @classmethod
    async def query_history(
        cls,
        verified_only: bool = True,
        region: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        coll = cls.get_collection()
        query: Dict[str, Any] = {}
        if verified_only:
            query["is_human_verified"] = True
        if region:
            query["geographic_source"] = region

        cursor = coll.find(query).sort("timestamp", -1).skip(offset).limit(limit)
        return await cursor.to_list(length=limit)
