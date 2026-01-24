#!/usr/bin/env python3
"""
Generate missing blog images using filename patterns to create prompts.
Images are generated via the Z Image Turbo glif.
"""

import os
import re
import json
import subprocess
import urllib.request
import time

# Language display names for better prompts
LANGUAGES = {
    'czech': 'Czech',
    'danish': 'Danish',
    'dutch': 'Dutch',
    'english': 'English',
    'french': 'French',
    'german': 'German',
    'greek': 'Greek',
    'hungarian': 'Hungarian',
    'italian': 'Italian',
    'norwegian': 'Norwegian',
    'polish': 'Polish',
    'portuguese': 'Portuguese',
    'romanian': 'Romanian',
    'russian': 'Russian',
    'spanish': 'Spanish',
    'swedish': 'Swedish',
    'turkish': 'Turkish',
    'ukrainian': 'Ukrainian',
    'brazilian': 'Brazilian Portuguese',
    'european': 'European Portuguese',
    'british': 'British English',
    'american': 'American English',
}

def filename_to_prompt(filename):
    """Convert a filename to an image generation prompt."""
    # Remove .jpg extension
    name = filename.replace('.jpg', '')

    # Extract language from filename
    lang = None
    for key in LANGUAGES:
        if name.startswith(key):
            lang = LANGUAGES[key]
            break

    # Determine image type based on patterns
    if 'pet-names' in name or 'terms-of-endearment' in name or 'endearment' in name:
        return f"Romantic couple whispering sweet pet names, {lang} cultural elements, warm intimate lighting, soft colors, love and affection, blog header 16:9"

    elif 'date-night' in name:
        return f"Romantic dinner date scene, {lang} restaurant ambiance, candlelight, couple enjoying evening together, elegant setting, blog header 16:9"

    elif 'travel-phrases' in name:
        return f"Couple traveling together with luggage at {lang or 'European'} destination, iconic landmarks in background, adventure and romance, blog header 16:9"

    elif 'meeting-the-family' in name or 'family-phrases' in name:
        return f"Warm family gathering, couple meeting parents, {lang} home setting, welcoming atmosphere, multi-generational, blog header 16:9"

    elif 'texting-slang' in name:
        return f"Modern couple texting on smartphones, casual setting, digital communication, {lang} cultural hints, contemporary style, blog header 16:9"

    elif 'romantic-phrases' in name:
        return f"Romantic couple in love, {lang} setting, hearts and romance, passionate moment, warm colors, blog header 16:9"

    elif 'vs-' in name or 'differences' in name:
        # Language comparison
        langs = re.findall(r'([a-z]+)-vs-([a-z]+)|([a-z]+)-vs-([a-z]+)', name)
        return f"Split screen showing two different cultures, language learning comparison, educational style, clean modern design, blog header 16:9"

    elif 'greetings' in name or 'farewells' in name:
        return f"People greeting each other warmly, {lang} cultural style, friendly handshake or wave, welcoming scene, blog header 16:9"

    elif 'pronunciation' in name:
        return f"Person speaking or learning pronunciation, sound waves, {lang} text elements, educational setting, modern style, blog header 16:9"

    elif 'essential' in name or 'phrases' in name:
        return f"Couple learning {lang} together, study materials, romantic educational scene, warm lighting, blog header 16:9"

    elif 'compliments' in name:
        return f"Person giving sincere compliment, hearts floating, {lang} romantic setting, warm affectionate moment, blog header 16:9"

    elif 'grammar' in name or 'verbs' in name or 'tense' in name:
        return f"Language learning scene, grammar books, {lang} text on chalkboard, educational romantic setting, couple studying, blog header 16:9"

    elif 'mistakes' in name:
        return f"Person learning from mistakes, educational scene, {lang} language learning, supportive atmosphere, blog header 16:9"

    elif 'emotions' in name or 'expressing' in name:
        return f"Person expressing emotions, {lang} setting, emotional connection, expressive faces, warm atmosphere, blog header 16:9"

    elif 'articles' in name:
        return f"Grammar learning scene, articles a/an/the, English language education, clean modern design, blog header 16:9"

    else:
        # Default prompt based on language
        return f"Romantic couple learning {lang or 'languages'} together, warm cozy atmosphere, soft lighting, modern minimalist style, blog header 16:9"

def main():
    # Read missing images
    with open('/tmp/missing-images.txt', 'r') as f:
        missing = [line.strip() for line in f if line.strip()]

    print(f"Found {len(missing)} missing images")

    # Output directory
    output_dir = 'public/blog'
    os.makedirs(output_dir, exist_ok=True)

    # Generate prompts file for reference
    prompts = []
    for filename in missing:
        prompt = filename_to_prompt(filename)
        prompts.append({'filename': filename, 'prompt': prompt})

    with open('/tmp/image-prompts.json', 'w') as f:
        json.dump(prompts, f, indent=2)

    print(f"Prompts saved to /tmp/image-prompts.json")
    print(f"\nFirst 10 prompts:")
    for p in prompts[:10]:
        print(f"  {p['filename']}: {p['prompt'][:60]}...")

if __name__ == '__main__':
    main()
