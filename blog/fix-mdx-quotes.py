#!/usr/bin/env python3
"""Fix MDX files where JSX props have single quotes containing apostrophes."""

import os
import re
import glob

def fix_jsx_props(content):
    """Convert single-quoted props containing apostrophes to double-quoted."""
    # Pattern matches: prop='value containing ' characters'
    # We need to be careful - only fix props where there's an apostrophe inside

    # Find all JSX-style attributes: name='...'
    # This regex finds attributes where the value contains an apostrophe
    def replace_prop(match):
        prop_name = match.group(1)
        prop_value = match.group(2)
        # Escape any existing double quotes in the value
        prop_value = prop_value.replace('"', '\\"')
        return f'{prop_name}="{prop_value}"'

    # Match: propName='value' where value contains at least one '
    # The tricky part is finding the correct end quote
    # Let's use a different approach - find all lines with props and fix them

    lines = content.split('\n')
    fixed_lines = []

    for line in lines:
        # Skip lines that don't look like JSX props
        if '=' not in line or "'" not in line:
            fixed_lines.append(line)
            continue

        # Find all prop='value' patterns where value contains apostrophe
        # Work character by character to handle nested quotes
        result = []
        i = 0
        while i < len(line):
            # Look for prop=' pattern
            match = re.match(r'(\w+)=\'', line[i:])
            if match:
                prop_name = match.group(1)
                start = i + len(match.group(0))

                # Find the closing quote - it's the last ' before = or end/whitespace
                # Actually need to find balanced quotes
                # For simplicity: count from start, find where the prop ends

                # Look for the end: either next prop (word=) or end of line/tag
                rest = line[start:]

                # Find end - look for pattern like "prop_end' next_prop=" or "prop_end'/>" or "prop_end'\n"
                end_idx = None
                for j in range(len(rest)):
                    if rest[j] == "'":
                        # Check if this could be the end
                        after = rest[j+1:j+20] if j+1 < len(rest) else ""
                        # End if followed by whitespace, /, >, or another prop
                        if j+1 >= len(rest) or rest[j+1] in ' \t\n/>':
                            end_idx = j
                            break
                        elif re.match(r'\s*\w+=', after):
                            end_idx = j
                            break

                if end_idx is not None:
                    value = rest[:end_idx]
                    # Check if value contains apostrophe - if so, use double quotes
                    if "'" in value:
                        value_escaped = value.replace('"', '\\"')
                        result.append(f'{prop_name}="{value_escaped}"')
                    else:
                        result.append(f"{prop_name}='{value}'")
                    i = start + end_idx + 1
                    continue

            result.append(line[i])
            i += 1

        fixed_lines.append(''.join(result))

    return '\n'.join(fixed_lines)


def fix_file(filepath):
    """Fix a single MDX file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    fixed = fix_jsx_props(content)

    if fixed != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(fixed)
        return True
    return False


def main():
    articles_dir = 'src/content/articles'
    mdx_files = glob.glob(f'{articles_dir}/**/*.mdx', recursive=True)

    fixed_count = 0
    for filepath in mdx_files:
        if fix_file(filepath):
            fixed_count += 1
            print(f'Fixed: {filepath}')

    print(f'\nTotal files fixed: {fixed_count}')


if __name__ == '__main__':
    main()
