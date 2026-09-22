import re
import logging
from typing import Optional
from langchain_core.messages import SystemMessage, HumanMessage

logger = logging.getLogger(__name__)


def generate_smart_fallback_title(message: str, document_name: Optional[str] = None) -> str:
    """Fast, deterministic ChatGPT-style title generator fallback."""
    clean_msg = message.strip()
    if not clean_msg:
        return "New Chat"

    # 1. Check if document summary request
    is_summary_req = any(w in clean_msg.lower() for w in ["summarize", "summary", "overview of doc", "read doc", "pdf", "document"])
    if is_summary_req:
        if document_name:
            # Clean filename: "Annual_Report_2025.pdf" -> "Annual Report 2025 Summary"
            base_name = re.sub(r'\.[a-zA-Z0-9]+$', '', document_name)
            base_name = re.sub(r'[_\-]+', ' ', base_name).strip()
            if len(base_name) > 24:
                base_name = base_name[:22].strip() + "..."
            return f"{base_name.title()} Summary"
        else:
            return "Document Summary"

    # 2. General Query Title Generation
    # Strip common conversational prefixes
    prefixes = [
        r"^(can you|please|could you|would you|i want to|i need to|help me|tell me|explain to me|explain|what is|what are|how do i|how to|who is|where is|why does|fix|fix it)\b",
    ]
    processed = clean_msg
    for pat in prefixes:
        processed = re.sub(pat, "", processed, flags=re.IGNORECASE).strip()

    # Strip question marks, periods, quotes
    processed = re.sub(r'[\?\.\!\"\'\`]', "", processed).strip()

    # If stripped message is too short or empty, revert to clean original
    if len(processed) < 3:
        processed = re.sub(r'[\?\.\!\"\'\`]', "", clean_msg).strip()

    # Capitalize words
    words = [w.capitalize() for w in processed.split()]

    # Limit to 5 words max
    if len(words) > 5:
        words = words[:5]

    candidate = " ".join(words)
    if len(candidate) > 35:
        candidate = candidate[:32].strip() + "..."

    return candidate if candidate else "New Chat"


async def generate_chatgpt_title(
    message: str,
    document_name: Optional[str] = None,
    assistant_response: Optional[str] = None,
) -> str:
    """Generate a clean 2-5 word ChatGPT-style conversation title using LLM with smart fallback."""
    if not message or not message.strip():
        return "New Chat"

    try:
        from app.ai.core.llm import get_llm
        llm = get_llm(provider="groq")

        system_prompt = (
            "You are an AI chat title generator like ChatGPT.\n"
            "Given the user's input (and optional document name or assistant response), generate a short, concise, topic-focused 2 to 5 word title for the chat sidebar.\n\n"
            "CRITICAL RULES:\n"
            "1. Output ONLY the plain text title (max 35 characters, 2-5 words).\n"
            "2. Capitalize the main words (Title Case).\n"
            "3. Do NOT use quotation marks, markdown, backticks, or trailing punctuation.\n"
            "4. Do NOT include phrases like 'Chat About', 'Summary of', 'User Question', 'Title:', 'Help with'.\n"
            "5. If a document name is provided, incorporate the document topic (e.g. 'Project Proposal Summary').\n"
            "6. Make titles distinct and informative."
        )

        user_content = f"User message: \"{message.strip()}\""
        if document_name:
            user_content += f"\nActive document name: \"{document_name}\""
        if assistant_response:
            snippet = assistant_response.strip()[:150]
            user_content += f"\nAssistant first response preview: \"{snippet}\""

        response = await llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_content),
        ])

        raw_title = str(response.content).strip()
        cleaned = re.sub(r'[\"\'\`\n\r]', '', raw_title)
        cleaned = re.sub(r'\.$', '', cleaned).strip()

        if cleaned.lower().startswith("title:"):
            cleaned = cleaned[6:].strip()

        if cleaned and len(cleaned) <= 45:
            return cleaned

    except Exception as e:
        logger.warning("LLM title generation failed: %s. Using fallback title generator.", e)

    return generate_smart_fallback_title(message, document_name)
