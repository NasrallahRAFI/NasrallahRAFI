import os
import glob
import re

base_dir = r"d:\Work\Antigravity\Projects\Nasrallah RAFI Portfolio\Front End\NasrallahRAFI"
html_files = glob.glob(os.path.join(base_dir, "*.html"))
exclude = ["index.html", "index-fr.html"]
files_to_process = [f for f in html_files if os.path.basename(f) not in exclude]

for file_path in files_to_process:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # --- THEME BACKGROUNDS & BORDERS ---
    # Convert dark mode backgrounds
    content = re.sub(r'\bbg-slate-900(?:/\d+)?\b', 'theme-bg-main', content)
    content = re.sub(r'\bbg-slate-800(?:/\d+)?\b', 'theme-card-bg', content)
    content = re.sub(r'\bbg-slate-700(?:/\d+)?\b', 'theme-bg-alt', content)
    
    # Convert dark mode borders
    content = re.sub(r'\bborder-slate-800(?:/\d+)?\b', 'theme-border-main/50', content)
    content = re.sub(r'\bborder-slate-700(?:/\d+)?\b', 'theme-border-main', content)
    content = re.sub(r'\bborder-slate-600(?:/\d+)?\b', 'theme-border-main', content)
    
    # Convert dark mode text
    content = re.sub(r'\btext-white\b', 'theme-text-main', content)
    content = re.sub(r'\btext-slate-200\b', 'theme-text-main', content)
    content = re.sub(r'\btext-slate-300\b', 'theme-text-light', content)
    content = re.sub(r'\btext-slate-400\b', 'theme-text-muted', content)
    content = re.sub(r'\btext-slate-500\b', 'theme-text-lighter', content)

    # Convert arbitrary cyan text to accent text
    content = re.sub(r'\btext-cyan-400\b', 'text-accent', content)
    content = re.sub(r'\bhover:text-cyan-400\b', 'hover:text-accent', content)
    content = re.sub(r'\bhover:border-cyan-500(?:/\d+)?\b', 'hover:theme-border-main', content)

    # --- SPECIFIC BUTTONS ---
    # The CTA buttons at the bottom of the project pages
    content = re.sub(
        r'class="inline-flex items-center font-bold theme-text-main theme-card-bg py-3 px-6 rounded-full border theme-border-main hover:theme-border-main hover:-translate-y-1 transition-all" href="https://www.linkedin',
        'class="hero-button hero-button-linkedin" href="https://www.linkedin',
        content
    )
    content = re.sub(
        r'class="inline-flex items-center font-bold theme-text-main theme-card-bg py-3 px-6 rounded-full border theme-border-main hover:theme-border-main hover:-translate-y-1 transition-all" href="mailto:',
        'class="hero-button hero-button-primary" href="mailto:',
        content
    )
    # Also clean up the icons in those CTA buttons
    content = re.sub(r'class="w-5 h-5 ml-2" data-lucide="arrow-up-right"', 'class="w-4 h-4 opacity-80" data-lucide="arrow-up-right"', content)
    content = re.sub(r'class="w-5 h-5 mr-2" data-lucide="mail"', 'class="w-4 h-4" data-lucide="mail"', content)
    
    # Save back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Applied deep theme integration to sub-pages.")
