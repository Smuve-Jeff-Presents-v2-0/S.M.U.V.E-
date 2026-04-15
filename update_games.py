import sys
import re

with open('src/app/hub/tha-spot-feed.fallback.ts', 'r') as f:
    content = f.read()

# Add previewVideo and bannerImage to all games
video = "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-dj-playing-at-a-club-24545-large.mp4"
banner = "https://images.unsplash.com/photo-1514525253361-bee243870eb2?auto=format&fit=crop&w=1200&q=80"

def add_props(match):
    inner = match.group(1)
    if '"previewVideo"' not in inner:
        inner = f'\n      "previewVideo": "{video}",\n      "bannerImage": "{banner}",{inner}'
    return f'{{{inner}}}'

# Target games list elements
content = re.sub(r'\{([^{}]*"id":\s*"\d+"[^{}]*)\}', add_props, content)

with open('src/app/hub/tha-spot-feed.fallback.ts', 'w') as f:
    f.write(content)
