"""Static category -> suggested team lookup.

This is only a suggestion surfaced to the agent/admin; the Node backend's
routing engine makes the authoritative assignment (it may consider agent
load, skills, SLAs, etc. that this service has no visibility into).
"""

TEAM_MAPPING = {
    "Billing": "Billing Team",
    "Technical": "Tech Support",
    "Account": "Account Management",
    "General": "General Support",
}

DEFAULT_TEAM = "General Support"


def suggest_team(category: str) -> str:
    return TEAM_MAPPING.get(category, DEFAULT_TEAM)
