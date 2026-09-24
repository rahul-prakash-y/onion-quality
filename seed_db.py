#!/usr/bin/env python3
"""Convenience root wrapper for the OnionVision AI Database Seeder.
Delegates to backend/seed_db.py.
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from seed_db import main

if __name__ == "__main__":
    main()
