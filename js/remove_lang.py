import os
import glob
import re

html_files = glob.glob('*.html')

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove lang.js from head
    content = re.sub(r'\s*<!-- Language Switcher Script -->\s*<script src="lang\.js"></script>', '', content)

    # 2. Remove google translate div
    content = re.sub(r'\s*<div id="google_translate_element" style="display:none;"></div>', '', content)

    # 3. Remove Language Toggle Button
    # Match the comment and the button block up to the closing tag
    
    button_pattern = r'\s*<!-- Language Toggle Button -->\s*<button aria-label="Toggle Language"[^>]*>[\s\S]*?</button>\s*'
    content = re.sub(button_pattern, '', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Processed and cleaned {filepath}")
