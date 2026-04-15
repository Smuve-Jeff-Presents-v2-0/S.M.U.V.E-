import re

with open('src/app/hub/tha-spot-feed.fallback.ts', 'r') as f:
    content = f.read()

# Remove any misplaced previewVideo/bannerImage from rules
content = re.sub(r'"previewVideo": "[^"]*",', '', content)
content = re.sub(r'"bannerImage": "[^"]*",', '', content)

# Now add them correctly to all games
video = "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-dj-playing-at-a-club-24545-large.mp4"
banner = "https://images.unsplash.com/photo-1514525253361-bee243870eb2?auto=format&fit=crop&w=1200&q=80"

# Target the games array and insert props into each object
games_pattern = re.compile(r'("games":\s*\[)(.*?)(\])', re.DOTALL)
def fix_games(match):
    prefix = match.group(1)
    games_list = match.group(2)
    suffix = match.group(3)

    # Split by game objects
    objs = re.split(r'(\{[^{}]*\})', games_list)
    new_objs = []
    for part in objs:
        if part.startswith('{'):
            # It's a game object, add properties
            part = part.replace('{', f'{{\n      "previewVideo": "{video}",\n      "bannerImage": "{banner}",', 1)
        new_objs.append(part)

    return prefix + "".join(new_objs) + suffix

content = games_pattern.sub(fix_games, content)

with open('src/app/hub/tha-spot-feed.fallback.ts', 'w') as f:
    f.write(content)
