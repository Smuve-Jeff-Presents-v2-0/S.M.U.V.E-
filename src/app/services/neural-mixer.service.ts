import { Injectable, inject } from '@angular/core';
import { MusicManagerService } from './music-manager.service';

@Injectable({ providedIn: 'root' })
export class NeuralMixerService {
  private musicManager = inject(MusicManagerService);

  applyNeuralMix() {
    this.musicManager.tracks.update(ts => ts.map(t => {
      const name = t.name.toLowerCase();
      let gain = t.gain;
      let pan = t.pan;
      let sendA = t.sendA;
      let sendB = t.sendB;

      // Heuristic AI Mixing Logic
      if (name.includes('kick')) {
        gain = 0.85;
        pan = 0;
      } else if (name.includes('snare') || name.includes('clap')) {
        gain = 0.75;
        pan = 0;
      } else if (name.includes('vocal')) {
        gain = 0.95;
        pan = 0;
        sendA = 0.25; // Vocal Reverb
        sendB = 0.15; // Vocal Delay
      } else if (name.includes('hi-hat') || name.includes('percussion')) {
        gain = 0.55;
        pan = (Math.random() - 0.5) * 0.6;
      } else if (name.includes('lead') || name.includes('synth')) {
        gain = 0.7;
        pan = -0.15;
        sendA = 0.2;
      } else if (name.includes('bass')) {
        gain = 0.8;
        pan = 0;
      } else if (name.includes('pad')) {
        gain = 0.6;
        pan = 0.2;
        sendA = 0.4;
      }

      return { ...t, gain, pan, sendA, sendB };
    }));

    // Synchronize changes with the Audio Engine
    this.musicManager.tracks().forEach(t => {
       this.musicManager.engine.updateTrack(t.id, {
         gain: t.gain,
         pan: t.pan,
         sendA: t.sendA,
         sendB: t.sendB
       });
    });
  }
}
