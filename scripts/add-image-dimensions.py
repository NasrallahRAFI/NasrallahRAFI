import re
from urllib.parse import unquote
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGE_TAG = re.compile(r"<img\b[^>]*>", re.IGNORECASE)
SRC_ATTR = re.compile(r"\bsrc=(['\"])(.*?)\1", re.IGNORECASE)

changed = 0
images_updated = 0

for html_path in sorted(ROOT.glob("*.html")):
    source = html_path.read_text(encoding="utf-8")

    def update_tag(match):
        nonlocal_state[0] += 1
        tag = match.group(0)
        src_match = SRC_ATTR.search(tag)
        if not src_match or all(re.search(rf"\b{attribute}=", tag, re.IGNORECASE) for attribute in ("width", "height", "loading", "decoding")):
            return tag

        src = unquote(src_match.group(2).split("?", 1)[0])
        image_path = (html_path.parent / src).resolve()
        if not image_path.exists() or ROOT not in image_path.parents:
            return tag

        try:
            with Image.open(image_path) as image:
                width, height = image.size
        except Exception:
            return tag

        updated = tag
        if not re.search(r"\bwidth=", updated, re.IGNORECASE):
            updated = updated[:-1] + f' width="{width}"' + updated[-1:]
        if not re.search(r"\bheight=", updated, re.IGNORECASE):
            updated = updated[:-1] + f' height="{height}"' + updated[-1:]
        if not re.search(r"\bloading=", updated, re.IGNORECASE):
            loading = "eager" if re.search(r"fetchpriority=['\"]high['\"]", updated, re.IGNORECASE) else "lazy"
            updated = updated[:-1] + f' loading="{loading}"' + updated[-1:]
        if not re.search(r"\bdecoding=", updated, re.IGNORECASE):
            updated = updated[:-1] + ' decoding="async"' + updated[-1:]
        if updated != tag:
            nonlocal_state[1] += 1
        return updated

    nonlocal_state = [0, 0]
    updated_source = IMAGE_TAG.sub(update_tag, source)
    if updated_source != source:
        html_path.write_text(updated_source, encoding="utf-8")
        changed += 1
        images_updated += nonlocal_state[1]

print(f"Image metadata pass completed: {images_updated} images updated across {changed} pages.")
