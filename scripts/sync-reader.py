#!/usr/bin/env python3
"""Project reviewed Berry Markdown; only --verify-public uses anonymous network reads."""

import argparse
import hashlib
import json
import posixpath
import re
import subprocess
from pathlib import Path, PurePosixPath
from urllib.parse import quote, unquote, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "docs/reader-sources.json"
LOCK = ROOT / "docs/reader-lock.json"
OUTPUT = ROOT / "apps/web/src/content/manual"
OWNERS = {"berry-desktop"}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_manifest():
    raw = MANIFEST.read_bytes()
    manifest = json.loads(raw)
    assert manifest["schema"] == 1
    assert set(manifest["repositories"]) == OWNERS
    ids, paths, orders = set(), set(), set()
    for owner, repo in manifest["repositories"].items():
        assert re.fullmatch(r"[0-9a-f]{40}", repo["revision"])
        assert repo["url"] == f"https://github.com/yeuanneberry/{owner}"
    for chapter in manifest["chapters"]:
        assert re.fullmatch(r"[a-z]+(?:-[a-z]+)*", chapter["id"])
        assert chapter["id"] not in ids
        ids.add(chapter["id"])
        assert chapter["repository"] in OWNERS
        source = PurePosixPath(chapter["path"])
        assert not source.is_absolute() and ".." not in source.parts
        assert source.suffix == ".md"
        key = (chapter["repository"], str(source))
        assert key not in paths
        paths.add(key)
        assert chapter["group"] in {"Desktop", "Setup", "Reference"}
        assert isinstance(chapter["order"], int) and chapter["order"] not in orders
        orders.add(chapter["order"])
    return manifest, digest(raw)


def source_url(manifest, chapter, path=None):
    repo = manifest["repositories"][chapter["repository"]]
    return f'{repo["url"]}/blob/{repo["revision"]}/{quote(path or chapter["path"], safe="/")}'


def select_body(chapter, raw):
    text = raw.decode("utf-8")
    if section := chapter.get("section"):
        start, end = section["start"] + "\n", section["end"] + "\n"
        assert text.count(start) == 1 and text.count(end) == 1
        selected = text.split(start, 1)[1].split(end, 1)[0].strip()
        text = f'# {section["title"]}\n\n{selected}\n'
    assert text.startswith("# ") and len(re.findall(r"^# ", text, re.M)) == 1
    assert not re.search(r"\bLKT\b|lktcomph", text, re.I), "Non-Berry source content"
    assert not re.search(r"<\s*(?:script|iframe)\b", text, re.I)
    return text


def render_body(manifest, chapter, selected):
    local = {
        (item["repository"], item["path"]): item
        for item in manifest["chapters"] if "section" not in item
    }

    def link(match):
        label, target = match.groups()
        parts = urlsplit(target)
        if parts.scheme or parts.netloc or target.startswith("#"):
            return match.group(0)
        assert not parts.path.startswith("/"), "Unexpected absolute source link"
        path = posixpath.normpath(posixpath.join(posixpath.dirname(chapter["path"]), parts.path))
        assert path != ".." and not path.startswith("../")
        target_chapter = local.get((chapter["repository"], path))
        url = f'/docs/{target_chapter["id"]}/' if target_chapter else source_url(manifest, chapter, path)
        if parts.query:
            url += "?" + parts.query
        if parts.fragment:
            url += "#" + parts.fragment
        return f"[{label}]({url})"

    text = re.sub(r"\[([^\]]+)\]\(([^\s)]+)\)", link, selected)
    return text.rstrip() + "\n"


def project(manifest, source_roots):
    files, receipts = {}, []
    checked_links = set()
    for chapter in manifest["chapters"]:
        owner = chapter["repository"]
        revision = manifest["repositories"][owner]["revision"]
        raw = subprocess.run(
            ["git", "-C", str(source_roots[owner]), "show", f'{revision}:{chapter["path"]}'],
            check=True, capture_output=True,
        ).stdout
        selected = select_body(chapter, raw)
        body = render_body(manifest, chapter, selected)
        # Resolve every emitted pinned source reference against committed Git
        # objects, including chapters deliberately outside this reader.
        prefix = f'{manifest["repositories"][owner]["url"]}/blob/{revision}/'
        for target in re.findall(re.escape(prefix) + r"([^\s)]+)", body):
            path = unquote(urlsplit(target).path)
            key = (owner, path)
            if key not in checked_links:
                subprocess.run(
                    ["git", "-C", str(source_roots[owner]), "cat-file", "-e", f"{revision}:{path}"],
                    check=True, capture_output=True,
                )
                checked_links.add(key)
        metadata = {key: chapter[key] for key in ("title", "description", "group", "order")}
        metadata.update({
            "repository": owner, "sourcePath": chapter["path"],
            "sourceUrl": source_url(manifest, chapter), "sourceRevision": revision,
            "sourcePublished": manifest["repositories"][owner]["published"],
            "reviewed": manifest["reviewed"], "generated": True,
        })
        frontmatter = "\n".join(f"{key}: {json.dumps(value)}" for key, value in metadata.items())
        data = f"---\n{frontmatter}\n---\n\n{body}".encode()
        files[f'{chapter["id"]}.md'] = data
        receipts.append({
            "id": chapter["id"], "sourceSha256": digest(raw),
            "selectedSha256": digest(selected.encode()), "projectionSha256": digest(data),
        })
    return files, receipts


def verify(manifest, manifest_hash):
    lock = json.loads(LOCK.read_bytes())
    assert lock["schema"] == 1 and lock["manifestSha256"] == manifest_hash
    expected = {f'{chapter["id"]}.md' for chapter in manifest["chapters"]}
    assert {path.name for path in OUTPUT.iterdir()} == expected, "Unexpected/missing reader file"
    receipts = {entry["id"]: entry for entry in lock["chapters"]}
    assert set(receipts) == {chapter["id"] for chapter in manifest["chapters"]}
    for chapter in manifest["chapters"]:
        data = (OUTPUT / f'{chapter["id"]}.md').read_bytes()
        assert digest(data) == receipts[chapter["id"]]["projectionSha256"], "Reader drift"
    print(json.dumps({"status": "PASS", "check": "local reader integrity", "chapters": len(expected)}))


def verify_public(manifest, manifest_hash):
    verify(manifest, manifest_hash)
    receipts = {item["id"]: item for item in json.loads(LOCK.read_bytes())["chapters"]}
    targets = {}
    for chapter in manifest["chapters"]:
        owner = chapter["repository"]
        targets[(owner, chapter["path"])] = receipts[chapter["id"]]["sourceSha256"]
        repo = manifest["repositories"][owner]
        prefix = f'{repo["url"]}/blob/{repo["revision"]}/'
        body = (OUTPUT / f'{chapter["id"]}.md').read_text()
        for target in re.findall(re.escape(prefix) + r"([^\s)\"]+)", body):
            path = unquote(urlsplit(target).path)
            assert ".." not in PurePosixPath(path).parts and not path.startswith("/")
            targets.setdefault((owner, path), None)
    for (owner, path), expected in sorted(targets.items()):
        repo = manifest["repositories"][owner]
        url = f'https://raw.githubusercontent.com/yeuanneberry/{owner}/{repo["revision"]}/{quote(path, safe="/")}'
        # urllib reads no Git credentials, credential helper, token or netrc.
        request = Request(url, headers={"User-Agent": "berry-reader-source-check"})
        with urlopen(request, timeout=30) as response:
            assert response.status == 200
            assert urlsplit(response.url).hostname == "raw.githubusercontent.com"
            raw = response.read()
        if expected:
            assert digest(raw) == expected, f"Anonymous source mismatch: {path}"
    print(json.dumps({"status": "PASS", "check": "anonymous pinned public sources",
                      "files": len(targets), "writes": 0, "authentication": False}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true", help="Refresh from reviewed committed sources")
    mode.add_argument("--check", action="store_true", help="Compare to the pinned upstream revisions")
    mode.add_argument("--verify", action="store_true", help="Verify local projections without upstream access")
    mode.add_argument("--verify-public", action="store_true", help="Read exact pinned sources anonymously and compare source hashes")
    parser.add_argument("--berry-desktop", type=Path)
    parser.add_argument("--prune", action="store_true", help="Remove reviewed retired chapter projections during --write")
    args = parser.parse_args()
    manifest, manifest_hash = read_manifest()
    if args.verify:
        verify(manifest, manifest_hash)
        return
    if args.verify_public:
        verify_public(manifest, manifest_hash)
        return
    assert args.berry_desktop, "The canonical Berry desktop repository is required"
    files, receipts = project(manifest, {"berry-desktop": args.berry_desktop})
    lock = {"schema": 1, "manifestSha256": manifest_hash, "chapters": receipts}
    lock_bytes = (json.dumps(lock, indent=2) + "\n").encode()
    if args.write:
        OUTPUT.mkdir(parents=True, exist_ok=True)
        retired = {path.name for path in OUTPUT.iterdir()} - files.keys()
        assert not retired or args.prune, "Review removed chapters and use --prune"
        for name in retired:
            path = OUTPUT / name
            assert path.suffix == ".md" and path.is_file() and not path.is_symlink()
        for name in retired:
            (OUTPUT / name).unlink()
        for name, data in files.items():
            (OUTPUT / name).write_bytes(data)
        LOCK.write_bytes(lock_bytes)
    else:
        assert LOCK.read_bytes() == lock_bytes, "Source receipt drift"
        for name, data in files.items():
            assert (OUTPUT / name).read_bytes() == data, f"Reader/source mismatch: {name}"
    verify(manifest, manifest_hash)
    print(json.dumps({"status": "PASS", "check": "pinned Berry sources", "mode": "write" if args.write else "check"}))


if __name__ == "__main__":
    try:
        main()
    except (AssertionError, OSError, ValueError, KeyError, subprocess.CalledProcessError) as error:
        raise SystemExit(f"Reader check failed: {error}") from None
