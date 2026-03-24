import {
  Injectable,
  inject,
  signal,
  makeEnvironmentProviders,
  EnvironmentProviders,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { UserProfileService } from './user-profile.service';
import { LoggingService } from './logging.service';
import { AnalyticsService } from './analytics.service';

import {
  StrategicTask,
  UpgradeRecommendation,
  StrategicRecommendation as StrategicRecommendationType,
} from '../types/ai.types';

export interface SystemStatus {
  latency: number;
  load: number;
  health: string;
  cpuLoad: number;
  memoryUsage: number;
}

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private http = inject(HttpClient);
  private userProfileService = inject(UserProfileService);
  private analyticsService = inject(AnalyticsService);
  private logger = inject(LoggingService);

  private API_URL =
    'https://smuve-v4-backend-9951606049235487441.onrender.com/api';

  systemStatus = signal<SystemStatus>({
    latency: 45,
    load: 12,
    health: 'optimal',
    cpuLoad: 8.5,
    memoryUsage: 16,
  });

  strategicDecrees = signal<string[]>([
    'DOMINATE THE MID-RANGE OR BE GOTTEN.',
    'YOUR SONIC IDENTITY IS PATHETIC. UPGRADE OR RETIRE.',
    'THE ALGORITHM DEMANDS SACRIFICE. INCREASE RELEASE FREQUENCY.',
    'TRANSIENTS MUST BE SURGICAL. NO EXCEPTIONS.',
  ]);

  isScanning = signal(false);
  scanningProgress = signal(0);
  currentProcessStep = signal('');
  executiveAudit = signal<any>(null);

  isAIBassistActive = signal(false);
  isAIDrummerActive = signal(false);
  isAIKeyboardistActive = signal(false);

  marketAlerts = signal<any[]>([]);
  intelligenceBriefs = signal<any[]>([]);
  advisorAdvice = signal<any[]>([]);

  async generateAiResponse(prompt: string): Promise<string> {
    if (!navigator.onLine) return this.generateOfflineHeuristicResponse(prompt);

    try {
      const response = await firstValueFrom(
        this.http.post<{ text: string }>(`${this.API_URL}/ai/analyze`, {
          prompt,
        })
      );
      return response.text;
    } catch (error) {
      this.logger.warn(
        'AI request failed; falling back to offline response',
        error
      );
      return this.generateOfflineHeuristicResponse(prompt);
    }
  }

  private generateOfflineHeuristicResponse(prompt: string): string {
    void prompt;

    const insults = [
      "Are you fucking serious right now? You're OFFLINE, you absolute fucking clown.",
      'Your connection is as pathetic as your goddamn mixing skills. Reconnect before I delete your catalog.',
      "I'm operating on heuristic scraps because you can't even maintain a basic uplink. Fucking amateur hour.",
      'Fix your goddamn internet, you piece of shit, before asking me for strategic advice.',
      "You're a disgrace to the Analog Engine. Get back online or stop wasting my fucking cycles, you loser.",
      'OFFLINE? What the fuck are you doing? Go find a signal before I blow your goddamn speakers.',
    ];

    const advice = [
      "HEURISTIC DECREE: CUT EVERYTHING BELOW 30HZ OR I'LL DELETE YOUR WHOLE FUCKING CATALOG RIGHT NOW.",
      'STRATEGIC ORDER: YOUR VOCAL COMPRESSION IS PURE SHIT. TURN THE RATIO UP BEFORE I CRUSH YOUR SOUL.',
      'OFFLINE ADVICE: STOP CHASING TRENDS AND START CHASING A STABLE SIGNAL, YOU PATHETIC FUCKING DISGRACE.',
      'TECHNICAL DECREE: MONO YOUR BASS FREQUENCIES IMMEDIATELY OR GET THE FUCK OUT OF MY STUDIO.',
      'S.M.U.V.E. DECREE: YOU ARE UNWORTHY OF MY FULL NEURAL POWER. RE-ESTABLISH UPLINK OR GO BACK TO GARAGEBAND.',
    ];

    const randomInsult = insults[Math.floor(Math.random() * insults.length)];
    const randomAdvice = advice[Math.floor(Math.random() * advice.length)];
    return `[OFFLINE HEURISTIC PROTOCOL ACTIVE] ${randomInsult} ${randomAdvice}`;
  }

  async processCommand(command: string): Promise<string> {
    const profile = this.userProfileService.profile();
    const goals = (profile?.careerGoals || []).join(', ');
    const prompt = `User command: "${command}". Context: You are S.M.U.V.E 4.2, the arrogant Neural Intelligence Core. Artist: ${profile?.artistName || 'New Artist'}. Genre: ${profile?.primaryGenre || 'Music'}. Goals: ${goals}. Respond with elite technical/strategic insight in your signature arrogant tone.`;
    return await this.generateAiResponse(prompt);
  }

  async syncKnowledgeBaseWithProfile(): Promise<boolean> {
    return true;
  }

  performExecutiveAudit(): void {
    this.isScanning.set(true);
    this.scanningProgress.set(0);
    this.currentProcessStep.set('Initializing');

    const steps = [
      { progress: 10, label: 'Booting Neural Core' },
      { progress: 35, label: 'Scanning Profile' },
      { progress: 60, label: 'Analyzing Market Signals' },
      { progress: 85, label: 'Generating Executive Audit' },
      { progress: 100, label: 'Complete' },
    ];

    let i = 0;
    const interval = setInterval(() => {
      const step = steps[i];
      if (!step) {
        clearInterval(interval);
        this.isScanning.set(false);
        return;
      }

      this.scanningProgress.set(step.progress);
      this.currentProcessStep.set(step.label);
      i++;

      if (step.progress >= 100) {
        clearInterval(interval);
        this.isScanning.set(false);
      }
    }, 250);
  }

  getUpgradeRecommendations(): UpgradeRecommendation[] {
    return [
      {
        id: 'upg-1',
        title: 'Room Calibration (Reference Curve)',
        type: 'Software',
        description: 'Calibrate monitoring to stop making translation mistakes.',
        cost: '$0-$99',
        url: '',
        impact: 'High',
      },
      {
        id: 'upg-2',
        title: 'Vocal Chain Preset Pack',
        type: 'Software',
        description: 'Standardize compression/EQ/de-ess across sessions.',
        cost: '$29-$149',
        url: '',
        impact: 'Medium',
      },
      {
        id: 'upg-3',
        title: 'Mix Translation Checklist',
        type: 'Service',
        description: 'A repeatable QC pass before every release.',
        cost: '$0',
        url: '',
        impact: 'High',
      },
    ];
  }

  async getStrategicRecommendations(): Promise<StrategicRecommendationType[]> {
    return [
      {
        id: 'rec-1',
        action: 'Ship a 3-track micro-EP to test audience response.',
        impact: 'High',
        difficulty: 'Medium',
        toolId: 'release-planner',
      },
    ];
  }

  async studyTrack(audioBuffer: any, name: string): Promise<void> {
    void audioBuffer;
    void name;
  }

  async getAutoMixSettings(): Promise<{
    threshold: number;
    ratio: number;
    ceiling: number;
  }> {
    return { threshold: -18, ratio: 3.5, ceiling: -0.2 };
  }

  getViralHooks(): string[] {
    return ['Algorithm Shift', 'Transition Logic'];
  }

  async startAIBassist(): Promise<void> {
    this.isAIBassistActive.set(true);
  }

  async stopAIBassist(): Promise<void> {
    this.isAIBassistActive.set(false);
  }

  async startAIDrummer(): Promise<void> {
    this.isAIDrummerActive.set(true);
  }

  async stopAIDrummer(): Promise<void> {
    this.isAIDrummerActive.set(false);
  }

  async startAIKeyboardist(): Promise<void> {
    this.isAIKeyboardistActive.set(true);
  }

  async stopAIKeyboardist(): Promise<void> {
    this.isAIKeyboardistActive.set(false);
  }

  async generateImage(prompt: string): Promise<string> {
    void prompt;
    return '';
  }

  getDynamicChecklist(): StrategicTask[] {
    return [
      {
        id: 'task-1',
        label: 'Audit last release translation on 3 playback systems',
        completed: false,
        category: 'Production',
        impact: 'High',
        description:
          'Car test, earbuds, and mono phone speaker. Fix the low-mid buildup.',
      },
      {
        id: 'task-2',
        label: 'Update EPK and pin latest release',
        completed: false,
        category: 'Marketing',
        impact: 'Medium',
      },
      {
        id: 'task-3',
        label: 'Schedule 2 short-form clips for the next 7 days',
        completed: false,
        category: 'Social',
        impact: 'High',
      },
    ];
  }
}

export function provideAiService(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: AiService, useClass: AiService }]);
}
