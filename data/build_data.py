#!/usr/bin/env python3
"""
What it does, in order
----------------------
 1. CLEAN   the one-page archive HTML.
 2. PARSE   every <h3> title block into a record + its link tree.
 3. ENRICH  join on IMDb with the local TSVs:
              title.basics.tsv  -> primaryTitle, startYear, endYear,
                                   runtimeMinutes, genres
              title.ratings.tsv -> averageRating, numVotes
 4. DIFF    against the previous data
            to stamp `version_added` per title, and to derive this run's
            version by bumping the previous one (1.0 -> 1.1 -> 1.2 ...).
 5. OMDb    fetch director/writer/actors/plot + download posters.
            Rate limited PER API KEY, cached per title, resumable across
            days. List as many keys as you like in _pipeline/omdb_key.txt -
            each key spends its own daily budget before the next one starts.
 6. WRITE   data.json               (meta + titles)
            chunks/chunk_000..127.json  (imdb_code + links + OMDb fields)

Usage
-----
  python build_data.py                  full run (offline work + OMDb batch)
  python build_data.py --no-omdb        offline only, rebuild outputs from cache
  python build_data.py --status         progress report, writes nothing
  python build_data.py --download-tsv   refresh the two IMDb TSVs first
  python build_data.py --omdb-limit 100 per-key budget override for this run
  python build_data.py --fetch-posters  download the posters listed in
                                        posters_index.json that are missing
                                        on disk, then exit.

OMDb API keys
-------------
Put one key per line in  _pipeline/omdb_key.txt  (gitignored - it is the
only place the keys live). Each key gets its own budget of OMDB_DAILY_LIMIT
requests per day, so 6 keys means 6 x 1000 requests before the run stops.
Already-fetched titles are cached in _pipeline/omdb_cache/, so re-running
the script the next day continues exactly where it stopped.

Only the Python standard library is used - no pip install needed.
"""

from __future__ import annotations

import argparse
import gzip
import json
import os
import re
import shutil
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from datetime import date
from pathlib import Path

# =====================================================================
# CONFIG
# =====================================================================

BASE_DIR = Path(__file__).resolve().parent

# ---- inputs ---------------------------------------------------------
ARCHIVE_HTML = BASE_DIR / "One Page Archive.html"
BASICS_TSV = BASE_DIR / "title.basics.tsv"
RATINGS_TSV = BASE_DIR / "title.ratings.tsv"

# previous state of the world, used only to compute `version_added`
DATA_JSON = BASE_DIR.parent / "src/assets/data.json"

# ---- outputs --------------------------------------------------------
CHUNKS_DIR = BASE_DIR.parent / "public/data_chunks"
POSTERS_DIR = BASE_DIR.parent / "public/posters"

# imdb_code -> poster URL. all anyone needs to rebuild the
# poster folder:  python build_data.py --fetch-posters
POSTERS_INDEX = BASE_DIR / "posters_index.json"

# ---- pipeline scratch (gitignored) ----------------------------------
PIPELINE_DIR = BASE_DIR / "_pipeline"
OMDB_CACHE_DIR = PIPELINE_DIR / "omdb_cache"
STATE_FILE = PIPELINE_DIR / "state.json"
# permanent, append-only history of how many requests each key spent each day
USAGE_LOG = PIPELINE_DIR / "usage_log.json"
# verification report written after every build
VERIFICATION_REPORT = PIPELINE_DIR / "verification_report.txt"
# one API key per line; blank lines and lines starting with # are ignored
OMDB_KEY_FILE = PIPELINE_DIR / "omdb_key.txt"

# ---- versions -------------------------------------------------------
# The version is NOT hardcoded. Every run reads the version of the previous
# data.json and bumps its minor part (1.0 -> 1.1 -> 1.2 -> ...). Titles that
# are new in the archive HTML get that new version; titles that already
# existed keep the version_added they were first seen with. If a run adds no
# new title, the version does not move (re-running on the same HTML is
# idempotent).
DEFAULT_BASELINE_VERSION = "1.0"  # used only when no previous data.json exists

CHUNK_COUNT = 128

# ---- OMDb -----------------------------------------------------------
OMDB_URL = "https://www.omdbapi.com/"
PLOT_MAX_CHARS = 128
# free tier = 1000 requests/day PER KEY; keep a margin so a retry never
# eats the quota. Every key listed in _pipeline/omdb_key.txt gets its own
# budget of this size, each day.
OMDB_DAILY_LIMIT = 1000
OMDB_PLOT = "full"        # "short" | "full"
OMDB_TIMEOUT = 20
OMDB_RETRIES = 3
# print a progress line every N requests (and once per key at the end)
OMDB_PROGRESS_EVERY = 10

# ---- IMDb TSV download URLs ----------------------------------------
IMDB_TSV_URLS = {
    BASICS_TSV.name: "https://datasets.imdbws.com/title.basics.tsv.gz",
    RATINGS_TSV.name: "https://datasets.imdbws.com/title.ratings.tsv.gz",
}

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36"
)

# =====================================================================
# HTML PARSING 
# =====================================================================

CHUNK_RE = re.compile(r"<hr\s*/?>", flags=re.I | re.S)

# title: strip the leading "12. " counter, and the legacy "start_year" marker
TITLE_RE = re.compile(r"<h3>(?:\d+\.\s*)?(.*?)(?:\s+start_year)?</h3>", flags=re.S)

IMDB_CODE_RE = re.compile(r"<b>\s*IMDb Code:\s*</b>\s*([^<]+)", flags=re.S | re.I)
TYPE_RE = re.compile(r"<b>\s*Title Type:\s*</b>\s*([^<]+)", flags=re.S | re.I)
VOTES_RE = re.compile(r"<b>\s*IMDb Votes:\s*</b>\s*([^<]+)", flags=re.S | re.I)
RATES_RE = re.compile(r"<b>\s*IMDb Rates:\s*</b>\s*([^<]+)", flags=re.S | re.I)

SUB_TITLE_RE = re.compile(r"<b>\s*SoftSub\s*</b>", flags=re.I)
DUB_TITLE_RE = re.compile(r"<b>\s*Dubbed\s*</b>", flags=re.I)
NOSUB_TITLE_RE = re.compile(r"<b>\s*NoSub\s*</b>", flags=re.I)

P_TAG_RE = re.compile(r"<p[^>]*>(.*?)</p>", flags=re.S)

LINK_IN_P_RE = re.compile(
    r'<a\s+href="([^"]+)">([^<]+)</a>\s*/?\s*([^\s<]+(?:\s*[A-Z]+)?)?',
    flags=re.S,
)

# ---- cleaning -------------------------------------------------------
DOCTYPE_RE = re.compile(r"<!DOCTYPE[^>]*>", flags=re.I)
HEAD_RE = re.compile(r"<head\b.*?</head>", flags=re.I | re.S)
SCRIPT_RE = re.compile(r"<(script|style)\b.*?</\1\s*>", flags=re.I | re.S)
H2_RE = re.compile(r"<h2\b.*?</h2>", flags=re.I | re.S)
WRAPPER_RE = re.compile(r"</?(?:html|body)\b[^>]*>", flags=re.I)
COMMENT_RE = re.compile(r"<!--.*?-->", flags=re.S)

# a title name that ends in a 4-digit year, e.g. "The Shawshank Redemption 1994"
TRAILING_YEAR_RE = re.compile(r"^(.*\S)\s+((?:18|19|20)\d{2})$")


def clean_html(text: str) -> str:
    """Strip the document chrome so only the title blocks survive.

    Removes the doctype, <head>, <script>/<style>, the <h2> header banner,
    comments, and the <html>/<body> wrapper tags.
    """
    text = COMMENT_RE.sub("", text)
    text = DOCTYPE_RE.sub("", text)
    text = HEAD_RE.sub("", text)
    text = SCRIPT_RE.sub("", text)
    text = H2_RE.sub("", text)
    text = WRAPPER_RE.sub("", text)
    return text


def _to_int(value, default=None):
    if value is None:
        return default
    digits = re.sub(r"[^\d]", "", str(value))
    return int(digits) if digits else default


def _to_float(value, default=None):
    if value is None:
        return default
    m = re.search(r"\d+(?:\.\d+)?", str(value))
    return float(m.group(0)) if m else default


def _format_year(title_type: str, start_year, end_year):
    """The single `year` field.

    movie  -> "1994"           (a plain number, as a string)
    series -> "2010-2015"      (start-end from IMDb)
              "2010-"          (still running: IMDb has no endYear)
              "2010"           (no endYear available at all)
    """
    if start_year is None:
        return None
    if title_type != "series":
        return str(start_year)
    if end_year is None:
        return f"{start_year}-"
    return f"{start_year}-{end_year}"


def _parse_link_entries(p_content: str):
    """All <a href> entries inside one <p>, as (resolution, url, size)."""
    out = []
    for url, res, size in LINK_IN_P_RE.findall(p_content):
        out.append(
            {
                "resolution": res.strip(),
                "url": url.strip(),
                "size": size.strip() if size else None,
            }
        )
    return out


def parse_archive_html(path: Path):
    """Clean + parse the one-page archive into a list of raw records."""
    text = clean_html(path.read_text(encoding="utf-8", errors="replace"))
    blocks = CHUNK_RE.split(text)

    records = []
    seen = set()
    duplicates = []

    for block in blocks:
        block = block.strip()
        if not block:
            continue

        # a real title block always carries an IMDb code; everything else
        # (header remnants, the empty tail after the last <hr>) is dropped
        code_match = IMDB_CODE_RE.search(block)
        if not code_match:
            continue

        imdb_code = code_match.group(1).strip()
        if imdb_code in seen:
            duplicates.append(imdb_code)
            continue
        seen.add(imdb_code)

        rec = {"imdb_code": imdb_code}

        # ---- title name + the year that may be glued onto it ----
        m = TITLE_RE.search(block)
        raw_title = m.group(1).strip() if m else ""
        rec["html_title_raw"] = raw_title
        rec["html_year"] = None
        ym = TRAILING_YEAR_RE.match(raw_title)
        if ym:
            rec["html_title"] = ym.group(1).strip()
            rec["html_year"] = int(ym.group(2))
        else:
            rec["html_title"] = raw_title

        # ---- type: the HTML parser's own normalisation is kept verbatim ----
        m = TYPE_RE.search(block)
        html_type = m.group(1).strip() if m else None
        rec["title_type"] = "movie" if html_type in ("movie", "tvMovie") else "series"
        rec["html_title_type"] = html_type

        # ---- ratings as they appear in the HTML (fallback values) ----
        m = VOTES_RE.search(block)
        rec["html_votes"] = _to_int(m.group(1)) if m else None

        m = RATES_RE.search(block)
        rec["html_rate"] = _to_float(m.group(1)) if m else None

        # ---- availability flags ----
        rec["subtitle"] = bool(SUB_TITLE_RE.search(block))
        rec["dubbed"] = bool(DUB_TITLE_RE.search(block))
        rec["nosub"] = bool(NOSUB_TITLE_RE.search(block))

        # ---- links ----
        if rec["title_type"] == "series":
            rec["links"] = _parse_series_links(block)
        else:
            rec["links"] = _parse_movie_links(block)

        records.append(rec)

    return records, duplicates


def _parse_movie_links(block: str):
    """Flat link list: resolution / url / type / size."""
    links = []
    current_type = None
    for p_match in P_TAG_RE.finditer(block):
        p_content = p_match.group(1).strip()

        if SUB_TITLE_RE.search(p_content):
            current_type = "sub"
            continue
        if DUB_TITLE_RE.search(p_content):
            current_type = "dub"
            continue
        if NOSUB_TITLE_RE.search(p_content):
            current_type = "nosub"
            continue

        for entry in _parse_link_entries(p_content):
            entry["type"] = current_type
            links.append(entry)
    return links


def _parse_series_links(block: str):
    """Nested tree: [{type, seasons:[{season, links:[{resolution,url}]}]}]."""
    links = []
    current_type = None
    current_season = None

    for p_match in P_TAG_RE.finditer(block):
        p_content = p_match.group(1).strip()

        if SUB_TITLE_RE.search(p_content):
            current_type = "sub"
            if not any(c["type"] == current_type for c in links):
                links.append({"type": current_type, "seasons": []})
            continue
        if DUB_TITLE_RE.search(p_content):
            current_type = "dub"
            if not any(c["type"] == current_type for c in links):
                links.append({"type": current_type, "seasons": []})
            continue
        if NOSUB_TITLE_RE.search(p_content):
            current_type = "nosub"
            if not any(c["type"] == current_type for c in links):
                links.append({"type": current_type, "seasons": []})
            continue

        season_match = re.match(r"season\s+(\d+)", p_content, flags=re.I)
        if season_match:
            current_season = season_match.group(1)
            if current_type:
                cat = next((c for c in links if c["type"] == current_type), None)
                if cat is not None:
                    cat["seasons"].append({"season": current_season, "links": []})
            continue

        if "<a " in p_content and current_type and current_season:
            entries = [
                {"resolution": e["resolution"], "url": e["url"]}
                for e in _parse_link_entries(p_content)
            ]
            cat = next((c for c in links if c["type"] == current_type), None)
            if cat and cat["seasons"]:
                cat["seasons"][-1]["links"].extend(entries)

    return links


# =====================================================================
# IMDb TSV LOOKUPS
# =====================================================================

def _stream_tsv(path: Path, wanted: set[str]):
    """Yield (tconst, row) for rows whose tconst is in `wanted`."""
    with path.open("r", encoding="utf-8", errors="replace", newline="") as fh:
        header = fh.readline().rstrip("\n").split("\t")
        for line in fh:
            tconst, _, rest = line.partition("\t")
            if tconst in wanted:
                yield tconst, dict(zip(header[1:], rest.rstrip("\n").split("\t")))


def load_basics(path: Path, wanted: set[str]):
    """tconst -> {title_type, primary_title, start_year, end_year, runtime, genres}"""
    out = {}
    for tconst, row in _stream_tsv(path, wanted):
        raw_genres = row.get("genres", r"\N")
        out[tconst] = {
            "title_type": row.get("titleType"),
            "primary_title": row.get("primaryTitle"),
            "start_year": _to_int(row.get("startYear")),
            "end_year": _to_int(row.get("endYear")),
            "runtime": _to_int(row.get("runtimeMinutes")),
            "genres": [] if raw_genres in (r"\N", "") else raw_genres.split(","),
        }
    return out


def load_ratings(path: Path, wanted: set[str]):
    """tconst -> {rate, votes}"""
    out = {}
    for tconst, row in _stream_tsv(path, wanted):
        out[tconst] = {
            "rate": _to_float(row.get("averageRating")),
            "votes": _to_int(row.get("numVotes")),
        }
    return out


# =====================================================================
# BASELINE / VERSIONING
# =====================================================================

def bump_minor(version):
    """"1.0" -> "1.1",  "1.1" -> "1.2",  "2" -> "2.1",  junk -> "1.1"."""
    parts = str(version or "").strip().split(".")
    major = parts[0] if parts and parts[0].isdigit() else "1"
    minor = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
    return f"{major}.{minor + 1}"


def load_baseline():
    """The previous state of the world, used for versioning.

    Returns (baseline, previous_version) where baseline maps
    imdb_code -> version_added.

    Prefers data.json (it carries version info). Falls back to the legacy
    final_all_data.json, which has none - its titles are therefore treated as
    belonging to DEFAULT_BASELINE_VERSION.
    """
    if DATA_JSON.exists():
        try:
            raw = json.loads(DATA_JSON.read_text(encoding="utf-8"))
            items = raw.get("titles", []) if isinstance(raw, dict) else raw
            previous_version = (
                raw.get("meta", {}).get("version")
                if isinstance(raw, dict)
                else None
            ) or DEFAULT_BASELINE_VERSION
            baseline = {}
            for item in items:
                code = item.get("imdb_code")
                if code:
                    baseline[code] = item.get("version_added") or previous_version
            if baseline:
                print(f"  baseline: {DATA_JSON.name} "
                      f"({len(baseline)} titles, version {previous_version})")
                return baseline, previous_version
        except (json.JSONDecodeError, OSError):
            pass

    print(f"  baseline: none found - every title will be treated as new "
          f"(starting at {bump_minor(DEFAULT_BASELINE_VERSION)})")
    return {}, DEFAULT_BASELINE_VERSION


# =====================================================================
# BUILD  data.json  +  chunks
# =====================================================================

def chunk_index(imdb_code: str) -> int:
    digits = imdb_code[2:] if imdb_code.startswith("tt") else imdb_code
    return (int(digits) % CHUNK_COUNT) if digits.isdigit() else 0


def _start_year_of(year_field):
    """First year out of the `year` string, for the meta statistics."""
    if not year_field:
        return None
    m = re.match(r"(\d{4})", str(year_field))
    return int(m.group(1)) if m else None


def build_meta(titles, version):
    years = [_start_year_of(t["year"]) for t in titles]
    runtimes = [t["runtime"] for t in titles]
    votes = [t["imdb_votes"] for t in titles]
    all_genres = sorted({g for t in titles for g in (t["genres"] or [])})
    return {
        "total_num": len(titles),
        "movies_num": sum(1 for t in titles if t["title_type"] == "movie"),
        "series_num": sum(1 for t in titles if t["title_type"] == "series"),
        "min_vote_count": min((v for v in votes if v is not None), default=None),
        "max_vote_count": max((v for v in votes if v is not None), default=None),
        "min_year": min((y for y in years if y is not None), default=None),
        "max_year": max((y for y in years if y is not None), default=None),
        "min_runtime": min((r for r in runtimes if r is not None), default=None),
        "max_runtime": max((r for r in runtimes if r is not None), default=None),
        "all_genres": all_genres,
        "version": version,
        "last_updated": date.today().isoformat(),
    }


def build_titles(records, basics, ratings, baseline, current_version, baseline_version):
    """Merge HTML + IMDb TSVs + baseline into the final title objects."""
    titles = []
    links_by_code = {}
    stats = Counter()
    unmatched = []
    no_rating = []

    for rec in records:
        code = rec["imdb_code"]
        basic = basics.get(code)
        rating = ratings.get(code)

        if basic:
            title_name = basic["primary_title"] or rec["html_title"]
            start_year = basic["start_year"] or rec["html_year"]
            end_year = basic["end_year"]
            runtime = basic["runtime"]
            genres = basic["genres"]
            stats["matched_basics"] += 1
        else:
            # not in title.basics.tsv - fall back to what the HTML gave us
            title_name = rec["html_title"]
            start_year = rec["html_year"]
            end_year = None
            runtime = None
            genres = []
            stats["unmatched_basics"] += 1
            unmatched.append((code, title_name))

        if rating:
            votes = rating["votes"]
            rate = rating["rate"]
            stats["matched_ratings"] += 1
        else:
            # unrated titles: keep whatever the HTML advertised
            votes = rec["html_votes"]
            rate = rec["html_rate"]
            stats["unmatched_ratings"] += 1
            no_rating.append(code)

        if code in baseline:
            version_added = baseline[code] or baseline_version
            stats["existing"] += 1
        else:
            version_added = current_version
            stats["new"] += 1

        titles.append(
            {
                "title": title_name,
                "imdb_code": code,
                "title_type": rec["title_type"],
                "imdb_votes": votes,
                "imdb_rate": rate,
                "subtitle": rec["subtitle"],
                "dubbed": rec["dubbed"],
                "nosub": rec["nosub"],
                "year": _format_year(rec["title_type"], start_year, end_year),
                "runtime": runtime,
                "genres": genres,
                "version_added": version_added,
            }
        )
        links_by_code[code] = rec["links"]

    return titles, links_by_code, stats, unmatched, no_rating


def write_data_json(meta, titles):
    payload = {"meta": meta, "titles": titles}
    DATA_JSON.write_text(
        json.dumps(payload, ensure_ascii=False, indent=None, separators=(",", ":")),
        encoding="utf-8",
    )


def write_chunks(titles, links_by_code, omdb):
    """ [CHUNK_COUNT] chunk files, keyed by imdb_code % [CHUNK_COUNT].

    Each entry: imdb_code + links + the OMDb fields (director/writer/actors/plot).
    """
    CHUNKS_DIR.mkdir(parents=True, exist_ok=True)
    buckets = [[] for _ in range(CHUNK_COUNT)]

    for title in titles:
        code = title["imdb_code"]
        extra = omdb.get(code) or {}
        buckets[chunk_index(code)].append(
            {
                "imdb_code": code,
                "links": links_by_code.get(code, []),
                "director": extra.get("director"),
                "writer": extra.get("writer"),
                "actors": extra.get("actors"),
                "plot": extra.get("plot"),
            }
        )

    # drop stale chunk files from a previous run
    for old in CHUNKS_DIR.glob("chunk_*.json"):
        try:
            old.unlink()
        except OSError:
            pass

    for i, bucket in enumerate(buckets):
        path = CHUNKS_DIR / f"chunk_{i:03d}.json"
        path.write_text(
            json.dumps(bucket, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
    return buckets


# =====================================================================
# OMDb PHASE  (rate limited + resumable)
# =====================================================================

def get_omdb_keys():
    """Every API key to use, in order.

    Sources: the OMDB_API_KEY environment variable first, then one key per
    line in _pipeline/omdb_key.txt. Blank lines and '#' comments are ignored,
    duplicates are dropped.
    """
    keys = []
    env = os.environ.get("OMDB_API_KEY", "").strip()
    if env:
        keys.append(env)
    if OMDB_KEY_FILE.exists():
        for line in OMDB_KEY_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            keys.append(line)
    seen = set()
    unique = []
    for key in keys:
        if key not in seen:
            seen.add(key)
            unique.append(key)
    return unique


def load_state():
    """Daily request counters, per API key.

    {
      "date": "2026-09-30",
      "keys": {"[OMDB_API_KEY]": {"used": 1000}, ...},
      "fetched_total": 1234,
      "errors_total": 5
    }
    """
    today = date.today().isoformat()
    state = {"date": today, "keys": {}, "fetched_total": 0, "errors_total": 0}
    if STATE_FILE.exists():
        try:
            loaded = json.loads(STATE_FILE.read_text(encoding="utf-8"))
            if isinstance(loaded, dict):
                # migrate the old single-key shape if present
                if "used" in loaded and "keys" not in loaded:
                    loaded["keys"] = {"(legacy)": {"used": loaded.pop("used")}}
                state.update(loaded)
        except (json.JSONDecodeError, OSError):
            pass
    if state.get("date") != today:
        # a new day: every key's budget is fresh again
        state["date"] = today
        state["keys"] = {}
    state.setdefault("keys", {})
    return state


def key_used(state, key):
    return state["keys"].get(key, {}).get("used", 0)


def add_key_use(state, key, count=1):
    entry = state["keys"].setdefault(key, {"used": 0})
    entry["used"] = entry.get("used", 0) + count


def save_state(state):
    PIPELINE_DIR.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


# ---- permanent usage log --------------------------------------------
# state.json only remembers TODAY, and resets at midnight. The usage log
# keeps every day forever, so a key's spend is never forgotten - not when
# the day rolls over, not when keys are added or removed from the key file.

def load_usage_log():
    """{"2026-10-01": {"[OMDB_API_KEY]": 33}, ...} - one entry per key per day."""
    if not USAGE_LOG.exists():
        return {}
    try:
        log = json.loads(USAGE_LOG.read_text(encoding="utf-8"))
        return log if isinstance(log, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def log_usage(key, count, day=None):
    """Add `count` requests for `key` on `day` (default today)."""
    if count <= 0:
        return
    day = day or date.today().isoformat()
    log = load_usage_log()
    day_entry = log.setdefault(day, {})
    day_entry[key] = day_entry.get(key, 0) + count
    PIPELINE_DIR.mkdir(parents=True, exist_ok=True)
    tmp = USAGE_LOG.with_suffix(".tmp")
    tmp.write_text(json.dumps(log, indent=2, sort_keys=True), encoding="utf-8")
    os.replace(tmp, USAGE_LOG)


def usage_for(key, day=None):
    """Requests this key has spent today, from the durable log."""
    day = day or date.today().isoformat()
    return load_usage_log().get(day, {}).get(key, 0)


def reconcile_state_from_log(state):
    """Make today's counters reflect the durable log.

    Guards against a state.json that was lost, wiped, or rolled over at
    midnight while the key had in fact already spent its budget.
    """
    day = state.get("date") or date.today().isoformat()
    logged = load_usage_log().get(day, {})
    for key, used in logged.items():
        entry = state["keys"].setdefault(key, {"used": 0})
        if used > entry.get("used", 0):
            entry["used"] = used
    return state


def cache_path(imdb_code):
    return OMDB_CACHE_DIR / f"{imdb_code}.json"


def load_cache(imdb_code):
    path = cache_path(imdb_code)
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def save_cache(imdb_code, payload):
    OMDB_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    tmp = cache_path(imdb_code).with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, cache_path(imdb_code))


def omdb_request(imdb_code, api_key):
    """One OMDb call. Returns the parsed JSON, or a dict with `_error`."""
    url = f"{OMDB_URL}?apikey={api_key}&i={imdb_code}&plot={OMDB_PLOT}&r=json"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    last_error = None
    for attempt in range(OMDB_RETRIES):
        try:
            with urllib.request.urlopen(req, timeout=OMDB_TIMEOUT) as resp:
                payload = json.loads(resp.read().decode("utf-8", errors="replace"))
            error = (payload.get("Error") or "").lower()
            if "limit" in error or "quota" in error:
                return {"_error": "limit", "Error": payload.get("Error")}
            if "incorrect imdb" in error or "not found" in error:
                return {"_error": "not_found", "Error": payload.get("Error")}
            return payload
        except urllib.error.HTTPError as exc:
            if exc.code in (401, 403):
                return {"_error": "auth", "Error": f"HTTP {exc.code} - bad API key"}
            last_error = f"HTTP {exc.code}"
        except Exception as exc:  # noqa: BLE001 - network layer, retry anything
            last_error = str(exc)
        if attempt < OMDB_RETRIES - 1:
            time.sleep(1.5 * (attempt + 1))
    return {"_error": "network", "Error": last_error}


def download_poster(imdb_code, poster_url):
    """Save the OMDb poster to posters/<imdb_code>.jpg. Never overwrites.

    Returns one of:
      "ok"    downloaded and validated (JPEG/PNG magic bytes)
      "skip"  already on disk
      "none"  OMDb reported no poster
      "gone"  the CDN answered 404/410 - the image no longer exists, so
              retrying will never help (a few hundred of the 22k posters)
      "fail"  anything else - worth retrying later
    """
    dest = POSTERS_DIR / f"{imdb_code}.jpg"
    if dest.exists() and dest.stat().st_size > 0:
        return "skip"
    if not poster_url or poster_url in ("N/A", ""):
        return "none"

    req = urllib.request.Request(poster_url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=OMDB_TIMEOUT) as resp:
            blob = resp.read()
    except urllib.error.HTTPError as exc:
        return "gone" if exc.code in (404, 410) else "fail"
    except Exception:  # noqa: BLE001
        return "fail"

    # guard against HTML error pages being saved as .jpg
    if len(blob) < 512 or not (blob[:3] == b"\xff\xd8\xff" or blob[:8] == b"\x89PNG\r\n\x1a\n"):
        return "fail"

    POSTERS_DIR.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(".part")
    tmp.write_bytes(blob)
    os.replace(tmp, dest)
    return "ok"


# =====================================================================
# POSTERS INDEX  (the shareable half of the OMDb cache)
# =====================================================================

def build_posters_index(titles):
    """{imdb_code: poster_url} for every cached title with a real URL.

    Only cached, successful, poster-bearing titles make it in, so the
    index always mirrors what a complete build would have downloaded.
    """
    index = {}
    for title in titles:
        cached = load_cache(title["imdb_code"])
        if not cached or cached.get("_error"):
            continue
        url = cached.get("Poster")
        if url and url not in ("N/A", ""):
            index[title["imdb_code"]] = url
    return index


def write_posters_index(index):
    tmp = POSTERS_INDEX.with_suffix(".tmp")
    tmp.write_text(
        json.dumps(index, ensure_ascii=False, sort_keys=True,
                   separators=(",", ":")),
        encoding="utf-8",
    )
    os.replace(tmp, POSTERS_INDEX)


def fetch_posters_from_index(limit=None):
    """Download every poster in POSTERS_INDEX that is missing on disk.

    Poster URLs point straight at the image CDN - no API key is used and
    no OMDb quota is spent - so a fresh clone can rebuild the whole
    folder without configuring anything. Posters already on disk are
    never re-downloaded, which also makes this safe to re-run.
    """
    if not POSTERS_INDEX.exists():
        print(f"ERROR: {POSTERS_INDEX} not found - run a full build first")
        return 1

    index = json.loads(POSTERS_INDEX.read_text(encoding="utf-8"))
    missing = [
        (code, url)
        for code, url in sorted(index.items())
        if not (POSTERS_DIR / f"{code}.jpg").exists()
    ]
    print(f"  posters index: {len(index)} entries   "
          f"already on disk: {len(index) - len(missing)}   "
          f"missing: {len(missing)}")

    if limit is not None and limit < len(missing):
        missing = missing[:limit]
        print(f"  limited to {len(missing)} downloads this run")

    if not missing:
        print("  nothing to download - every indexed poster is on disk.")
        return 0

    ok = fail = gone = none = 0
    for i, (code, url) in enumerate(missing, 1):
        status = download_poster(code, url)
        if status == "ok":
            ok += 1
        elif status == "fail":
            fail += 1
        elif status == "gone":
            gone += 1
        elif status == "none":
            none += 1

        if i % OMDB_PROGRESS_EVERY == 0:
            print(f"    [{i:>6}/{len(missing)}]  +{ok} downloaded, "
                  f"{fail} failed, {gone} gone", flush=True)

    on_disk = (len(list(POSTERS_DIR.glob("*.jpg")))
               if POSTERS_DIR.exists() else 0)
    print(f"\n  posters: +{ok} downloaded, {fail} failed, "
          f"{none} had no poster URL")
    if gone:
        print(f"  {gone} poster URL(s) are 404 on the CDN - the image no "
              f"longer exists upstream")
    print(f"  on disk now: {on_disk}")
    return 0


def extract_omdb_fields(payload):
    """The four fields the chunks carry (kept as OMDb returns them)."""
    if not payload or payload.get("_error"):
        return {}
    return {
        "director": _clean(payload.get("Director")),
        "writer": _clean(payload.get("Writer")),
        "actors": _clean(payload.get("Actors")),
        "plot": _truncate_plot(_clean(payload.get("Plot"))),
    }


def _truncate_plot(plot):
    """Cap a plot at PLOT_MAX_CHARS characters, appending "..." when cut.

    Short plots, and missing ones, come back untouched.
    """
    if plot is None or len(plot) <= PLOT_MAX_CHARS:
        return plot
    return plot[:PLOT_MAX_CHARS] + "..."


def _clean(value):
    if not value or value == "N/A":
        return None
    return value.strip()


def load_all_omdb(titles):
    """{imdb_code: {director, writer, actors, plot}} from the on-disk cache."""
    out = {}
    for title in titles:
        cached = load_cache(title["imdb_code"])
        if cached and not cached.get("_error"):
            fields = extract_omdb_fields(cached)
            if any(fields.values()):
                out[title["imdb_code"]] = fields
    return out


def omdb_phase(titles, daily_limit):
    """Fetch OMDb data for every title that has no cache entry yet.

    Multiple API keys: each key spends its own budget of `daily_limit`
    requests before the next key takes over, so N keys means N x limit
    requests in one run.

    Fully resumable: every response is written to
    _pipeline/omdb_cache/<tt>.json, and the per-key daily counters live in
    _pipeline/state.json. Re-running the script tomorrow continues exactly
    where it stopped - nothing is ever fetched twice.
    """
    keys = get_omdb_keys()
    if not keys:
        print("\n  !! no OMDb API key found - skipping the OMDb phase.")
        print(f"     put one key per line in {OMDB_KEY_FILE}")
        print("     or set the OMDB_API_KEY environment variable.")
        return {"skipped": True}

    state = load_state()
    reconcile_state_from_log(state)
    todo = [t for t in titles if load_cache(t["imdb_code"]) is None]
    # titles that are still missing a poster get served first
    todo.sort(key=lambda t: ((POSTERS_DIR / f"{t['imdb_code']}.jpg").exists(), t["imdb_code"]))

    budgets = [(k, daily_limit - key_used(state, k)) for k in keys]
    total_left = sum(max(0, left) for _, left in budgets)

    print(f"\n  OMDb: {len(todo)} titles with no cache, "
          f"{len(keys)} key(s), {total_left} requests left today "
          f"({state.get('date')})")
    for key, left in budgets:
        spent = usage_for(key)
        if left <= 0:
            print(f"    {key[:8]}...  spent today ({spent}) - will be skipped")
        else:
            print(f"    {key[:8]}...  {spent} used, {left} left today")

    if not todo:
        print("  nothing to fetch - cache is complete.")
        repair_posters(titles)
        return state
    if total_left <= 0:
        print("  every key's budget is spent for today - re-run tomorrow.")
        repair_posters(titles)
        return state

    done = errors = attempted = 0
    total_todo = len(todo)
    pending = list(todo)
    handled_codes = set()

    for index, key in enumerate(keys):
        if not pending:
            break
        left = daily_limit - key_used(state, key)
        if left <= 0:
            print(f"  key {index + 1}/{len(keys)} ({key[:8]}...) is spent today "
                  f"- skipping to the next key")
            continue

        batch = pending[:left]
        print(f"\n  --- key {index + 1}/{len(keys)} ({key[:8]}...): "
              f"up to {len(batch)} requests ---")

        for title in batch:
            code = title["imdb_code"]
            payload = omdb_request(code, key)
            add_key_use(state, key)
            log_usage(key, 1)          # durable, survives restarts and key changes
            attempted += 1

            if payload.get("_error") == "limit":
                print(f"  key {key[:8]}... hit its quota after "
                      f"{key_used(state, key)} requests - moving to the next key")
                break
            if payload.get("_error") == "auth":
                print(f"  key {key[:8]}... rejected: {payload.get('Error')}")
                print("     fix or remove this key from the key file.")
                break

            save_cache(code, payload)
            handled_codes.add(code)
            state["fetched_total"] = state.get("fetched_total", 0) + 1

            if payload.get("_error"):
                errors += 1
                state["errors_total"] = state.get("errors_total", 0) + 1
            else:
                done += 1
                download_poster(code, payload.get("Poster"))

            if attempted % OMDB_PROGRESS_EVERY == 0:
                save_state(state)
                print(f"    [{attempted:>6}/{total_todo}]  {done} ok, {errors} err"
                      f"  |  key {index + 1}/{len(keys)} at "
                      f"{key_used(state, key)}/{daily_limit}"
                      f"  |  {total_todo - attempted} to go", flush=True)

        # everything this key handled is no longer pending
        pending = [t for t in pending if t["imdb_code"] not in handled_codes]

    save_state(state)
    print(f"\n  OMDb batch finished: +{done} fetched, {errors} errors "
          f"({attempted} requests spent this run)")
    print(f"  {len(pending)} titles still without cache")
    for key in keys:
        spent = usage_for(key)
        print(f"    {key[:8]}...  {spent}/{daily_limit} used today")
    repair_posters(titles)
    return state


def repair_posters(titles):
    """Posters whose OMDb data is already cached but whose file is missing."""
    ok = fail = gone = 0
    for title in titles:
        code = title["imdb_code"]
        if (POSTERS_DIR / f"{code}.jpg").exists():
            continue
        cached = load_cache(code)
        if not cached or cached.get("_error"):
            continue
        status = download_poster(code, cached.get("Poster"))
        if status == "ok":
            ok += 1
        elif status == "gone":
            gone += 1
        elif status == "fail":
            fail += 1
    if ok or fail or gone:
        print(f"  poster repair from cache: +{ok} downloaded, {fail} failed"
              + (f", {gone} gone upstream" if gone else ""))


def verify_pipeline(titles, unmatched=None):
    """Cross-check data.json, chunks/, OMDb cache, and posters/ for mismatches.

    Writes a full report to _pipeline/verification_report.txt and prints
    a summary. Categories checked:

      0. Titles in HTML but not found in title.basics.tsv (HTML fallback used)
      1. Titles in data.json but no OMDb cache file
      2. Titles with cache but _error set
      3. Titles with cache but Poster is N/A or missing
      4. Titles with cache and valid Poster URL but no poster file
      5. Orphan poster files (poster exists, no cache)
      6. Titles in chunks but not in data.json
      7. Titles in data.json but not in chunks
      8. Titles in chunks with missing data (links, OMDb fields)
    """
    data_codes = {t["imdb_code"] for t in titles}

    # ---- load chunk codes ----
    chunk_codes = set()
    chunk_entries = {}
    if CHUNKS_DIR.exists():
        for f in CHUNKS_DIR.glob("chunk_*.json"):
            try:
                entries = json.loads(f.read_text(encoding="utf-8"))
                for entry in entries:
                    code = entry.get("imdb_code")
                    if code:
                        chunk_codes.add(code)
                        chunk_entries[code] = entry
            except (json.JSONDecodeError, OSError):
                pass

    # ---- load cache codes ----
    cache_codes = set()
    cache_data = {}
    if OMDB_CACHE_DIR.exists():
        for f in OMDB_CACHE_DIR.glob("*.json"):
            code = f.stem
            cache_codes.add(code)
            try:
                cache_data[code] = json.loads(f.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                cache_data[code] = {"_error": "corrupt_cache_file"}

    # ---- load poster codes ----
    poster_codes = set()
    if POSTERS_DIR.exists():
        for f in POSTERS_DIR.glob("*.jpg"):
            if f.stat().st_size > 0:
                poster_codes.add(f.stem)

    # ---- category checks ----
    no_cache = sorted(data_codes - cache_codes)
    cache_error = sorted(c for c in cache_codes & data_codes
                         if cache_data.get(c, {}).get("_error"))
    poster_na = sorted(c for c in cache_codes & data_codes
                       if not cache_data.get(c, {}).get("Poster")
                       or cache_data.get(c, {}).get("Poster") in ("N/A", ""))
    poster_missing_file = sorted(
        c for c in cache_codes & data_codes
        if cache_data.get(c, {}).get("Poster")
        and cache_data.get(c, {}).get("Poster") not in ("N/A", "")
        and c not in poster_codes
    )
    orphan_posters = sorted(poster_codes - cache_codes)
    chunk_not_in_data = sorted(chunk_codes - data_codes)
    data_not_in_chunk = sorted(data_codes - chunk_codes)

    # ---- missing data in chunks ----
    missing_links = []
    missing_omdb = []
    for code in sorted(chunk_codes & data_codes):
        entry = chunk_entries.get(code, {})
        if not entry.get("links"):
            missing_links.append(code)
        # check if OMDb fields are all None/empty
        omdb_fields = [entry.get("director"), entry.get("writer"),
                       entry.get("actors"), entry.get("plot")]
        if all(not f for f in omdb_fields):
            missing_omdb.append(code)

    # ---- build report ----
    lines = []
    lines.append("=" * 62)
    lines.append("PIPELINE VERIFICATION REPORT")
    lines.append(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("=" * 62)
    lines.append("")
    lines.append(f"data.json titles:  {len(data_codes)}")
    lines.append(f"chunk titles:       {len(chunk_codes)}")
    lines.append(f"OMDb cache files:   {len(cache_codes)}")
    lines.append(f"poster files:       {len(poster_codes)}")
    lines.append("")

    # ---- category 0: HTML titles not in title.basics.tsv ----
    unmatched = unmatched or []
    lines.append(f"--- 0. In HTML but NOT in title.basics.tsv ({len(unmatched)}) ---")
    if not unmatched:
        lines.append("  (none)")
    else:
        for code, name in unmatched[:50]:
            lines.append(f"  {code}  {name}")
        if len(unmatched) > 50:
            lines.append(f"  ... and {len(unmatched) - 50} more")
    lines.append("")

    def section(title, items, detail_fn=None):
        lines.append(f"--- {title} ({len(items)}) ---")
        if not items:
            lines.append("  (none)")
        else:
            for item in items[:50]:
                if detail_fn:
                    lines.append(f"  {item}  {detail_fn(item)}")
                else:
                    lines.append(f"  {item}")
            if len(items) > 50:
                lines.append(f"  ... and {len(items) - 50} more")
        lines.append("")

    section("1. In data.json but NO OMDb cache file", no_cache)
    section("2. Cache exists but has _error", cache_error,
            lambda c: f"({cache_data.get(c, {}).get('_error', '?')})")
    section("3. Cache exists but Poster is N/A or missing", poster_na)
    section("4. Cache has Poster URL but poster file missing", poster_missing_file)
    section("5. Orphan poster files (no cache entry)", orphan_posters)
    section("6. In chunks but NOT in data.json", chunk_not_in_data)
    section("7. In data.json but NOT in chunks", data_not_in_chunk)
    section("8a. In chunks but missing links", missing_links)
    section("8b. In chunks but missing all OMDb fields", missing_omdb)

    lines.append("=" * 62)
    total_issues = (len(unmatched) + len(no_cache) + len(cache_error) + len(poster_na)
                    + len(poster_missing_file) + len(orphan_posters)
                    + len(chunk_not_in_data) + len(data_not_in_chunk)
                    + len(missing_links) + len(missing_omdb))
    lines.append(f"TOTAL ISSUES: {total_issues}")
    lines.append("=" * 62)

    report = "\n".join(lines)
    VERIFICATION_REPORT.write_text(report, encoding="utf-8")

    # print summary
    print(f"\n  verification report -> {VERIFICATION_REPORT}")
    print(f"    0. not in basics.tsv:     {len(unmatched)}")
    print(f"    1. no cache:              {len(no_cache)}")
    print(f"    2. cache error:           {len(cache_error)}")
    print(f"    3. poster N/A:            {len(poster_na)}")
    print(f"    4. poster file missing:   {len(poster_missing_file)}")
    print(f"    5. orphan posters:        {len(orphan_posters)}")
    print(f"    6. chunk not in data:     {len(chunk_not_in_data)}")
    print(f"    7. data not in chunk:     {len(data_not_in_chunk)}")
    print(f"    8a. missing links:        {len(missing_links)}")
    print(f"    8b. missing OMDb fields:  {len(missing_omdb)}")
    print(f"    TOTAL ISSUES:            {total_issues}")

    return total_issues


# =====================================================================
# IMDb TSV REFRESH
# =====================================================================

def download_tsvs():
    for name, url in IMDB_TSV_URLS.items():
        dest = BASE_DIR / name
        print(f"  downloading {name} ...")
        tmp_gz = dest.with_suffix(".tsv.gz.part")
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=120) as resp, tmp_gz.open("wb") as out:
            shutil.copyfileobj(resp, out, length=1 << 20)

        tmp_tsv = dest.with_suffix(".tsv.part")
        with gzip.open(tmp_gz, "rb") as src, tmp_tsv.open("wb") as out:
            shutil.copyfileobj(src, out, length=1 << 20)
        os.replace(tmp_tsv, dest)
        tmp_gz.unlink(missing_ok=True)
        print(f"    -> {dest.name} ({dest.stat().st_size / 1e6:.0f} MB)")


# =====================================================================
# STATUS
# =====================================================================

def print_status(titles=None):
    print("\n" + "=" * 62)
    print("PIPELINE STATUS")
    print("=" * 62)

    state = load_state()
    reconcile_state_from_log(state)
    limit = OMDB_DAILY_LIMIT
    keys = get_omdb_keys()
    print(f"  OMDb day: {state.get('date')}   keys configured: {len(keys)}")
    for key in keys:
        spent = usage_for(key)
        left = max(0, limit - spent)
        print(f"    {key[:8]}...  {spent}/{limit} used, {left} left today")
    if not keys:
        print("    (none - add keys to _pipeline/omdb_key.txt)")
    print(f"  OMDb fetched all-time: {state.get('fetched_total', 0)} "
          f"({state.get('errors_total', 0)} errors)")
    total_budget = len(keys) * limit
    print(f"  daily capacity: {total_budget} requests")

    cached = len(list(OMDB_CACHE_DIR.glob("*.json"))) if OMDB_CACHE_DIR.exists() else 0
    print(f"  OMDb cache entries: {cached}")

    # ---- full usage history from the durable log ----
    log = load_usage_log()
    if log:
        grand = sum(sum(day.values()) for day in log.values())
        print(f"\n  OMDb request history ({grand} total across {len(log)} day(s)):")
        for day in sorted(log, reverse=True):
            entries = log[day]
            total = sum(entries.values())
            keys_txt = ", ".join(f"{k[:8]}...={v}" for k, v in sorted(entries.items()))
            print(f"    {day}  {total:>5} req   {keys_txt}")

    if titles is None:
        if not DATA_JSON.exists():
            print("  data.json: not built yet")
            return
        titles = json.loads(DATA_JSON.read_text(encoding="utf-8"))["titles"]

    total = len(titles)
    posters = len(list(POSTERS_DIR.glob("*.jpg"))) if POSTERS_DIR.exists() else 0
    print(f"  titles: {total}")
    print(f"  posters on disk: {posters}")
    missing = total - cached
    if missing > 0:
        capacity = max(1, len(get_omdb_keys()) * limit)
        days = -(-missing // capacity)
        print(f"  titles still needing OMDb: {missing}  "
              f"(~{days} more days at {capacity}/day)")
    else:
        print("  OMDb: complete for every title")


# =====================================================================
# MAIN
# =====================================================================

def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Build data.json + 128 link chunks from the one-page archive HTML."
    )
    parser.add_argument("--no-omdb", action="store_true",
                        help="skip the OMDb network phase (offline rebuild only)")
    parser.add_argument("--status", action="store_true",
                        help="print pipeline progress and exit")
    parser.add_argument("--download-tsv", action="store_true",
                        help="refresh title.basics.tsv / title.ratings.tsv first")
    parser.add_argument("--omdb-limit", type=int, default=OMDB_DAILY_LIMIT,
                        help=f"max OMDb requests this run (default {OMDB_DAILY_LIMIT})")
    parser.add_argument("--fetch-posters", action="store_true",
                        help="download the missing posters listed in "
                             "posters_index.json (no API key needed), then exit")
    parser.add_argument("--poster-limit", type=int, default=None,
                        help="with --fetch-posters: max posters to download this run")
    parser.add_argument("--html", type=Path, default=ARCHIVE_HTML,
                        help="archive HTML to parse")
    args = parser.parse_args(argv)

    if args.status:
        print_status()
        return 0

    if args.fetch_posters:
        print("=" * 62)
        print("fetch posters from posters_index.json")
        print("=" * 62)
        return fetch_posters_from_index(args.poster_limit)

    t0 = time.time()
    print("=" * 62)
    print("moovies data pipeline")
    print("=" * 62)

    # ---- 0. optional TSV refresh ----
    if args.download_tsv:
        download_tsvs()

    for path in (args.html, BASICS_TSV, RATINGS_TSV):
        if not path.exists():
            print(f"ERROR: missing input {path}")
            return 1

    # ---- 1. clean + parse the HTML ----
    print(f"\n[1/5] parsing {args.html.name} ...")
    records, duplicates = parse_archive_html(args.html)
    print(f"  parsed {len(records)} titles"
          f"{f' ({len(duplicates)} duplicate codes skipped)' if duplicates else ''}")

    wanted = {r["imdb_code"] for r in records}

    # ---- 2. join with the IMDb TSVs ----
    print(f"[2/5] reading {BASICS_TSV.name} (this scans ~1 GB, be patient) ...")
    basics = load_basics(BASICS_TSV, wanted)
    print(f"  matched {len(basics)}/{len(wanted)} in title.basics.tsv")

    print(f"[3/5] reading {RATINGS_TSV.name} ...")
    ratings = load_ratings(RATINGS_TSV, wanted)
    print(f"  matched {len(ratings)}/{len(wanted)} in title.ratings.tsv")

    # ---- 3. version diff ----
    print("[4/5] computing version_added ...")
    baseline, baseline_version = load_baseline()
    new_version = bump_minor(baseline_version)

    titles, links_by_code, stats, unmatched, no_rating = build_titles(
        records, basics, ratings, baseline, new_version, baseline_version
    )
    print(f"  existing (v{baseline_version}): {stats['existing']}   "
          f"new (v{new_version}): {stats['new']}")
    if stats["new"] == 0:
        print(f"  no new titles in this HTML - version stays at {baseline_version}")
    if unmatched:
        print(f"  !! {len(unmatched)} titles not found in title.basics.tsv "
              f"(HTML fallback used):")
        for code, name in unmatched[:20]:
            print(f"       {code}  {name}")

    # ---- 4. OMDb ----
    if args.no_omdb:
        print("[5/5] OMDb phase skipped (--no-omdb)")
    else:
        print("[5/5] OMDb phase ...")
        omdb_phase(titles, args.omdb_limit)

    # ---- 5. write outputs ----
    print("\nwriting outputs ...")
    omdb = load_all_omdb(titles)
    # if this run added nothing, the version does not move
    final_version = new_version if stats["new"] else baseline_version
    meta = build_meta(titles, final_version)
    write_data_json(meta, titles)
    buckets = write_chunks(titles, links_by_code, omdb)

    print(f"  data.json          {DATA_JSON.stat().st_size / 1e6:.2f} MB "
          f"({meta['total_num']} titles)")
    print(f"  chunks/            {CHUNK_COUNT} files, "
          f"sizes {min(len(b) for b in buckets)}-{max(len(b) for b in buckets)}")
    print(f"  OMDb data merged into chunks: {len(omdb)} titles")

    poster_index = build_posters_index(titles)
    write_posters_index(poster_index)
    print(f"  posters_index.json  {len(poster_index)} poster URLs "
          f"({POSTERS_INDEX.stat().st_size / 1e6:.2f} MB)")

    # ---- 6. verify ----
    print("\n[6/6] verifying pipeline ...")
    verify_pipeline(titles, unmatched)

    print("\n" + "-" * 62)
    print(f"meta: {json.dumps(meta, ensure_ascii=False)}")
    print("-" * 62)
    print(f"done in {time.time() - t0:.1f}s")
    print_status(titles)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\ninterrupted - progress is saved, re-run to continue.")
        sys.exit(130)
