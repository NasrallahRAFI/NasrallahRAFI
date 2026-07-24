import re
import os

files = [
    'project-waveguide.html',
    'project-thermal.html',
    'project-rendezvous.html',
    'internship-smcv.html',
    'apprenticeship-rafi.html',
    'project-smart-bms.html'
]

def fix_figures_mangling(html):
    # We find all <section class="bg-slate-800/50...">
    pattern = re.compile(r'(<section class="bg-slate-800/50[^"]*">)(.*?)(</section>)', re.DOTALL)
    
    def replacer(match):
        open_tag = match.group(1)
        inner = match.group(2)
        close_tag = match.group(3)
        
        # Remove all existing <figure> and </figure> from inner
        inner = re.sub(r'<figure>\n?', '', inner)
        inner = re.sub(r'\n?</figure>', '', inner)
        
        # Find the first <figcaption
        fc_idx = inner.find('<figcaption')
        if fc_idx != -1:
            # Check if there is already a <figure> wrap (shouldn't be, we just removed it)
            new_inner = inner[:fc_idx] + '<figure>\n' + inner[fc_idx:]
            # Ensure it ends with a newline
            if not new_inner.endswith('\n'):
                new_inner += '\n'
            new_inner += '</figure>\n'
        else:
            new_inner = inner
            
        return f"{open_tag}{new_inner}{close_tag}"

    return re.sub(pattern, replacer, html)

def fix_headings(html):
    # Convert <div ...> inside <h[1-6]> to <span ...>
    pattern = re.compile(r'(<h[1-6][^>]*>)(.*?)(</h[1-6]>)', re.DOTALL)
    def replacer(match):
        open_tag = match.group(1)
        inner = match.group(2)
        close_tag = match.group(3)
        inner = re.sub(r'<div([^>]*)>', r'<span\1>', inner)
        inner = inner.replace('</div>', '</span>')
        return f"{open_tag}{inner}{close_tag}"
    return re.sub(pattern, replacer, html)

def fix_smart_bms(html):
    # Fix h3 skipping h2
    html = html.replace('<h3 class="text-xs font-bold text-slate-300 tracking-[0.2em] uppercase">Engineering Scope</h3>',
                        '<h2 class="text-xs font-bold text-slate-300 tracking-[0.2em] uppercase">Engineering Scope</h2>')
    
    # Fix aria-label on div
    html = html.replace('<div class="smart-bms-chip-row" aria-label="Project technologies">',
                        '<div class="smart-bms-chip-row" role="group" aria-label="Project technologies">')
    
    # Fix dl / dt / dd hierarchy violation
    html = html.replace('<dl class="space-y-3">', '<div class="space-y-3" role="list">')
    html = html.replace('</dl>', '</div>')
    html = re.sub(r'<dt class="([^"]*)">', r'<p class="\1">', html)
    html = html.replace('</dt>', '</p>')
    html = re.sub(r'<dd class="([^"]*)">', r'<p class="\1">', html)
    html = html.replace('</dd>', '</p>')
    
    # Fix img src spaces
    def img_replacer(m):
        src = m.group(1)
        fixed_src = src.replace(' ', '%20')
        return f'src="{fixed_src}"'
    html = re.sub(r'src="([^"]*?Causes Diagram[^"]*?|[^"]*?Algorithm Workflow[^"]*?|[^"]*?Industrial BMS PCB[^"]*?)"', img_replacer, html)
    
    return html

for filename in files:
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()
    
    html = fix_headings(html)
    html = fix_figures_mangling(html)
    
    if filename == 'project-smart-bms.html':
        html = fix_smart_bms(html)
        
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html)
