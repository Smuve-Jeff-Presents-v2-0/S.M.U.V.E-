import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ArrangementTrack {
  id: string;
  name: string;
  clips: ArrangementClip[];
  muted: boolean;
  solo: boolean;
}

export interface ArrangementClip {
  id: string;
  name: string;
  start: number;
  length: number;
  color: string;
}

const TRACK_COLORS = [
  '#10b981', '#8b5cf6', '#f59e0b', '#3b82f6',
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
];

@Component({
  selector: 'app-arrangement-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './arrangement-view.component.html',
  styleUrls: ['./arrangement-view.component.css'],
})
export class ArrangementViewComponent {
  bars = Array.from({ length: 64 }, (_, i) => i);
  barWidth = 100;
  gridWidth = 64 * 100;
  playheadPos = signal(120);
  selectedTrackId = signal<string | null>(null);
  selectedClipId = signal<string | null>(null);

  tracks = signal<ArrangementTrack[]>([
    {
      id: '1',
      name: 'Kick',
      muted: false,
      solo: false,
      clips: [
        { id: 'c1', name: 'Pattern 1', start: 0, length: 4, color: '#10b981' },
        { id: 'c2', name: 'Pattern 1', start: 8, length: 4, color: '#10b981' },
      ],
    },
    {
      id: '2',
      name: 'Snare',
      muted: false,
      solo: false,
      clips: [
        { id: 'c3', name: 'Pattern 2', start: 4, length: 4, color: '#8b5cf6' },
      ],
    },
    {
      id: '3',
      name: 'Vocal 01',
      muted: false,
      solo: false,
      clips: [
        {
          id: 'c4',
          name: 'Verse 1 Recording',
          start: 0,
          length: 16,
          color: '#f59e0b',
        },
      ],
    },
    {
      id: '4',
      name: 'Lead Synth',
      muted: false,
      solo: false,
      clips: [
        { id: 'c5', name: 'Synth Loop', start: 8, length: 8, color: '#3b82f6' },
      ],
    },
  ]);

  trackCount = computed(() => this.tracks().length);
  clipCount = computed(() =>
    this.tracks().reduce((sum, t) => sum + t.clips.length, 0)
  );

  addTrack(): void {
    const currentTracks = this.tracks();
    const newId = String(currentTracks.length + 1);
    const colorIndex = currentTracks.length % TRACK_COLORS.length;
    const newTrack: ArrangementTrack = {
      id: newId,
      name: `Track ${newId}`,
      muted: false,
      solo: false,
      clips: [],
    };
    this.tracks.set([...currentTracks, newTrack]);
  }

  removeTrack(trackId: string): void {
    this.tracks.update((tracks) => tracks.filter((t) => t.id !== trackId));
    if (this.selectedTrackId() === trackId) {
      this.selectedTrackId.set(null);
    }
  }

  selectTrack(trackId: string): void {
    this.selectedTrackId.set(trackId);
  }

  toggleMute(trackId: string): void {
    this.tracks.update((tracks) =>
      tracks.map((t) =>
        t.id === trackId ? { ...t, muted: !t.muted } : t
      )
    );
  }

  toggleSolo(trackId: string): void {
    this.tracks.update((tracks) =>
      tracks.map((t) =>
        t.id === trackId ? { ...t, solo: !t.solo } : t
      )
    );
  }

  addClip(trackId: string): void {
    const colorIndex = this.tracks().findIndex((t) => t.id === trackId);
    const color = TRACK_COLORS[colorIndex % TRACK_COLORS.length];
    const newClip: ArrangementClip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: 'New Clip',
      start: 0,
      length: 4,
      color,
    };
    this.tracks.update((tracks) =>
      tracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t
      )
    );
  }

  removeClip(trackId: string, clipId: string): void {
    this.tracks.update((tracks) =>
      tracks.map((t) =>
        t.id === trackId
          ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) }
          : t
      )
    );
    if (this.selectedClipId() === clipId) {
      this.selectedClipId.set(null);
    }
  }

  selectClip(clipId: string, event: Event): void {
    event.stopPropagation();
    this.selectedClipId.set(clipId);
  }

  onClipKeydown(clipId: string, event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectedClipId.set(clipId);
    }
  }

  isTrackSelected(trackId: string): boolean {
    return this.selectedTrackId() === trackId;
  }

  isClipSelected(clipId: string): boolean {
    return this.selectedClipId() === clipId;
  }
}
