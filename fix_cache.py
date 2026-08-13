import os
import glob
import re

base_dir = r"d:\Work\Antigravity\Projects\Nasrallah RAFI Portfolio\Front End\NasrallahRAFI"
html_files = glob.glob(os.path.join(base_dir, "*.html"))

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Append cache buster to theme.js
    content = re.sub(r'src="js/theme\.js(\?v=\d+)?"', 'src="js/theme.js?v=6"', content)

    # Save back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Updated cache busters for theme.js in {len(html_files)} files.")
