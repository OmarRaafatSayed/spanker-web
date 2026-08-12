# FastAPI CRM - Design System Integration Guide

This guide explains how to integrate the Spanker luxury design system into your FastAPI CRM dashboard.

## Quick Start

### Step 1: Fetch Design Tokens

Add this to your FastAPI startup sequence:

```python
# fastapi_crm/core/config.py

import os
import requests
from functools import lru_cache
from typing import Dict, Any

PORTAL_URL = os.getenv("PORTAL_URL", "http://localhost:3000")
DESIGN_TOKENS_URL = f"{PORTAL_URL}/api/design-tokens"

@lru_cache(maxsize=1)
def get_design_tokens() -> Dict[str, Any]:
    """Fetch design tokens from portal once at startup."""
    try:
        response = requests.get(DESIGN_TOKENS_URL, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"⚠️ Failed to fetch design tokens: {e}")
        # Return fallback tokens (optional)
        return {
            "colors": {
                "brand": {
                    "green": "#1b4332",
                    "greenDark": "#081c15",
                    "greenLight": "#2d6a4f",
                },
                "accent": {
                    "yellow": "#d4af37",
                    "yellowDark": "#b8941f",
                    "yellowLight": "#f4d03f",
                },
            }
        }

@lru_cache(maxsize=1)
def get_css_variables() -> str:
    """Fetch CSS variables from portal."""
    try:
        response = requests.get(f"{DESIGN_TOKENS_URL}?format=css", timeout=5)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"⚠️ Failed to fetch CSS variables: {e}")
        return ""

# Make it available globally
DESIGN_TOKENS = get_design_tokens()
CSS_VARIABLES = get_css_variables()

class Settings:
    DESIGN_TOKENS = DESIGN_TOKENS
    CSS_VARIABLES = CSS_VARIABLES
```

### Step 2: Serve CSS Variables as Endpoint

```python
# fastapi_crm/main.py

from fastapi import FastAPI
from fastapi.responses import FileResponse
from core.config import get_css_variables

app = FastAPI()

@app.get("/static/design-tokens.css")
async def get_design_tokens_css():
    """Serve design tokens as CSS variables."""
    css = get_css_variables()
    return FileResponse(
        io.BytesIO(css.encode()),
        media_type="text/css",
        filename="design-tokens.css"
    )
```

### Step 3: Link CSS in Jinja Template

```html
<!-- fastapi_crm/templates/base.html -->

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Travel Agency CRM</title>
    
    <!-- Spanker Design System -->
    <link rel="stylesheet" href="/static/design-tokens.css">
    
    <!-- Your own stylesheet -->
    <style>
        /* Override with local styles if needed */
        :root {
            --font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
    </style>
</head>
<body>
    {% block content %}{% endblock %}
</body>
</html>
```

### Step 4: Use Design Tokens in Templates

```html
<!-- fastapi_crm/templates/dashboard.html -->

{% extends "base.html" %}

{% block content %}
<div class="dashboard-container">
    <!-- Header with brand green -->
    <header style="background: var(--color-brand-green); color: white; padding: var(--spacing-8);">
        <h1>Travel Agency CRM</h1>
    </header>

    <!-- Glass card with visa applications -->
    <div class="visa-applications" style="
        background: var(--color-background-light);
        padding: var(--spacing-6);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        margin: var(--spacing-8);
    ">
        <h2 style="
            font-size: 1.875rem;
            color: var(--color-brand-green);
            margin-bottom: var(--spacing-4);
        ">
            Visa Applications
        </h2>

        <div class="applications-grid" style="
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: var(--spacing-6);
        ">
            {% for app in visa_applications %}
            <div class="application-card" style="
                background: var(--color-background-light);
                border: 1px solid var(--color-border-light);
                border-radius: var(--radius-lg);
                padding: var(--spacing-4);
                box-shadow: var(--shadow-md);
                transition: all 0.3s ease;
            " onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='var(--shadow-lg)';"
               onmouseout="this.style.transform='none'; this.style.boxShadow='var(--shadow-md)';">
                <h3 style="
                    font-size: 1.125rem;
                    color: var(--color-text-primary);
                    margin-bottom: var(--spacing-2);
                ">
                    {{ app.applicant_name }}
                </h3>
                <p style="
                    font-size: 0.875rem;
                    color: var(--color-text-secondary);
                    margin-bottom: var(--spacing-3);
                ">
                    Destination: {{ app.destination_country }}
                </p>
                
                <!-- Status badge -->
                {% if app.status == 'approved' %}
                    <span style="
                        background: var(--color-success);
                        color: white;
                        padding: var(--spacing-1) var(--spacing-3);
                        border-radius: var(--radius-full);
                        font-size: 0.75rem;
                        font-weight: 600;
                    ">✓ Approved</span>
                {% elif app.status == 'pending' %}
                    <span style="
                        background: var(--color-warning);
                        color: white;
                        padding: var(--spacing-1) var(--spacing-3);
                        border-radius: var(--radius-full);
                        font-size: 0.75rem;
                        font-weight: 600;
                    ">⏳ Pending</span>
                {% elif app.status == 'rejected' %}
                    <span style="
                        background: var(--color-destructive);
                        color: white;
                        padding: var(--spacing-1) var(--spacing-3);
                        border-radius: var(--radius-full);
                        font-size: 0.75rem;
                        font-weight: 600;
                    ">✕ Rejected</span>
                {% endif %}
            </div>
            {% endfor %}
        </div>
    </div>

    <!-- Glass panel with staff stats -->
    <div class="stats-panel" style="
        background: rgba(248, 246, 241, 0.7);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(216, 208, 195, 0.4);
        border-radius: var(--radius-lg);
        padding: var(--spacing-8);
        margin: var(--spacing-8);
        box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.07);
    ">
        <h2 style="
            font-size: 1.875rem;
            color: var(--color-brand-green);
            margin-bottom: var(--spacing-6);
        ">
            Statistics
        </h2>
        
        <div class="stats-grid" style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: var(--spacing-4);
        ">
            <div style="text-align: center; padding: var(--spacing-4);">
                <div style="
                    font-size: 2.25rem;
                    color: var(--color-brand-green);
                    font-weight: 700;
                ">
                    {{ total_applications }}
                </div>
                <p style="
                    font-size: 0.875rem;
                    color: var(--color-text-secondary);
                ">
                    Total Applications
                </p>
            </div>

            <div style="text-align: center; padding: var(--spacing-4);">
                <div style="
                    font-size: 2.25rem;
                    color: var(--color-accent-yellow);
                    font-weight: 700;
                ">
                    {{ pending_applications }}
                </div>
                <p style="
                    font-size: 0.875rem;
                    color: var(--color-text-secondary);
                ">
                    Pending
                </p>
            </div>

            <div style="text-align: center; padding: var(--spacing-4);">
                <div style="
                    font-size: 2.25rem;
                    color: var(--color-success);
                    font-weight: 700;
                ">
                    {{ approved_applications }}
                </div>
                <p style="
                    font-size: 0.875rem;
                    color: var(--color-text-secondary);
                ">
                    Approved
                </p>
            </div>
        </div>
    </div>

    <!-- Action button with brand green -->
    <div style="
        text-align: center;
        margin: var(--spacing-8) 0;
    ">
        <button style="
            background: var(--color-brand-green);
            color: white;
            padding: var(--spacing-3) var(--spacing-6);
            border: none;
            border-radius: var(--radius-md);
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            box-shadow: var(--shadow-md);
            transition: all 0.3s ease;
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-lg)';"
           onmouseout="this.style.transform='none'; this.style.boxShadow='var(--shadow-md)';">
            Create New Application
        </button>
    </div>
</div>

<!-- Optional: Link CSS file approach (alternative) -->
<link rel="stylesheet" href="/static/design-tokens.css">
{% endblock %}
```

### Step 5: Use Tokens in Python Components

```python
# fastapi_crm/services/visa_service.py

from core.config import DESIGN_TOKENS

def format_visa_card(application):
    """Format visa application with design tokens."""
    colors = DESIGN_TOKENS["colors"]
    
    return {
        "title": application.applicant_name,
        "destination": application.destination_country,
        "status": {
            "label": application.status.upper(),
            "backgroundColor": get_status_color(application.status, colors),
            "textColor": "#ffffff",
        },
        "styles": {
            "containerBackground": colors["background"]["light"],
            "textPrimary": colors["text"]["primary"],
            "textSecondary": colors["text"]["secondary"],
            "borderColor": colors["border"]["light"],
        }
    }

def get_status_color(status: str, colors: dict) -> str:
    """Get color for application status."""
    if status == "approved":
        return "#16a34a"  # Green
    elif status == "pending":
        return colors["accent"]["yellow"]
    elif status == "rejected":
        return "#dc2626"  # Red
    return colors["text"]["muted"]
```

### Step 6: Use in Flask/Jinja Globals (Optional)

```python
# fastapi_crm/main.py

from fastapi.templating import Jinja2Templates
from core.config import DESIGN_TOKENS

templates = Jinja2Templates(directory="templates")

# Make tokens available to all templates
templates.env.globals.update({
    "design_tokens": DESIGN_TOKENS,
    "brand_green": DESIGN_TOKENS["colors"]["brand"]["green"],
    "brand_yellow": DESIGN_TOKENS["colors"]["accent"]["yellow"],
    "spacing": DESIGN_TOKENS["spacing"],
    "radius": DESIGN_TOKENS["borderRadius"],
    "shadows": DESIGN_TOKENS["shadows"],
})
```

Then in Jinja:

```html
<!-- fastapi_crm/templates/component.html -->

<button style="
    background: {{ brand_green }};
    padding: {{ spacing['4'] }} {{ spacing['6'] }};
    border-radius: {{ radius['md'] }};
">
    Click Me
</button>
```

## CSS Variables Reference

All available CSS variables (mapped from design tokens):

```css
/* Colors */
--color-brand-green: #1b4332;
--color-brand-greenDark: #081c15;
--color-brand-greenLight: #2d6a4f;
--color-accent-yellow: #d4af37;
--color-background-light: #f8f6f1;
--color-text-primary: #0f172a;
--color-text-secondary: #475569;
--color-success: #16a34a;
--color-warning: #ea580c;
--color-destructive: #dc2626;

/* Spacing */
--spacing-1: 0.25rem;
--spacing-2: 0.5rem;
--spacing-3: 0.75rem;
--spacing-4: 1rem;
--spacing-6: 1.5rem;
--spacing-8: 2rem;
--spacing-12: 3rem;

/* Radius */
--radius-sm: 0.25rem;
--radius-md: 0.625rem;
--radius-lg: 0.75rem;
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

## Environment Setup

Add these variables to your `.env`:

```env
# Portal URL for fetching design tokens
PORTAL_URL=http://localhost:3000

# Cache design tokens at startup (recommended)
CACHE_DESIGN_TOKENS=true

# Refresh design tokens on demand (optional)
DESIGN_TOKENS_REFRESH_INTERVAL=3600  # seconds
```

## Caching Strategy

For production, implement smart caching:

```python
# fastapi_crm/core/cache.py

from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import requests

class DesignTokenCache:
    def __init__(self, ttl_seconds: int = 3600):
        self.ttl = timedelta(seconds=ttl_seconds)
        self._tokens: Optional[Dict[str, Any]] = None
        self._fetched_at: Optional[datetime] = None

    def get(self, force_refresh: bool = False) -> Dict[str, Any]:
        """Get tokens with automatic refresh."""
        if force_refresh or self._is_expired():
            self._fetch()
        return self._tokens or {}

    def _is_expired(self) -> bool:
        if not self._fetched_at:
            return True
        return datetime.utcnow() - self._fetched_at > self.ttl

    def _fetch(self):
        """Fetch tokens from portal."""
        try:
            response = requests.get(
                f"{PORTAL_URL}/api/design-tokens",
                timeout=5
            )
            response.raise_for_status()
            self._tokens = response.json()
            self._fetched_at = datetime.utcnow()
        except Exception as e:
            print(f"Failed to fetch tokens: {e}")

# Usage
token_cache = DesignTokenCache(ttl_seconds=3600)
tokens = token_cache.get()
```

## Troubleshooting

### CSS Variables Not Loading

```python
# Debug endpoint
@app.get("/debug/design-tokens")
async def debug_tokens():
    """Debug design tokens loading."""
    return {
        "tokens_loaded": bool(DESIGN_TOKENS),
        "css_available": bool(CSS_VARIABLES),
        "token_keys": list(DESIGN_TOKENS.keys()) if DESIGN_TOKENS else [],
    }
```

### Portal Connection Issues

Ensure the portal is running and accessible:

```bash
# Test connection
curl http://localhost:3000/api/design-tokens

# Or from FastAPI
python -c "import requests; print(requests.get('http://localhost:3000/api/design-tokens').json())"
```

## Performance Tips

1. **Cache tokens at startup** — Don't fetch on every request
2. **Use CSS variables** — Offload styling to browser (faster than inline styles)
3. **Minify CSS variables** — Reduce payload size
4. **Enable CORS caching** — Browser caches 1 hour automatically
5. **CDN edge-case** — If using CDN, cache tokens at edge locations

## Next Steps

- Build CRM dashboard components using design tokens
- Implement real-time updates for visa applications
- Add data sync webhooks (TASK 2)
- Create admin UI for staff management

---

**Questions?** Refer to `docs/DESIGN_SYSTEM.md` or check the live style guide at `/api/design-tokens?format=html`
