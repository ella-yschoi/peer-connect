export interface SignalMessage {
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  timestamp: number;
}

export interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isConnected: boolean;
  roomId: string;
  isInRoom: boolean;
  peerLeft: boolean;
  messages: ChatMessage[];
}
