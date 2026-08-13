import re

html_files = [
    r"d:\Work\Antigravity\Projects\Nasrallah RAFI Portfolio\Front End\NasrallahRAFI\index.html",
    r"d:\Work\Antigravity\Projects\Nasrallah RAFI Portfolio\Front End\NasrallahRAFI\index-fr.html"
]

for file_path in html_files:
    try:
        content = open(file_path, 'r', encoding='utf-8').read()
        
        # Primary Button
        content = re.sub(
            r'class="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-gradient-to-r from-\[#D4AF37\] to-\[#c5a059\] hover:from-\[#c5a059\] hover:to-\[#b8860b\] text-slate-950 font-bold text-sm transition-all duration-200 ease-\[cubic-bezier\(0.16,1,0.3,1\)\] shadow-lg shadow-\[#D4AF37\]/25 hover:shadow-\[#D4AF37\]/40 hover:-translate-y-0.5 active:scale-\[0.98\]"',
            'class="hero-button hero-button-primary"',
            content
        )
        # Remove margin left/right on icons for primary button
        content = re.sub(r'class="ml-2 w-4 h-4"', 'class="w-4 h-4"', content)

        # LinkedIn Button
        content = re.sub(
            r'class="inline-flex items-center justify-center h-11 px-4 rounded-xl border theme-border-main/80 theme-bg-alt/60 hover:theme-bg-alt hover:border-blue-500/60 theme-text-muted hover:theme-text-main font-semibold text-sm transition-all duration-200 ease-\[cubic-bezier\(0.16,1,0.3,1\)\] hover:-translate-y-0.5 active:scale-\[0.98\]"',
            'class="hero-button hero-button-linkedin"',
            content
        )
        
        # Also clean up the SVG margins inside LinkedIn button
        content = re.sub(r'class="w-4 h-4 mr-2 text-\[#0a66c2\] fill-current"', 'class="w-4 h-4 fill-current"', content)
        content = re.sub(r'class="ml-1.5 w-3.5 h-3.5 theme-text-lighter"', 'class="w-3.5 h-3.5 opacity-80"', content)
        
        # CV Button
        content = re.sub(
            r'class="inline-flex items-center justify-center h-11 px-4 rounded-xl border theme-border-main/80 theme-bg-alt/60 hover:theme-bg-alt hover:border-\[#c5a059\]/60 theme-text-muted hover:text-accent font-semibold text-sm transition-all duration-200 ease-\[cubic-bezier\(0.16,1,0.3,1\)\] hover:-translate-y-0.5 active:scale-\[0.98\]"',
            'class="hero-button hero-button-outline"',
            content
        )
        content = re.sub(r'class="w-4 h-4 mr-2 text-accent"', 'class="w-4 h-4 text-accent"', content)

        open(file_path, 'w', encoding='utf-8').write(content)
    except Exception as e:
        print(e)
        
print("Updated HTML buttons")
