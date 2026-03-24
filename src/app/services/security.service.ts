import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoggingService } from './logging.service';
import { UserProfileService } from './user-profile.service';
import { firstValueFrom } from 'rxjs';

export interface SecurityLog {
  log_id: number;
  user_id: string;
  event_type: string;
  description: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface UserSession {
  session_id: string;
  user_id: string;
  device_name: string;
  location: string;
  last_active: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class SecurityService {
  private http = inject(HttpClient);
  private logger = inject(LoggingService);
  private profileService = inject(UserProfileService);

  // NOTE: backend URL can be swapped via environment later.
  private readonly API_URL = 'http://localhost:3000/api';

  logs = signal<SecurityLog[]>([]);
  sessions = signal<UserSession[]>([]);

  async logEvent(
    eventType: string,
    description: string,
    userId?: string
  ): Promise<void> {
    const profile = this.profileService.profile();
    const resolvedUserId = userId || (profile as any)?.id || 'anonymous';

    try {
      await firstValueFrom(
        this.http.post(`${this.API_URL}/security/log`, {
          userId: resolvedUserId,
          eventType,
          description,
          ipAddress: '127.0.0.1',
          userAgent: navigator.userAgent,
        })
      );
    } catch (error) {
      // Logging should never break the app.
      this.logger.error('Failed to log security event', error);
    }
  }

  async fetchLogs(userId: string = 'anonymous'): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<SecurityLog[]>(`${this.API_URL}/security/logs/${userId}`)
      );
      this.logs.set(data);
    } catch (error) {
      this.logger.error('Failed to fetch security logs', error);
    }
  }

  async fetchSessions(userId: string = 'anonymous'): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<UserSession[]>(`${this.API_URL}/security/sessions/${userId}`)
      );
      this.sessions.set(data);
    } catch (error) {
      this.logger.error('Failed to fetch active sessions', error);
    }
  }

  async revokeSession(sessionId: string, userId: string = 'anonymous'): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.API_URL}/security/session/${sessionId}`)
      );
      await this.fetchSessions(userId);
      await this.logEvent('SESSION_REVOKED', `Revoked session ${sessionId}`, userId);
    } catch (error) {
      this.logger.error('Failed to revoke session', error);
    }
  }

  async registerCurrentSession(
    sessionId: string,
    deviceName: string,
    location: string,
    userId: string
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.API_URL}/security/session`, {
          sessionId,
          userId,
          deviceName,
          location,
        })
      );
    } catch (error) {
      this.logger.error('Failed to register session', error);
    }
  }
}
