"""Client IP normalization for PostgreSQL INET columns.

Proxies, test clients, and unix sockets can yield hostnames or garbage;
asyncpg rejects non-IP values for INET columns, which would turn ordinary
requests into 500s. Normalize at request boundaries instead.
"""
from __future__ import annotations

import ipaddress


def normalize_ip_address(value: str | None) -> str | None:
    """Return a valid IPv4/IPv6 string, else None.

    Handles X-Forwarded-For style comma-separated lists by taking the
    leftmost entry.
    """
    if not value:
        return None
    candidate = value.split(",")[0].strip().strip("[]")
    if not candidate:
        return None
    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        return None
