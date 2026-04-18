import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioSessionService } from '../audio-session.service';
import { ChannelStripComponent } from '../channel-strip/channel-strip.component';
import { VocalSuiteComponent } from '../vocal-suite/vocal-suite.component';
import { MusicManagerService, TrackModel } from '../../services/music-manager.service';
import { NeuralMixerService } from '../../services/neural-mixer.service';
import { MixerService } from '../mixer.service';

@Component({
  selector: 'app-mixer', standalone: true, imports: [CommonModule, ChannelStripComponent, VocalSuiteComponent],
  templateUrl: './mixer.component.html', styleUrls: ['./mixer.component.css'],
})
export class MixerComponent {
  public audioSession = inject(AudioSessionService);
  public musicManager = inject(MusicManagerService);
  private neuralMixer = inject(NeuralMixerService);
  public mixerService = inject(MixerService);

  @Input() activeClip: any = null;

  masterVolume = this.audioSession.masterVolume;
  selectedTrackId = this.musicManager.selectedTrackId;
  tracks = this.musicManager.tracks;
  micChannels = this.audioSession.micChannels;
  isPlaying = this.audioSession.isPlaying;
  isRecording = this.audioSession.isRecording;

  viewMode = signal<'compact' | 'expanded'>('expanded');
  showVocalSuite = signal(false);
  showVisualRouting = signal(false);

  toggleViewMode() { this.viewMode.update((v) => (v === 'compact' ? 'expanded' : 'compact')); }
  toggleVocalSuite() { this.showVocalSuite.update((v) => !v); }
  toggleVisualRouting() { this.showVisualRouting.update((v) => !v); }

  togglePlayback() { this.audioSession.togglePlay(); }
  toggleRecording() { this.audioSession.toggleRecord(); }
  stopPlayback() { this.audioSession.stop(); }

  updateMasterVolume(v: number) { this.audioSession.updateMasterVolume(v); }
  applyNeuralMix() { this.neuralMixer.applyNeuralMix(); }
  suggestTrack(id: number) { this.neuralMixer.suggestForTrack(id); }
  stopTrackSelection(e: Event) { e.stopPropagation(); }
  selectTrack(id: number) { this.musicManager.selectedTrackId.set(id); }
  toggleMute(id: number) { this.musicManager.toggleMute(id); }
  toggleSolo(id: number) { this.musicManager.toggleSolo(id); }
  updateTrackGain(id: number, v: number) { this.musicManager.engine.updateTrack(id, { gain: v / 100 }); }
  updateTrackPan(id: number, v: number) { this.musicManager.engine.updateTrack(id, { pan: v / 100 }); }
  gainPercent(t: TrackModel) { return Math.round((t.gain || 0) * 100); }
  panPercent(t: TrackModel) { return Math.round((t.pan || 0) * 100); }
  isSelected(t: TrackModel) { return this.selectedTrackId() === t.id; }
  toggleFxSlot(trackId: number, slotId: string) {
    const track = this.musicManager.tracks().find(t => t.id === trackId);
    if (!track) return;

    const updatedSlots = track.fxSlots.map(s => s.id === slotId ? { ...s, enabled: !s.enabled } : s);

    this.musicManager.tracks.update(ts =>
      ts.map(t => t.id === trackId ? { ...t, fxSlots: updatedSlots } : t)
    );

    this.musicManager.engine.updateTrack(trackId, { fxSlots: updatedSlots });
  }
  resetTrack(id: number) {
    this.musicManager.tracks.update(ts => ts.map(t => t.id === id ? { ...t, gain: 0.9, pan: 0 } : t));
    this.musicManager.engine.updateTrack(id, { gain: 0.9, pan: 0 });
  }
}
