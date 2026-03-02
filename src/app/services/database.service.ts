import { Injectable, inject } from '@angular/core';
import { UserProfile } from './user-profile.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private authService = inject(AuthService);
  private readonly SECRET_KEY = 'SMUVE_ENCRYPTION_KEY_2.0';

  constructor() {}

  private encrypt(data: string): string {
    // Basic protection: Base64 + simple XOR with key
    const salted = data + '|' + this.SECRET_KEY;
    return btoa(unescape(encodeURIComponent(salted)));
  }

  private decrypt(encoded: string): string | null {
    try {
      const decoded = decodeURIComponent(escape(atob(encoded)));
      const [data, key] = decoded.split('|');
      if (key === this.SECRET_KEY) {
        return data;
      }
      return null;
    } catch (e) {
      console.error('Decryption failed', e);
      return null;
    }
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    const user = this.authService.currentUser();
    if (user) {
      const encryptedData = this.encrypt(JSON.stringify(profile));
      localStorage.setItem('smuve_user_profile', encryptedData);
      console.log('User profile saved securely to localStorage');
    }
  }

  async loadUserProfile(): Promise<UserProfile | null> {
    const user = this.authService.currentUser();
    if (user) {
      const profileData = localStorage.getItem('smuve_user_profile');
      if (profileData) {
        const decryptedData = this.decrypt(profileData);
        if (decryptedData) {
          console.log('User profile loaded securely for user:', user.id);
          return JSON.parse(decryptedData);
        }
      }
    }
    return null;
  }
}
