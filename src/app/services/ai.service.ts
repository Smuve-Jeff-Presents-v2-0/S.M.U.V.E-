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

  systemStatus = signal<AiSystemStatus>({
    neuralSync: 98.4,
    cpuLoad: 12.2,
    memoryUsage: 45.1,
    latency: 0,
    marketVelocity: 0,
    activeProcesses: 0,
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
    const profile = this.userProfileService.profile() as (UserProfile & {
      recommendationPreferences?: RecommendationPreference[];
      recommendationHistory?: RecommendationHistoryEntry[];
      upgradeRecommendationHistory?: RecommendationHistoryEntry[];
      releases?: any[];
      tracks?: any[];
      socialLinks?: Record<string, string>;
      links?: Record<string, string>;
      branding?: { artworkReady?: boolean; pressPhotosReady?: boolean; bioReady?: boolean };
      assets?: { artworkReady?: boolean; epkReady?: boolean };
      verification?: { email?: boolean };
      distribution?: { configured?: boolean };
      production?: { mixesReviewed?: boolean; mastered?: boolean };
      marketing?: { pixelConfigured?: boolean; campaignReady?: boolean };
      audience?: { mailingListConnected?: boolean };
    }) | null;

    const history = [
      ...(((profile as any)?.recommendationHistory ?? []) as RecommendationHistoryEntry[]),
      ...(((profile as any)?.upgradeRecommendationHistory ?? []) as RecommendationHistoryEntry[]),
    ];

    const preferences = new Set<RecommendationPreference>(
      (((profile as any)?.recommendationPreferences ?? []) as RecommendationPreference[])
    );

    const isHistoryState = (id: string, state: string): boolean =>
      history.some((entry: any) => entry?.recommendationId === id && String(entry?.state ?? '').toLowerCase() === state);

    const hasRelease = Boolean(((profile as any)?.releases?.length ?? 0) > 0 || ((profile as any)?.tracks?.length ?? 0) > 0);
    const hasArtwork = Boolean(
      (profile as any)?.branding?.artworkReady ||
      (profile as any)?.assets?.artworkReady
    );
    const hasPressKit = Boolean(
      (profile as any)?.assets?.epkReady ||
      ((profile as any)?.branding?.pressPhotosReady && (profile as any)?.branding?.bioReady)
    );
    const emailVerified = Boolean((profile as any)?.verification?.email || (profile as any)?.emailVerified);
    const distributionReady = Boolean((profile as any)?.distribution?.configured);
    const mixesReviewed = Boolean((profile as any)?.production?.mixesReviewed || (profile as any)?.production?.mastered);
    const socialLinksCount = Object.keys(((profile as any)?.socialLinks ?? (profile as any)?.links ?? {})).filter(
      key => Boolean((((profile as any)?.socialLinks ?? (profile as any)?.links ?? {})[key] ?? '').toString().trim())
    ).length;
    const campaignReady = Boolean(
      (profile as any)?.marketing?.campaignReady ||
      (profile as any)?.marketing?.pixelConfigured ||
      (profile as any)?.audience?.mailingListConnected
    );

    type RankedRecommendation = UpgradeRecommendation & {
      state: 'ready' | 'blocked' | 'active' | 'completed' | 'dismissed';
      whyNow: string;
      nextStep: string;
      score: number;
      preference?: RecommendationPreference;
      enabled: boolean;
    };

    const candidates: RankedRecommendation[] = [
      {
        id: 'upg-profile-verification',
        title: 'Verify Email & Artist Identity',
        type: 'Upgrade',
        description: 'Unlock distribution and support workflows by completing account verification.',
        cost: 'Free',
        url: '#/profile/security',
        impact: 'High',
        rationale: 'Verification is a dependency for several downstream growth actions.',
        targetArea: 'Profile',
        priority: 'Critical',
        prerequisites: [],
        actionLabel: 'Verify Now',
        state: emailVerified ? 'completed' : 'ready',
        whyNow: emailVerified ? 'Your account is already verified.' : 'This is the fastest unblocker for release and promotion activity.',
        nextStep: emailVerified ? 'No action required.' : 'Confirm your email address and complete any pending identity checks.',
        score: emailVerified ? -100 : 120,
        preference: 'Career Growth' as RecommendationPreference,
        enabled: !emailVerified
      },
      {
        id: 'upg-release-readiness',
        title: 'Prepare Release Assets',
        type: 'Service',
        description: 'Finalize artwork, metadata, and delivery requirements before launch.',
        cost: '$19',
        url: '#/releases/new',
        impact: 'High',
        rationale: 'A release cannot perform if the packaging and metadata are incomplete.',
        targetArea: 'Distribution',
        priority: 'High',
        prerequisites: emailVerified ? [] : ['Account verification'],
        actionLabel: hasArtwork ? 'Review Assets' : 'Complete Assets',
        state: !emailVerified ? 'blocked' : hasArtwork && hasRelease ? 'active' : 'ready',
        whyNow: hasRelease
          ? 'You already have music ready, so improving release readiness can move you to market faster.'
          : 'Preparing assets now reduces delays when your next track is ready.',
        nextStep: hasArtwork
          ? 'Review title, metadata, and delivery settings for the next release.'
          : 'Upload release artwork and verify your metadata checklist.',
        score: (hasRelease ? 95 : 70) + (emailVerified ? 10 : -30),
        preference: 'Distribution' as RecommendationPreference,
        enabled: !distributionReady || !hasArtwork
      },
      {
        id: 'upg-mix-feedback',
        title: 'Professional Mix Feedback',
        type: 'Service',
        description: 'Get a targeted review to improve clarity, translation, and competitiveness.',
        cost: '$29',
        url: '#/production/mix-review',
        impact: 'Medium',
        rationale: 'Production quality compounds the impact of every later marketing step.',
        targetArea: 'Production',
        priority: 'Medium',
        prerequisites: hasRelease ? [] : ['At least one track uploaded'],
        actionLabel: 'Request Review',
        state: !hasRelease ? 'blocked' : mixesReviewed ? 'completed' : 'ready',
        whyNow: mixesReviewed
          ? 'Your recent tracks have already been reviewed.'
          : hasRelease
            ? 'You have music available, so feedback can improve the next release cycle immediately.'
            : 'Upload a draft track to unlock actionable production feedback.',
        nextStep: mixesReviewed
          ? 'Apply the latest review notes to your current project.'
          : hasRelease
            ? 'Submit your strongest draft for a focused mix analysis.'
            : 'Add a track or draft release before requesting review.',
        score: hasRelease ? (mixesReviewed ? -50 : 80) : 20,
        preference: 'Production' as RecommendationPreference,
        enabled: hasRelease && !mixesReviewed
      },
      {
        id: 'upg-press-kit',
        title: 'Build Electronic Press Kit',
        type: 'Upgrade',
        description: 'Create a sharable EPK with bio, visuals, and links for pitching.',
        cost: '$15',
        url: '#/profile/epk',
        impact: 'High',
        rationale: 'A polished pitch package improves conversion with curators and collaborators.',
        targetArea: 'Branding',
        priority: 'High',
        prerequisites: hasArtwork ? [] : ['Release artwork'],
        actionLabel: hasPressKit ? 'Update EPK' : 'Create EPK',
        state: !hasArtwork ? 'blocked' : hasPressKit ? 'active' : 'ready',
        whyNow: socialLinksCount > 0
          ? 'You already have discoverability signals in place, so an EPK can improve pitch conversion.'
          : 'Setting up an EPK early gives you a reusable foundation for future campaigns.',
        nextStep: hasPressKit
          ? 'Refresh your bio, links, and hero image before your next outreach push.'
          : 'Add your bio, press photo, and key links to publish your first EPK.',
        score: (hasArtwork ? 75 : 25) + (socialLinksCount > 0 ? 10 : 0),
        preference: 'Branding' as RecommendationPreference,
        enabled: hasArtwork && !hasPressKit
      },
      {
        id: 'upg-dsp-promotion',
        title: 'DSP Promotion',
        type: 'Service',
        description: 'Accelerate reach with playlist, audience, and release-campaign support.',
        cost: '$49/mo',
        url: '#',
        impact: 'High',
        rationale: 'Promotion performs best once the release foundation is already in place.',
        targetArea: 'Marketing',
        priority: 'High',
        prerequisites: hasRelease ? [] : ['Released music'],
        actionLabel: 'Deploy',
        state: !hasRelease ? 'blocked' : campaignReady ? 'active' : 'ready',
        whyNow: hasRelease
          ? 'You have music available now, so campaign spend can convert into measurable listener growth.'
          : 'Promotion should follow a release-ready catalog to avoid wasted spend.',
        nextStep: hasRelease
          ? 'Launch a focused campaign around your strongest release and track performance weekly.'
          : 'Publish or schedule a release before starting paid promotion.',
        score: hasRelease ? 110 : 15,
        preference: 'Marketing' as RecommendationPreference,
        enabled: hasRelease
      }
    ];

    return candidates
      .map((candidate) => {
        if (isHistoryState(candidate.id, 'completed')) {
          return { ...candidate, state: 'completed', enabled: false, score: -100 };
        }
        if (isHistoryState(candidate.id, 'dismissed')) {
          return { ...candidate, state: 'dismissed', enabled: false, score: -100 };
        }
        return candidate;
      })
      .filter(candidate => candidate.state !== 'completed' && candidate.state !== 'dismissed')
      .filter(candidate => candidate.enabled)
      .filter(candidate => preferences.size === 0 || !candidate.preference || preferences.has(candidate.preference))
      .sort((a, b) => {
        const stateWeight = (value: string) => value === 'ready' ? 3 : value === 'active' ? 2 : value === 'blocked' ? 1 : 0;
        return (b.score + stateWeight(b.state) * 10) - (a.score + stateWeight(a.state) * 10);
      })
      .map(({ score, enabled, preference, ...recommendation }) => recommendation as UpgradeRecommendation);
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
      const authService = (this as any)['authService'] as AuthService | undefined;
      const token =
        (authService as any)?.getToken?.() ??
        (authService as any)?.getJwtToken?.() ??
        (authService as any)?.getAccessToken?.();

      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await firstValueFrom(
        this.http.post<{ text: string }>(
          '/api/ai/analyze',
          { text: prompt },
          { headers }
        )
      );
      return response.text;
    } catch (e) { return 'SYSTEM OFFLINE'; }
  }
}

export function provideAiService(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: AiService, useClass: AiService }]);
}
