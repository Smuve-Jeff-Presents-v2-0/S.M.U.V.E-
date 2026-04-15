import re

# --- Fix ThaSpotComponent ---
with open('src/app/components/tha-spot/tha-spot.component.ts', 'r') as f:
    content = f.read()

# 1. Remove all featuredGame declarations
content = re.sub(r'  featuredGame = computed\(.*?\);?\n', '', content, flags=re.DOTALL)

# 2. Add storefront signals after activeRoom
signals = """  featuredGame = computed(() => this.games().find(g => g.badgeIds?.includes('featured')) || this.games()[0]);
  trendingGames = computed(() => this.games().filter(g => g.badgeIds?.includes('trending')));
  newGames = computed(() => this.games().filter(g => g.badgeIds?.includes('new-drop')));
  genreRails = computed(() => {
    const genres = [...new Set(this.games().map(g => g.genre).filter(Boolean))];
    return genres.map(genre => ({
      title: genre,
      games: this.games().filter(g => g.genre === genre)
    }));
  });\n"""
content = re.sub(r'(activeRoom = signal<string>\(\'all\'\);)\n', r'\1\n' + signals, content)

# 3. Fix previewGame -> openPreview
content = content.replace('this.previewGame(', 'this.openPreview(')

# 4. Remove existing onGameClick, isPlaying, toggleIntel to avoid duplicates
content = re.sub(r'  onGameClick\(game: Game\) \{.*?\n  \}', '', content, flags=re.DOTALL)
content = re.sub(r'  isPlaying\(\) \{.*?\n  \}', '', content, flags=re.DOTALL)
content = re.sub(r'  toggleIntel\(\) \{.*?\n  \}', '', content, flags=re.DOTALL)

# 5. Clean up the handlePresenceAction and re-inject methods once
# We'll use a unique anchor to inject them.
# Let's inject them before getPromotionRoute
methods = """  onGameClick(game: Game) {
    this.launchGame(game);
  }

  isPlaying() {
    return !!this.currentGame();
  }

  toggleIntel() {
    this.showIntelPanel.update((value) => !value);
  }

"""

content = re.sub(r'handlePresenceAction\(entry: SocialPresence\) \{.*?\}',
                 r'handlePresenceAction(entry: SocialPresence) {\n    this.setActiveRoom(entry.roomId);\n    const game = this.getPresenceGame(entry);\n    if (game) {\n      this.openPreview(game);\n      return;\n    }\n  }',
                 content, flags=re.DOTALL)

content = content.replace('  getPromotionRoute', methods + '  getPromotionRoute')

with open('src/app/components/tha-spot/tha-spot.component.ts', 'w') as f:
    f.write(content)

# --- Fix Fallback Feed ---
with open('src/app/hub/tha-spot-feed.fallback.ts', 'r') as f:
    fb_content = f.read()

# Remove misplaced properties from ALL objects (simplified)
fb_content = re.sub(r'"previewVideo": "[^"]*",\s*', '', fb_content)
fb_content = re.sub(r'"bannerImage": "[^"]*",\s*', '', fb_content)

# Correctly add to games only
video = "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-dj-playing-at-a-club-24545-large.mp4"
banner = "https://images.unsplash.com/photo-1514525253361-bee243870eb2?auto=format&fit=crop&w=1200&q=80"

games_match = re.search(r'("games":\s*\[)(.*?)(\]\s*\};)', fb_content, re.DOTALL)
if games_match:
    games_list = games_match.group(2)
    def add_to_game(m):
        obj = m.group(0)
        return obj.replace('{', f'{{\n      "previewVideo": "{video}",\n      "bannerImage": "{banner}",', 1)

    fixed_list = re.sub(r'\{[^{}]*\}', add_to_game, games_list)
    fb_content = fb_content.replace(games_list, fixed_list)

with open('src/app/hub/tha-spot-feed.fallback.ts', 'w') as f:
    f.write(fb_content)
