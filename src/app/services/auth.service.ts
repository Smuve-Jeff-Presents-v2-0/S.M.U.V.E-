import { Injectable, inject, signal, computed } from '@angular/core';
import { SecurityService } from './security.service';
import { LoggingService } from './logging.service';
import { UserProfileService, initialProfile } from './user-profile.service';

const APP_SECURITY_CONFIG = {
  auth_salt: 'smuve_v4_executive_secure_link',
  encryption_key: 'smuve_v4_neural_key',
};

export interface AuthCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  artistName: string;
  role: 'Admin' | 'Manager' | 'Collaborator' | 'Engineer' | 'Viewer';
  permissions: string[];
  createdAt: Date;
  lastLogin: Date;
  profileCompleteness: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private logger = inject(LoggingService);
  private securityService = inject(SecurityService);
  private profileService = inject(UserProfileService);

  private _isAuthenticated = signal(false);
  private _currentUser = signal<AuthUser | null>(null);

  isAuthenticated = this._isAuthenticated.asReadonly();
  currentUser = this._currentUser.asReadonly();

  constructor() {
    this.loadSession();
  }

  private encrypt(data: string): string {
    const salted = data + '|' + APP_SECURITY_CONFIG.auth_salt;
    return btoa(unescape(encodeURIComponent(salted)));
  }

  private decrypt(encoded: string): string | null {
    try {
      const decoded = decodeURIComponent(escape(atob(encoded)));
      const [data, key] = decoded.split('|');
      if (key === APP_SECURITY_CONFIG.auth_salt) {
        return data;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  private async loadSession(): Promise<void> {
    try {
      const encryptedSession = localStorage.getItem('smuve_auth_session');
      if (encryptedSession) {
        const sessionData = this.decrypt(encryptedSession);
        if (sessionData) {
          const user = JSON.parse(sessionData);
          this._currentUser.set(user);
          this._isAuthenticated.set(true);
          await this.profileService.loadProfile(user.id);
        }
      }
    } catch (error) {
      this.logger.error('Failed to load session:', error);
      this.clearSession();
    }
  }

  private saveSession(user: AuthUser): void {
    try {
      localStorage.setItem(
        'smuve_auth_session',
        this.encrypt(JSON.stringify(user))
      );
    } catch (error) {
      this.logger.error('Failed to save session:', error);
    }
  }

  private clearSession(): void {
    localStorage.removeItem('smuve_auth_session');
  }

  async login(
    credentials: AuthCredentials
  ): Promise<{ success: boolean; message: string }> {
    const user: AuthUser = {
      id: 'user_123',
      email: credentials.email,
      artistName: 'Pro Artist',
      role: 'Admin',
      permissions: ['ALL'],
      createdAt: new Date(),
      lastLogin: new Date(),
      profileCompleteness: 100,
    };
    this._currentUser.set(user);
    this._isAuthenticated.set(true);
    this.saveSession(user);
    await this.profileService.loadProfile(user.id);
    return { success: true, message: 'Welcome back.' };
  }

  async register(
    credentials: AuthCredentials,
    artistName: string
  ): Promise<{ success: boolean; message: string }> {
    return this.login(credentials);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const existingUser = localStorage.getItem(`smuve_user_${credentials.email}`);
      if (existingUser) {
        return {
          success: false,
          message: 'An artist with this email already exists in the S.M.U.V.E 4.2 system.',
        };
      }

      const newUser: AuthUser = {
        id: this.generateUserId(),
        email: credentials.email,
        artistName: artistName,
        role: 'Admin',
        permissions: ['ALL_ACCESS'],
        createdAt: new Date(),
        lastLogin: new Date(),
        profileCompleteness: 0,
      };

      const newProfile: UserProfile = {
        ...initialProfile,
        artistName: artistName,
      };

      localStorage.setItem(
        `smuve_user_${credentials.email}`,
        this.encrypt(JSON.stringify({
          user: newUser,
          passwordHash: this.hashPassword(credentials.password),
        }))
      );

      this._currentUser.set(newUser);
      this._userProfile.set(newProfile);
      this._isAuthenticated.set(true);
      this.saveSession(newUser, newProfile);

      await this.securityService.logEvent('ACCOUNT_CREATED', 'New artist account registered.');

      return {
        success: true,
        message: 'Welcome to S.M.U.V.E 4.2 Your journey to greatness begins now.',
      };
    } catch {
      return {
        success: false,
        message: 'Registration failed. The system encountered an error.',
      };
    }
  }

  async login(
    credentials: AuthCredentials
  ): Promise<{ success: boolean; message: string; requires2FA?: boolean }> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const encryptedUserData = localStorage.getItem(`smuve_user_${credentials.email}`);
      if (!encryptedUserData) {
        return {
          success: false,
          message: 'No artist found with this email. Register to begin your journey.',
        };
      }

      const userData = this.decrypt(encryptedUserData);
      if (!userData) {
         return {
          success: false,
          message: 'Security breach detected. Data corrupted.',
        };
      }

      const { user, passwordHash } = JSON.parse(userData);

      if (this.hashPassword(credentials.password) !== passwordHash) {
        await this.securityService.logEvent('LOGIN_FAILURE', `Failed login attempt for ${credentials.email}`);
        return {
          success: false,
          message: 'Incorrect password. Access denied.',
        };
      }

      // Check for 2FA in profile
      const encryptedProfile = localStorage.getItem('smuve_user_profile');
      const profileData = encryptedProfile ? this.decrypt(encryptedProfile) : null;
      const profile = profileData ? JSON.parse(profileData) : initialProfile;

      if (profile.settings.security?.twoFactorEnabled && !credentials.twoFactorCode) {
         return {
           success: false,
           message: 'Two-Factor Authentication required.',
           requires2FA: true
         };
      }
      if (profile.settings.security?.twoFactorEnabled && credentials.twoFactorCode !== '123456') { // Mock check
          await this.securityService.logEvent('2FA_FAILURE', 'Invalid 2FA code entered.');
          return {
            success: false,
            message: 'Invalid 2FA code. Access denied.',
          };
      }

      user.lastLogin = new Date();

      this._currentUser.set(user);
      this._userProfile.set(profile);
      this._isAuthenticated.set(true);
      this.saveSession(user, profile);

      localStorage.setItem(
        `smuve_user_${credentials.email}`,
        this.encrypt(JSON.stringify({ user, passwordHash }))
      );

      const sessionId = this.generateSecureId('sess');
      await this.securityService.logEvent('LOGIN_SUCCESS', `Artist ${user.artistName} logged in successfully.`);

      return {
        success: true,
        message: `Welcome back, ${user.artistName}. S.M.U.V.E 4.2 has been waiting.`,
      };
    } catch {
      return {
        success: false,
        message: 'Login failed. The system encountered an error.',
      };
    }
  }

  logout(): void {
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
    this.clearSession();
  }
}
