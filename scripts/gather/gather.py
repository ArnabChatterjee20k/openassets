# /// script
# requires-python = ">=3.14"
# dependencies = [
#   "scout @ git+https://github.com/ArnabChatterjee20k/scout@ad6b4b85a9180f52f5cb4a42f7b724787d15af7f",
#   "lxml",
#   "cssselect",
# ]
# ///
"""Gathers real products launched recently and writes them to ideas-gathered.md.

The daily job (scripts/prepare-drop.ts) takes its next kit from this file before
falling back to the hand-written ideas.md, so kits are modelled on things people
are actually shipping.

Sources:
  - YC Launches (https://www.ycombinator.com/launches), rendered with Scout.
  - Product Hunt's public Atom feed (https://www.producthunt.com/feed). The site
    itself serves a bot challenge to headless browsers, and the feed is the
    channel Product Hunt offers for this, so we read that instead.

Each product becomes one kit line. The kit is named after what the product does,
not after the company, and the generator is told to invent its own brand: the
library publishes the kits, and they shouldn't look like official assets of a
real company.

Run: uv run scripts/gather/gather.py [--per-source 30] [--max-kits 20] [--out ideas-gathered.md]
(first time: uv run --script scripts/gather/gather.py --install-browser --dry-run)
"""

import argparse
import asyncio
import html
import os
import re
import subprocess
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path

import lxml.html

ROOT = Path(__file__).resolve().parents[2]
YC_URL = "https://www.ycombinator.com/launches"
PH_FEED = "https://www.producthunt.com/feed"
UA = "OpenAssets idea gatherer (+https://github.com/ArnabChatterjee20k/openassets)"


def clean(s: str) -> str:
    s = html.unescape(re.sub(r"<[^>]+>", " ", s or ""))
    # A colon would end the kit name early in ideas.md's "Name: brief" format.
    return re.sub(r"\s+", " ", s).replace(":", " –").strip(" .–-")


def split_title(t: str) -> tuple[str, str]:
    parts = re.split(r":| [-–] ", t, maxsplit=1)
    return (parts[0].strip(), parts[1].strip()) if len(parts) == 2 else (t.strip(), t.strip())


async def yc_launches(limit: int) -> list[dict]:
    from scout.scout import Scout

    # The page is occasionally slow to answer; Scout's default page timeout is 30 s.
    doc = None
    for attempt in range(3):
        try:
            async with Scout().set_headless().start() as scout:
                scout.set_timeout(90_000)
                doc = await scout.scrape(YC_URL)
            break
        except Exception as e:
            print(f"yc attempt {attempt + 1} failed: {e!r}"[:200], file=sys.stderr)
            await asyncio.sleep(10)
    if doc is None:
        return []
    if doc.metadata.get("status") != 200:
        print(f"yc: HTTP {doc.metadata.get('status')}, skipping", file=sys.stderr)
        return []
    tree = lxml.html.fromstring(doc.html or "")
    out, seen = [], set()
    for row in tree.cssselect(".post"):
        title = row.cssselect(".post-title")
        tagline = row.cssselect(".post-tagline")
        if not title or not tagline:
            continue
        href = title[0].get("href", "")
        if href in seen:
            continue
        seen.add(href)
        # Titles look like "acme: One-line pitch" or "Acme - One-line pitch".
        company, pitch = split_title(title[0].text_content())
        out.append({
            "source": "YC",
            "company": company.strip(),
            "what": clean(pitch),
            "detail": clean(tagline[0].text_content()),
            "url": "https://www.ycombinator.com" + href,
        })
        if len(out) >= limit:
            break
    return out


def ph_feed(limit: int) -> list[dict]:
    req = urllib.request.Request(PH_FEED, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        root = ET.fromstring(r.read())
    ns = {"a": "http://www.w3.org/2005/Atom"}
    out = []
    for e in root.findall("a:entry", ns):
        name = (e.findtext("a:title", "", ns) or "").strip()
        # The first <p> of the content is the tagline.
        m = re.search(r"<p>(.*?)</p>", e.findtext("a:content", "", ns) or "", re.S)
        tagline = clean(m.group(1)) if m else ""
        link = e.find("a:link", ns)
        if not name or not tagline:
            continue
        out.append({
            "source": "Product Hunt",
            "company": name,
            "what": tagline,
            "detail": "",
            "url": link.get("href") if link is not None else "",
        })
        if len(out) >= limit:
            break
    return out


# Launch sites run in waves (this year: AI agents). Keep a gather from being all one thing.
CROWDED = re.compile(r"\b(agents?|agentic|ai|llms?|gpt|mcp|copilot)\b", re.I)
MAX_CROWDED = 3


def kit_line(p: dict) -> str:
    what = p["what"][:1].upper() + p["what"][1:]
    detail = f" ({p['detail']})" if p["detail"] and p["detail"].lower() != p["what"].lower() else ""
    return (
        f"- {what}: modelled on {p['company']}{detail}, launched on {p['source']}. "
        f"Use it to understand who the product is for and what they need, "
        f"but give the kit your own fictional brand name and never use {p['company']}'s name or logo"
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-source", type=int, default=30)
    ap.add_argument("--max-kits", type=int, default=20)
    ap.add_argument("--out", default=str(ROOT / "ideas-gathered.md"))
    ap.add_argument("--install-browser", action="store_true")
    ap.add_argument("--dry-run", action="store_true", help="only install, don't gather")
    args = ap.parse_args()
    if args.install_browser:
        # --with-deps installs the system libraries too; it needs root, so CI only.
        deps = ["--with-deps"] if os.environ.get("CI") else []
        subprocess.run([sys.executable, "-m", "playwright", "install", *deps, "chromium"], check=True)
    if args.dry_run:
        return

    sources = []
    try:
        sources.append(asyncio.run(yc_launches(args.per_source)))
    except Exception as e:  # one source failing shouldn't lose the other
        print(f"yc failed: {e!r}", file=sys.stderr)
    try:
        sources.append(ph_feed(args.per_source))
    except Exception as e:
        print(f"product hunt failed: {e!r}", file=sys.stderr)

    # Interleave sources so consecutive days alternate between them.
    products, seen, crowded = [], set(), 0
    for i in range(max((len(s) for s in sources), default=0)):
        for s in sources:
            if i >= len(s) or s[i]["what"].lower() in seen:
                continue
            text = f"{s[i]['what']} {s[i]['detail']}"
            if CROWDED.search(text):
                if crowded >= MAX_CROWDED:
                    continue
                crowded += 1
            seen.add(s[i]["what"].lower())
            products.append(s[i])
    # Two weeks of new kits plus some slack in case a gather fails.
    products = products[: args.max_kits]
    if not products:
        sys.exit("gathered nothing; keeping the existing ideas-gathered.md")

    body = "\n".join(kit_line(p) for p in products)
    sources_md = "\n".join(f"<!-- {p['source']}: {p['url']} -->" for p in products)
    Path(args.out).write_text(
        f"# Gathered use cases\n\n"
        f"Written by `scripts/gather/gather.py` on {date.today().isoformat()} from recent "
        f"YC and Product Hunt launches. The daily job uses these before `ideas.md`. "
        f"This file is overwritten on every gather, so put lasting ideas in `ideas.md`.\n\n"
        f"{body}\n\n{sources_md}\n"
    )
    print(f"wrote {len(products)} kits to {args.out}")


if __name__ == "__main__":
    main()
