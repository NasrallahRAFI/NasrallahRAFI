import os
import re

base_dir = r"d:\Work\Antigravity\Projects\Nasrallah RAFI Portfolio\Front End\NasrallahRAFI"
style_css = os.path.join(base_dir, "css", "style.css")
style_min_css = os.path.join(base_dir, "css", "style.min.css")

with open(style_css, "r", encoding="utf-8") as f:
    content = f.read()

# Strip comments and condense whitespace
minified = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
minified = re.sub(r'\s+', ' ', minified)
minified = re.sub(r'\s*([\{\};:,])\s*', r'\1', minified)

with open(style_min_css, "w", encoding="utf-8") as f:
    f.write(minified)

print("Updated style.min.css successfully via Python.")
