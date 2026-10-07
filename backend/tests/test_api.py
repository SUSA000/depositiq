NEVER_CONTACTED = {
    "age": 35,
    "job": "management",
    "marital": "married",
    "education": "secondary",
    "default": "no",
    "balance": 1200,
    "housing": "yes",
    "loan": "no",
    "contact": "cellular",
    "day": 15,
    "month": "may",
    "campaign": 2,
    "previously_contacted": False,
    "pdays": None,
    "previous": None,
    "poutcome": None,
}

PREVIOUSLY_CONTACTED = {
    **NEVER_CONTACTED,
    "age": 58,
    "job": "retired",
    "balance": 5000,
    "housing": "no",
    "day": 5,
    "month": "oct",
    "campaign": 1,
    "previously_contacted": True,
    "pdays": 90,
    "previous": 2,
    "poutcome": "success",
}


def test_authentication_flow(client):
    registration = client.post(
        "/api/auth/register",
        json={
            "full_name": "Data Analyst",
            "email": "data@example.com",
            "password": "SecurePass123!",
        },
    )
    assert registration.status_code == 201
    assert "password_hash" not in registration.text

    duplicate = client.post(
        "/api/auth/register",
        json={
            "full_name": "Another Analyst",
            "email": "data@example.com",
            "password": "SecurePass123!",
        },
    )
    assert duplicate.status_code == 409

    wrong_password = client.post(
        "/api/auth/login",
        json={"email": "data@example.com", "password": "incorrect"},
    )
    assert wrong_password.status_code == 401

    valid_login = client.post(
        "/api/auth/login",
        json={"email": "data@example.com", "password": "SecurePass123!"},
    )
    assert valid_login.status_code == 200
    assert valid_login.json()["token_type"] == "bearer"

    headers = {"Authorization": f"Bearer {registration.json()['access_token']}"}
    me = client.get("/api/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["email"] == "data@example.com"


def test_prediction_is_preserved_and_saved(client, auth_headers):
    assert client.post("/api/predict", json=NEVER_CONTACTED).status_code == 401

    result = client.post("/api/predict", json=NEVER_CONTACTED, headers=auth_headers)
    assert result.status_code == 200
    body = result.json()
    assert body["prediction"] == "no"
    assert body["probability"] == 0.3984
    assert 0 <= body["probability"] <= 1

    history = client.get("/api/history", headers=auth_headers)
    assert history.status_code == 200
    assert history.json()["total"] == 1
    assert history.json()["items"][0]["id"] == body["history_id"]

    summary = client.get("/api/dashboard/summary", headers=auth_headers)
    assert summary.json() == {
        "total_predictions": 1,
        "likely": 0,
        "unlikely": 1,
        "average_probability": 0.3984,
    }

    previous_result = client.post(
        "/api/predict", json=PREVIOUSLY_CONTACTED, headers=auth_headers
    )
    assert previous_result.status_code == 200
    assert previous_result.json()["prediction"] == "yes"
    assert previous_result.json()["probability"] == 0.8946

    prediction_filter = client.get("/api/history?prediction=yes", headers=auth_headers)
    assert prediction_filter.json()["total"] == 1
    assert prediction_filter.json()["summary"]["likely"] == 1
    assert prediction_filter.json()["summary"]["unlikely"] == 0

    search_filter = client.get("/api/history?search=retired", headers=auth_headers)
    assert search_filter.json()["total"] == 1
    assert search_filter.json()["items"][0]["job"] == "retired"

    created_date = previous_result.json()["created_at"][:10]
    date_filter = client.get(
        f"/api/history?from_date={created_date}&to_date={created_date}",
        headers=auth_headers,
    )
    assert date_filter.json()["total"] == 2

    csv_export = client.get("/api/history/export?prediction=yes", headers=auth_headers)
    assert csv_export.status_code == 200
    assert "retired" in csv_export.text
    assert "password" not in csv_export.text.lower()


def test_validation_and_real_dataset_insights(client, auth_headers):
    invalid = {**NEVER_CONTACTED, "age": 12}
    assert client.post("/api/predict", json=invalid, headers=auth_headers).status_code == 422

    invalid_category = {**NEVER_CONTACTED, "job": "not-a-model-category"}
    assert client.post("/api/predict", json=invalid_category, headers=auth_headers).status_code == 422

    missing_previous = {
        **NEVER_CONTACTED,
        "previously_contacted": True,
        "pdays": None,
    }
    assert client.post("/api/predict", json=missing_previous, headers=auth_headers).status_code == 422

    insights = client.get("/api/insights/dataset", headers=auth_headers)
    assert insights.status_code == 200
    summary = insights.json()["summary"]
    assert summary["total_customers"] == 45211
    assert summary["subscribers"] == 5289
    assert summary["subscription_rate"] == 11.7

    filtered = client.get(
        "/api/insights/dataset?job=student&contact=cellular",
        headers=auth_headers,
    )
    assert filtered.status_code == 200
    assert filtered.json()["summary"]["total_customers"] < 45211
