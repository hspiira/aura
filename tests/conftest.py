"""Pytest configuration and fixtures."""

import os

# Ensure Settings can load during collection (when tests import app.main).
# Some environments set DEBUG to a non-boolean value (e.g. "release").
if os.environ.get("DEBUG", "").lower() not in ("true", "false", "1", "0", ""):
    os.environ["DEBUG"] = "false"
