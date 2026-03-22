
# 🩻 Phrelis Hospital OS
### **The Intelligent Neural Framework for Modern Healthcare**

Phrelis is not just a Hospital ERP; it is a **Clinical Operating System** designed to automate the "Nervous System" of a healthcare facility. Built with a multimodal AI stack, it predicts patient surges, automates triage using international protocols, and acts as an autonomous sentinel for radiology diagnostics.

---

## 🚀 Elite Features

### 🧠 Multimodal AI Stack
* **Radiology Sentinel AI:** Uses a **DenseNet121** Computer Vision model to analyze X-ray bytes in real-time, detecting 14 pathologies (e.g., Pneumothorax, Lung Opacity) with automated clinical escalation.
* **Clinical Triage Engine:** Powered by **Gemini Flash**, it automates the **ESI v5 Protocol**, providing clinical justifications and resource-mapping for incoming patients.
* **Predictive Inflow Engine:** A multivariate **XGBoost** model that forecasts patient volume by correlating historical trends with live **Weather & AQI telemetry** via Open-Meteo.

### 🏥 Orchestration & Flow
* **Dynamic Priority Queueing:** A sophisticated triage algorithm integrating **ICD-10 Chapter weighting** and an **Anti-Starvation mechanic** (+1 point every 2 mins) to ensure queue equity.
* **Real-Time WebSocket Fabric:** Instant, system-wide broadcasts for critical radiology findings, bed status updates, and emergency admissions.
* **Smart Nursing Worklist:** Autonomous generation of pathology-specific tasks (e.g., Q15m vitals monitoring for critical patients) upon admission.

### 💼 Administrative Intelligence
* **Unified Financial Engine:** Automated, **GST-compliant billing** that links inventory logs, surgery complexity, and bed occupancy into a single ledger.
* **Predictive Inventory:** Real-time **burn-rate calculation** and exhaustion forecasting based on current hospital saturation.
* **Clinical Guardrails:** Programmatic safety checks for infection control (Isolation forcing) and gender-compatibility in medical wards.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | FastAPI (Python 3.13), SQLAlchemy, Uvicorn |
| **Frontend** | Next.js 14, Tailwind CSS, TypeScript |
| **AI/ML** | PyTorch, TorchXRayVision, XGBoost, LangChain (Google Gemini) |
| **Database** | SQLite (Development) / PostgreSQL (Production) |
| **Real-time** | WebSockets (Native FastAPI) |

---

## 📥 Installation & Setup

### 1. Prerequisites
* Python 3.11+
* Node.js 18+


### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure Environment
echo "GOOGLE_API_KEY=your_key_here" > .env

# Run the server
python main.py
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## 🛡️ Security & Compliance
* **RBAC:** Strict Role-Based Access Control using **JWT** (JSON Web Tokens).
* **Audit Logging:** HIPAA-inspired logging for every clinical action, admission, and diagnostic scan.
* **Data Integrity:** Atomic transactions for inventory management and billing to prevent data desync.

