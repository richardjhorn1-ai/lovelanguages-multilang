#!/usr/bin/env python3
"""Fix broken quotes in MDX files."""

import os
import re
import glob

def fix_broken_quotes(content):
    """Fix various quote issues in MDX content."""

    # Pattern 1: prop="text 'word" more' - mismatched double then single
    # These need to be normalized

    lines = content.split('\n')
    fixed_lines = []

    for line in lines:
        # Skip if no quotes
        if '=' not in line:
            fixed_lines.append(line)
            continue

        # Fix: word='...' where content has unbalanced quotes
        # Convert all single-quoted props to double-quoted
        result = []
        i = 0
        in_jsx_tag = False

        while i < len(line):
            char = line[i]

            # Detect JSX tag start
            if char == '<' and i + 1 < len(line) and (line[i+1].isupper() or line[i+1].islower()):
                in_jsx_tag = True

            # Detect JSX tag end
            if char == '>' or (char == '/' and i + 1 < len(line) and line[i+1] == '>'):
                in_jsx_tag = False

            result.append(char)
            i += 1

        fixed_lines.append(''.join(result))

    fixed_content = '\n'.join(fixed_lines)

    # More aggressive: fix patterns like ="text 'word" more'
    # This catches the pattern: attr="...text 'word" continuation'
    # Replace with attr="...text 'word' continuation"

    # Pattern: ="([^"]*)'([^"']*)"([^"']*)'
    # This is: double-quote, content with single, double (wrong!), more content, single (wrong!)

    def fix_mismatched(m):
        full = m.group(0)
        # Just escape internal quotes
        attr = m.group(1)
        return f'="{attr}"'

    # Simpler: find lines with ="...'..." " ...'" pattern and fix them
    # Actually - let's just look for the specific broken pattern

    # Pattern: attr="text 'word" more' -> attr="text 'word' more"
    fixed_content = re.sub(
        r'(\w+)="([^"]*)"([^"]*)"',
        lambda m: f'{m.group(1)}="{m.group(2)}\\"{m.group(3)}"',
        fixed_content
    )

    return fixed_content


def fix_specific_patterns(filepath):
    """Fix specific broken patterns in a file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Pattern 1: 'word" - single quote closed by double
    # e.g., 'älskling" -> 'älskling'
    content = re.sub(r"'(\w+)\"", r"'\1'", content)

    # Pattern 2: ="...'word" -> ="...'word'"
    # Find attribute values that start with " but have mismatched quotes
    # This is complex - let's handle line by line

    lines = content.split('\n')
    fixed_lines = []

    for line in lines:
        # Check for pattern: ="text 'word" more'
        if '="' in line and "'" in line:
            # Count quotes to see if they're balanced
            dq = line.count('"')
            sq = line.count("'")

            # If uneven, try to fix
            if dq % 2 == 1:  # Odd number of double quotes is wrong
                # Try to replace trailing double with single or vice versa
                # Common pattern: ="...'word" more'
                # Should be: ="...'word' more"

                # Find "= and count from there
                matches = list(re.finditer(r'(\w+)="', line))
                for match in matches:
                    start = match.end()
                    rest = line[start:]

                    # Find where this attr value should end
                    # Look for pattern where " appears after ' and before next =
                    if "'" in rest:
                        # Check if there's a " before the next = or end
                        sq_pos = rest.find("'")
                        dq_pos = rest.find('"')

                        if dq_pos != -1 and sq_pos != -1:
                            # Complex case - needs manual review
                            pass

        fixed_lines.append(line)

    content = '\n'.join(fixed_lines)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


def main():
    articles_dir = 'src/content/articles'
    mdx_files = glob.glob(f'{articles_dir}/**/*.mdx', recursive=True)

    fixed_count = 0
    for filepath in mdx_files:
        try:
            if fix_specific_patterns(filepath):
                fixed_count += 1
                print(f'Fixed: {filepath}')
        except Exception as e:
            print(f'Error in {filepath}: {e}')

    print(f'\nTotal files fixed: {fixed_count}')


if __name__ == '__main__':
    main()
