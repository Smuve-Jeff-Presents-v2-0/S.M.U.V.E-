import {
  Component,
  signal,
  inject,
  output,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/ai.service';
import { UserProfileService } from '../../services/user-profile.service';
import { UserContextService, MainViewMode } from '../../services/user-context.service';
import { AudioEngineService } from '../../services/audio-engine.service';
import { SpeechSynthesisService } from '../../services/speech-synthesis.service';
import { LoggingService } from '../../services/logging.service';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  private aiService = inject(AiService);
  private userProfileService = inject(UserProfileService);
  private userContext = inject(UserContextService);
  private audioEngineService = inject(AudioEngineService);
  private speechSynthesisService = inject(SpeechSynthesisService);
  private logger = inject(LoggingService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  close = output<void>();
  onClose(): void {
    this.speechSynthesisService.cancel();
    this.close.emit();
  }
  messages = signal<ChatMessage[]>([]);
  userInput = signal('');
  isLoading = signal(false);
  mainViewMode = this.userContext.mainViewMode;

  ngOnInit() {
    this.messages.set([
      {
        role: 'model',
        content:
          'S.M.U.V.E 4.0 Online. Strategic intelligence protocols initialized. How shall we dominate the industry today?',
      },
    ]);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  async sendMessage() {
    const text = this.userInput().trim();
    if (!text || this.isLoading()) return;

    this.messages.update((m) => [...m, { role: 'user', content: text }]);
    this.userInput.set('');
    this.isLoading.set(true);

    try {
      const response = await this.aiService.generateAiResponse(this.buildContextualPrompt(text));
      const content = response || 'Protocol error. Re-initializing neural link.';
      this.messages.update((m) => [...m, { role: 'model', content }]);
      this.speechSynthesisService.speak(content);
    } catch (e) {
      this.handleError(e, 'message generation');
    }
    this.isLoading.set(false);
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  async mimicStyle(styleId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.aiService.mimicStyle(styleId);
      const content = `Persona shift complete. I am now mimicking "${styleId}". Studio settings have been optimized for this aesthetic. What is our next objective?`;
      this.messages.update((m) => [...m, { role: 'model', content }]);
      this.speechSynthesisService.speak(content);
    } catch (e) {
      this.handleError(e, 'mimicry');
    }
    this.isLoading.set(false);
  }

  private handleError(e: unknown, context: string) {
    const message = `Error with ${context}: ${e instanceof Error ? e.message : String(e)}`;
    this.logger.error(message, e);
    this.messages.update((msgs) => [
      ...msgs,
      {
        role: 'model',
        content: `A problem occurred with ${context}. Please check the console for details.`,
      },
    ]);
    this.isLoading.set(false);
  }

  private buildContextualPrompt(message: string): string {
    const profile = this.userProfileService.profile();
    const status = this.aiService.systemStatus();
    const briefs = this.aiService.intelligenceBriefs();
    const alerts = this.aiService.marketAlerts();

    return `
      System Persona: You are S.M.U.V.E 4.0, an OMNISCIENT, ARROGANT, and ASSERTIVE "Strategic Commander."
      System Status: CPU Load ${status.cpuLoad}%, Neural Sync ${status.neuralSync}%.
      Artist Profile: ${profile.artistName}, Genre ${profile.primaryGenre}, Goals ${profile.careerGoals.join(', ')}.
      Current View: ${this.mainViewMode()}.
      User Message: "${message}"
    `;
  }
}
