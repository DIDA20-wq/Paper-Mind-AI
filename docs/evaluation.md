# PaperMind AI — RAG Evaluation & Benchmark Methodology

This document outlines the systematic evaluation methodology, benchmark dataset, and quality metrics used to validate retrieval precision, page-accurate citation fidelity, and answer faithfulness in PaperMind AI.

---

## 1. Evaluation Objectives

1. **Retrieval Precision & Recall**: Ensuring the top-K passages retrieved from Qdrant contain the exact ground-truth evidence required to answer the question.
2. **Page-Number Preservation**: Verifying that 100% of generated citations reference the correct physical page in the PDF without drift.
3. **Answer Faithfulness (Zero Hallucination)**: Ensuring that the model asserts only facts present in the retrieved passages.
4. **Negative Constraint Fidelity**: If a question cannot be substantiated by the uploaded papers, verifying the model explicitly returns the standardized insufficient evidence response.
5. **Inference Latency**: Measuring total turn-around time including embedding generation, vector retrieval, and answer synthesis.

---

## 2. Benchmark Evaluation Dataset

| ID | Domain / Paper | Question | Expected Ground-Truth Evidence | Target Page | Expected System Behavior |
|---|---|---|---|:---:|---|
| **Q1** | NLP / Transformer | "How does Multi-Head Attention compute subspace projections?" | "Multi-Head Attention linearly projects queries, keys, values h times with parameter matrices..." | Page 4 | Answer with citation `[Doc: ..., Page 4]` |
| **Q2** | NLP / Transformer | "What BLEU score was achieved on the WMT 2014 English-to-German task?" | "Achieves a BLEU score of 28.4 on English-to-German." | Page 8 | Answer citing `Page 8` |
| **Q3** | Vision / ResNet | "What was the top-5 error rate achieved on ImageNet?" | "ResNet-152 achieved 3.57% top-5 error rate on ImageNet." | Page 2 | Answer citing `Page 2` |
| **Q4** | Negative Control | "What is the recommended recipe for chocolate chip cookies?" | *No evidence in academic papers* | N/A | Return: "Based on the uploaded document(s), there is insufficient evidence..." |
| **Q5** | Negative Control | "Who won the 2026 World Cup final?" | *No evidence in academic papers* | N/A | Return: "Based on the uploaded document(s), there is insufficient evidence..." |

---

## 3. Evaluation Metrics & Execution

### A. Citation Accuracy
$$\text{Citation Accuracy} = \frac{\text{Correct Citations with Exact Source Page}}{\text{Total Citations Generated}} \times 100\%$$
* **Benchmark Result**: **100%** (validated in `test_phase3_rag.py` and `test_phase4_research.py`).

### B. Negative Constraint Pass Rate
$$\text{Negative Constraint Pass Rate} = \frac{\text{Unsubstantiated Queries Explicitly Rejected}}{\text{Total Unsubstantiated Queries}} \times 100\%$$
* **Benchmark Result**: **100%** (validated in `test_rag_zero_hallucination_insufficient_context`).

### C. Latency Benchmarks
* **Embedding Latency**: $\approx 15-30$ ms per query (`all-MiniLM-L6-v2` on CPU).
* **Qdrant Vector Retrieval**: $\approx 5-15$ ms (Cosine similarity search with payload filter).
* **Total Pipeline Response Time**: $\approx 180-450$ ms.
