import re
import os

html_files = [
    r"d:\Work\Antigravity\Projects\Nasrallah RAFI Portfolio\Front End\NasrallahRAFI\index.html",
    r"d:\Work\Antigravity\Projects\Nasrallah RAFI Portfolio\Front End\NasrallahRAFI\index-fr.html"
]

css_file = r"d:\Work\Antigravity\Projects\Nasrallah RAFI Portfolio\Front End\NasrallahRAFI\css\style.css"
js_file = r"d:\Work\Antigravity\Projects\Nasrallah RAFI Portfolio\Front End\NasrallahRAFI\js\theme.js"

# 1. Update JS
js_content = open(js_file, 'r', encoding='utf-8').read()

js_content = re.sub(
    r"const THEMES = \[.*?\];",
    "const THEMES = ['theme-glass', 'theme-deepsea'];",
    js_content
)

js_content = re.sub(
    r"const THEME_META = \{.*?\};",
    "const THEME_META = {\n    'theme-glass': { icon: 'sun', label: 'Classic' },\n    'theme-deepsea': { icon: 'moon', label: 'Deep Sea' },\n};",
    js_content,
    flags=re.DOTALL
)

js_content = re.sub(
    r"const THEME_COLOR = \{.*?\};",
    "const THEME_COLOR = {\n    'theme-glass': '#D4AF37',\n    'theme-deepsea': '#2dd4bf',\n};",
    js_content,
    flags=re.DOTALL
)

open(js_file, 'w', encoding='utf-8').write(js_content)


# 2. Update CSS
css_content = open(css_file, 'r', encoding='utf-8').read()

# Add new custom classes to CSS
custom_classes = """
/* Theme Classes for light/dark mode */
.theme-bg-main { background-color: var(--bg-color); }
.theme-bg-alt { background-color: var(--bg-alt); }
.theme-bg-alt-2 { background-color: var(--bg-alt-2); }
.theme-text-main { color: var(--text-color); }
.theme-text-muted { color: var(--text-muted); }
.theme-text-light { color: var(--text-light); }
.theme-text-lighter { color: var(--text-lighter); }
.theme-border-main { border-color: var(--border-color); }
"""

if "/* Theme Classes" not in css_content:
    css_content = css_content + custom_classes

# We need to make sure :root has the light theme variables (already does)
# Let's add --bg-alt, --bg-alt-2, etc. to :root
if "--bg-alt:" not in css_content:
    css_content = css_content.replace(
        "--bg-color: #fbfbfb;", 
        "--bg-color: #ffffff;\n    --bg-alt: #fbfbfb;\n    --bg-alt-2: #f5f5f4;\n    --border-color: #e5e7eb;\n    --text-light: #57534e;\n    --text-lighter: #78716c;"
    )

# Now update theme-deepsea
deepsea_vars = """html.theme-deepsea {
    --primary-rgb: 20, 184, 166;
    --secondary-rgb: 16, 185, 129;
    --accent-color: #2dd4bf;
    --accent-rgb: var(--primary-rgb);
    --bg-color: #020617;
    --bg-alt: #0f172a;
    --bg-alt-2: #1e293b;
    --text-color: #f8fafc;
    --text-muted: #e2e8f0;
    --text-light: #cbd5e1;
    --text-lighter: #94a3b8;
    --border-color: #1e293b;
    
    --glass-bg: rgba(2, 6, 23, 0.5);
    --glass-border: rgba(255, 255, 255, 0.05);
    --glass-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
    --card-bg: rgba(15, 23, 42, 0.42);
    --border-accent: rgba(20, 184, 166, 0.15);
}"""

css_content = re.sub(r'html\.theme-deepsea \{.*?\}', deepsea_vars, css_content, flags=re.DOTALL)

open(css_file, 'w', encoding='utf-8').write(css_content)


# 3. Update HTML Files
replacements_html = {
    r'\bbg-white\b': 'theme-bg-main',
    r'\bbg-stone-50\b': 'theme-bg-alt',
    r'\bbg-stone-100\b': 'theme-bg-alt-2',
    r'\btext-stone-900\b': 'theme-text-main',
    r'\btext-stone-800\b': 'theme-text-muted',
    r'\btext-stone-700\b': 'theme-text-light',
    r'\btext-stone-500\b': 'theme-text-lighter',
    r'\bborder-stone-200\b': 'theme-border-main',
    # Unhide theme button
    r'id="theme-toggle-button" style="display: none;"': 'id="theme-toggle-button"',
    r"const THEMES = \['theme-glass', 'theme-volt', 'theme-deepsea', 'theme-obsidian'\];": "const THEMES = ['theme-glass', 'theme-deepsea'];"
}

for html_file in html_files:
    if not os.path.exists(html_file):
        continue
    content = open(html_file, 'r', encoding='utf-8').read()
    
    for pattern, repl in replacements_html.items():
        content = re.sub(pattern, repl, content)
        
    open(html_file, 'w', encoding='utf-8').write(content)

import shutil
shutil.copy(css_file, css_file.replace('style.css', 'style.min.css'))

print("Done updating themes.")
