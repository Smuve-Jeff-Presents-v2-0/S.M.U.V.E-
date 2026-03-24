import { Injectable, inject, signal } from '@angular/core';
import { SecurityService } from './security.service';
import { LoggingService } from './logging.service';
import { UserProfileService, initialProfile } from './user-profile.service';

const APP_SECURITY_CONFIG = {
  auth_salt: 'smuve_v4_executive_secure_link',
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
    void this.loadSession();
  }

  private encrypt(data: string): string {
    const salted = data + '|' + APP_SECURITY_CONFIG.auth_salt;
    return btoa(unescape(encodeURIComponent(salted)));
  }

  private decrypt(encoded: string): string | null {
    try {
      const decoded = decodeURIComponent(escape(atob(encoded)));
      const [data, key] = decoded.split('|');
      return key === APP_SECURITY_CONFIG.auth_salt ? data : null;
    } catch {
      return null;
    }
  }

  private async loadSession(): Promise<void> {
    try {
      const encryptedSession = localStorage.getItem('smuve_auth_session');
      if (!encryptedSession) return;

      const sessionData = this.decrypt(encryptedSession);
      if (!sessionData) return;

      const user = JSON.parse(sessionData) as AuthUser;
      this._currentUser.set(user);
      this._isAuthenticated.set(true);
      await this.profileService.loadProfile(user.id);
    } catch (error) {
      this.logger.error('Failed to load session:', error);
      this.clearSession();
    }
  }

  private saveSession(user: AuthUser): void {
    try {
      localStorage.setItem('smuve_auth_session', this.encrypt(JSON.stringify(user)));
    } catch (error) {
      this.logger.error('Failed to save session:', error);
    }
  }

  private clearSession(): void {
    localStorage.removeItem('smuve_auth_session');
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  private hashPassword(password: string): string {
    // Lightweight client-side hash for mock/local auth only.
    // Do NOT treat as secure.
    let hash = 0;
    const input = `${password}|${APP_SECURITY_CONFIG.auth_salt}`;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return `h_${Math.abs(hash)}`;
  }

  private generateSecureId(prefix: string): string {
    return `${prefix}_${crypto?.randomUUID?.() || this.generateUserId()}`;
  }

  async register(
    credentials: AuthCredentials,
    artistName: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

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
        artistName,
        role: 'Admin',
        permissions: ['ALL_ACCESS'],
        createdAt: new Date(),
        lastLogin: new Date(),
        profileCompleteness: 0,
      };

      localStorage.setItem(
        `smuve_user_${credentials.email}`,
        this.encrypt(
          JSON.stringify({
            user: newUser,
            passwordHash: this.hashPassword(credentials.password),
          })
        )
      );

      this._currentUser.set(newUser);
      this._isAuthenticated.set(true);
      this.saveSession(newUser);

      await this.profileService.updateProfile({
        ...initialProfile,
        artistName,
      } as any);

      await this.securityService.logEvent('ACCOUNT_CREATED', 'New artist account registered.', newUser.id);

      return {
        success: true,
        message: 'Welcome to S.M.U.V.E 4.2. Your journey to greatness begins now.',
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
      await new Promise((resolve) => setTimeout(resolve, 300));

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

      const { user, passwordHash } = JSON.parse(userData) as {
        user: AuthUser;
        passwordHash: string;
      };

      if (this.hashPassword(credentials.password) !== passwordHash) {
        await this.securityService.logEvent('LOGIN_FAILURE', `Failed login attempt for ${credentials.email}`, user.id);
        return {
          success: false,
          message: 'Incorrect password. Access denied.',
        };
      }

      // Mock 2FA check based on profile settings.
      const profile = this.profileService.profile() || (initialProfile as any);
      if (profile?.settings?.security?.twoFactorEnabled && !credentials.twoFactorCode) {
        return {
          success: false,
          message: 'Two-Factor Authentication required.',
          requires2FA: true,
        };
      }
      if (
        profile?.settings?.security?.twoFactorEnabled &&
        credentials.twoFactorCode &&
        credentials.twoFactorCode !== '123456'
      ) {
        await this.securityService.logEvent('2FA_FAILURE', 'Invalid 2FA code entered.', user.id);
        return {
          success: false,
          message: 'Invalid 2FA code. Access denied.',
        };
      }

      user.lastLogin = new Date();

      this._currentUser.set(user);
      this._isAuthenticated.set(true);
      this.saveSession(user);

      localStorage.setItem(
        `smuve_user_${credentials.email}`,
        this.encrypt(JSON.stringify({ user, passwordHash }))
      );

      const sessionId = this.generateSecureId('sess');
      void sessionId;

      await this.securityService.logEvent('LOGIN_SUCCESS', `Artist ${user.artistName} logged in successfully.`, user.id);
      await this.profileService.loadProfile(user.id);

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
