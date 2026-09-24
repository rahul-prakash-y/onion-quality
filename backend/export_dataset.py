#!/usr/bin/env python3
"""OnionVision AI - National Onion Intelligence Dataset Export Pipeline (CLI).

Extracts human-verified agricultural inspection records from MongoDB,
formats bounding boxes and classifications into standard YOLO or COCO format,
packages images and annotations partitioned by geographic source (Maharashtra, Karnataka, etc.),
updates the database state (used_for_training = True), and writes a ready-to-train .zip archive.

Usage:
    python export_dataset.py --format yolo --output national_onion_dataset.zip
    python export_dataset.py --region Maharashtra --dry-run
    python export_dataset.py --seed-sample-data
"""

import argparse
import asyncio
import os
import sys
from pathlib import Path

# Add backend directory to sys.path so app imports resolve
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from app.config import settings
from app.db.mongodb import mongo_manager, MongoInspectionRepository
from app.services.dataset_export import DatasetExportService, CANONICAL_CLASSES
from app.routes.seed_helper import seed_mongo_verified_dataset


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Extract and export human-verified National Onion Intelligence Dataset for YOLO/ViT retraining.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    parser.add_argument(
        "--format",
        choices=["yolo", "coco"],
        default="yolo",
        help="Target annotation format for model training."
    )
    parser.add_argument(
        "--region",
        type=str,
        default=None,
        help="Filter exports by geographic origin (e.g., 'Maharashtra', 'Karnataka', 'Gujarat')."
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default="national_onion_dataset.zip",
        help="Path where the generated .zip archive should be written."
    )
    parser.add_argument(
        "--admin-token",
        type=str,
        default=settings.ADMIN_TOKEN,
        help="Administrator security token for pipeline authentication."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate extraction without updating database records (records remain used_for_training=False)."
    )
    parser.add_argument(
        "--include-previously-exported",
        action="store_true",
        help="Include records that were already exported in previous batches."
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Maximum number of inspection records to export."
    )
    parser.add_argument(
        "--seed-sample-data",
        action="store_true",
        help="Seed high-quality human-verified sample records into MongoDB before exporting."
    )
    parser.add_argument(
        "--mongo-uri",
        type=str,
        default=settings.MONGODB_URI,
        help="MongoDB connection URI."
    )
    parser.add_argument(
        "--db-name",
        type=str,
        default=settings.MONGODB_DB_NAME,
        help="Target MongoDB database name."
    )
    return parser.parse_args()


async def main_async(args):
    print("=" * 70)
    print("  ONIONVISION AI - NATIONAL ONION INTELLIGENCE DATASET PIPELINE")
    print("=" * 70)

    # 1. Verify Admin Token
    if args.admin_token != settings.ADMIN_TOKEN:
        print("[!] Security Error: Invalid admin token provided.")
        sys.exit(1)

    # 2. Connect to MongoDB
    print(f"[*] Connecting to MongoDB at {args.mongo_uri} (Database: {args.db_name})...")
    mongo_manager.connect(uri=args.mongo_uri, db_name=args.db_name)
    is_alive = await mongo_manager.ping()
    if is_alive:
        print("    [+] MongoDB connection active and responsive.")
        await MongoInspectionRepository.ensure_indexes()
    else:
        print("    [-] MongoDB connection unreachable; will fallback to SQLite if needed.")

    # 3. Seed data if requested
    if args.seed_sample_data:
        print("[*] Seeding human-verified inspection samples across APMC Mandis...")
        seeded = await seed_mongo_verified_dataset(count_per_region=3)
        print(f"    [+] Successfully seeded {seeded} verified records into MongoDB.")

    # 4. Check available records
    print("[*] Querying unexported human-verified inspections...")
    print(f"    - Filter: is_human_verified == True, used_for_training == False")
    if args.region:
        print(f"    - Geographic region: {args.region}")
    if args.dry_run:
        print("    - Dry-run mode: True (Database state will NOT be altered)")

    try:
        zip_bytes, filename, summary = await DatasetExportService.export_dataset(
            format_type=args.format,
            region=args.region,
            dry_run=args.dry_run,
            include_previously_exported=args.include_previously_exported,
            limit=args.limit
        )
    except ValueError as e:
        print(f"[-] Extraction aborted: {e}")
        print("[*] Tip: Use --seed-sample-data to populate verified test records.")
        sys.exit(2)
    except Exception as e:
        print(f"[!] Extraction failure: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(3)

    # 5. Write output ZIP archive
    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f_out:
        f_out.write(zip_bytes)

    # 6. Print Report Summary
    print("-" * 70)
    print("  EXTRACTION & CONVERSION REPORT")
    print("-" * 70)
    print(f"  [+] Output Archive     : {output_path}")
    print(f"  [+] Archive Size       : {len(zip_bytes) / 1024:.1f} KB")
    print(f"  [+] Export Batch ID    : {summary['batch_id']}")
    print(f"  [+] Database Engine    : {summary['database_engine']}")
    print(f"  [+] Total Inspections  : {summary['record_count']}")
    print(f"  [+] Total Annotations  : {summary['total_annotations']}")
    print(f"  [+] Annotation Format  : {args.format.upper()}")
    print("\n  Class Distribution (YOLO Labels):")
    for cls_name, count in summary["class_distribution"].items():
        print(f"    - {cls_name:<12} : {count:>5} boxes")
    print("\n  Geographic Distribution:")
    for region_name, count in summary["geographic_distribution"].items():
        print(f"    - {region_name:<16} : {count:>5} inspections")
    print("-" * 70)
    if args.dry_run:
        print("  [*] Mode: DRY RUN (Database records were NOT marked as used_for_training).")
    else:
        print("  [+] State Update: Database records marked as used_for_training = True.")
        print("      (These inspections will not be exported again in subsequent runs).")
    print("=" * 70)

    mongo_manager.close()


def main():
    args = parse_arguments()
    asyncio.run(main_async(args))


if __name__ == "__main__":
    main()
