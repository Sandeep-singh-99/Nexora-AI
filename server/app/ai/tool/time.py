from datetime import datetime, timezone as dt_timezone, timedelta
from typing import Any
from zoneinfo import ZoneInfo, available_timezones, ZoneInfoNotFoundError

from pydantic import BaseModel, Field
from langchain.tools import tool

COMMON_TIMEZONE_ALIASES = {
    # India / New Delhi
    "asia/new_delhi": "Asia/Kolkata",
    "asia/delhi": "Asia/Kolkata",
    "asia_new_delhi": "Asia/Kolkata",
    "asia_delhi": "Asia/Kolkata",
    "asia new delhi": "Asia/Kolkata",
    "asia delhi": "Asia/Kolkata",
    "new delhi": "Asia/Kolkata",
    "delhi": "Asia/Kolkata",
    "india": "Asia/Kolkata",
    "calcutta": "Asia/Kolkata",
    "asia/calcutta": "Asia/Kolkata",
    "ist": "Asia/Kolkata",

    # UK / London
    "london": "Europe/London",
    "uk": "Europe/London",
    "england": "Europe/London",
    "great britain": "Europe/London",
    "gmt": "Europe/London",
    "bst": "Europe/London",

    # US / New York
    "america/newyork": "America/New_York",
    "america_new_york": "America/New_York",
    "new york": "America/New_York",
    "nyc": "America/New_York",
    "ny": "America/New_York",
    "est": "America/New_York",
    "edt": "America/New_York",

    # US / Los Angeles
    "america/losangeles": "America/Los_Angeles",
    "america_los_angeles": "America/Los_Angeles",
    "los angeles": "America/Los_Angeles",
    "la": "America/Los_Angeles",
    "pst": "America/Los_Angeles",
    "pdt": "America/Los_Angeles",

    # Japan / Tokyo
    "tokyo": "Asia/Tokyo",
    "japan": "Asia/Tokyo",
    "jst": "Asia/Tokyo",

    # UAE / Dubai
    "dubai": "Asia/Dubai",
    "uae": "Asia/Dubai",

    # Singapore
    "singapore": "Asia/Singapore",

    # France / Paris
    "paris": "Europe/Paris",
    "france": "Europe/Paris",

    # Germany / Berlin
    "berlin": "Europe/Berlin",
    "germany": "Europe/Berlin",

    # Australia / Sydney
    "sydney": "Australia/Sydney",
    "australia": "Australia/Sydney",

    # China / Beijing / Shanghai
    "china": "Asia/Shanghai",
    "beijing": "Asia/Shanghai",
    "shanghai": "Asia/Shanghai",
}

# Fallback UTC offsets (minutes, abbreviation) for systems without tzdata package (e.g. Windows)
UTC_OFFSET_FALLBACKS = {
    "Asia/Kolkata": (330, "IST"),          # UTC +5:30
    "Asia/Tokyo": (540, "JST"),            # UTC +9:00
    "Asia/Dubai": (240, "GST"),            # UTC +4:00
    "Asia/Singapore": (480, "SGT"),        # UTC +8:00
    "Asia/Shanghai": (480, "CST"),         # UTC +8:00
    "Asia/Hong_Kong": (480, "HKT"),        # UTC +8:00
    "Asia/Seoul": (540, "KST"),            # UTC +9:00
    "Europe/London": (0, "GMT"),           # UTC +0:00
    "Europe/Paris": (60, "CET"),           # UTC +1:00
    "Europe/Berlin": (60, "CET"),          # UTC +1:00
    "America/New_York": (-300, "EST"),     # UTC -5:00
    "America/Los_Angeles": (-480, "PST"),  # UTC -8:00
    "America/Chicago": (-360, "CST"),      # UTC -6:00
    "Australia/Sydney": (600, "AEST"),     # UTC +10:00
}


def resolve_timezone(timezone_input: Any) -> str | None:
    """Resolves timezone input string or dict (including cities, aliases, and misnomers) to a valid IANA timezone."""
    if not timezone_input:
        return None

    if isinstance(timezone_input, dict):
        timezone_str = (
            timezone_input.get("timezone")
            or timezone_input.get("location")
            or timezone_input.get("city")
            or str(timezone_input)
        )
    else:
        timezone_str = str(timezone_input)

    cleaned = timezone_str.strip().strip("'\"").lower()

    # 1. Direct alias check
    if cleaned in COMMON_TIMEZONE_ALIASES:
        return COMMON_TIMEZONE_ALIASES[cleaned]

    # Normalize space to underscore or slash
    with_slash = cleaned.replace(" ", "/")
    with_underscore = cleaned.replace(" ", "_")

    if with_slash in COMMON_TIMEZONE_ALIASES:
        return COMMON_TIMEZONE_ALIASES[with_slash]
    if with_underscore in COMMON_TIMEZONE_ALIASES:
        return COMMON_TIMEZONE_ALIASES[with_underscore]

    # 2. Case-insensitive lookup in available_timezones
    avail_map = {tz.lower(): tz for tz in available_timezones()}

    if cleaned in avail_map:
        return avail_map[cleaned]
    if with_slash in avail_map:
        return avail_map[with_slash]
    if with_underscore in avail_map:
        return avail_map[with_underscore]

    # 3. Match suffix (e.g. "Kolkata" -> "Asia/Kolkata")
    for tz_lower, canonical in avail_map.items():
        if tz_lower.endswith("/" + cleaned) or tz_lower.endswith("/" + with_underscore):
            return canonical

    # 4. If available_timezones() was empty (Windows without tzdata), return normalized title case
    if not avail_map and "/" in with_slash:
        parts = with_slash.split("/")
        return "/".join(p.capitalize() for p in parts)

    return None


class GetCurrentTimeInput(BaseModel):
    timezone: str = Field(
        default="Asia/Kolkata",
        description="The location, city name (e.g., 'New Delhi', 'London', 'Tokyo', 'New York'), or IANA timezone (e.g., 'Asia/Kolkata') to retrieve current date and time for."
    )


@tool(args_schema=GetCurrentTimeInput)
def get_current_time(timezone: str = "Asia/Kolkata", *args: Any, **kwargs: Any) -> str:
    """
    Get the current date and time for any location, city, or IANA timezone.

    Use this tool whenever a user asks for the current time, local time, or date in any city or location.

    Examples of timezone input:
    - New Delhi or Asia/Kolkata (for New Delhi, India)
    - London or Europe/London (for London, UK)
    - New York or America/New_York (for New York, USA)
    - Tokyo or Asia/Tokyo (for Tokyo, Japan)
    """
    target_tz = timezone
    if isinstance(kwargs, dict) and kwargs:
        target_tz = (
            kwargs.get("timezone")
            or kwargs.get("location")
            or kwargs.get("city")
            or target_tz
        )
    if args and not target_tz:
        target_tz = args[0]

    resolved_tz = resolve_timezone(target_tz)

    if not resolved_tz:
        return (
            f"Invalid or unrecognized timezone/location: '{target_tz}'. "
            "Please provide a valid timezone (e.g., Asia/Kolkata, America/New_York, Europe/London, Asia/Tokyo) "
            "or a major city name."
        )

    # First attempt using ZoneInfo
    try:
        now = datetime.now(ZoneInfo(resolved_tz))
        return now.strftime("%A, %B %d, %Y at %I:%M:%S %p %Z")
    except (ZoneInfoNotFoundError, Exception):
        # Fallback for systems (like Windows) where Python's tzdata package might not be installed
        if resolved_tz in UTC_OFFSET_FALLBACKS:
            offset_minutes, abbrev = UTC_OFFSET_FALLBACKS[resolved_tz]
            fallback_tz = dt_timezone(timedelta(minutes=offset_minutes), name=abbrev)
            now = datetime.now(fallback_tz)
            return now.strftime("%A, %B %d, %Y at %I:%M:%S %p %Z")
        else:
            # Generic UTC fallback
            now_utc = datetime.now(dt_timezone.utc)
            return f"{now_utc.strftime('%A, %B %d, %Y at %I:%M:%S %p')} UTC (Location requested: {resolved_tz})"
