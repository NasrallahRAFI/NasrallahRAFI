import re

files = [
    r"d:\Work\Antigravity\Projects\Nasrallah RAFI Portfolio\Front End\NasrallahRAFI\index.html",
    r"d:\Work\Antigravity\Projects\Nasrallah RAFI Portfolio\Front End\NasrallahRAFI\index-fr.html"
]

for file_path in files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 1. Increase spacing on Section Headings (h2)
        # Find: h2 class="... mb-8" and change to mb-12
        content = re.sub(
            r'<h2 class="(.*?)\bmb-8\b(.*?)"',
            r'<h2 class="\1mb-12\2"',
            content
        )

        # 2. Increase padding on skill-group, patent-card, project-card
        # Find p-6 and change to p-8 md:p-10 for these cards
        content = re.sub(
            r'class="(skill-group|reveal|patent-card|project-card)(.*?) p-6 ',
            r'class="\1\2 p-8 md:p-10 ',
            content
        )
        content = re.sub(
            r'class="p-6 rounded-xl border',
            r'class="p-8 md:p-10 rounded-xl border',
            content
        )
        
        # 3. "Skills and Tools" grid gaps
        content = re.sub(
            r'<div class="grid grid-cols-1 gap-8">',
            r'<div class="grid grid-cols-1 gap-12">',
            content
        )
        
        # 4. Technical Expertise List gap-y
        content = re.sub(
            r'gap-x-8 gap-y-2',
            r'gap-x-8 gap-y-4',
            content
        )
        
        # 5. Software Proficiencies gaps
        content = re.sub(
            r'gap-x-6 gap-y-4',
            r'gap-x-8 gap-y-8',
            content
        )
        content = re.sub(
            r'class="flex flex-wrap gap-2',
            r'class="flex flex-wrap gap-3',
            content
        )
        # Adjust badge padding px-3 py-1.5 to px-4 py-2
        content = re.sub(
            r'px-3 py-1.5',
            r'px-4 py-2',
            content
        )
        
        # 6. Projects text spacing
        # Increase gap inside project card if any, or ul lists
        content = re.sub(
            r'<ul class="(.*?)space-y-2(.*?)">',
            r'<ul class="\1space-y-4\2">',
            content
        )
        
        # Add margin bottom to h4 inside Software Proficiencies
        content = re.sub(
            r'<h4 class="(.*?)mb-2(.*?)">',
            r'<h4 class="\1mb-4\2">',
            content
        )

        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

print("Updated spacing!")
