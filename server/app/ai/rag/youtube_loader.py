import re
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
import httpx
from youtube_transcript_api import YouTubeTranscriptApi

logger = logging.getLogger(__name__)


@dataclass
class YouTubeTranscriptSnippet:
    """Individual timestamped caption/transcript line."""
    text: str
    start: float
    duration: float
    timestamp: str


@dataclass
class YouTubeChunkItem:
    """Chunk of grouped transcript snippets ready for embedding into pgvector."""
    content: str
    chunk_index: int
    start_time: float
    end_time: float
    timestamp_formatted: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class YouTubeVideoData:
    """Complete processed YouTube video data with metadata, snippets, and RAG chunks."""
    video_id: str
    url: str
    title: str
    author_name: str
    thumbnail_url: str
    snippets: List[YouTubeTranscriptSnippet]
    chunks: List[YouTubeChunkItem]
    full_text: str


def extract_youtube_video_id(url_or_id: str) -> Optional[str]:
    """
    Extracts 11-character YouTube video ID from various YouTube URL formats or raw ID.
    Examples supported:
    - https://www.youtube.com/watch?v=dQw4w9WgXcQ
    - https://youtu.be/dQw4w9WgXcQ
    - https://www.youtube.com/shorts/dQw4w9WgXcQ
    - https://www.youtube.com/embed/dQw4w9WgXcQ
    - https://www.youtube.com/watch?feature=shared&v=dQw4w9WgXcQ
    - dQw4w9WgXcQ
    """
    if not url_or_id:
        return None

    clean = url_or_id.strip()

    # Raw 11-char ID
    if len(clean) == 11 and re.match(r'^[0-9A-Za-z_-]{11}$', clean):
        return clean

    patterns = [
        r'(?:v=|\/vi=|\/v\/|youtu\.be\/|embed\/|shorts\/)([0-9A-Za-z_-]{11})',
        r'[\?&]v=([0-9A-Za-z_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, clean)
        if match:
            return match.group(1)

    return None


def format_timestamp(seconds: float) -> str:
    """Formats seconds into MM:SS or HH:MM:SS string."""
    total_sec = max(0, int(seconds))
    hrs = total_sec // 3600
    mins = (total_sec % 3600) // 60
    secs = total_sec % 60
    if hrs > 0:
        return f"{hrs:02d}:{mins:02d}:{secs:02d}"
    return f"{mins:02d}:{secs:02d}"


async def fetch_youtube_video_data(url_or_id: str) -> YouTubeVideoData:
    """
    Fetches YouTube video metadata via public oEmbed API and transcript via youtube_transcript_api.
    Groups transcript snippets into RAG chunks with timestamp metadata.
    """
    video_id = extract_youtube_video_id(url_or_id)
    if not video_id:
        raise ValueError(
            f"Invalid YouTube URL or Video ID: '{url_or_id}'. "
            "Please provide a valid YouTube video link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)."
        )

    canonical_url = f"https://www.youtube.com/watch?v={video_id}"

    # 1. Fetch metadata via YouTube oEmbed
    title = f"YouTube Video ({video_id})"
    author_name = "YouTube"
    thumbnail_url = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            oembed_url = f"https://www.youtube.com/oembed?url={canonical_url}&format=json"
            resp = await client.get(oembed_url)
            if resp.status_code == 200:
                data = resp.json()
                title = data.get("title", title)
                author_name = data.get("author_name", author_name)
                thumbnail_url = data.get("thumbnail_url", thumbnail_url)
    except Exception as meta_err:
        logger.warning(f"Could not retrieve oEmbed metadata for {video_id}: {meta_err}")

    # 2. Fetch transcript via youtube_transcript_api
    raw_snippets = []
    yt_api = YouTubeTranscriptApi()

    try:
        # Direct fetch handles video default transcript (supports dataclass FetchedTranscriptSnippet)
        raw_snippets = yt_api.fetch(video_id)
    except Exception as fetch_err:
        logger.info(f"Direct fetch failed for {video_id}, trying transcript list: {fetch_err}")
        try:
            transcript_list = yt_api.list(video_id)
            # Try preferred languages
            try:
                transcript = transcript_list.find_transcript(['en', 'en-US', 'en-GB', 'hi', 'es', 'fr', 'de'])
                raw_snippets = transcript.fetch()
            except Exception:
                # Take first available language (manual or generated)
                for t in transcript_list:
                    raw_snippets = t.fetch()
                    break
        except Exception as list_err:
            logger.error(f"Failed to fetch transcript for video {video_id}: {list_err}")
            raise ValueError(
                f"Could not retrieve transcript for YouTube video '{title}'. "
                "The video might not have captions enabled or may be private/age-restricted."
            )

    if not raw_snippets:
        raise ValueError(f"YouTube video '{title}' has no readable transcript captions.")

    # 3. Convert raw snippets to structured YouTubeTranscriptSnippet
    snippets: List[YouTubeTranscriptSnippet] = []
    text_lines = []

    for item in raw_snippets:
        text = getattr(item, "text", item.get("text") if isinstance(item, dict) else "").strip()
        start = float(getattr(item, "start", item.get("start", 0.0) if isinstance(item, dict) else 0.0))
        duration = float(getattr(item, "duration", item.get("duration", 0.0) if isinstance(item, dict) else 0.0))

        if text:
            # Clean newlines inside a single snippet
            clean_text = " ".join(text.split())
            ts_str = format_timestamp(start)
            snippets.append(
                YouTubeTranscriptSnippet(
                    text=clean_text,
                    start=round(start, 2),
                    duration=round(duration, 2),
                    timestamp=ts_str,
                )
            )
            text_lines.append(f"[{ts_str}] {clean_text}")

    full_text = "\n".join(text_lines)

    # 4. Group snippets into RAG chunks (~400 to 700 chars or ~45-60s per chunk)
    chunks: List[YouTubeChunkItem] = []
    current_group: List[YouTubeTranscriptSnippet] = []
    current_char_count = 0
    chunk_index = 0

    TARGET_CHUNK_CHARS = 550

    for snippet in snippets:
        current_group.append(snippet)
        current_char_count += len(snippet.text) + 1

        # When group exceeds target size or time threshold
        if current_char_count >= TARGET_CHUNK_CHARS:
            start_time = current_group[0].start
            end_time = current_group[-1].start + current_group[-1].duration
            ts_badge = format_timestamp(start_time)

            content_lines = [f"[{s.timestamp}] {s.text}" for s in current_group]
            content = (
                f"YouTube Video: {title}\n"
                f"Channel: {author_name}\n"
                f"Time: {ts_badge} to {format_timestamp(end_time)}\n\n"
                + " ".join(content_lines)
            )

            chunks.append(
                YouTubeChunkItem(
                    content=content,
                    chunk_index=chunk_index,
                    start_time=round(start_time, 2),
                    end_time=round(end_time, 2),
                    timestamp_formatted=ts_badge,
                    metadata={
                        "video_id": video_id,
                        "start_time": round(start_time, 2),
                        "end_time": round(end_time, 2),
                        "timestamp_formatted": ts_badge,
                        "url": f"{canonical_url}&t={int(start_time)}s",
                        "title": title,
                        "author_name": author_name,
                        "thumbnail_url": thumbnail_url,
                        "file_type": "youtube",
                        "filename": f"YouTube: {title}",
                    },
                )
            )
            chunk_index += 1
            current_group = []
            current_char_count = 0

    # Remaining group
    if current_group:
        start_time = current_group[0].start
        end_time = current_group[-1].start + current_group[-1].duration
        ts_badge = format_timestamp(start_time)

        content_lines = [f"[{s.timestamp}] {s.text}" for s in current_group]
        content = (
            f"YouTube Video: {title}\n"
            f"Channel: {author_name}\n"
            f"Time: {ts_badge} to {format_timestamp(end_time)}\n\n"
            + " ".join(content_lines)
        )

        chunks.append(
            YouTubeChunkItem(
                content=content,
                chunk_index=chunk_index,
                start_time=round(start_time, 2),
                end_time=round(end_time, 2),
                timestamp_formatted=ts_badge,
                metadata={
                    "video_id": video_id,
                    "start_time": round(start_time, 2),
                    "end_time": round(end_time, 2),
                    "timestamp_formatted": ts_badge,
                    "url": f"{canonical_url}&t={int(start_time)}s",
                    "title": title,
                    "author_name": author_name,
                    "thumbnail_url": thumbnail_url,
                    "file_type": "youtube",
                    "filename": f"YouTube: {title}",
                },
            )
        )

    return YouTubeVideoData(
        video_id=video_id,
        url=canonical_url,
        title=title,
        author_name=author_name,
        thumbnail_url=thumbnail_url,
        snippets=snippets,
        chunks=chunks,
        full_text=full_text,
    )
