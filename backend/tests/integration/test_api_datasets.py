import io
from unittest.mock import MagicMock, patch

from app.etl.etl_constants import COLUMNS


def _csv():
    header = ",".join(COLUMNS)
    row = "10100,30,95.7,1,2871,2003-02-01,Shipped,1,2,2003,Classic Cars,95,S10_1678,Cust,,addr,,NYC,,10001,USA,,S,J,Small"
    return (header + "\n" + row).encode("cp1252")


def _upload(client, auth_headers):
    with patch("app.etl.etl_service.process_upload_task") as mock:
        mock.apply_async = MagicMock()
        r = client.post(
            "/api/datasets/upload",
            headers=auth_headers,
            files={"file": ("sample.csv", io.BytesIO(_csv()), "text/csv")},
        )
    return r


def test_list_datasets_empty(client, auth_headers):
    r = client.get("/api/datasets/", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["items"] == []


def test_list_requires_auth(client):
    r = client.get("/api/datasets/")
    assert r.status_code == 401


def test_upload_success(client, auth_headers):
    r = _upload(client, auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "dataset_id" in data
    assert data["dataset_id"] >= 1


def test_upload_requires_auth(client):
    r = client.post(
        "/api/datasets/upload",
        files={"file": ("sample.csv", io.BytesIO(_csv()), "text/csv")},
    )
    assert r.status_code == 401


def test_list_shows_uploaded_dataset(client, auth_headers):
    _upload(client, auth_headers)
    r = client.get("/api/datasets/", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()["items"]) == 1


def test_get_dataset_success(client, auth_headers):
    up = _upload(client, auth_headers)
    did = up.json()["dataset_id"]
    r = client.get(f"/api/datasets/{did}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["id"] == did
    assert r.json()["filename"] == "sample.csv"


def test_get_dataset_not_found(client, auth_headers):
    r = client.get("/api/datasets/99999", headers=auth_headers)
    assert r.status_code == 404


def test_get_dataset_other_user_returns_404(client, db):
    client.post("/api/auth/register", json={"email": "a@x.com", "password": "pass"})
    client.post("/api/auth/register", json={"email": "b@x.com", "password": "pass"})
    token_a = client.post("/api/auth/login", data={"username": "a@x.com", "password": "pass"}).json()["access_token"]
    token_b = client.post("/api/auth/login", data={"username": "b@x.com", "password": "pass"}).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    up = _upload(client, headers_a)
    did = up.json()["dataset_id"]

    r = client.get(f"/api/datasets/{did}", headers=headers_b)
    assert r.status_code == 404


def test_records_returns_paginated_items(client, auth_headers):
    up = _upload(client, auth_headers)
    did = up.json()["dataset_id"]
    r = client.get(f"/api/datasets/{did}/records", headers=auth_headers)
    assert r.status_code == 200
    assert "items" in r.json()


def test_records_not_found(client, auth_headers):
    r = client.get("/api/datasets/99999/records", headers=auth_headers)
    assert r.status_code == 404


def test_aggregates_returns_structure(client, auth_headers):
    up = _upload(client, auth_headers)
    did = up.json()["dataset_id"]
    r = client.get(f"/api/datasets/{did}/aggregates", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "sales_by_product_line" in data
    assert "sales_by_country" in data
    assert "sales_over_time" in data


def test_aggregates_not_found(client, auth_headers):
    r = client.get("/api/datasets/99999/aggregates", headers=auth_headers)
    assert r.status_code == 404


def test_statuses_dropdown(client, auth_headers):
    up = _upload(client, auth_headers)
    did = up.json()["dataset_id"]
    r = client.get(f"/api/datasets/{did}/statuses", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_product_lines_dropdown(client, auth_headers):
    up = _upload(client, auth_headers)
    did = up.json()["dataset_id"]
    r = client.get(f"/api/datasets/{did}/product-lines", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_countries_dropdown(client, auth_headers):
    up = _upload(client, auth_headers)
    did = up.json()["dataset_id"]
    r = client.get(f"/api/datasets/{did}/countries", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_delete_dataset(client, auth_headers):
    up = _upload(client, auth_headers)
    did = up.json()["dataset_id"]
    with patch("app.etl.etl_service.delete_dataset_task") as mock:
        mock.apply_async = MagicMock()
        r = client.delete(f"/api/datasets/{did}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["dataset_id"] == did


def test_delete_not_found(client, auth_headers):
    with patch("app.etl.etl_service.delete_dataset_task") as mock:
        mock.apply_async = MagicMock()
        r = client.delete("/api/datasets/99999", headers=auth_headers)
    assert r.status_code == 404
