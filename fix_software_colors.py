import re

def fix_software_colors(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Unify headers to text-accent
    content = re.sub(r'text-\[#0a66c2\]', 'text-accent', content)
    content = re.sub(r'text-blue-400', 'text-accent', content)
    content = re.sub(r'text-purple-400', 'text-accent', content)

    # 2. Unify badges to accent pill style
    # Replace blue badges
    content = re.sub(
        r'bg-blue-900/40\s+text-blue-200\s+text-sm\s+font-medium\s+px-4\s+py-2\s+rounded-full\s+border\s+border-blue-700/50',
        'bg-accent/15 text-accent text-sm font-medium px-4 py-2 rounded-full border border-accent/40',
        content
    )
    # Replace purple badges
    content = re.sub(
        r'bg-purple-900/40\s+text-purple-200\s+text-sm\s+font-medium\s+px-4\s+py-2\s+rounded-full\s+border\s+border-purple-700/50',
        'bg-accent/15 text-accent text-sm font-medium px-4 py-2 rounded-full border border-accent/40',
        content
    )
    # Replace any existing accent/20 to accent/15 border-accent/40 for perfect consistency
    content = re.sub(
        r'bg-accent/20\s+text-accent\s+text-sm\s+font-medium\s+px-4\s+py-2\s+rounded-full\s+border\s+border-accent/50',
        'bg-accent/15 text-accent text-sm font-medium px-4 py-2 rounded-full border border-accent/40',
        content
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_software_colors(r"d:\Work\Antigravity\Projects\Nasrallah RAFI Portfolio\Front End\NasrallahRAFI\index.html")
fix_software_colors(r"d:\Work\Antigravity\Projects\Nasrallah RAFI Portfolio\Front End\NasrallahRAFI\index-fr.html")
print("Software proficiency colors unified successfully!")
