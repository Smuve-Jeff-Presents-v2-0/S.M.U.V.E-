import { LoggingService } from './logging.service';
import { Injectable, inject } from '@angular/core';
import { AudioEngineService } from './audio-engine.service';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private logger = inject(LoggingService);
  private engine = inject(AudioEngineService);

  async startVideoExport(canvas: HTMLCanvasElement) {
    this.logger.system('INITIALIZING INTEGRATED VIDEO EXPORT UPLINK...');
    this.engine.resume();
    const audioStream = this.engine.getMasterStream().stream;
    const canvasStream = (canvas as any).captureStream(60);
    audioStream.getAudioTracks().forEach(track => canvasStream.addTrack(track));
    const recorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm', videoBitsPerSecond: 8000000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    const promise = new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
    });
    recorder.start();
    return { recorder, result: promise };
  }

  async downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
