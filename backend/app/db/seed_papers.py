import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import uuid
import pymupdf as fitz
from app.db.session import SessionLocal
from app.models.user import User
from app.models.document import Document, DocumentStatus
from app.models.chat import ChatSession, Message
from app.models.citation import Citation, Summary
from app.core.config import settings
from app.services.pdf_service import pdf_service
from app.rag.chunker import chunker
from app.rag.embedder import embedding_engine
from app.services.qdrant_service import qdrant_service
from app.rag.engine import rag_engine


def create_attention_pdf() -> bytes:
    doc = fitz.open()

    # Page 1: Abstract & Introduction
    p1 = doc.new_page()
    p1.insert_text(
        (50, 72),
        "Attention Is All You Need\n"
        "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, Illia Polosukhin\n"
        "Google Brain, Google Research, University of Toronto\n\n"
        "Abstract\n"
        "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output. The Transformer allows for significantly more parallelization and can reach a new state of the art in translation quality after being trained for as little as twelve hours on eight P100 GPUs.\n\n"
        "1. Introduction\n"
        "Recurrent neural networks, particularly long short-term memory (LSTM) and gated recurrent (GRU) neural networks, have been firmly established as state of the art approaches in sequence modeling. Recurrent models inherently factor computation along the symbol positions of the input and output sequences, precluding parallelization within training examples."
    )

    # Page 2: Background & Limitations of RNNs
    p2 = doc.new_page()
    p2.insert_text(
        (50, 72),
        "2. Background and Motivation\n\n"
        "The goal of reducing sequential computation also forms the foundation of the Extended Neural GPU, ByteNet and ConvS2S, all of which use convolutional neural networks as basic building blocks. In these models, the number of operations required to relate signals from two arbitrary input or output positions grows in the distance between positions, linearly for ConvS2S and logarithmically for ByteNet. This makes it more difficult to learn dependencies between distant positions.\n\n"
        "In the Transformer this is reduced to a constant number of operations, albeit at the cost of reduced effective resolution due to averaging attention-weighted positions, an effect we counteract with Multi-Head Attention as described in Section 3.2. Self-attention, sometimes called intra-attention, is an attention mechanism relating different positions of a single sequence in order to compute a representation of the sequence."
    )

    # Page 3: Model Architecture
    p3 = doc.new_page()
    p3.insert_text(
        (50, 72),
        "3. Model Architecture\n\n"
        "Most competitive neural sequence transduction models have an encoder-decoder structure. Here, the encoder maps an input sequence of symbol representations (x1, ..., xn) to a sequence of continuous representations z = (z1, ..., zn). Given z, the decoder then generates an output sequence (y1, ..., ym) of symbols one element at a time.\n\n"
        "3.1 Encoder and Decoder Stacks\n"
        "Encoder: The encoder is composed of a stack of N = 6 identical layers. Each layer has two sub-layers. The first is a multi-head self-attention mechanism, and the second is a simple, position-wise fully connected feed-forward network. We employ a residual connection around each of the two sub-layers, followed by layer normalization. That is, the output of each sub-layer is LayerNorm(x + Sublayer(x)), where Sublayer(x) is the function implemented by the sub-layer itself.\n\n"
        "Decoder: The decoder is also composed of a stack of N = 6 identical layers. In addition to the two sub-layers in each encoder layer, the decoder inserts a third sub-layer, which performs multi-head attention over the output of the encoder stack."
    )

    # Page 4: Scaled Dot-Product & Multi-Head Attention
    p4 = doc.new_page()
    p4.insert_text(
        (50, 72),
        "3.2 Attention Mechanisms\n\n"
        "An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors. The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key.\n\n"
        "3.2.1 Scaled Dot-Product Attention\n"
        "We call our particular attention Scaled Dot-Product Attention. The input consists of queries and keys of dimension dk, and values of dimension dv. We compute the dot products of the query with all keys, divide each by sqrt(dk), and apply a softmax function to obtain the weights on the values:\n"
        "Attention(Q, K, V) = softmax((Q * K^T) / sqrt(dk)) * V\n\n"
        "3.2.2 Multi-Head Attention\n"
        "Instead of performing a single attention function with dmodel-dimensional queries, keys and values, we found it beneficial to linearly project the queries, keys and values h times with different, learned linear projections to dk, dk and dv dimensions, respectively. On each of these projected versions of queries, keys and values we then perform the attention function in parallel, yielding dv-dimensional output values. These are concatenated and once again projected, resulting in the final values.\n"
        "Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions. In this work we employ h = 8 parallel attention layers, or heads. For each of these we use dk = dv = dmodel / h = 64."
    )

    # Page 5: Applications & Positional Encoding
    p5 = doc.new_page()
    p5.insert_text(
        (50, 72),
        "3.3 Positional Encoding\n\n"
        "Since our model contains no recurrence and no convolution, in order for the model to make use of the order of the sequence, we must inject some information about the relative or absolute position of the tokens in the sequence. To this end, we add positional encodings to the input embeddings at the bottoms of the encoder and decoder stacks. The positional encodings have the same dimension dmodel as the embeddings, so that the two can be summed.\n\n"
        "In this work, we use sine and cosine functions of different frequencies:\n"
        "PE(pos, 2i) = sin(pos / 10000^(2i/dmodel))\n"
        "PE(pos, 2i+1) = cos(pos / 10000^(2i/dmodel))\n"
        "where pos is the position and i is the dimension."
    )

    # Page 6: Training and Empirical Results
    p6 = doc.new_page()
    p6.insert_text(
        (50, 72),
        "5. Training and Results\n\n"
        "5.1 Training Data and Batching\n"
        "We trained on the standard WMT 2014 English-German dataset consisting of about 4.5 million sentence pairs. Sentences were encoded using byte-pair encoding, which has a shared source-target vocabulary of about 37000 tokens. For English-French, we used the significantly larger WMT 2014 English-French dataset consisting of 36 million sentence pairs.\n\n"
        "5.2 Hardware and Schedule\n"
        "We trained our models on one machine with 8 NVIDIA P100 GPUs. For our base models using the hyperparameters described throughout the paper, each training step took about 0.4 seconds. We trained the base models for a total of 100,000 steps or 12 hours. For our big models, step time was 1.0 seconds. The big models were trained for 300,000 steps (3.5 days).\n\n"
        "5.3 Machine Translation Results\n"
        "On the WMT 2014 English-to-German translation task, the big transformer model achieves a state-of-the-art BLEU score of 28.4, outperforming the existing best models by more than 2.0 BLEU. On the English-to-French translation task, our big model achieves a BLEU score of 41.8, outperforming all previously published single models at 1/4 the training cost of previous models."
    )

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def seed_demo_papers():
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == "researcher@papermind.ai").first()
        if not user:
            print("Researcher user not found. Skipping paper seed.")
            return

        # Check if Attention paper already seeded
        existing_doc = db.query(Document).filter(
            Document.user_id == user.id,
            Document.title.ilike("%Attention Is All You Need%")
        ).first()

        if existing_doc:
            print(f"Paper '{existing_doc.title}' already seeded.")
            return

        print("Seeding 'Attention Is All You Need' research paper for demo researcher...")
        pdf_bytes = create_attention_pdf()
        doc_id = str(uuid.uuid4())
        safe_filename = f"{doc_id}_attention_is_all_you_need.pdf"
        file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

        with open(file_path, "wb") as f:
            f.write(pdf_bytes)

        # Extract text page-by-page
        pages_data = pdf_service.extract_text_by_page(pdf_bytes)
        title = "Attention Is All You Need (Vaswani et al.)"

        # Chunk document
        chunks = chunker.chunk_document(document_id=doc_id, pages_data=pages_data)

        # Generate embeddings
        chunk_texts = [c["text"] for c in chunks]
        embeddings = embedding_engine.embed_texts(chunk_texts)

        # Upsert into Qdrant
        qdrant_service.upsert_chunks(
            document_id=doc_id,
            user_id=user.id,
            title=title,
            chunks=chunks,
            embeddings=embeddings
        )

        # Save document
        new_doc = Document(
            id=doc_id,
            user_id=user.id,
            title=title,
            filename="attention_is_all_you_need.pdf",
            file_path=file_path,
            file_size=len(pdf_bytes),
            file_hash=pdf_service.compute_sha256(pdf_bytes),
            page_count=len(pages_data),
            chunk_count=len(chunks),
            status=DocumentStatus.INDEXED.value,
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
        print(f"Seeded '{title}' ({new_doc.page_count} pages, {new_doc.chunk_count} chunks).")

        # Create an initial demo research conversation
        session = ChatSession(
            user_id=user.id,
            document_id=new_doc.id,
            title="Multi-Head Attention & WMT Benchmarks",
            is_multi_doc=False
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        # Answer question using RAG engine
        question = "How does Multi-Head Attention work, and what BLEU score did the big Transformer achieve on English-to-German?"
        rag_res = rag_engine.answer_question(
            question=question,
            user_id=user.id,
            document_ids=[new_doc.id],
            limit=5
        )

        # User message
        u_msg = Message(session_id=session.id, sender="user", content=question)
        db.add(u_msg)
        db.commit()

        # Assistant message
        a_msg = Message(
            session_id=session.id,
            sender="assistant",
            content=rag_res["answer"],
            response_time_ms=rag_res["response_time_ms"]
        )
        db.add(a_msg)
        db.commit()
        db.refresh(a_msg)

        # Citations
        for c in rag_res["citations"]:
            cit = Citation(
                message_id=a_msg.id,
                document_id=c["document_id"],
                page_number=c["page_number"],
                chunk_id=c["chunk_id"],
                snippet=c["snippet"],
                similarity_score=c["similarity_score"]
            )
            db.add(cit)

        db.commit()
        print("Seeded demo research dialogue and verifiable page citations.")


if __name__ == "__main__":
    seed_demo_papers()
