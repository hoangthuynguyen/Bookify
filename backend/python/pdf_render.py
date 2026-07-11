#!/usr/bin/env python3
"""
PDF Renderer using WeasyPrint
10x lighter than Puppeteer/Chrome - fits Render.com free tier (512MB RAM)
Supports 17 trim sizes for KDP/IngramSpark print-on-demand
"""

import sys
import json
import base64
import re
from weasyprint import HTML, CSS


# Chapter heading gap presets: margins around h1 chapter titles
HEADING_GAPS = {
    "compact":  {"top": "1em",   "bottom": "0.8em"},
    "normal":   {"top": "3em",   "bottom": "1.5em"},
    "spacious": {"top": "5em",   "bottom": "2.5em"},
    "dramatic": {"top": "7em",   "bottom": "3em"},
}


def parse_mm(value, default):
    """Extract numeric mm from strings like '152.4mm'."""
    try:
        m = re.match(r"([\d.]+)", str(value))
        return float(m.group(1)) if m else default
    except Exception:
        return default


def preprocess_two_page_spreads(html_content, page_w_mm, page_h_mm):
    """
    Replace <img alt="...[TWO_PAGE_SPREAD]..."> with two full-bleed pages:
    the left half of the image on the verso page, the right half on the recto.
    """
    pattern = re.compile(
        r'<img\b(?=[^>]*alt="[^"]*\[TWO_PAGE_SPREAD\][^"]*")[^>]*src="([^"]+)"[^>]*/?>',
        re.IGNORECASE,
    )

    def replace(match):
        src = match.group(1)
        return (
            '<div class="spread-page spread-left">'
            f'<img class="spread-img" src="{src}" alt="" />'
            '</div>'
            '<div class="spread-page spread-right">'
            f'<img class="spread-img spread-img-right" src="{src}" alt="" />'
            '</div>'
        )

    return pattern.sub(replace, html_content)


def render_pdf(html_content, trim_size, theme, settings):
    """
    Render HTML to print-ready PDF with specified trim size.

    Args:
        html_content: HTML string of the book
        trim_size: { width: "152.4mm", height: "228.6mm" }
        theme: { fontFamily, headingFont, fontSize, lineHeight, colorAccent, margins }
        settings: { orphanControl, mirrorMargins, dropCaps, sceneBreakSymbol }
    """

    width = trim_size.get("width", "152.4mm")
    height = trim_size.get("height", "228.6mm")

    margins = theme.get("margins", {})
    margin_top = margins.get("top", "1in")
    margin_bottom = margins.get("bottom", "1in")
    margin_inner = margins.get("inner", "1in")
    margin_outer = margins.get("outer", "0.75in")

    font_family = theme.get("fontFamily", "Georgia")
    heading_font = theme.get("headingFont", font_family)
    font_size = theme.get("fontSize", "11pt")
    line_height = theme.get("lineHeight", 1.6)
    color_accent = theme.get("colorAccent", "#333333")

    mirror = settings.get("mirrorMargins", False)
    orphan_control = settings.get("orphanControl", True)
    drop_caps = settings.get("dropCaps", False)
    scene_break = settings.get("sceneBreakSymbol", "* * *")
    running_header = settings.get("runningHeader", "none")
    author = theme.get("author", "")
    title_book = theme.get("title", "")

    # --- Design upgrades ---
    heading_gap = HEADING_GAPS.get(settings.get("headingGap", "normal"), HEADING_GAPS["normal"])
    chapter_position = settings.get("chapterStartPosition", "top")  # top | middle | bottom
    large_print = settings.get("largePrint", False)
    drop_cap_lines = int(settings.get("dropCapLines", 3) or 3)
    drop_cap_style = settings.get("dropCapStyle", "classic")  # classic | accent | ornate

    # Large print: enforce accessibility-friendly typography (16pt+, taller lines)
    if large_print:
        try:
            base_pt = float(re.match(r"([\d.]+)", str(font_size)).group(1))
        except Exception:
            base_pt = 11.0
        font_size = f"{max(base_pt, 16.0)}pt"
        line_height = max(float(line_height or 1.6), 1.8)

    # Chapter start position: push the h1 down the page by a fraction of the
    # text-block height (page height minus vertical margins, approximated)
    page_h_mm = parse_mm(height, 228.6)
    page_w_mm = parse_mm(width, 152.4)
    if chapter_position == "middle":
        chapter_offset_css = f"padding-top: {page_h_mm * 0.22:.1f}mm;"
    elif chapter_position == "bottom":
        chapter_offset_css = f"padding-top: {page_h_mm * 0.40:.1f}mm;"
    else:
        chapter_offset_css = ""

    # Two-page image spreads: split tagged images across two facing pages
    html_content = preprocess_two_page_spreads(html_content, page_w_mm, page_h_mm)

    # =========================================================================
    # Build print CSS
    # =========================================================================

    page_css = f"""
    /* === Page Setup === */
    @page {{
        size: {width} {height};
        margin-top: {margin_top};
        margin-bottom: {margin_bottom};
    }}
    """

    if mirror:
        left_header = author.upper() if running_header == 'author_title' and author else ''
        right_header = title_book.upper() if running_header == 'author_title' and title_book else ''

        page_css += f"""
    @page :left {{
        margin-left: {margin_outer};
        margin-right: {margin_inner};
        @bottom-left {{ content: counter(page); font-size: 9pt; color: #999; }}
        @top-center {{ content: "{left_header}"; font-size: 8pt; color: #666; font-family: '{font_family}', serif; letter-spacing: 0.1em; }}
    }}
    @page :right {{
        margin-left: {margin_inner};
        margin-right: {margin_outer};
        @bottom-right {{ content: counter(page); font-size: 9pt; color: #999; }}
        @top-center {{ content: "{right_header}"; font-size: 8pt; color: #666; font-family: '{font_family}', serif; letter-spacing: 0.1em; }}
    }}
    """
    else:
        center_header = (author.upper() + " / " + title_book.upper()).strip(" / ") if running_header == 'author_title' and (author or title_book) else ''
        page_css += f"""
    @page {{
        margin-left: {margin_inner};
        margin-right: {margin_outer};
        @bottom-center {{ content: counter(page); font-size: 9pt; color: #999; }}
        @top-center {{ content: "{center_header}"; font-size: 8pt; color: #666; font-family: '{font_family}', serif; letter-spacing: 0.1em; }}
    }}
    """

    # First page - no page number nor running header
    page_css += """
    @page :first {
        @bottom-center { content: none; }
        @bottom-left { content: none; }
        @bottom-right { content: none; }
        @top-center { content: none; }
    }
    """

    # Body typography
    page_css += f"""
    /* === Typography === */
    body {{
        font-family: '{font_family}', 'Times New Roman', serif;
        font-size: {font_size};
        line-height: {line_height};
        color: #1a1a1a;
        text-align: justify;
        hyphens: auto;
    }}

    p {{
        margin: 0 0 0.3em 0;
        text-indent: 1.5em;
    }}

    /* First para after heading - no indent */
    h1 + p, h2 + p, h3 + p, hr + p {{
        text-indent: 0;
    }}

    /* Hide running header on chapters starting pages */
    @page chapter {{
        @top-center {{ content: none; }}
    }}

    /* === Headings === */
    h1 {{
        font-family: '{heading_font}', serif;
        font-size: 2em;
        font-weight: bold;
        text-align: center;
        margin: {heading_gap["top"]} 0 {heading_gap["bottom"]} 0;
        {chapter_offset_css}
        color: {color_accent};
        page-break-before: always;
        page-break-after: avoid;
        page: chapter;
    }}

    h1:first-of-type {{
        page-break-before: avoid;
    }}

    h2 {{
        font-family: '{heading_font}', serif;
        font-size: 1.4em;
        margin: 1.5em 0 0.8em 0;
        page-break-after: avoid;
    }}

    h3 {{
        font-family: '{heading_font}', serif;
        font-size: 1.15em;
        margin: 1.2em 0 0.6em 0;
        page-break-after: avoid;
    }}

    /* === Block Elements === */
    blockquote {{
        margin: 1em 2em;
        padding-left: 1em;
        border-left: 2px solid {color_accent};
        font-style: italic;
    }}

    /* === Images === */
    img {{
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1em auto;
    }}

    /* === Full Bleed Images === */
    @page full-bleed {{
        margin: 0;
        @bottom-left {{ content: none; }}
        @bottom-right {{ content: none; }}
        @bottom-center {{ content: none; }}
        @top-center {{ content: none; }}
    }}
    img[alt*="[FULL_BLEED]"] {{
        page: full-bleed;
        width: 100vw;
        height: 100vh;
        max-width: none;
        max-height: none;
        margin: 0;
        object-fit: cover;
    }}

    /* === Two-Page Image Spreads === */
    /* Each half is a zero-margin page; the image is 2x page width and the
       right page shifts it left by one page width so the halves line up. */
    .spread-page {{
        page: full-bleed;
        page-break-before: always;
        page-break-after: always;
        width: {page_w_mm}mm;
        height: {page_h_mm}mm;
        overflow: hidden;
        margin: 0;
        padding: 0;
    }}
    .spread-img {{
        width: {page_w_mm * 2}mm;
        height: {page_h_mm}mm;
        max-width: none;
        max-height: none;
        margin: 0;
        object-fit: cover;
        display: block;
    }}
    .spread-img-right {{
        margin-left: -{page_w_mm}mm;
    }}
    
    /* === Scene Breaks === */
    hr {{
        border: none;
        text-align: center;
        margin: 1.5em 0;
        page-break-after: avoid;
    }}
    hr::after {{
        content: '{scene_break}';
        letter-spacing: 0.3em;
        color: {color_accent};
    }}

    .scene-break {{
        text-align: center;
        margin: 1.5em 0;
        page-break-after: avoid;
    }}

    /* === Tables === */
    table {{
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
        page-break-inside: avoid;
    }}
    td, th {{
        padding: 0.4em;
        border: 1px solid #ddd;
    }}
    """

    # Orphan/Widow control
    if orphan_control:
        page_css += """
    /* === Orphan/Widow Control === */
    p {
        orphans: 2;
        widows: 2;
    }
    h1, h2, h3 {
        page-break-after: avoid;
    }
    table, figure, img {
        page-break-inside: avoid;
    }
    """

    # Drop Caps — size scales with lines spanned; style picks font/color
    if drop_caps:
        # ~1.2em of body text per line spanned
        drop_size = {2: "2.4em", 3: "3.5em", 4: "4.7em"}.get(drop_cap_lines, "3.5em")
        if drop_cap_style == "classic":
            dc_color = "#1a1a1a"
            dc_font = font_family
        elif drop_cap_style == "accent":
            dc_color = color_accent
            dc_font = font_family
        else:  # ornate
            dc_color = color_accent
            dc_font = heading_font
        page_css += f"""
    /* === Drop Caps ({drop_cap_style}, {drop_cap_lines} lines) === */
    h1 + p::first-letter {{
        float: left;
        font-size: {drop_size};
        line-height: 0.8;
        padding: 0.05em 0.1em 0 0;
        font-weight: bold;
        color: {dc_color};
        font-family: '{dc_font}', serif;
    }}
    """

    # Text message bubbles for print
    page_css += f"""
    /* === Text Messages (Print) === */
    .text-msg {{
        margin: 0.3em 0;
        padding: 0.4em 0.8em;
        border: 1px solid #ccc;
        border-radius: 0.5em;
    }}
    .text-msg-sent {{
        margin-left: 20%;
        border-color: {color_accent};
    }}
    .text-msg-received {{
        margin-right: 20%;
    }}

    /* === Callout Boxes (Print) === */
    .callout-box {{
        border: 2px solid {color_accent};
        padding: 0.8em;
        margin: 1em 0;
        page-break-inside: avoid;
    }}
    """

    # =========================================================================
    # Render PDF
    # =========================================================================

    try:
        html = HTML(string=html_content)
        css = CSS(string=page_css)
        document = html.render(stylesheets=[css])
        pdf_bytes = document.write_pdf()
        page_count = len(document.pages)

        return {
            "pdf": base64.b64encode(pdf_bytes).decode("utf-8"),
            "page_count": page_count,
            "size": len(pdf_bytes),
        }

    except Exception as e:
        return {
            "error": str(e),
            "pdf": "",
            "page_count": 0,
            "size": 0,
        }


if __name__ == "__main__":
    try:
        input_data = json.loads(sys.stdin.read())

        result = render_pdf(
            input_data["html"],
            input_data["trimSize"],
            input_data["theme"],
            input_data["settings"],
        )

        if result.get("error"):
            print(json.dumps(result), file=sys.stderr)
            sys.exit(1)

        print(json.dumps(result))

    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {e}"}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
