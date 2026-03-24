import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from '../../services/ai.service';
import { AdvisorAdvice } from '../../types/ai.types';
import { UserContextService } from '../../services/user-context.service';

@Component({
  selector: 'app-smuve-advisor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './smuve-advisor.component.html',
  styleUrls: ['./smuve-advisor.component.css'],
})
export class SmuveAdvisorComponent {
  private aiService = inject(AiService);
  private userContext = inject(UserContextService);

  advice = this.aiService.advisorAdvice;
  isOpen = signal(false);

  toggleOpen() {
    this.isOpen.update((v) => !v);
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'medium':
        return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
      default:
        return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
    }
  }

  executeAction(item: AdvisorAdvice) {
    console.log('Advisor Action Executed:', item.title);
  }
}
