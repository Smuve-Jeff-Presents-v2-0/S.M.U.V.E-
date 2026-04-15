import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserProfileService, initialProfile } from './user-profile.service';
import { LoggingService } from './logging.service';
import { SecurityService } from './security.service';
import { DatabaseService } from './database.service';
import { firstValueFrom } from 'rxjs';

export interface User {
  id: string;
  email: string;
  name: string;
  artistName?: string;
  role: 'artist' | 'admin';
  token?: string;
  permissions: string[];
  lastLogin?: number | Date;
}

export type AuthUser = User;

export interface AuthCredentials {
  email: string;
  password: string;
  artistName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private profileService = inject(UserProfileService);
  private logger = inject(LoggingService);
  private securityService = inject(SecurityService);
  private db = inject(DatabaseService);

  private readonly SESSION_KEY = 'smuve_session_v4';
  private _currentUser = signal<User | null>(null);
  private _isAuthenticated = signal<boolean>(false);

  currentUser = computed(() => this._currentUser());
  isAuthenticated = computed(() => this._isAuthenticated());

  constructor() {
    this.checkSession();
  }

  private checkSession() {
    const session = localStorage.getItem(this.SESSION_KEY);
    if (session) {
      try {
        const user = JSON.parse(this.securityService.decrypt(session));
        this._currentUser.set(user);
        this._isAuthenticated.set(true);
        void this.profileService.loadProfile(user.id);
      } catch (err) {
        this.logger.error('Session restoration failed', err);
        this.logout();
      }
    }
  }

  private saveSession(user: User) {
    const encrypted = this.securityService.encrypt(JSON.stringify(user));
    localStorage.setItem(this.SESSION_KEY, encrypted);
  }

  async login(creds: AuthCredentials): Promise<{ success: boolean; message?: string }> {
    const email = creds.email;
    const rateLimitKey = `login_${email}`;
    if (this.securityService.isRateLimited(rateLimitKey)) {
      return { success: false, message: 'Too many attempts. Please wait.' };
    }

    try {
      const mockUser: User = {
        id: 'user-' + btoa(email).slice(0, 8),
        email,
        name: email.split('@')[0],
        artistName: email.split('@')[0],
        role: 'artist',
        token: 'mock-jwt-token',
        permissions: ['ALL_ACCESS'],
        lastLogin: Date.now(),
      };

      this._currentUser.set(mockUser);
      this._isAuthenticated.set(true);
      this.saveSession(mockUser);
      this.securityService.clearRateLimit(rateLimitKey);

      await this.profileService.loadProfile(mockUser.id);

      this.logger.info('Login successful', email);
      return { success: true };
    } catch (err) {
      this.securityService.incrementRateLimit(rateLimitKey);
      this.logger.error('Login failed', err);
      return { success: false, message: 'Invalid credentials.' };
    }
  }

  async register(creds: AuthCredentials): Promise<{ success: boolean; message?: string }> {
    const { email, artistName } = creds;
    const rateLimitKey = 'register_global';
    if (this.securityService.isRateLimited(rateLimitKey)) {
      return { success: false, message: 'System busy. Try again later.' };
    }

    try {
      const newUser: User = {
        id: 'user-' + btoa(email).slice(0, 8),
        email,
        name: artistName || email.split('@')[0],
        artistName: artistName || email.split('@')[0],
        role: 'artist',
        token: 'mock-jwt-token',
        permissions: ['ALL_ACCESS'],
        lastLogin: Date.now(),
      };

      this._currentUser.set(newUser);
      this._isAuthenticated.set(true);
      this.saveSession(newUser);
      this.securityService.clearRateLimit(rateLimitKey);

      await this.profileService.updateProfile({
        ...initialProfile,
        id: newUser.id,
        artistName: this.securityService.sanitizeInput(artistName || ''),
      });

      await this.securityService.logEvent(
        'ACCOUNT_CREATED',
        'New artist account registered.',
        newUser.id
      );

      return {
        success: true,
        message: 'Account initialized. Welcome to the grid.',
      };
    } catch (err) {
      this.logger.error('Registration failed', err);
      return { success: false, message: 'Registration protocol error.' };
    }
  }

  logout() {
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
    localStorage.removeItem(this.SESSION_KEY);
    this.router.navigate(['/login']);
  }
}
