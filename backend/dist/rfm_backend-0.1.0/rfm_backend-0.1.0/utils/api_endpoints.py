import os

API_BASE = os.getenv("WBOX_API_BASE", "https://cloudapi.wbbox.in/api/v1.0")


def create_template_url(channel: str) -> str:
    return f"{API_BASE}/create-templates/{channel}"


def sync_templates_url(channel: str) -> str:
    return f"{API_BASE}/sync-templates/{channel}"


def sync_template_name_url(template_name: str) -> str:
    return f"{API_BASE}/sync-templates/{template_name}"


def templates_url() -> str:
    return f"{API_BASE}/templates"


def send_template_message_url(channel: str) -> str:
    return f"{API_BASE}/messages/send-template/{channel}"


def uploads_url(channel: str) -> str:
    return f"{API_BASE}/uploads/{channel}"