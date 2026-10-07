# DepositIQ

DepositIQ is an authenticated bank-marketing decision-support dashboard. It combines a React analytics interface with a FastAPI API and the project's original tuned Random Forest model to estimate whether a customer is likely to subscribe to a term deposit.

The application preserves the trained model, preprocessing artifacts, 50-feature order, and `0.5` decision threshold. Call duration is deliberately excluded because it would not be known before a call and would introduce target leakage.

## Features

- Secure registration and login with Argon2 password hashing and JWT access tokens
- Protected React routes with persistent login and logout
- Live dashboard statistics calculated from the signed-in user's history
- Customer prediction form driven by the model's fitted category options
- Original RobustScaler and OneHotEncoder preprocessing pipeline
- Professional prediction result with probability, confidence, customer review, and decision-support guidance
- SQLite prediction persistence scoped to each user
- Searchable, sortable, filterable and paginated prediction history
- Filter-aware KPI cards and CSV export
- Right-side prediction detail drawer
- Real UCI Bank Marketing EDA calculated from 45,211 dataset rows
- Nine dataset/model charts and six saved-prediction analytics views using Recharts
- Responsive desktop, tablet and mobile layouts
- Persistent light and dark themes
- Loading, error and empty states throughout

## Architecture

```text
React + Vite (port 5173)
        |
        | JSON + Bearer JWT
        v
FastAPI + Pydantic (port 8001)
        |
        +-- SQLAlchemy --> SQLite (users and prediction history)
        |
        +-- pandas --> cached UCI dataset analytics
        |
        +-- RobustScaler + OneHotEncoder --> RandomForestClassifier
```

The Vite development server and FastAPI run separately during development. A production React build can also be served by FastAPI from `frontend/dist`.

## Technology Stack

### Frontend

- React 18
- Vite 6
- React Router 7
- JavaScript and modern CSS
- Recharts 3
- Lucide React
- Axios

### Backend

- Python 3.11+
- FastAPI and Uvicorn
- Pydantic
- SQLAlchemy and SQLite
- PyJWT
- pwdlib with Argon2
- pandas and NumPy
- scikit-learn and joblib
- pytest and FastAPI TestClient

## Folder Structure

```text
webapp/
├── backend/
│   ├── app/
│   │   ├── api/                 # Auth, prediction, history and analytics routes
│   │   ├── core/                # Configuration, database and security
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic request/response models
│   │   └── services/            # ML inference and dataset analytics
│   ├── artifacts/               # Original fitted ML artifacts
│   ├── tests/                   # Backend integration tests
│   ├── main.py                  # FastAPI application entry point
│   ├── requirements.txt
│   └── .env.example
├── data/
│   └── bank-full.csv            # UCI Bank Marketing dataset
├── frontend/
│   ├── src/
│   │   ├── api/                 # Centralized Axios client
│   │   ├── components/          # Layout, charts, common and feature components
│   │   ├── context/             # Authentication and theme contexts
│   │   ├── pages/               # Login, dashboard, insights, predict and history
│   │   └── styles/              # Shared responsive design system
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## ML Model Information

- Model: tuned `RandomForestClassifier`
- Trees: 200
- Maximum depth: 20
- Class weights: balanced
- Numerical preprocessing: fitted `RobustScaler`
- Categorical preprocessing: fitted `OneHotEncoder`
- Processed model features: 50
- Threshold: probability `>= 0.5` is `yes`; otherwise `no`

Numerical features are `age`, `balance`, `day`, `campaign`, `pdays`, and `previous`. Categorical features are `job`, `marital`, `education`, `default`, `housing`, `loan`, `contact`, `month`, and `poutcome`.

The `previously_contacted` feature is engineered exactly as in the original system. For a customer who was never contacted, the raw values become `pdays=-1`, `previous=0`, and `poutcome=unknown`; `previously_contacted` becomes `0`, and `pdays` is changed to `0` immediately before scaling. The encoded `poutcome_unknown` column is dropped and columns are reordered to the model's saved feature order.

The result page shows the model's real global feature importance. It does not label global importance as a customer-specific explanation. SHAP was intentionally left out because it is optional and was not needed to preserve or validate the existing prediction pipeline.

## Environment Requirements

- Python 3.11 or later
- Node.js 20 or later with npm
- Windows, macOS or Linux

On Windows, this project's deeply nested OneDrive location can exceed the legacy path limit. If creating `.venv` inside the repository fails, use a shorter location such as `C:\venvs\depositiq`.

## Backend Setup

From the project root in PowerShell:

```powershell
python -m venv C:\venvs\depositiq
& "C:\venvs\depositiq\Scripts\Activate.ps1"
python -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
```

Change `TDI_SECRET_KEY` in `backend/.env` to a long random value before deployment.

Start FastAPI:

```powershell
python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8001 --reload
```

API documentation is available at `http://127.0.0.1:8001/docs`.

## Frontend Setup

Open a second terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://127.0.0.1:5173` and create an account.

Create a production frontend bundle with:

```powershell
npm run build
```

After `frontend/dist` exists, restarting FastAPI lets it serve the React build directly at `http://127.0.0.1:8001`.

## Database Setup

No manual migration is required for the initial project. FastAPI creates `backend/app.db`, the `users` table, and the `prediction_history` table during startup.

Passwords are never stored in plain text. Prediction history has a foreign key to the authenticated user, and APIs only return records owned by the current user.

## API Overview

### Public endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create an account and return a JWT |
| `POST` | `/api/auth/login` | Authenticate and return a JWT |
| `GET` | `/api/health` | Check model status and feature count |
| `GET` | `/api/options` | Read fitted categories and numeric ranges |

### Authenticated endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/auth/me` | Return the current user |
| `POST` | `/api/predict` | Predict and save a successful result |
| `GET` | `/api/dashboard/summary` | User-specific dashboard KPIs |
| `GET` | `/api/insights/dataset` | Filterable real-dataset EDA payload |
| `GET` | `/api/analytics/predictions` | Analytics from saved user predictions |
| `GET` | `/api/history` | Filtered, sorted, paginated history |
| `GET` | `/api/history/{id}` | One user-owned prediction record |
| `GET` | `/api/history/export` | Export filtered history as CSV |

## Running Tests

```powershell
python -m pytest backend\tests -q
```

The tests cover authentication, duplicate email handling, invalid credentials, protected prediction access, input validation, exact regression probability, persistence, dashboard aggregation, history, and real-dataset statistics.

## Screenshots

Add final screenshots here after running the application:

- `docs/screenshots/login.png`
- `docs/screenshots/dashboard.png`
- `docs/screenshots/insights.png`
- `docs/screenshots/prediction-result.png`
- `docs/screenshots/history.png`

## Known Limitations

- JWT access tokens are used without refresh tokens; users sign in again after token expiry.
- SQLite is appropriate for a university/local deployment, not a highly concurrent production service.
- Global Random Forest importance is not a customer-specific causal explanation.
- The project does not retrain or version models through the web interface.
- The recommendation is decision support only and must not be treated as automatic approval or rejection of a financial product.
