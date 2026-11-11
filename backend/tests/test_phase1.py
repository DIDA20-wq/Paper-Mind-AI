import uuid
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "PaperMind AI"


def test_user_registration_and_login(client: TestClient):
    unique_email = f"test_{uuid.uuid4().hex[:8]}@papermind.ai"
    password = "TestPassword2026!"
    
    # 1. Register
    reg_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": unique_email,
            "full_name": "Test Researcher",
            "password": password
        }
    )
    assert reg_response.status_code == 201, reg_response.text
    user_data = reg_response.json()
    assert user_data["email"] == unique_email
    assert "id" in user_data

    # 2. Login via JSON
    login_response = client.post(
        "/api/v1/auth/login/json",
        json={
            "email": unique_email,
            "password": password
        }
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # 3. Access protected /me route
    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == unique_email


def test_demo_user_login(client: TestClient):
    response = client.post(
        "/api/v1/auth/login/json",
        json={
            "email": "researcher@papermind.ai",
            "password": "ResearchPass2026!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["full_name"] == "Dr. Eleanor Vance"
    assert "access_token" in data
