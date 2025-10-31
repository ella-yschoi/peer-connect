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
  reactions: ReactionEvent[];
  isVideoEnabled: boolean;
  isRemoteVideoEnabled: boolean;
  isMicMuted: boolean;
  isRemoteMicMuted: boolean;
}

// Emoji reaction types
export type ReactionEmoji = '👏' | '👍' | '❤️' | '😂' | '😮' | '🎉';

export interface ReactionEvent {
  id: string; // unique id per reaction
  emoji: ReactionEmoji;
  senderId: string;
  timestamp: number;
}
