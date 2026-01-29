#!/usr/bin/env python3
"""
Fix all MDX files where JSX attributes have single quotes containing apostrophes.
Convert single-quoted attributes to double-quoted attributes.
"""

import os
import re
import glob

def fix_jsx_attributes(content):
    """Convert single-quoted JSX attributes to double-quoted."""

    # Match JSX attribute patterns: propName='value'
    # We want to convert to propName="value" where value may contain '

    lines = content.split('\n')
    fixed_lines = []

    for line in lines:
        # Quick check - if no = and ' together, skip
        if '=' not in line or "'" not in line:
            fixed_lines.append(line)
            continue

        # Process each potential attribute
        result = []
        i = 0
        while i < len(line):
            # Look for attribute pattern: word='
            match = re.match(r'(\w+)=\'', line[i:])
            if match:
                attr_name = match.group(1)
                value_start = i + len(match.group(0))

                # Find the end of the value
                # Look for next attribute or tag end
                rest = line[value_start:]

                # Find closing quote - it should be followed by:
                # - space + another attribute (word=)
                # - /
                # - >
                # - newline/end

                end_idx = None
                depth = 0
                for j, c in enumerate(rest):
                    if c == "'" and depth == 0:
                        # Check what comes after
                        after = rest[j+1:j+30] if j+1 < len(rest) else ""
                        # Valid endings
                        if (not after or
                            after[0] in ' \t\n/>' or
                            re.match(r'\s+\w+=', after) or
                            re.match(r'\s*/>', after) or
                            re.match(r'\s*>', after)):
                            end_idx = j
                            break

                if end_idx is not None:
                    value = rest[:end_idx]
                    # Always use double quotes - escape any existing double quotes
                    value_escaped = value.replace('"', '\\"')
                    result.append(f'{attr_name}="{value_escaped}"')
                    i = value_start + end_idx + 1
                    continue

            result.append(line[i])
            i += 1

        fixed_lines.append(''.join(result))

    return '\n'.join(fixed_lines)


def fix_file(filepath):
    """Fix a single MDX file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f'Error reading {filepath}: {e}')
        return False

    fixed = fix_jsx_attributes(content)

    if fixed != content:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed)
            return True
        except Exception as e:
            print(f'Error writing {filepath}: {e}')
            return False
    return False


def main():
    articles_dir = 'src/content/articles'
    mdx_files = glob.glob(f'{articles_dir}/**/*.mdx', recursive=True)

    fixed_count = 0
    for filepath in mdx_files:
        if fix_file(filepath):
            fixed_count += 1

    print(f'Total files fixed: {fixed_count}')


if __name__ == '__main__':
    main()
