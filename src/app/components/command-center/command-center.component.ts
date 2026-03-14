import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIService } from '../../services/ui.service';
import { AiService, StrategicRecommendation } from '../../services/ai.service';
import { UserProfileService } from '../../services/user-profile.service';
import { ReputationService } from '../../services/reputation.service';
import { UpgradeRecommendation } from '../../types/ai.types';

@Component({
  selector: 'app-command-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './command-center.component.html',
  styleUrls: ['./command-center.component.css']
})
export class CommandCenterComponent implements OnInit, OnDestroy {
  public aiService = inject(AiService);
  public profileService = inject(UserProfileService);
  public uiService = inject(UIService);
  public reputationService = inject(ReputationService);

  recommendations = computed(() => this.aiService.getUpgradeRecommendations());
  strategicRecs = signal<StrategicRecommendation[]>([]);
  isPoweringUp = signal(false);

  // Terminal state
  terminalLines = signal<string[]>([]);
  private intervalId: any;

  ngOnInit() {
    this.startTerminalSimulation();
    this.loadStrategicRecommendations();
  }

  async loadStrategicRecommendations() {
    const recs = await this.aiService.getStrategicRecommendations();
    this.strategicRecs.set(recs);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private startTerminalSimulation() {
    // Wait for decrees to be available
    const checkDecrees = setInterval(() => {
      const decrees = this.aiService.strategicDecrees();
      if (decrees.length > 0) {
        clearInterval(checkDecrees);

        // Clear existing lines to refresh simulation if needed
        this.terminalLines.set([]);

        let currentLine = 0;
        this.intervalId = setInterval(() => {
          if (currentLine < decrees.length) {
            this.terminalLines.update(lines => [...lines, decrees[currentLine]]);
            currentLine++;
          } else {
            clearInterval(this.intervalId);
          }
        }, 800);
      }
    }, 500);
  }

  async handleCommand(command: string) {
    if (!command.trim()) return;

    this.terminalLines.update(lines => [...lines, `USER: ${command.toUpperCase()}`]);

    const response = await this.aiService.processCommand(command);

    // Simulate thinking delay
    setTimeout(() => {
      this.terminalLines.update(lines => [...lines, `SMUVE: ${response}`]);

      // Auto-scroll terminal (logic usually in component or via directive,
      // but for this mock we just update the signal)
    }, 400);
  }

  async acquireUpgrade(rec: UpgradeRecommendation) {
    this.isPoweringUp.set(true);

    await this.profileService.acquireUpgrade({ title: rec.title, type: rec.type });

    this.terminalLines.update(lines => [...lines, `ALERT: INTEGRATING ${rec.title.toUpperCase()}. SYNCING NEURAL PATHWAYS.`]);

    setTimeout(() => {
      this.isPoweringUp.set(false);
      if (rec.url) {
        window.open(rec.url, '_blank');
      }
    }, 1200);
  }

  initializeOperation(srec: StrategicRecommendation) {
    this.terminalLines.update(lines => [...lines, `INITIALIZING OPERATION: ${srec.action.toUpperCase()}...`]);

    setTimeout(() => {
      if (srec.toolId) {
        this.uiService.navigateToView(srec.toolId as any);
      }
    }, 800);
  }

  getImpactColor(impact: string): string {
    switch (impact) {
      case 'Extreme': return 'text-violet-400 animate-pulse-subtle font-black';
      case 'High': return 'text-brand-primary';
      case 'Medium': return 'text-yellow-400';
      case 'Low': return 'text-slate-400';
      default: return 'text-white';
    }
  }
}
