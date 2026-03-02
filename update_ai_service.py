import sys

with open('src/app/services/ai.service.ts', 'r') as f:
    content = f.read()

# Add to generateSystemInstruction
campaigns_snippet = """
    const campaignsList = profile.marketingCampaigns
      .map((c) => `- [${c.name}] Status: ${c.status}, Budget: $${c.budget}, Platforms: ${c.platforms.join(', ')}`)
      .join('\n');
"""

marker = "const productionSecretsList ="
if "const campaignsList =" not in content:
    content = content.replace(marker, campaigns_snippet + "\n    " + marker)

# Add to system instruction return
profile_marker = "- Expertise (1–10):"
campaign_instruction = "- Marketing Campaigns:\n${campaignsList || 'No active campaigns.'}"

if "- Marketing Campaigns:" not in content:
    content = content.replace(profile_marker, campaign_instruction + "\n" + profile_marker)

# Update strategicDecrees logic
decree_marker = "strategicDecrees = signal<string[]>([\n    'Establish dominance in your primary genre.',"
new_decrees = """strategicDecrees = signal<string[]>([
    'Establish dominance in your primary genre.',
    'Optimize metadata for global DSP search algorithms.',
    'Scale your marketing budget to follow high-performing viral hooks.',
    'Your current marketing campaigns are being monitored. Perform better.',
"""

if "'Your current marketing campaigns are being monitored. Perform better.'" not in content:
    content = content.replace(marker, "") # Just making sure I don't break things, actually I should be careful with replace

with open('src/app/services/ai.service.ts', 'w') as f:
    f.write(content)
