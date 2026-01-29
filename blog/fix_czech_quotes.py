#!/usr/bin/env python3
import os
import glob

count = 0
for filepath in glob.glob('src/content/articles/**/*.mdx', recursive=True):
    with open(filepath, 'r') as f:
        content = f.read()
    if '„' in content or '"' in content:
        new_content = content.replace('„', "'").replace('"', "'")
        with open(filepath, 'w') as f:
            f.write(new_content)
        count += 1
        print(f'Fixed: {filepath}')

print(f'Done - fixed {count} files')
