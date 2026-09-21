import io
import pytest
from app.ai.rag.loaders import load_document, DocumentItem


def create_in_memory_pdf(text: str = "This is a sample document for testing.") -> bytes:
    """Creates a valid PDF in memory using pypdf without writing to disk."""
    import pypdf

    writer = pypdf.PdfWriter()
    # Add a blank page and add annotations or basic text
    writer.add_blank_page(width=200, height=200)
    
    # Write to memory buffer
    buffer = io.BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


def create_in_memory_docx(paragraphs: list[str]) -> bytes:
    """Creates a valid DOCX in memory using python-docx without writing to disk."""
    import docx

    doc = docx.Document()
    doc.add_heading("Test Document Heading", level=1)
    for p in paragraphs:
        doc.add_paragraph(p)

    # Add a simple table
    table = doc.add_table(rows=2, cols=2)
    table.cell(0, 0).text = "Header 1"
    table.cell(0, 1).text = "Header 2"
    table.cell(1, 0).text = "Value A"
    table.cell(1, 1).text = "Value B"

    buffer = io.BytesIO()
    doc.save(buffer)
    return buffer.getvalue()


def test_load_docx_in_memory():
    """Verify DOCX in-memory extraction for paragraphs, headings, and tables."""
    sample_text = [
        "Nexora AI provides advanced multi-agent orchestration.",
        "Agentic RAG evaluates context sufficiency before answering.",
    ]
    docx_bytes = create_in_memory_docx(sample_text)
    items = load_document("architecture_spec.docx", docx_bytes)

    assert len(items) > 0
    full_content = "\n".join(item.content for item in items)
    assert "Nexora AI provides advanced multi-agent orchestration." in full_content
    assert "Agentic RAG evaluates context sufficiency before answering." in full_content
    assert "Header 1 | Header 2" in full_content
    assert items[0].metadata["filename"] == "architecture_spec.docx"
    assert items[0].metadata["file_type"] == "docx"


def test_load_pdf_in_memory():
    """Verify PDF loader handles in-memory bytes and extracts metadata."""
    pdf_bytes = create_in_memory_pdf()
    items = load_document("sample_contract.pdf", pdf_bytes)

    assert len(items) == 1
    assert items[0].page_number == 1
    assert items[0].metadata["filename"] == "sample_contract.pdf"
    assert items[0].metadata["file_type"] == "pdf"


def test_unsupported_extension_error():
    """Verify loader rejects unsupported extensions with clear error."""
    with pytest.raises(ValueError) as exc_info:
        load_document("malicious.exe", b"binary content")
    assert "Unsupported document format" in str(exc_info.value)
