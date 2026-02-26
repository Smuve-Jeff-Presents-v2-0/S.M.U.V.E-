import { Injectable, signal, inject } from '@angular/core';
import { DeckState, initialDeckState } from './user-context.service';
import { AudioEngineService } from './audio-engine.service';
import { ReputationService } from './reputation.service';
import { Stems } from './stem-separation.service';

@Injectable({
  providedIn: 'root',
})
export class DeckService {
  deckA = signal<DeckState>({ ...initialDeckState });
  deckB = signal<DeckState>({ ...initialDeckState });
  crossfader = signal(0); // -1 to 1

  private audioEngine = inject(AudioEngineService);
  private reputationService = inject(ReputationService);

  async loadDeckBuffer(deckId: 'A' | 'B', buffer: AudioBuffer, name: string) {
    if (deckId === 'A') {
      this.deckA.update((d) => ({
        ...d,
        track: { ...d.track, name, url: '' }, // Add missing url property
        buffer,
        duration: buffer.duration,
      }));
      await this.audioEngine.loadDeckBuffer('A', buffer);
    } else {
      this.deckB.update((d) => ({
        ...d,
        track: { ...d.track, name, url: '' }, // Add missing url property
        buffer,
        duration: buffer.duration,
      }));
      await this.audioEngine.loadDeckBuffer('B', buffer);
    }
  }

  togglePlay(deckId: 'A' | 'B') {
    const isA = deckId === 'A';
    const deck = isA ? this.deckA : this.deckB;
    const currentlyPlaying = deck().isPlaying;

    if (currentlyPlaying) {
      this.audioEngine.pauseDeck(deckId);
      deck.update((d) => ({ ...d, isPlaying: false }));
    } else {
      this.audioEngine.playDeck(deckId);
      deck.update((d) => ({ ...d, isPlaying: true }));
      this.reputationService.addXp(10); // Small XP for DJing
    }
  }

  setPlaybackRate(deckId: 'A' | 'B', rate: number) {
      if (deckId === 'A') {
          this.deckA.update(d => ({ ...d, playbackRate: rate }));
      } else {
          this.deckB.update(d => ({ ...d, playbackRate: rate }));
      }
      this.audioEngine.setDeckRate(deckId, rate);
  }

  onStemGainChange(deckId: 'A' | 'B', event: { stem: keyof Stems; value: number }) {
      this.audioEngine.setStemGain(deckId, event.stem, event.value);
  }
}
