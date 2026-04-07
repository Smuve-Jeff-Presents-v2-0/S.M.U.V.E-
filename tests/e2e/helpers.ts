import type { Page } from '@playwright/test';

const AUTH_SALT = 'smuve_v2_executive_secure_link';

export async function seedAuthenticatedSession(page: Page) {
  const user = {
    id: 'user_e2e_exec',
    email: 'e2e@smuve.test',
    artistName: 'Executive Artist',
    role: 'Admin',
    permissions: ['ALL_ACCESS'],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    lastLogin: new Date('2026-01-01T00:00:00.000Z'),
    profileCompleteness: 100,
  };

  const session = Buffer.from(
    unescape(encodeURIComponent(`${JSON.stringify(user)}|${AUTH_SALT}`))
  ).toString('base64');

  await page.addInitScript(
    ({ authSession, profile }) => {
      localStorage.setItem('smuve_auth_session', authSession);
      localStorage.setItem('smuve_user_profile', JSON.stringify(profile));
    },
    {
      authSession: session,
      profile: {
        artistName: user.artistName,
        artistType: 'Producer',
        primaryGenre: 'Electronic',
        level: 7,
      },
    }
  );
}
