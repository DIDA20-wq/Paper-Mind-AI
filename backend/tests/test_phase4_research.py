import uuid
from fastapi.testclient import TestClient


def test_research_summarize_and_compare(client: TestClient):
    # 1. Login as demo researcher
    login_res = client.post(
        "/api/v1/auth/login/json",
        json={"email": "researcher@papermind.ai", "password": "ResearchPass2026!"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload two synthetic research papers
    import fitz
    
    # Doc A
    doc_a = fitz.open()
    p1 = doc_a.new_page()
    p1.insert_text((50, 72), "Deep Residual Learning for Image Recognition\n\nAbstract\nWe present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs.")
    p2 = doc_a.new_page()
    p2.insert_text((50, 72), "Methodology and Dataset\n\nEvaluated on ImageNet dataset with 152 layers, achieving 3.57% top-5 error rate.")
    bytes_a = doc_a.tobytes()
    doc_a.close()

    res_a = client.post(
        "/api/v1/documents/upload",
        files={"file": ("resnet.pdf", bytes_a, "application/pdf")},
        headers=headers
    )
    assert res_a.status_code == 201
    doc_id_a = res_a.json()["document"]["id"]

    # Doc B
    doc_b = fitz.open()
    p1 = doc_b.new_page()
    p1.insert_text((50, 72), "Vision Transformer for Large Scale Image Recognition\n\nAbstract\nWhile the Transformer architecture has become the de-facto standard for natural language processing tasks, its applications to computer vision remain limited. In vision, attention is either applied in conjunction with convolutional networks, or used to replace certain components.")
    p2 = doc_b.new_page()
    p2.insert_text((50, 72), "Methodology and Results\n\nWhen pre-trained on large amounts of data and transferred to mid-sized benchmarks (ImageNet), Vision Transformer (ViT) attains excellent results: 88.55% top-1 accuracy.")
    bytes_b = doc_b.tobytes()
    doc_b.close()

    res_b = client.post(
        "/api/v1/documents/upload",
        files={"file": ("vit.pdf", bytes_b, "application/pdf")},
        headers=headers
    )
    assert res_b.status_code == 201
    doc_id_b = res_b.json()["document"]["id"]

    try:
        # 3. Test 7-Section Summarize endpoint
        summ_res = client.post(
            "/api/v1/research/summarize",
            json={"document_id": doc_id_a},
            headers=headers
        )
        assert summ_res.status_code == 200
        summary_data = summ_res.json()["summary"]
        assert "abstract" in summary_data
        assert "methodology" in summary_data
        assert "results" in summary_data

        # 4. Test Multi-Paper Compare endpoint
        comp_res = client.post(
            "/api/v1/research/compare",
            json={"document_ids": [doc_id_a, doc_id_b]},
            headers=headers
        )
        assert comp_res.status_code == 200
        comp_data = comp_res.json()
        assert len(comp_data["papers"]) == 2
        assert len(comp_data["key_differences"]) > 0
        assert len(comp_data["synthesis_observations"]) > 0

        # 5. Test Chat Ask endpoint against these papers
        chat_res = client.post(
            "/api/v1/chat/ask",
            json={
                "question": "What top-5 error rate did ResNet achieve on ImageNet?",
                "document_ids": [doc_id_a]
            },
            headers=headers
        )
        assert chat_res.status_code == 200
        chat_data = chat_res.json()
        assert "session_id" in chat_data
        assert len(chat_data["citations"]) > 0
        assert chat_data["citations"][0]["document_id"] == doc_id_a
    finally:
        # Cleanup documents
        client.delete(f"/api/v1/documents/{doc_id_a}", headers=headers)
        client.delete(f"/api/v1/documents/{doc_id_b}", headers=headers)
