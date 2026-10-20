"""
CardioTwin AI - Single-Command Demonstration Runner
Digital Twin Challenge 2026 - Happiest Health

Starts the FastAPI backend (port 8000) and the Vite React frontend (port 5173).
"""

import os
import sys
import time
import subprocess
import webbrowser

def main():
    print("=" * 70)
    print("  CARDIOTWIN AI: VIRTUAL CARDIOVASCULAR PATIENT LABORATORY")
    print("  Digital Twin Challenge 2026 organized by Happiest Health")
    print("  Author: Madabattula Tejo Hasini (Aditya University)")
    print("=" * 70)

    # 1. Verify Data and Model Artifacts
    if not os.path.exists("data/synthetic_patients.csv"):
        print("\n[STEP 1/3] Generating synthetic EHR and wearable datasets...")
        subprocess.run([sys.executable, "-u", "ml/synthetic_generator.py"], check=True)
    else:
        print("\n[STEP 1/3] Synthetic datasets verified.")

    if not os.path.exists("artifacts/model_random_forest.joblib"):
        print("\n[STEP 2/3] Training and evaluating ML models...")
        subprocess.run([sys.executable, "-u", "ml/train_models.py"], check=True)
    else:
        print("\n[STEP 2/3] ML models and evaluation artifacts verified.")

    # 2. Launch FastAPI Backend
    print("\n[STEP 3/3] Launching Backend & Frontend services...")
    print("  -> Starting FastAPI Backend on http://127.0.0.1:8000")
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"]
    backend_proc = subprocess.Popen(backend_cmd)

    # Allow backend to bind socket
    time.sleep(2)

    # 3. Launch Vite Frontend
    print("  -> Starting Vite Frontend on http://localhost:5173")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_proc = subprocess.Popen([npm_cmd, "run", "dev"], cwd="frontend")

    print("\n" + "*" * 70)
    print("  CardioTwin AI is now LIVE!")
    print("  Frontend Research Dashboard:  http://localhost:5173")
    print("  Backend OpenAPI Documentation: http://127.0.0.1:8000/docs")
    print("  System Health Check:           http://127.0.0.1:8000/health")
    print("*" * 70)
    print("\nPress Ctrl+C to safely shut down both services.\n")

    # Open browser
    try:
        webbrowser.open("http://localhost:5173")
    except Exception:
        pass

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down CardioTwin AI services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        backend_proc.wait()
        frontend_proc.wait()
        print("Services cleanly terminated. Goodbye!")

if __name__ == "__main__":
    main()
