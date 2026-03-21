import { LoggingService } from './logging.service';
import { Injectable, signal, inject } from '@angular/core';
import { AuthUser } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CollaborationService {
  private logger = inject(LoggingService);
  private peers: { [key: string]: RTCPeerConnection } = {};
  private dataChannels: { [key: string]: RTCDataChannel } = {};
  currentSession = signal<any>(null);

  async startSession(user: AuthUser, projectState: any): Promise<string> {
    const sessionId = Math.random().toString(36).substr(2, 9);
    this.logger.system(`INITIALIZING WEBRTC P2P SESSION: ${sessionId}`);
    this.currentSession.set({ sessionId, participants: [user], projectState });
    return sessionId;
  }

  async joinSession(sessionId: string, user: AuthUser): Promise<void> {
    this.logger.system(`JOINING P2P COLLABORATION SESSION: ${sessionId}`);
    const peerConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    const dataChannel = peerConnection.createDataChannel('smuve-sync');
    dataChannel.onopen = () => this.logger.system('P2P DATA LINK ESTABLISHED.');
    this.peers[sessionId] = peerConnection;
    this.dataChannels[sessionId] = dataChannel;
  }

  sendProjectUpdate(sessionId: string, projectState: any): void {
    const channel = this.dataChannels[sessionId];
    if (channel && channel.readyState === 'open') {
      channel.send(JSON.stringify({ action: 'update', payload: projectState }));
    }
  }
}
