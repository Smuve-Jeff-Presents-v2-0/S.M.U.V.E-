import { Injectable, signal, computed, inject } from '@angular/core';
import { DeckService } from './deck.service';
import { AudioEngineService } from './audio-engine.service';
import { FileLoaderService } from './file-loader.service';
import { ExportService } from './export.service';

export interface GlobalTrack {
  id: string;
  title: string;
  artist: string;
  url?: string;
  buffer?: AudioBuffer;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private deckService = inject(DeckService);
  private audioEngine = inject(AudioEngineService);
  private fileLoader = inject(FileLoaderService);
  private exportService = inject(ExportService);

  isPlaying = computed(() => this.deckService.deckA().isPlaying);
  currentTrack = signal<GlobalTrack | null>({
    id: 'default',
    title: 'S.M.U.V.E Radio Broadcast',
    artist: 'AI SYNDICATE'
  });

  progress = computed(() => {
    const d = this.deckService.deckA();
    return d.duration > 0 ? (d.progress / d.duration) * 100 : 0;
  });

  isShuffle = signal(false);
  isRepeat = signal(false);

  togglePlay() {
    this.deckService.togglePlay('A');
  }

  next() {
    console.log('PlayerService: Skipping to next track');
    // Implement playlist logic if needed
  }

  previous() {
    console.log('PlayerService: Returning to previous track');
    // Implement playlist logic if needed
  }

  toggleShuffle() { this.isShuffle.set(!this.isShuffle()); }
  toggleRepeat() { this.isRepeat.set(!this.isRepeat()); }

  async loadExternalTrack() {
    const files = await this.fileLoader.pickLocalFiles('.mp3,.wav');
    if (files.length > 0) {
      const file = files[0];
      const buffer = await this.fileLoader.decodeToAudioBuffer(
        this.audioEngine.getContext(),
        file
      );
      this.deckService.loadDeckBuffer('A', buffer, file.name);
      this.currentTrack.set({
        id: Date.now().toString(),
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Local Import',
        buffer: buffer
      });
      if (!this.isPlaying()) this.togglePlay();
    }
  }

  exportCurrent() {
    const buffer = this.audioEngine.getDeck('A').buffer;
    if (!buffer) return;
    const wavBuffer = this.exportService.audioBufferToWav(buffer);
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentTrack()?.title}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
