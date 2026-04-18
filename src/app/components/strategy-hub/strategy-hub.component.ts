import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/ai.service';
import { UserProfileService } from '../../services/user-profile.service';
import { UIService } from '../../services/ui.service';
import { UpgradeRecommendation, StrategicRecommendation } from '../../types/ai.types';

@Component({
  selector: 'app-strategy-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './strategy-hub.component.html',
  styleUrls: ['./strategy-hub.component.css'],
})
export class StrategyHubComponent implements OnInit {
  public aiService = inject(AiService);
  public profileService = inject(UserProfileService);
  public uiService = inject(UIService);

  activeTab = signal<'briefs' | 'alerts' | 'upgrades' | 'social'>('briefs');
  activeHubTab = computed(() => this.activeTab()); // Alias for template compatibility

  recommendedUpgrades = computed(() => this.aiService.getUpgradeRecommendations().slice(0, 5));
  strategicRecs = signal<StrategicRecommendation[]>([]);

  intelligenceBriefs = this.aiService.intelligenceBriefs;
  marketAlerts = this.aiService.marketAlerts;

  // Missing properties from template
  recommendationInbox = computed(() => this.profileService.profile().recommendationHistory || []);
  socialStats = signal([{ platform: 'Spotify', followers: 1200, engagementRate: 5.2 }, { platform: 'Instagram', followers: 8400, engagementRate: 4.8 }]);
  viralHooks = ['Behind the Beat', 'Mix Reveal', 'Tempo Switch'];

  async ngOnInit() {
    await this.loadStrategicRecommendations();
  }

  async loadStrategicRecommendations() {
    const recs = await this.aiService.getStrategicRecommendations();
    this.strategicRecs.set(recs);
  }

  setTab(tab: 'briefs' | 'alerts' | 'upgrades' | 'social') { this.activeTab.set(tab); }
  async acquireUpgrade(rec: UpgradeRecommendation) {
    await this.profileService.acquireUpgrade({ title: rec.title, type: rec.type, recommendationId: rec.id });
    if (rec.url) window.open(rec.url, '_blank');
  }
  async saveRecommendation(rec: UpgradeRecommendation) { await this.profileService.setRecommendationState(rec.id, 'saved', rec); }
  async dismissRecommendation(rec: UpgradeRecommendation) { await this.profileService.setRecommendationState(rec.id, 'not-relevant', rec); }
  async completeRecommendation(rec: UpgradeRecommendation) { await this.profileService.completeUpgrade({ title: rec.title, type: rec.type, recommendationId: rec.id }); }

  getImpactColor(impact: string): string {
    switch (impact) {
      case 'Extreme': return 'text-violet-400';
      case 'High': return 'text-brand-primary';
      case 'Medium': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  }

  focusTool(toolId: string) { this.uiService.navigateToView(toolId as any); }
  formatNumber(n: number) { return n.toLocaleString(); }
  getHistoryStateLabel(state: string) { return state.toUpperCase(); }
}
