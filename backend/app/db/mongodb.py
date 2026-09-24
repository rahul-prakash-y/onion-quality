"""MongoDB Motor Async Connection Setup & Repository.
Manages the National Onion Intelligence Dataset in MongoDB documents using Motor.
Provides data access pipelines for YOLO and Vision Transformer retraining dataset exports.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from ..config import settings

logger = logging.getLogger("onionvision.mongodb")

# Lazy motor import with graceful fallback if motor is not installed in the environment
try:
    from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
    MOTOR_AVAILABLE = True
except ImportError:
    AsyncIOMotorClient = None
    AsyncIOMotorDatabase = None
    MOTOR_AVAILABLE = False


import asyncio

class MongoManager:
    """Manages asynchronous MongoDB connection via Motor."""
    def __init__(self):
        self.client: Optional[Any] = None
        self.db: Optional[Any] = None
        self._loop: Optional[Any] = None

    def connect(self, uri: str = settings.MONGODB_URI, db_name: str = settings.MONGODB_DB_NAME, force: bool = False):
        if not MOTOR_AVAILABLE:
            raise RuntimeError("Motor is not installed. Run `pip install motor` to use MongoDB.")
        
        current_loop = None
        try:
            current_loop = asyncio.get_running_loop()
        except RuntimeError:
            current_loop = None

        if force or self.client is None or (current_loop is not None and self._loop != current_loop):
            if self.client:
                try:
                    self.client.close()
                except Exception:
                    pass
            self.client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=2500)
            self.db = self.client[db_name]
            self._loop = current_loop
            logger.info(f"Connected to MongoDB at {uri}, database: {db_name}")

    def close(self):
        if self.client:
            try:
                self.client.close()
            except Exception:
                pass
            self.client = None
            self.db = None
            self._loop = None
            logger.info("Closed MongoDB connection.")

    async def ping(self) -> bool:
        """Verifies if MongoDB instance is alive and reachable."""
        if not MOTOR_AVAILABLE:
            return False
        try:
            self.connect()
            await self.client.admin.command('ping')
            return True
        except Exception:
            try:
                self.connect(force=True)
                await self.client.admin.command('ping')
                return True
            except Exception as exc:
                logger.warning(f"MongoDB ping check failed: {exc}")
                return False


mongo_manager = MongoManager()



class MongoInspectionRepository:
    """Repository implementation using MongoDB collection for National Onion Intelligence Dataset."""

    @staticmethod
    def get_collection():
        if mongo_manager.db is None:
            mongo_manager.connect()
        return mongo_manager.db["inspection_records"]

    @classmethod
    async def ensure_indexes(cls):
        """Builds high-performance indexes for the National Onion Intelligence Dataset."""
        if not await mongo_manager.ping():
            return
        coll = cls.get_collection()
        try:
            await coll.create_index("inspection_id", unique=True)
            await coll.create_index([("is_human_verified", 1), ("used_for_training", 1)])
            await coll.create_index([("geographic_source", 1), ("is_human_verified", 1)])
            await coll.create_index("timestamp")
            logger.info("MongoDB indexes verified for inspection_records collection.")
        except Exception as exc:
            logger.warning(f"Failed to create MongoDB indexes: {exc}")

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
            "used_for_training": False,
            "verified_data": None,
            "metadata": metadata or {}
        }
        await coll.update_one(
            {"inspection_id": inspection_id},
            {"$set": doc},
            upsert=True
        )
        return doc

    @classmethod
    async def update_ai_predictions(
        cls,
        inspection_id: str,
        ai_predictions: Dict[str, Any]
    ):
        """Attaches AI computer vision inferences to MongoDB document."""
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
        verified_data: Dict[str, Any],
        geographic_source: Optional[str] = None
    ):
        """Marks an inspection record as verified by a human grading officer."""
        coll = cls.get_collection()
        update_fields: Dict[str, Any] = {
            "is_human_verified": True,
            "inspector_id": inspector_id,
            "verified_data": verified_data,
            "used_for_training": False  # Initial state: ready for training export
        }
        if geographic_source:
            update_fields["geographic_source"] = geographic_source

        await coll.update_one(
            {"inspection_id": inspection_id},
            {"$set": update_fields}
        )

    @classmethod
    async def upsert_record(cls, doc: Dict[str, Any]) -> bool:
        """Inserts or replaces an inspection document by inspection_id."""
        coll = cls.get_collection()
        insp_id = doc.get("inspection_id")
        if not insp_id:
            return False
        await coll.update_one(
            {"inspection_id": insp_id},
            {"$set": doc},
            upsert=True
        )
        return True

    @classmethod
    async def get_exportable_records(
        cls,
        region: Optional[str] = None,
        limit: Optional[int] = None,
        include_previously_exported: bool = False
    ) -> List[Dict[str, Any]]:
        """Queries verified records ready for model retraining (used_for_training == False)."""
        coll = cls.get_collection()
        query: Dict[str, Any] = {
            "is_human_verified": True
        }

        if not include_previously_exported:
            query["used_for_training"] = {"$ne": True}

        if region:
            query["geographic_source"] = region

        cursor = coll.find(query).sort("timestamp", 1)
        if limit:
            cursor = cursor.limit(limit)

        return await cursor.to_list(length=limit or 10000)

    @classmethod
    async def mark_as_used_for_training(
        cls,
        inspection_ids: List[str],
        batch_id: Optional[str] = None
    ) -> int:
        """Sets used_for_training = True for exported records to prevent redundant training."""
        if not inspection_ids:
            return 0
        coll = cls.get_collection()
        result = await coll.update_many(
            {"inspection_id": {"$in": inspection_ids}},
            {"$set": {
                "used_for_training": True,
                "exported_at": datetime.now(timezone.utc),
                "export_batch_id": batch_id
            }}
        )
        return result.modified_count

    @classmethod
    async def query_history(
        cls,
        verified_only: bool = True,
        region: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Queries historical records with pagination."""
        coll = cls.get_collection()
        query: Dict[str, Any] = {}
        if verified_only:
            query["is_human_verified"] = True
        if region:
            query["geographic_source"] = region

        cursor = coll.find(query).sort("timestamp", -1).skip(offset).limit(limit)
        return await cursor.to_list(length=limit)

    @classmethod
    async def get_dataset_stats(cls) -> Dict[str, Any]:
        """Aggregates intelligence dataset statistics across MongoDB collections."""
        coll = cls.get_collection()
        total = await coll.count_documents({})
        verified_total = await coll.count_documents({"is_human_verified": True})
        unexported = await coll.count_documents({"is_human_verified": True, "used_for_training": {"$ne": True}})
        already_trained = await coll.count_documents({"is_human_verified": True, "used_for_training": True})

        # Breakdown by geographic source
        pipeline = [
            {"$match": {"is_human_verified": True}},
            {"$group": {"_id": "$geographic_source", "count": {"$sum": 1}}}
        ]
        regions_res = await coll.aggregate(pipeline).to_list(length=50)
        regions_breakdown = {r["_id"] or "Unknown": r["count"] for r in regions_res}

        return {
            "total_inspections": total,
            "total_verified": verified_total,
            "ready_for_export": unexported,
            "already_exported_for_training": already_trained,
            "regions_breakdown": regions_breakdown
        }
