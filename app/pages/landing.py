"""Root landing page: minimalist grid and headline."""

# 6x6 grid: (col, row) positions for dots. Spacing and radius for SVG.
_GRID_SPACING = 28
_GRID_RADIUS = 5
# White dots (rest are black) for contrast—pattern only.
_WHITE_DOTS = {(1, 1), (3, 0), (2, 3), (4, 2), (5, 4), (0, 4), (3, 5), (1, 3)}


def _svg_grid() -> str:
    """SVG for 6x6 dot grid with connecting lines and alternating fill."""
    w = 5 * _GRID_SPACING + _GRID_RADIUS * 2
    h = w
    cx = _GRID_RADIUS
    cy = _GRID_RADIUS
    lines: list[str] = []
    # Lines (horizontal and vertical between adjacent dots)
    for i in range(6):
        for j in range(6):
            x = cx + i * _GRID_SPACING
            y = cy + j * _GRID_SPACING
            if i < 5:
                x2 = cx + (i + 1) * _GRID_SPACING
                lines.append(f'<line x1="{x}" y1="{y}" x2="{x2}" y2="{y}" />')
            if j < 5:
                y2 = cy + (j + 1) * _GRID_SPACING
                lines.append(f'<line x1="{x}" y1="{y}" x2="{x}" y2="{y2}" />')
    # Dots
    dots: list[str] = []
    for i in range(6):
        for j in range(6):
            x = cx + i * _GRID_SPACING
            y = cy + j * _GRID_SPACING
            fill = "#fff" if (i, j) in _WHITE_DOTS else "#1a1a1a"
            stroke = "#1a1a1a" if (i, j) in _WHITE_DOTS else "none"
            dots.append(
                f'<circle cx="{x}" cy="{y}" r="{_GRID_RADIUS}" '
                f'fill="{fill}" stroke="{stroke}" stroke-width="1" />'
            )
    inner = "\n      ".join(
        ['<g stroke="#2a2a2a" stroke-width="1.5">'] + lines + ["</g>"] + dots
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}" aria-hidden="true">\n      {inner}\n    </svg>'
    )


def render_landing_page(app_name: str) -> str:
    """Return HTML for the root landing page with grid and headline."""
    grid_svg = _svg_grid()
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{app_name}</title>
    <style>
        * {{ box-sizing: border-box; }}
        body {{
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            min-height: 100vh;
            background: #f0f0f0;
            color: #1a1a1a;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
        }}
        .landing {{
            text-align: center;
            max-width: 420px;
        }}
        .headline {{
            font-size: clamp(1.25rem, 4vw, 1.5rem);
            font-weight: 500;
            letter-spacing: -0.02em;
            line-height: 1.4;
            margin: 0 0 2rem 0;
            color: #2a2a2a;
        }}
        .grid-wrap {{
            filter: drop-shadow(0 8px 16px rgba(0,0,0,0.08));
            margin-bottom: 2.5rem;
        }}
        .links {{
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            justify-content: center;
        }}
        a {{
            color: #555;
            font-size: 0.875rem;
            text-decoration: none;
        }}
        a:hover {{
            color: #1a1a1a;
            text-decoration: underline;
        }}
    </style>
</head>
<body>
    <div class="landing">
        <p class="headline">
            Objectives aligned. Ratings defensible—without the spreadsheets.
        </p>
        <div class="grid-wrap">
            {grid_svg}
        </div>
        <nav class="links">
            <a href="/api/v1/docs">API docs</a>
            <a href="/api/v1">API</a>
        </nav>
    </div>
</body>
</html>
""".strip()
