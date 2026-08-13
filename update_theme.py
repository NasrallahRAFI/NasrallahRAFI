import re
import os

html_path = r"d:\Work\Antigravity\Projects\Nasrallah RAFI Portfolio\Front End\NasrallahRAFI\index.html"
css_path = r"d:\Work\Antigravity\Projects\Nasrallah RAFI Portfolio\Front End\NasrallahRAFI\css\style.css"

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Tailwind dark mode replacements
replacements_html = {
    r'\bbg-slate-900': 'bg-white',
    r'\bbg-slate-800': 'bg-stone-50',
    r'\bbg-slate-700': 'bg-stone-100',
    
    r'\btext-white': 'text-stone-900',
    r'\btext-slate-200': 'text-stone-800',
    r'\btext-slate-300': 'text-stone-700',
    r'\btext-slate-400': 'text-stone-500',
    
    r'\btext-cyan-400': 'text-accent',
    r'\btext-cyan-300': 'text-accent',
    r'\btext-cyan-200': 'text-accent',
    r'\bbg-cyan-500': 'bg-accent',
    
    r'\bborder-slate-800': 'border-stone-200',
    r'\bborder-slate-700': 'border-stone-200',
    
    r'\bfrom-cyan-500': 'from-[#D4AF37]',
    r'\bto-cyan-400': 'to-[#c5a059]',
    r'\bhover:from-cyan-400': 'hover:from-[#c5a059]',
    r'\bhover:to-cyan-300': 'hover:to-[#b8860b]',
    r'\bshadow-cyan-500': 'shadow-[#D4AF37]',
    r'\bhover:shadow-cyan-500': 'hover:shadow-[#D4AF37]',
    
    r'\btext-blue-400': 'text-[#0a66c2]',
    r'\bh-11 px-4.5': 'h-11 px-4', # minor fix
}

for pattern, repl in replacements_html.items():
    html = re.sub(pattern, repl, html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated index.html")

with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

replacements_css = {
    # Replace white text with standard text variable
    r'color:\s*#fff;': 'color: var(--text-color);',
    r'color:\s*rgba\(\s*226\s*,\s*232\s*,\s*240\s*,\s*0\.[0-9]+\s*\);': 'color: var(--text-muted);',
    r'color:\s*rgba\(\s*241\s*,\s*245\s*,\s*249\s*,\s*0\.[0-9]+\s*\);': 'color: var(--text-muted);',
    r'color:\s*rgba\(\s*203\s*,\s*213\s*,\s*225\s*,\s*0\.[0-9]+\s*\);': 'color: var(--text-muted);',
    r'color:\s*rgba\(\s*103\s*,\s*232\s*,\s*249\s*,\s*0\.[0-9]+\s*\);': 'color: var(--text-color);',
    
    # Backgrounds and borders (removing dark colors)
    r'rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*(0\.[0-9]+)\s*\)': lambda m: f'rgba(0, 0, 0, {m.group(1)})',
    r'rgba\(\s*15\s*,\s*23\s*,\s*42\s*,\s*(0\.[0-9]+)\s*\)': lambda m: f'rgba(255, 255, 255, {m.group(1)})',
    r'rgba\(\s*2\s*,\s*6\s*,\s*23\s*,\s*(0\.[0-9]+)\s*\)': lambda m: f'rgba(240, 240, 240, {m.group(1)})',
    r'rgba\(\s*5\s*,\s*12\s*,\s*20\s*,\s*(0\.[0-9]+)\s*\)': lambda m: f'rgba(255, 255, 255, {m.group(1)})',
}

for pattern, repl in replacements_css.items():
    if callable(repl):
        css = re.sub(pattern, repl, css)
    else:
        css = re.sub(pattern, repl, css)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

print("Updated style.css")
