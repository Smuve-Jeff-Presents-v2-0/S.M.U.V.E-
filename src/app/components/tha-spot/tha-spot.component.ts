import {
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { GameService } from '../../hub/game.service';
import { Game } from '../../hub/game';
import { UserProfileService } from '../../services/user-profile.service';
import { AiService } from '../../services/ai.service';
import { UIService } from '../../services/ui.service';
import { MainViewMode } from '../../services/user-context.service';

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
  isSystem?: boolean;
}

@Component({
  selector: 'app-tha-spot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tha-spot.component.html',
  styleUrls: ['./tha-spot.component.css'],
})
export class ThaSpotComponent implements OnInit, OnDestroy {
  @ViewChild('gameIframe') gameIframe?: ElementRef<HTMLIFrameElement>;

  private gameService = inject(GameService);
  private profileService = inject(UserProfileService);
  public aiService = inject(AiService);
  public uiService = inject(UIService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);

  activeTab = signal<string>('Arcade');
  games = signal<Game[]>([]);
  searchQuery = '';
  isSearching = signal(false);
  matchFound = signal(false);
  searchProgress = signal(0);
  opponentName = signal('');
  matchmakingStep = signal<string>('Initializing');

  currentGame = signal<Game | null>(null);

  leaderboard = signal<{ player: string; score: number }[]>([
    { player: 'SmuveKing', score: 125000 },
    { player: 'RhythmQueen', score: 98000 },
    { player: 'BassLord', score: 85400 },
  ]);

  chatMessages = signal<ChatMessage[]>([]);
  newChatMessage = '';
  isChatOpen = signal(false);

  // Isometric floor state
  floorRotation = signal({ x: 60, z: -45 });
  floorScale = signal(1);
  private isDragging = false;
  private lastMousePos = { x: 0, y: 0 };

  // Placeholder for game updates from iframe
  gameData = signal<any>({});

  ngOnInit() {
    this.fetchGames();
    this.chatMessages.set([
      {
        id: '1',
        user: 'S.M.U.V.E.',
        text: 'NEURAL CHAT LINK ESTABLISHED. KEEP IT DISCIPLINED.',
        timestamp: new Date(),
        isSystem: true,
      },
      {
        id: '2',
        user: 'SYSTEM',
        text: 'NEURAL LINK ESTABLISHED. WELCOME TO THA SPOT.',
        timestamp: new Date(),
        isSystem: true,
      },
    ]);
  }

  ngOnDestroy() {}

  fetchGames() {
    this.gameService
      .listGames({ query: this.searchQuery })
      .subscribe((g) => this.games.set(g));
  }

  navigateToView(mode: string) {
    this.uiService.navigateToView(mode as MainViewMode);
  }

  navigateTo(mode: string) {
    this.uiService.navigateToView(mode as MainViewMode);
  }

  playGame(game: Game) {
    if (game.tags?.includes('Multiplayer') || Math.random() > 0.7) {
      this.startMatchmaking(game);
    } else {
      this.currentGame.set(game);
    }
  }

  startMatchmaking(game: Game) {
    this.isSearching.set(true);
    this.matchFound.set(false);
    this.searchProgress.set(0);
    this.matchmakingStep.set('Scanning Matrix');

    const interval = setInterval(() => {
      this.searchProgress.update((p) => p + 5);
      if (this.searchProgress() >= 100) {
        clearInterval(interval);
        this.matchFound.set(true);
        setTimeout(() => {
          this.isSearching.set(false);
          this.currentGame.set(game);
        }, 1500);
      }
    }, 100);
  }

  closeGame() {
    this.currentGame.set(null);
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  toggleChat() {
    this.isChatOpen.update((v) => !v);
  }

  chatActive(): boolean {
    return this.isChatOpen();
  }

  sendChatMessage() {
    const text = this.newChatMessage.trim();
    if (!text) return;

    this.chatMessages.update((msgs) => [
      ...msgs,
      {
        id: Date.now().toString(),
        user: 'Artist',
        text,
        timestamp: new Date(),
      },
    ]);
    this.newChatMessage = '';
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  getFloorTransform() {
    return `rotateX(${this.floorRotation().x}deg) rotateZ(${this.floorRotation().z}deg) scale(${this.floorScale()})`;
  }

  onFloorMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.lastMousePos = { x: event.clientX, y: event.clientY };
  }

  onFloorMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    const deltaX = event.clientX - this.lastMousePos.x;
    const deltaY = event.clientY - this.lastMousePos.y;
    this.floorRotation.update((r) => ({
      x: Math.max(30, Math.min(80, r.x - deltaY * 0.5)),
      z: r.z + deltaX * 0.5,
    }));
    this.lastMousePos = { x: event.clientX, y: event.clientY };
  }

  @HostListener('window:mouseup')
  onFloorMouseUp() {
    this.isDragging = false;
  }

  getStationPos(index: number) {
    const row = Math.floor(index / 4);
    const col = index % 4;
    return `pos-${row}-${col}`;
  }

  @HostListener('window:message', ['$event'])
  onMessage(event: MessageEvent) {
    const type = (event as MessageEvent).data?.type;
    const payload = (event as MessageEvent).data?.payload || (event as MessageEvent).data?.data;

    if (type === 'GAME_UPDATE' && payload) {
      this.gameData.update((d: any) => ({ ...d, ...payload }));

      if (payload.score > 1000 && payload.score % 5000 < 500) {
        this.chatMessages.update((msgs) => [
          ...msgs,
          {
            id: Date.now().toString(),
            user: 'S.M.U.V.E',
            text: `EXECUTIVE PERFORMANCE DETECTED: ${payload.score} POINTS. STATUS SYNCED.`,
            timestamp: new Date(),
            isSystem: true,
          },
        ]);
      }
    }
  }

  navigateToPath(path: string) {
    this.router.navigate([path]);
  }
}
