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

## Collaboration and Contribution Guide

These instructions are for anyone joining the DepositIQ project.

### 1. Clone the repository and create a branch

```powershell
git clone https://github.com/SUSA000/depositiq.git
cd depositiq
git checkout -b feature/short-description
```

Use a separate branch for every feature, bug fix, documentation change, or experiment. Do not work directly on `main`.

### 2. Set up the project

Follow the [Backend Setup](#backend-setup) and [Frontend Setup](#frontend-setup) sections above. Each contributor must create local copies of:

- `backend/.env.example` as `backend/.env`
- `frontend/.env.example` as `frontend/.env`

Never commit `.env` files, passwords, JWT keys, database files, `node_modules`, or build output. These files are already excluded by `.gitignore`.

### 3. Make changes in the correct layer

- **Backend API:** update routes in `backend/app/api/`, request and response models in `backend/app/schemas/`, and shared configuration or security code in `backend/app/core/`.
- **Business and ML logic:** update services in `backend/app/services/`. Preserve the saved model artifacts, feature order, preprocessing behavior, and `0.5` decision threshold unless the change explicitly includes model validation.
- **Frontend:** update pages and components in `frontend/src/`. Keep API calls aligned with the backend endpoint and schema.
- **Database changes:** update SQLAlchemy models in `backend/app/models/`, database initialization code, and the related tests. Explain any migration or data-reset requirement in the pull request.
- **Tests:** add or update backend tests in `backend/tests/` for every changed API or business rule.

### 4. Validate before opening a pull request

Run the backend tests from the project root:

```powershell
python -m pytest backend\tests -q
```

Build the frontend to catch JavaScript and production-bundle errors:

```powershell
cd frontend
npm run build
cd ..
```

If the change affects the running application, verify both services locally and check the API documentation at `http://127.0.0.1:8001/docs`.

### 5. Commit and open a pull request

```powershell
git status
git add <changed-files>
git commit -m "Describe the change"
git push -u origin feature/short-description
```

Open a pull request against `main` and include:

- What changed and why
- How the change was tested
- Screenshots or a short recording for visual changes
- API, database, model, or environment changes that other contributors must know about
- Any known limitations or follow-up work

Keep pull requests focused and avoid unrelated formatting or generated-file changes. Request review from at least one other contributor before merging.

### Contribution checklist

- [ ] The branch is based on the latest `main`.
- [ ] No secrets, local databases, `node_modules`, or build artifacts are included.
- [ ] Relevant tests were added or updated.
- [ ] `python -m pytest backend\tests -q` passes.
- [ ] `npm run build` passes for frontend changes.
- [ ] README or API documentation was updated when behavior changed.
- [ ] The pull request explains the implementation and validation steps.

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
