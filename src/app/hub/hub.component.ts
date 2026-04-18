import { Component, OnInit, OnDestroy, AfterViewInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { UIService } from '../services/ui.service';
import { DeckService } from '../services/deck.service';
import { UserProfileService } from '../services/user-profile.service';
import { AiService } from '../services/ai.service';
import { FileLoaderService } from '../services/file-loader.service';
import { ExportService } from '../services/export.service';
import { AudioEngineService } from '../services/audio-engine.service';
import { NotificationService } from '../services/notification.service';
import { SecurityService } from '../services/security.service';
import { PlayerService } from '../services/player.service';
import { OnboardingService } from '../services/onboarding.service';

@Component({
  selector: 'app-hub', standalone: true, imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './hub.component.html', styleUrls: ['./hub.component.css'],
})
export class HubComponent implements OnInit, OnDestroy, AfterViewInit {
  private router = inject(Router);
  public uiService = inject(UIService);
  public deckService = inject(DeckService);
  public profileService = inject(UserProfileService);
  public aiService = inject(AiService);
  private fileLoader = inject(FileLoaderService);
  private exportService = inject(ExportService);
  public audioEngine = inject(AudioEngineService);
  private notificationService = inject(NotificationService);
  public playerService = inject(PlayerService);
  public securityService = inject(SecurityService);
  public onboarding = inject(OnboardingService);

  public currentBeat = this.audioEngine.currentBeat;
  globalStudioPulse = signal<string[]>(["Artist 'Viper' committed a Master.", "Neural Jam Session active in Tokyo.", "Sync License secured by 'Echo-4'."]);

  quickProfile = signal({ artistName: '', primaryGenre: 'Hip Hop' });
  genres = ['Hip Hop', 'R&B', 'Pop', 'Electronic', 'Rock', 'Jazz', 'Classical'];
  labelStats = [{ label: 'Roster Ready', value: '12', foot: 'Active talent' }, { label: 'Pipeline', value: '5', foot: 'In mastering' }, { label: 'Momentum', value: '+18%', foot: 'Growth' }];
  marketPulse = ['Streaming spike – West Coast', 'Vinyl preorders up 12%', 'Sync request: indie film'];
  visualizerData = signal<number[]>(new Array(24).fill(20));
  private animFrame: number | null = null;

  homeBackdropMedia = [
    { src: 'assets/hub/home-backdrop-studio.png', label: 'Production Suite', title: 'Studio performance view', layoutClass: 'panel-studio' },
    { src: 'assets/hub/home-backdrop-command.png', label: 'Executive Layout', title: 'Command surface overview', layoutClass: 'panel-command' },
    { src: 'assets/hub/home-backdrop-intel.png', label: 'Intel Brief', title: 'Strategy signal board', layoutClass: 'panel-intel' },
    { src: 'assets/hub/home-backdrop-cinema.png', label: 'Cinema Engine', title: 'Mobile visual direction', layoutClass: 'panel-cinema' },
  ];

  ngOnInit() { if (typeof window !== 'undefined' && window.innerWidth <= 768) this.aiService.proactiveStrategicPulse(); }
  ngAfterViewInit() { this.startVisualizer(); }
  ngOnDestroy() { if (this.animFrame) cancelAnimationFrame(this.animFrame); }

  private startVisualizer() {
    const update = () => {
      if (this.playerService.isPlaying()) {
        const newData = this.visualizerData().map(() => Math.random() * 80 + 20);
        this.visualizerData.set(newData);
      } else {
        this.visualizerData.set(this.visualizerData().map(v => Math.max(20, v * 0.95)));
      }
      this.animFrame = requestAnimationFrame(update);
    };
    this.animFrame = requestAnimationFrame(update);
  }

  updateQuickProfile(field: string, value: string) { this.quickProfile.update((p) => ({ ...p, [field]: value })); }
  getCareerFocusProgress(): number { return Math.min(100, this.profileService.profile().careerGoals.length * 20 || 20); }
  onQuickStart() { this.router.navigate(['/profile']); }
  toggleAIBassist() { this.aiService.isAIBassistActive.update(v => !v); }
  toggleAIDrummer() { this.aiService.isAIDrummerActive.update(v => !v); }
  toggleAIKeyboardist() { this.aiService.isAIKeyboardistActive.update(v => !v); }
  resumeWorkspace() { this.uiService.navigateToView('studio'); }
  continueOnboarding() {
    const next = this.onboarding.nextStep();
    if (next) this.router.navigate(['/' + next.route], { queryParams: next.queryParams });
  }
}
