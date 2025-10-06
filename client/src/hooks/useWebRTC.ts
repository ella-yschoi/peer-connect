import { useState, useRef, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebRTCState, SignalMessage } from '../types';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useWebRTC = () => {
  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    isConnected: false,
    roomId: '',
    isInRoom: false,
  });

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Monitor local video stream
  useEffect(() => {
    if (state.localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = state.localStream;
      console.log('useEffect: Local video stream assigned');
    }
  }, [state.localStream]);

  // Get local media stream
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log('Local stream obtained successfully:', stream);
      setState((prev) => ({ ...prev, localStream: stream }));

      // Assign stream to video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('Stream assigned to local video element');
      } else {
        console.warn('Local video element not found');
      }

      return stream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      throw error;
    }
  }, []);

  // Create PeerConnection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(STUN_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log('ICE Candidate generated:', event.candidate);
        socketRef.current.emit('signal', {
          roomId: state.roomId,
          signal: event.candidate,
          type: 'ice-candidate',
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Remote stream received');
      const remoteStream = event.streams[0];
      setState((prev) => ({ ...prev, remoteStream }));

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state changed:', pc.connectionState);
      const isConnected = pc.connectionState === 'connected';
      setState((prev) => ({ ...prev, isConnected }));
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
    };

    peerConnectionRef.current = pc;
    setState((prev) => ({ ...prev, peerConnection: pc }));

    return pc;
  }, [state.roomId]);

  // Join room
  const joinRoom = useCallback(
    async (roomId: string) => {
      try {
        // Get local stream
        const localStream = await getLocalStream();

        // Connect to Socket.io
        socketRef.current = io('http://localhost:3001');

        // Create PeerConnection
        const pc = createPeerConnection();

        // Add local stream to PeerConnection
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });

        // Join room
        socketRef.current.emit('join-room', roomId);

        setState((prev) => ({
          ...prev,
          roomId,
          isInRoom: true,
        }));

        // Reassign stream to local video element (after component mount)
        setTimeout(() => {
          if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
            console.log('Local video stream reassigned');
          }
        }, 100);

        // Handle signaling messages
        socketRef.current.on('signal', async (message: SignalMessage) => {
          const { signal, type, from } = message;
          console.log(`Signal received: ${type} from ${from}`);

          try {
            if (type === 'offer') {
              console.log('Processing offer...');
              await pc.setRemoteDescription(
                signal as RTCSessionDescriptionInit
              );
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              socketRef.current?.emit('signal', {
                roomId,
                signal: answer,
                type: 'answer',
              });
              console.log('Answer sent');
            } else if (type === 'answer') {
              console.log('Processing answer...');
              await pc.setRemoteDescription(
                signal as RTCSessionDescriptionInit
              );
            } else if (type === 'ice-candidate') {
              console.log('Processing ICE candidate...');
              await pc.addIceCandidate(signal as RTCIceCandidateInit);
            }
          } catch (error) {
            console.error('Signal processing error:', error);
          }
        });

        // Create offer when new user joins
        socketRef.current.on('user-joined', async () => {
          console.log('New user joined, creating offer...');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socketRef.current?.emit('signal', {
            roomId,
            signal: offer,
            type: 'offer',
          });
          console.log('Offer sent');
        });
      } catch (error) {
        console.error('Failed to join room:', error);
        throw error;
      }
    },
    [getLocalStream, createPeerConnection]
  );

  // Leave room and cleanup
  const leaveRoom = useCallback(() => {
    if (state.localStream) {
      state.localStream.getTracks().forEach((track) => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    setState({
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isConnected: false,
      roomId: '',
      isInRoom: false,
    });
  }, [state.localStream]);

  return {
    state,
    localVideoRef,
    remoteVideoRef,
    joinRoom,
    leaveRoom,
  };
};
