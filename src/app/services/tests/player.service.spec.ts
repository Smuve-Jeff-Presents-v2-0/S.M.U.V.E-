import { TestBed } from '@angular/core/testing';
import { PlayerService } from '../player.service';
import { DeckService } from '../deck.service';
import { AudioEngineService } from '../audio-engine.service';
import { FileLoaderService } from '../file-loader.service';
import { ExportService } from '../export.service';
import { signal } from '@angular/core';

describe('PlayerService', () => {
  let service: PlayerService;
  let mockDeckService: any;
  let mockAudioEngine: any;

  beforeEach(() => {
    mockDeckService = {
      deckA: signal({ isPlaying: false, progress: 0, duration: 100 }),
      togglePlay: jest.fn(),
      loadDeckBuffer: jest.fn()
    };
    mockAudioEngine = {
      getContext: jest.fn().mockReturnValue({ sampleRate: 44100 }),
      getDeck: jest.fn().mockReturnValue({ buffer: {} })
    };

    TestBed.configureTestingModule({
      providers: [
        PlayerService,
        { provide: DeckService, useValue: mockDeckService },
        { provide: AudioEngineService, useValue: mockAudioEngine },
        { provide: FileLoaderService, useValue: {} },
        { provide: ExportService, useValue: {} }
      ]
    });
    service = TestBed.inject(PlayerService);
  });

  it('should toggle play on Deck A', () => {
    service.togglePlay();
    expect(mockDeckService.togglePlay).toHaveBeenCalledWith('A');
  });

  it('should calculate progress correctly', () => {
    mockDeckService.deckA.set({ isPlaying: true, progress: 50, duration: 100 });
    expect(service.progress()).toBe(50);
  });
});
