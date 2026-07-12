import os
import sys

# Filter out bare home directory from search path to prevent clash with 'app.py'
sys.path = [p for p in sys.path if p.rstrip("\\/").lower() != "c:\\users\\lenovo"]

# Ensure current backend directory is at the front
backend_path = os.path.abspath(os.path.dirname(__file__))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
