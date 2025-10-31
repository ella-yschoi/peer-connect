import { useState, useRef, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  WebRTCState,
  SignalMessage,
  ChatMessage,
  ReactionEvent,
  ReactionEmoji,
} from '../types';

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
    peerLeft: false,
    messages: [],
    reactions: [],
    isVideoEnabled: true,
    isRemoteVideoEnabled: true,
    isMicMuted: false,
    isRemoteMicMuted: false,
  });

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Save chat messages to localStorage
  const saveChatMessages = useCallback(
    (roomId: string, messages: ChatMessage[]) => {
      try {
        localStorage.setItem(`chat-${roomId}`, JSON.stringify(messages));
      } catch (error) {
        console.error('Failed to save chat messages:', error);
      }
    },
    []
  );

  // Clear chat messages from localStorage
  const clearChatMessages = useCallback((roomId: string) => {
    try {
      localStorage.removeItem(`chat-${roomId}`);
      console.log('Cleared chat messages for room:', roomId);
    } catch (error) {
      console.error('Failed to clear chat messages:', error);
    }
  }, []);

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

      // If ICE connection fails, try to reconnect
      if (pc.iceConnectionState === 'failed') {
        console.log('ICE connection failed, attempting to restart...');
        pc.restartIce();
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', pc.iceGatheringState);
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
        socketRef.current = io(
          import.meta.env.VITE_SIGNALING_URL || 'http://localhost:3001',
          {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true,
          }
        );

        // Handle connection events
        socketRef.current.on('disconnect', (reason) => {
          console.log('Disconnected from signaling server:', reason);
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('Connection error:', error);
        });

        // Create PeerConnection
        const pc = createPeerConnection();

        // Add local stream to PeerConnection
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });

        // Set up signaling message handlers BEFORE joining room
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
              try {
                await pc.addIceCandidate(signal as RTCIceCandidateInit);
              } catch (iceError) {
                console.warn('Failed to add ICE candidate:', iceError);
              }
            }
          } catch (error) {
            console.error('Signal processing error:', error);
          }
        });

        // Create offer when new user joins
        socketRef.current.on('user-joined', async () => {
          console.log('New user joined, creating offer...');
          setState((prev) => ({ ...prev, peerLeft: false }));

          try {
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });
            await pc.setLocalDescription(offer);

            socketRef.current?.emit('signal', {
              roomId,
              signal: offer,
              type: 'offer',
            });
            console.log('Offer sent');

            // Broadcast current mic status to sync with newly joined peer
            socketRef.current?.emit('mic-status-change', {
              roomId,
              isMuted: state.isMicMuted,
            });
            console.log(
              `Broadcasted current mic status after user-joined: ${
                state.isMicMuted ? 'MUTED' : 'UNMUTED'
              }`
            );
          } catch (error) {
            console.error('Failed to create offer:', error);
          }
        });

        // Wait for connection before joining room
        socketRef.current.on('connect', () => {
          console.log('Connected to signaling server, joining room...');
          // Generate unique user ID for this session
          const userId = socketRef.current?.id || `user-${Date.now()}`;
          setCurrentUserId(userId);
          socketRef.current?.emit('join-room', roomId);
        });

        // If already connected, join immediately
        if (socketRef.current.connected) {
          const userId = socketRef.current.id || `user-${Date.now()}`;
          setCurrentUserId(userId);
          socketRef.current.emit('join-room', roomId);
        }

        // Clear any existing chat messages for this room before joining
        clearChatMessages(roomId);

        setState((prev) => ({
          ...prev,
          roomId,
          isInRoom: true,
          messages: [], // Clear messages when joining new room
        }));

        // Reassign stream to local video element (after component mount)
        setTimeout(() => {
          if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
            console.log('Local video stream reassigned');
          }
        }, 100);

        // Check if there are already users in the room and create offer immediately
        socketRef.current.on('room-users', (userCount: number) => {
          console.log(`Room has ${userCount} users`);
          if (userCount > 1) {
            // There are other users, create offer immediately
            setTimeout(async () => {
              try {
                console.log('Creating initial offer for existing users...');
                const offer = await pc.createOffer({
                  offerToReceiveAudio: true,
                  offerToReceiveVideo: true,
                });
                await pc.setLocalDescription(offer);

                socketRef.current?.emit('signal', {
                  roomId,
                  signal: offer,
                  type: 'offer',
                });
                console.log('Initial offer sent');

                // Broadcast current mic status to sync with existing peer
                socketRef.current?.emit('mic-status-change', {
                  roomId,
                  isMuted: state.isMicMuted,
                });
                console.log(
                  `Broadcasted current mic status on initial offer: ${
                    state.isMicMuted ? 'MUTED' : 'UNMUTED'
                  }`
                );
              } catch (error) {
                console.error('Failed to create initial offer:', error);
              }
            }, 1000);
          }
        });

        // Handle peer leaving
        socketRef.current.on('user-left', (userId: string) => {
          console.log(
            `🔴 User ${userId} left the room - setting peerLeft to true`
          );
          setState((prev) => ({ ...prev, peerLeft: true }));

          // Clean up remote stream
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
            console.log('🔴 Remote video stream cleared');
          }

          // Close peer connection
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
            console.log('🔴 Peer connection closed');
          }
        });

        // Handle chat messages
        socketRef.current.on('receive-message', (message: ChatMessage) => {
          console.log(
            'Received message:',
            message,
            'Current userId:',
            currentUserId
          );
          setState((prev) => {
            // Check if message already exists to prevent duplicates
            const messageExists = prev.messages.some(
              (m) => m.id === message.id
            );
            if (messageExists) {
              console.log('Message already exists, skipping:', message.id);
              return prev;
            }

            const newMessages = [...prev.messages, message].sort(
              (a, b) => a.timestamp - b.timestamp
            );
            console.log('Updated messages:', newMessages);

            // Save to localStorage
            saveChatMessages(roomId, newMessages);

            return {
              ...prev,
              messages: newMessages,
            };
          });
        });

        // Handle reactions
        socketRef.current.on('receive-reaction', (reaction: ReactionEvent) => {
          setState((prev) => ({
            ...prev,
            reactions: [...prev.reactions, reaction],
          }));
          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              reactions: prev.reactions.filter((r) => r.id !== reaction.id),
            }));
          }, 3000);
        });

        // Handle remote camera status changes
        socketRef.current.on('remote-camera-status-change', ({ isEnabled }) => {
          console.log(
            `Remote camera status changed to: ${isEnabled ? 'ON' : 'OFF'}`
          );
          setState((prev) => ({ ...prev, isRemoteVideoEnabled: isEnabled }));
        });

        // Handle remote mic status changes
        socketRef.current.on('remote-mic-status-change', ({ isMuted }) => {
          console.log(
            `Remote mic status changed to: ${isMuted ? 'MUTED' : 'UNMUTED'}`
          );
          setState((prev) => ({ ...prev, isRemoteMicMuted: isMuted }));
        });

        // Wait for ICE gathering to complete before checking connection
        setTimeout(() => {
          if (pc.iceGatheringState === 'complete') {
            console.log('ICE gathering completed');
          }
        }, 2000);
      } catch (error) {
        console.error('Failed to join room:', error);
        throw error;
      }
    },
    [getLocalStream, createPeerConnection, saveChatMessages, clearChatMessages]
  );

  // Leave room and cleanup
  const leaveRoom = useCallback(() => {
    console.log('🚪 Leaving room:', state.roomId);

    // Clear chat messages from localStorage before leaving
    if (state.roomId) {
      clearChatMessages(state.roomId);
    }

    // First notify server that we're leaving the room
    if (socketRef.current && state.roomId) {
      console.log('📤 Sending leave-room event to server');
      socketRef.current.emit('leave-room', state.roomId);
    }

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
      peerLeft: false,
      messages: [], // Clear messages when leaving room
      reactions: [],
      isVideoEnabled: true,
      isRemoteVideoEnabled: true,
      isMicMuted: false,
      isRemoteMicMuted: false,
    });
  }, [state.localStream, state.roomId, clearChatMessages]);

  // Send chat message
  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !state.roomId || !content.trim()) return;

      console.log('Sending message with userId:', currentUserId);

      const message: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: content.trim(),
        senderId: currentUserId,
        timestamp: Date.now(),
      };

      socketRef.current.emit('send-message', {
        roomId: state.roomId,
        message,
      });

      // Add message to local state immediately
      setState((prev) => {
        const newMessages = [...prev.messages, message].sort(
          (a, b) => a.timestamp - b.timestamp
        );
        console.log('Sending message, updated messages:', newMessages);

        // Save to localStorage
        saveChatMessages(state.roomId, newMessages);

        return {
          ...prev,
          messages: newMessages,
        };
      });
    },
    [state.roomId, state.messages, saveChatMessages, currentUserId]
  );

  // Send emoji reaction
  const sendReaction = useCallback(
    (emoji: ReactionEmoji) => {
      if (!socketRef.current || !state.roomId) return;

      const reaction: ReactionEvent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        emoji,
        senderId: currentUserId,
        timestamp: Date.now(),
      };

      socketRef.current.emit('send-reaction', {
        roomId: state.roomId,
        reaction,
      });

      // show locally as well
      setState((prev) => ({
        ...prev,
        reactions: [...prev.reactions, reaction],
      }));
      // auto-remove after 3 seconds
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          reactions: prev.reactions.filter((r) => r.id !== reaction.id),
        }));
      }, 3000);
    },
    [state.roomId, currentUserId]
  );

  // Toggle video camera on/off
  const toggleVideoCamera = useCallback(() => {
    if (!state.localStream) {
      console.warn('No local stream available to toggle');
      return;
    }

    const videoTrack = state.localStream.getVideoTracks()[0];
    if (!videoTrack) {
      console.warn('No video track found in local stream');
      return;
    }

    const newEnabledState = !videoTrack.enabled;
    videoTrack.enabled = newEnabledState;

    setState((prev) => ({ ...prev, isVideoEnabled: newEnabledState }));
    console.log(`Local video camera turned ${newEnabledState ? 'on' : 'off'}`);

    // Notify other users about camera status change
    if (socketRef.current && state.roomId) {
      socketRef.current.emit('camera-status-change', {
        roomId: state.roomId,
        isEnabled: newEnabledState,
      });
      console.log(
        `Notified others about camera status: ${newEnabledState ? 'ON' : 'OFF'}`
      );
    }
  }, [state.localStream, state.roomId]);

  // Toggle microphone mute/unmute
  const toggleMicrophone = useCallback(() => {
    if (!state.localStream) {
      console.warn('No local stream available to toggle mic');
      return;
    }

    const audioTrack = state.localStream.getAudioTracks()[0];
    if (!audioTrack) {
      console.warn('No audio track found in local stream');
      return;
    }

    const newEnabledState = !audioTrack.enabled; // if currently enabled, we will disable
    audioTrack.enabled = newEnabledState;

    const newMutedState = !newEnabledState;
    setState((prev) => ({ ...prev, isMicMuted: newMutedState }));
    console.log(`Local microphone ${newMutedState ? 'muted' : 'unmuted'}`);

    // Notify other users about mic status change
    if (socketRef.current && state.roomId) {
      socketRef.current.emit('mic-status-change', {
        roomId: state.roomId,
        isMuted: newMutedState,
      });
      console.log(
        `Notified others about mic status: ${
          newMutedState ? 'MUTED' : 'UNMUTED'
        }`
      );
    }
  }, [state.localStream, state.roomId]);

  return {
    state,
    localVideoRef,
    remoteVideoRef,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendReaction,
    toggleVideoCamera,
    toggleMicrophone,
    currentUserId,
  };
};
