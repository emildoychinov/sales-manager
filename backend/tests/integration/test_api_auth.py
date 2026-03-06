def test_register_success(client):
    r = client.post(
        "/api/auth/register",
        json={"email": "new@example.com", "password": "secret123"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "new@example.com"
    assert "id" in data
    assert "created_at" in data


def test_register_duplicate_email_returns_400(client):
    payload = {"email": "dup@example.com", "password": "secret123"}
    client.post("/api/auth/register", json=payload)
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 400
    assert "already registered" in r.json()["detail"].lower()


def test_login_returns_token(client):
    client.post(
        "/api/auth/register",
        json={"email": "login@example.com", "password": "mypass"},
    )
    r = client.post(
        "/api/auth/login",
        data={"username": "login@example.com", "password": "mypass"},
    )
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password_returns_401(client):
    client.post(
        "/api/auth/register",
        json={"email": "pw@example.com", "password": "correct"},
    )
    r = client.post(
        "/api/auth/login",
        data={"username": "pw@example.com", "password": "wrong"},
    )
    assert r.status_code == 401


def test_login_unknown_user_returns_401(client):
    r = client.post(
        "/api/auth/login",
        data={"username": "nobody@example.com", "password": "x"},
    )
    assert r.status_code == 401


def test_me_without_token_returns_401(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 401


def test_me_with_token_returns_user(client, auth_headers):
    r = client.get("/api/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["email"] == "test@example.com"
