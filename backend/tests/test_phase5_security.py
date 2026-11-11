import uuid
from datetime import timedelta
from jose import jwt
from fastapi.testclient import TestClient
from app.core.config import settings
from app.core.security import create_access_token

try:
    import pymupdf as fitz
except ImportError:
    import fitz


def test_cross_user_isolation(client: TestClient):
    """
    Comprehensive verification of multi-tenant isolation:
    User B must NEVER be able to read, delete, summarize, search,
    query, or access chat sessions belonging to User A.
    """
    # 1. Register User A
    user_a_email = f"user_a_{uuid.uuid4().hex[:6]}@univ.edu"
    reg_a = client.post("/api/v1/auth/register", json={"email": user_a_email, "password": "Password123!", "full_name": "User A"})
    assert reg_a.status_code == 201
    login_a = client.post("/api/v1/auth/login/json", json={"email": user_a_email, "password": "Password123!"})
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Register User B
    user_b_email = f"user_b_{uuid.uuid4().hex[:6]}@univ.edu"
    reg_b = client.post("/api/v1/auth/register", json={"email": user_b_email, "password": "Password123!", "full_name": "User B"})
    assert reg_b.status_code == 201
    login_b = client.post("/api/v1/auth/login/json", json={"email": user_b_email, "password": "Password123!"})
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. User A uploads a paper
    doc = fitz.open()
    p = doc.new_page()
    p.insert_text((50, 72), "User A Confidential Research Paper\n\nTop secret algorithmic findings in deep architectures.")
    pdf_bytes = doc.tobytes()
    doc.close()

    upload_res = client.post(
        "/api/v1/documents/upload",
        files={"file": ("confidential.pdf", pdf_bytes, "application/pdf")},
        headers=headers_a
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["document"]["id"]

    # 4. User A creates a chat session and summary
    chat_a = client.post(
        "/api/v1/chat/ask",
        json={"question": "What algorithmic findings are in this paper?", "document_ids": [doc_id]},
        headers=headers_a
    )
    assert chat_a.status_code == 200
    session_id = chat_a.json()["session_id"]

    summ_a = client.post(
        "/api/v1/research/summarize",
        json={"document_id": doc_id},
        headers=headers_a
    )
    assert summ_a.status_code == 200

    try:
        # A. Document Isolation
        # User B cannot get User A's document
        get_res = client.get(f"/api/v1/documents/{doc_id}", headers=headers_b)
        assert get_res.status_code == 404

        # User B cannot delete User A's document
        del_res = client.delete(f"/api/v1/documents/{doc_id}", headers=headers_b)
        assert del_res.status_code == 404

        # User B's document list must NOT contain User A's document
        list_b = client.get("/api/v1/documents", headers=headers_b)
        assert list_b.status_code == 200
        assert all(item["id"] != doc_id for item in list_b.json()["items"])

        # B. Research & Summarization Isolation
        # User B cannot summarize User A's document
        summ_b = client.post("/api/v1/research/summarize", json={"document_id": doc_id}, headers=headers_b)
        assert summ_b.status_code == 404

        # User B cannot export User A's summary
        exp_summ_b = client.get(f"/api/v1/research/summary/{doc_id}/export", headers=headers_b)
        assert exp_summ_b.status_code == 404

        # User B cannot compare User A's document
        comp_b = client.post("/api/v1/research/compare", json={"document_ids": [doc_id, str(uuid.uuid4())]}, headers=headers_b)
        assert comp_b.status_code == 400

        # User B semantic search cannot see User A's passages
        search_b = client.post("/api/v1/research/search", json={"query": "algorithmic findings", "document_ids": [doc_id]}, headers=headers_b)
        assert search_b.status_code == 200
        assert len(search_b.json()) == 0

        # C. Chat Session Isolation
        # User B cannot view User A's session
        get_sess_b = client.get(f"/api/v1/chat/sessions/{session_id}", headers=headers_b)
        assert get_sess_b.status_code == 404

        # User B cannot rename User A's session
        patch_sess_b = client.patch(f"/api/v1/chat/sessions/{session_id}", json={"title": "Hacked Title"}, headers=headers_b)
        assert patch_sess_b.status_code == 404

        # User B cannot export User A's session
        exp_sess_b = client.get(f"/api/v1/chat/sessions/{session_id}/export", headers=headers_b)
        assert exp_sess_b.status_code == 404

        # User B cannot delete User A's session
        del_sess_b = client.delete(f"/api/v1/chat/sessions/{session_id}", headers=headers_b)
        assert del_sess_b.status_code == 404

        # User B cannot inject messages into User A's session
        inject_b = client.post(
            "/api/v1/chat/ask",
            json={"question": "Tell me secrets", "session_id": session_id},
            headers=headers_b
        )
        assert inject_b.status_code == 404

        # User B asking against User A's doc_id yields insufficient evidence and no leak
        leak_test = client.post(
            "/api/v1/chat/ask",
            json={"question": "What algorithmic findings are in this paper?", "document_ids": [doc_id]},
            headers=headers_b
        )
        assert leak_test.status_code == 200
        assert "insufficient evidence" in leak_test.json()["answer"].lower()
        assert len(leak_test.json()["citations"]) == 0

    finally:
        # User A cleans up
        client.delete(f"/api/v1/documents/{doc_id}", headers=headers_a)
        client.delete(f"/api/v1/chat/sessions/{session_id}", headers=headers_a)


def test_jwt_and_authentication_security(client: TestClient):
    """
    Test authentication boundaries, password hashing, token expiration,
    malformed tokens, and forged signatures.
    """
    test_email = f"sec_user_{uuid.uuid4().hex[:6]}@univ.edu"

    # 1. Registration validation
    reg_ok = client.post("/api/v1/auth/register", json={"email": test_email, "password": "SecurePassword1!", "full_name": "Sec Tester"})
    assert reg_ok.status_code == 201
    user_id = reg_ok.json()["id"]

    # Duplicate registration must fail
    dup_reg = client.post("/api/v1/auth/register", json={"email": test_email, "password": "SecurePassword1!", "full_name": "Sec Tester"})
    assert dup_reg.status_code == 400

    # Short password (< 6 chars) must fail validation
    short_pwd = client.post("/api/v1/auth/register", json={"email": "short@univ.edu", "password": "123"})
    assert short_pwd.status_code == 422

    # 2. Login verification
    # Wrong password -> 401
    bad_login = client.post("/api/v1/auth/login/json", json={"email": test_email, "password": "WrongPassword"})
    assert bad_login.status_code == 401

    # Non-existent user -> 401
    ghost_login = client.post("/api/v1/auth/login/json", json={"email": "nonexistent@univ.edu", "password": "Password123!"})
    assert ghost_login.status_code == 401

    # Successful login
    login_res = client.post("/api/v1/auth/login/json", json={"email": test_email, "password": "SecurePassword1!"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # 3. /auth/me returns current user profile
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == test_email

    # 4. Token validation edge cases
    # Missing token -> 401
    no_token = client.get("/api/v1/auth/me")
    assert no_token.status_code == 401

    # Malformed token string -> 401
    malformed = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-valid-jwt-token"})
    assert malformed.status_code == 401

    # Forged signature token -> 401
    forged_token = jwt.encode({"sub": user_id}, "completely-wrong-secret-key-attacker", algorithm="HS256")
    forged_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {forged_token}"})
    assert forged_res.status_code == 401

    # Expired token -> 401
    expired_token = create_access_token(subject=user_id, expires_delta=timedelta(seconds=-10))
    expired_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert expired_res.status_code == 401


def test_input_validation_and_malicious_uploads(client: TestClient):
    """
    Test defense against invalid magic headers, empty files,
    and invalid request payloads.
    """
    login_res = client.post(
        "/api/v1/auth/login/json",
        json={"email": "researcher@papermind.ai", "password": "ResearchPass2026!"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Non-PDF file disguised as PDF (missing %PDF- magic bytes) -> 400
    malicious_bytes = b"#!/bin/bash\necho 'This is not a PDF file'"
    bad_upload = client.post(
        "/api/v1/documents/upload",
        files={"file": ("script.pdf", malicious_bytes, "application/pdf")},
        headers=headers
    )
    assert bad_upload.status_code == 400
    assert "not a valid PDF" in bad_upload.json()["detail"]

    # 2. Empty file upload -> 400
    empty_upload = client.post(
        "/api/v1/documents/upload",
        files={"file": ("empty.pdf", b"", "application/pdf")},
        headers=headers
    )
    assert empty_upload.status_code == 400
    assert "empty" in empty_upload.json()["detail"].lower()

    # 3. Question length validation (min_length=2) -> 422
    short_q = client.post(
        "/api/v1/chat/ask",
        json={"question": "a"},
        headers=headers
    )
    assert short_q.status_code == 422

