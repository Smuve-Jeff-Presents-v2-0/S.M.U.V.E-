import { Injectable, inject } from '@angular/core';
import { UserProfile } from './user-profile.service';
import { LoggingService } from './logging.service';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private logger = inject(LoggingService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private API_URL = 'https://smuve-v4-backend-9951606049235487441.onrender.com/api';

  async saveUserProfile(profile: UserProfile): Promise<void> {
    const user = this.authService.currentUser();
    if (user) {
      try {
        await firstValueFrom(this.http.post(`${this.API_URL}/profile`, {
          userId: user.id,
          profileData: profile
        }));
        this.logger.info('User profile saved securely to Render Postgres');
      } catch (error) {
        this.logger.error('Failed to save profile to backend', error);
        localStorage.setItem('smuve_user_profile_backup', JSON.stringify(profile));
      }
    }
  }

  async loadUserProfile(): Promise<UserProfile | null> {
    const user = this.authService.currentUser();
    if (user) {
      try {
        const profile = await firstValueFrom(this.http.get<UserProfile>(`${this.API_URL}/profile/${user.id}`));
        this.logger.info('User profile loaded securely from Render Postgres');
        return profile;
      } catch (error) {
        this.logger.error('Failed to load profile from backend', error);
        const backup = localStorage.getItem('smuve_user_profile_backup');
        return backup ? JSON.parse(backup) : null;
      }
    }
    return null;
  }
}
