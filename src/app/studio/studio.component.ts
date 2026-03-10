import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TransportBarComponent } from './transport-bar/transport-bar.component';
import { MixerComponent } from './mixer/mixer.component';
import { MasterControlsComponent } from './master-controls/master-controls.component';
import { DjDeckComponent } from './dj-deck/dj-deck.component';
import { ChannelRackComponent } from './channel-rack/channel-rack.component';
import { ArrangementViewComponent } from './arrangement-view/arrangement-view.component';
import { PianoRollComponent } from './piano-roll/piano-roll.component';
import { WaveformRendererComponent } from './waveform-renderer/waveform-renderer.component';
import { AudioSessionService } from './audio-session.service';
import { MusicManagerService } from '../services/music-manager.service';

@Component({
  selector: 'app-studio',
  standalone: true,
  imports: [
    CommonModule,
    TransportBarComponent,
    MixerComponent,
    MasterControlsComponent,
    DjDeckComponent,
    ChannelRackComponent,
    ArrangementViewComponent,
    PianoRollComponent,
    WaveformRendererComponent
  ],
  templateUrl: './studio.component.html',
  styleUrls: ['./studio.component.css']
})
export class StudioComponent implements OnInit {
  private readonly audioSession = inject(AudioSessionService);
  private readonly route = inject(ActivatedRoute);
  public readonly musicManager = inject(MusicManagerService);

  activeView = signal<'daw' | 'dj' | 'mastering'>('daw');
  showMixer = signal(true);
  showRack = signal(true);
  showPianoRoll = signal(false);

  isRecording = this.audioSession.isRecording;


  ngOnInit() {
    this.route.url.subscribe(url => {
      const path = url[0]?.path;
      if (path === 'dj') {
        this.activeView.set('dj');
      } else if (path === 'mastering') {
        this.activeView.set('mastering');
      } else {
        this.activeView.set('daw');
      }
    });
  }

  constructor() {
    effect(() => {
      const selectedId = this.musicManager.selectedTrackId();
      if (selectedId) {
        if (this.activeView() !== "dj") this.showPianoRoll.set(true);
      }
    });
  }

  toggleView(view: 'daw' | 'dj' | 'mastering') {
    this.activeView.set(view);
  }
}
