import os
import glob

base_dir = r"d:\Work\Antigravity\Projects\Nasrallah RAFI Portfolio\Front End\NasrallahRAFI"
html_files = glob.glob(os.path.join(base_dir, "*.html"))
js_files = glob.glob(os.path.join(base_dir, "js", "*.js"))
all_files = html_files + js_files

found = False
for file_path in all_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'theme-volt' in content or 'theme-obsidian' in content:
        print(f"Found in: {os.path.basename(file_path)}")
        found = True

if not found:
    print("Not found anywhere.")
