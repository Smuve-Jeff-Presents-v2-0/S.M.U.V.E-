import sys
import os

def replace_math_random(content):
    # In AuthService, generateUserId and verification codes
    # We should use crypto.getRandomValues or crypto.randomUUID

    # generateUserId
    content = content.replace(
        "return `user_${Date.now()}_${Math.random().toString(16).slice(2)}`;" ,
        "return `user_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`;"
    )

    # verificationCode
    verification_fix = """
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const code = (100000 + (array[0] % 900000)).toString();
    """

    content = content.replace(
        "verificationCode: Math.floor(100000 + Math.random() * 900000).toString(),",
        "verificationCode: (100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000)).toString(),"
    )

    content = content.replace(
        "user.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();",
        "user.verificationCode = (100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000)).toString();"
    )

    return content

# Apply to AuthService
with open('src/app/services/auth.service.ts', 'r') as f:
    auth_content = f.read()
auth_content = replace_math_random(auth_content)
with open('src/app/services/auth.service.ts', 'w') as f:
    f.write(auth_content)

# Apply to server/index.js (use crypto module)
with open('server/index.js', 'r') as f:
    server_content = f.read()

# Add crypto requirement if not present
if "const crypto = require('crypto');" not in server_content:
    server_content = "const crypto = require('crypto');\n" + server_content

server_content = server_content.replace(
    "const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;" ,
    "const jobId = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;"
)

with open('server/index.js', 'w') as f:
    f.write(server_content)

# Fix the QuickFilter error in ThaSpotComponent
with open('src/app/components/tha-spot/tha-spot.component.ts', 'r') as f:
    ts_content = f.read()

# The error was: activeFilters.includes(filter) where filter might be string
# Let's add the missing methods if they were deleted or fix the type issue.

# Check if methods are missing
if 'setSearchQuery' not in ts_content:
    missing_methods = """
  setSearchQuery(q: string) { this.searchQuery.set(q); }
  setSortMode(m: GameSortMode) { this.sortMode.set(m); }
  setActiveGenre(g: string) { this.activeGenre.set(g); }
  toggleQuickFilter(f: QuickFilter) {
    this.quickFilters.update(fs => fs.includes(f) ? fs.filter(e => e !== f) : [...fs, f]);
  }
"""
    ts_content = ts_content.replace("hasRail(railId: string): boolean {", missing_methods + "\n  hasRail(railId: string): boolean {")

with open('src/app/components/tha-spot/tha-spot.component.ts', 'w') as f:
    f.write(ts_content)
