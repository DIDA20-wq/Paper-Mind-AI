import uuid
from fastapi.testclient import TestClient


def test_cross_user_isolation(client: TestClient):
    # Register User A
    user_a_email = f"user_a_{uuid.uuid4().hex[:6]}@univ.edu"
    reg_a = client.post("/api/v1/auth/register", json={"email": user_a_email, "password": "Password123!", "full_name": "User A"})
    assert reg_a.status_code == 201
    login_a = client.post("/api/v1/auth/login/json", json={"email": user_a_email, "password": "Password123!"})
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register User B
    user_b_email = f"user_b_{uuid.uuid4().hex[:6]}@univ.edu"
    reg_b = client.post("/api/v1/auth/register", json={"email": user_b_email, "password": "Password123!", "full_name": "User B"})
    assert reg_b.status_code == 201
    login_b = client.post("/api/v1/auth/login/json", json={"email": user_b_email, "password": "Password123!"})
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A uploads a paper
    import fitz
    doc = fitz.open()
    p = doc.new_page()
    p.insert_text((50, 72), "User A Confidential Research Paper\n\nSecret algorithmic findings.")
    pdf_bytes = doc.tobytes()
    doc.close()

    upload_res = client.post(
        "/api/v1/documents/upload",
        files={"file": ("confidential.pdf", pdf_bytes, "application/pdf")},
        headers=headers_a
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["document"]["id"]

    try:
        # User B attempts to access User A's document -> Must return 404
        get_res = client.get(f"/api/v1/documents/{doc_id}", headers=headers_b)
        assert get_res.status_code == 404

        # User B attempts to delete User A's document -> Must return 404
        del_res = client.delete(f"/api/v1/documents/{doc_id}", headers=headers_b)
        assert del_res.status_code == 404

        # User B's document list must NOT contain User A's document
        list_b = client.get("/api/v1/documents", headers=headers_b)
        assert list_b.status_code == 200
        items_b = list_b.json()["items"]
        assert all(item["id"] != doc_id for item in items_b)

        # Unauthenticated request must return 401
        no_auth = client.get(f"/api/v1/documents/{doc_id}")
        assert no_auth.status_code == 401

    finally:
        # User A cleans up
        client.delete(f"/api/v1/documents/{doc_id}", headers=headers_a)
