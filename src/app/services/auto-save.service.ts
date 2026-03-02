import { Injectable, inject, OnDestroy } from '@angular/core';
import { UserProfileService } from './user-profile.service';
import { AuthService } from './auth.service';
import { interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AutoSaveService implements OnDestroy {
  private profileService = inject(UserProfileService);
  private authService = inject(AuthService);
  private autoSaveSub?: Subscription;

  constructor() {
    // Start auto-save every 30 seconds if authenticated
    this.autoSaveSub = interval(30000).subscribe(() => {
      if (this.authService.isAuthenticated()) {
        this.saveCurrentState();
      }
    });
  }

  private async saveCurrentState() {
    console.log('Auto-saving application state...');
    try {
      await this.profileService.updateProfile(this.profileService.profile());
      console.log('Auto-save successful');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  ngOnDestroy() {
    this.autoSaveSub?.unsubscribe();
  }
}
