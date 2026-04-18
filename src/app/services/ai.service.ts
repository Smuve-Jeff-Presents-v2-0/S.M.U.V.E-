import { APP_SECURITY_CONFIG } from '../app.security';
import { AuthService } from './auth.service';
import { Injector, Injectable, inject, signal, makeEnvironmentProviders, EnvironmentProviders, InjectionToken, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { NeuralMixerService } from './neural-mixer.service';
import { MusicManagerService } from './music-manager.service';
import { RecommendationPreference, UserProfileService, UserProfile } from './user-profile.service';
import { LoggingService } from './logging.service';
import { AnalyticsService } from './analytics.service';
import { UserContextService, MainViewMode } from './user-context.service';
import { AiAuditService } from './ai-audit.service';
import { ArtistIdentityService } from './artist-identity.service';
import { INTELLIGENCE_LIBRARY, MARKET_ALERTS, PRODUCTION_SECRETS, STRATEGIC_DECREES } from './ai-knowledge.data';

import {
  AdvisorAdvice,
  StrategicTask,
  SystemStatus as AiSystemStatus,
  UpgradeRecommendation,
  StrategicRecommendation as StrategicRecommendationType,
  ExecutiveAuditReport,
  RecommendationHistoryEntry,
} from '../types/ai.types';

export const API_KEY_TOKEN = new InjectionToken<string>('GEMINI_API_KEY');

export type { AiSystemStatus as SystemStatus };

const COMMAND_ROUTES: Record<string, string> = {
  AUTO_MIX: 'Provide an expert auto-mix analysis.',
  AUDIT_TRACK: 'Analyze the selected track data.',
  SUGGEST_COLLAB: 'Suggest three high-value collaboration types.',
};

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private http = inject(HttpClient);
  private userProfileService = inject(UserProfileService);
  private logger = inject(LoggingService);
  private analytics = inject(AnalyticsService);
  private userContext = inject(UserContextService);
  private aiAuditService = inject(AiAuditService);
  private artistIdentityService = inject(ArtistIdentityService);
  private injector = inject(Injector);

  isScanning = signal(false);
  scanningProgress = signal(0);
  currentProcessStep = signal('INITIALIZING...');
  sonicCohesion = signal(0);
  frequencyBalance = signal({ low: 0, mid: 0, high: 0 });
  criticalDeficits = signal<string[]>([]);
  strategicDecrees = signal<string[]>(STRATEGIC_DECREES);
  intelligenceBriefs = signal<any[]>(INTELLIGENCE_LIBRARY);
  isAIBassistActive = signal(false);
  isAIDrummerActive = signal(false);
  isAIKeyboardistActive = signal(false);

  systemStatus = signal({
    neuralSync: 98.4,
    cpuLoad: 12.2,
    memoryUsage: 45.1,
  });

  marketAlerts = signal<any[]>(MARKET_ALERTS);
  executiveAudit = signal<ExecutiveAuditReport | null>(null);
  advisorAdvice = signal<AdvisorAdvice[]>([]);

  constructor() {
    effect(() => {
      const mode = this.userContext.mainViewMode();
      this.currentProcessStep.set(`CONTEXT: ${mode.toUpperCase()}`);
    });
  }

  isMobile() { return typeof window !== 'undefined' && window.innerWidth <= 768; }

  async runStrategicAudit() {
    this.isScanning.set(true);
    this.scanningProgress.set(0);
    await new Promise(r => setTimeout(r, 100));
    this.isScanning.set(false);
  }

  async getExecutiveAdvice(): Promise<AdvisorAdvice[]> {
    const advice: AdvisorAdvice[] = [{
      id: 'adv-1', title: 'Sonic Collision', content: 'Conflict at 60Hz.',
      type: 'Production', impact: 'High', priority: 'HIGH', persona: 'EXECUTIVE', actionLabel: 'Fix'
    }];
    this.advisorAdvice.set(advice);
    return advice;
  }

  proactiveStrategicPulse() { this.runStrategicAudit(); }

  async runHardDataAudit(): Promise<ExecutiveAuditReport> {
    const profile = this.userProfileService.profile();
    const auditLog = this.aiAuditService.calculateStrategicHealth(profile);
    const audit: ExecutiveAuditReport = {
       overallScore: auditLog.score, sonicCohesion: 80, arrangementDepth: 70, marketViability: 60,
       criticalDeficits: auditLog.deficits, technicalRecommendations: auditLog.recommendations
    };
    this.executiveAudit.set(audit);
    return audit;
  }

  performExecutiveAudit() { return this.runHardDataAudit(); }
  syncKnowledgeBaseWithProfile() { return Promise.resolve(); }

  getUpgradeRecommendations(): UpgradeRecommendation[] {
    return [{
        id: 'upg-dsp-promotion', title: 'DSP Promotion', type: 'Service',
        description: 'Accelerate reach.', cost: '$49/mo', url: '#', impact: 'High', rationale: 'Critical mass.',
        targetArea: 'Marketing', priority: 'High', prerequisites: [], actionLabel: 'Deploy'
    }];
  }

  async getStrategicRecommendations(): Promise<StrategicRecommendationType[]> {
    return [{ id: 'sec-rec-1', action: 'Verify Email', impact: 'Extreme', difficulty: 'Low', toolId: 'profile' }];
  }

  async getQuestionnaireInsights(profile: UserProfile): Promise<any[]> {
    return [{ title: 'Sonic Realignment', content: 'Calibration needed.' }];
  }

  async generateImage(prompt: string): Promise<string> {
    return 'mock-image-url';
  }

  getDynamicChecklist(): StrategicTask[] {
    return [{ id: 'task-1', label: 'Audit Release', completed: false, category: 'Production', impact: 'High', description: 'Car test.' }];
  }

  async studyTrack(audioBuffer: any, name: string): Promise<void> { return Promise.resolve(); }

  async getAutoMixSettings(): Promise<any> {
    return { threshold: -18, ratio: 3.5, ceiling: -0.2, targetLufs: -14, eqTilt: 0.15 };
  }

  getProductionSmartAssist(input: any): any {
    return { arrangementSuggestion: 'Good', eqMaskingHint: 'None', correctivePreset: {} };
  }

  async processCommand(command: string): Promise<string> {
    const trimmed = command.trim().toLowerCase();
    if (trimmed === '/audit_track') return this.generateAiResponse(COMMAND_ROUTES['AUDIT_TRACK']);
    if (trimmed === '/suggest_collab') return this.generateAiResponse(COMMAND_ROUTES['SUGGEST_COLLAB']);
    return await this.generateAiResponse(command);
  }

  public async generateAiResponse(prompt: string): Promise<string> {
    try {
      const response = await firstValueFrom(this.http.post<{ response: string }>('/api/ai/chat', { prompt }));
      return response.response;
    } catch (e) { return 'SYSTEM OFFLINE'; }
  }
}

export function provideAiService(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: AiService, useClass: AiService }]);
}
