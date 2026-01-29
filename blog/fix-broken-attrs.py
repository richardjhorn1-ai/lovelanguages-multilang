#!/usr/bin/env python3
"""
Fix broken attribute values where quotes are mismatched.
E.g., example="text 'word" more' -> example="text 'word' more"
"""

import os
import re
import glob

def fix_line(line):
    """Fix broken quote patterns in a line."""

    # Pattern: attr="...text..."...more...
    # The issue is when there's a " that shouldn't be there (in the middle)

    # Look for JSX components (start with <Capital)
    if not re.search(r'<[A-Z]', line):
        return line

    # Find attribute definitions
    # Match: word="..."
    result = []
    i = 0

    while i < len(line):
        # Look for attr="
        match = re.match(r'(\w+)="', line[i:])
        if match:
            attr_name = match.group(1)
            value_start = i + len(match.group(0))

            # Now find the proper end of this value
            # It should end with " followed by:
            # - whitespace + new attr
            # - />
            # - >
            # - end of line

            rest = line[value_start:]

            # Check if this is a broken pattern (has " followed by non-ending stuff)
            # Look for the pattern: text "word" more'
            # or: text " something

            # Find all " positions
            quote_positions = [j for j, c in enumerate(rest) if c == '"']

            if len(quote_positions) >= 1:
                # Check each " to see if it's the correct closing quote
                for q_idx, q_pos in enumerate(quote_positions):
                    after = rest[q_pos+1:q_pos+30] if q_pos+1 < len(rest) else ""

                    # Valid ending: space+attr, />, >, EOL
                    if (not after or
                        after[0] in ' \t\n' or
                        after.startswith('/>') or
                        after.startswith('>') or
                        re.match(r'\s+\w+=', after)):
                        # This is the valid end quote
                        value = rest[:q_pos]

                        # Check if value contains unescaped " - if so, it's broken
                        if '"' not in value:
                            result.append(f'{attr_name}="{value}"')
                            i = value_start + q_pos + 1
                            break
                        else:
                            # There are quotes inside - we need to escape them or fix them
                            # Replace internal " with '
                            value_fixed = value.replace('"', "'")
                            result.append(f'{attr_name}="{value_fixed}"')
                            i = value_start + q_pos + 1
                            break
                else:
                    # No valid ending found
                    result.append(line[i])
                    i += 1
            else:
                result.append(line[i])
                i += 1
        else:
            result.append(line[i])
            i += 1

    return ''.join(result)


def fix_file(filepath):
    """Fix a single MDX file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return False

    lines = content.split('\n')
    fixed_lines = [fix_line(line) for line in lines]
    fixed = '\n'.join(fixed_lines)

    if fixed != content:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed)
            return True
        except Exception as e:
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
