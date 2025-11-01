import React, { useState } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import ChatPanel from './ChatPanel';
import { ReactionEmoji } from '../types';

const VideoChat: React.FC = () => {
  const {
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
  } = useWebRTC();
  const [roomInput, setRoomInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinRoom = async () => {
    if (!roomInput.trim()) return;

    setIsJoining(true);
    try {
      await joinRoom(roomInput.trim());
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Failed to join room. Please check camera permissions.');
    } finally {
      setIsJoining(false);
    }
  };

  const emojis: ReactionEmoji[] = ['👏', '👍', '❤️', '😂', '😮', '🎉'];

  const handleLeaveRoom = () => {
    leaveRoom();
    setRoomInput('');
  };

  return (
    <div className='min-h-screen p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-8 liquid-highlight'>
          <div className='flex items-center justify-center gap-3 mb-2 animate-liquid-float'>
            <img
              src='/peerconnect-icon.png'
              alt='PeerConnect icon'
              className='h-10 w-10 drop-shadow'
            />
            <h1 className='text-4xl font-semibold text-ink-900 tracking-tight'>
              PeerConnect
            </h1>
          </div>
          <p className='text-ink-600 font-normal'>WebRTC P2P Video Chat</p>
        </div>

        {/* Room Join Section */}
        {!state.isInRoom && (
          <div className='liquid-card p-6 mb-8'>
            <h2 className='text-2xl font-semibold mb-4 tracking-tight'>
              Join Room
            </h2>
            <div className='flex gap-4'>
              <input
                type='text'
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder='Enter room code'
                className='flex-1 px-4 py-2 liquid-soft focus:outline-none focus:ring-2 focus:ring-blue-500/60'
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <button
                onClick={handleJoinRoom}
                disabled={isJoining || !roomInput.trim()}
                className='px-6 py-2 rounded-xl bg-blue-500 text-white shadow-glow hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed'
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </div>
          </div>
        )}

        {/* Video Chat Section */}
        {state.isInRoom && (
          <div className='liquid-card p-6'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-2xl font-semibold tracking-tight'>
                Room: {state.roomId}
              </h2>
              <div className='flex items-center gap-4'>
                <div
                  className={`px-3 py-1 rounded-full text-sm ${
                    state.isConnected
                      ? 'bg-green-200/60 text-green-900'
                      : 'bg-yellow-200/60 text-yellow-900'
                  }`}
                >
                  {state.isConnected ? 'Connected' : 'Connecting...'}
                </div>
                <button
                  onClick={handleLeaveRoom}
                  className='px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-glow'
                >
                  Leave
                </button>
              </div>
            </div>

            {/* Video and Chat Grid */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* Video Grid */}
              <div className='lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Local Video */}
                <div className='rounded-2xl overflow-hidden relative liquid-soft'>
                  <div
                    className='px-4 py-2 text-white text-sm'
                    style={{ background: 'rgba(0,0,0,0.35)' }}
                  >
                    My Screen
                  </div>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className='w-full h-64 object-cover bg-black/40'
                  />
                  {!state.localStream && (
                    <div className='absolute inset-0 flex items-center justify-center text-gray-300'>
                      Loading local stream...
                    </div>
                  )}
                  {/* Camera disabled overlay */}
                  {!state.isVideoEnabled && (
                    <div className='absolute inset-0 flex items-center justify-center bg-black/60'>
                      <div className='text-center text-white'>
                        <div className='text-4xl mb-2'>📹</div>
                        <div className='text-sm'>Camera Off</div>
                      </div>
                    </div>
                  )}
                  {/* Local mic muted badge */}
                  {state.isMicMuted && (
                    <div
                      className='absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 shadow-glow'
                      title='Mic muted'
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='h-4 w-4'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 11a7 7 0 01-14 0M5 11H3m18 0h-2M12 1a3 3 0 00-3 3v6a3 3 0 106 0V4a3 3 0 00-3-3M12 17v4m0 0h3m-3 0H9'
                        />
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 4L20 20'
                        />
                      </svg>
                    </div>
                  )}
                  {/* Floating reactions over local video */}
                  <div className='pointer-events-none absolute inset-0 flex flex-col justify-end items-start p-2 space-y-2'>
                    {state.reactions
                      .filter((r) => r.senderId === currentUserId)
                      .slice(-6)
                      .map((r) => (
                        <span
                          key={r.id}
                          className='text-3xl animate-liquid-float'
                          aria-hidden
                        >
                          {r.emoji}
                        </span>
                      ))}
                  </div>
                  {/* Camera/Mic toggle buttons */}
                  <div className='absolute bottom-4 right-4 flex gap-2'>
                    <button
                      onClick={toggleVideoCamera}
                      className={`p-3 rounded-full transition-colors shadow-glow ${
                        state.isVideoEnabled
                          ? 'bg-gray-700/80 hover:bg-gray-600/90 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                      title={
                        state.isVideoEnabled
                          ? 'Turn off camera'
                          : 'Turn on camera'
                      }
                      aria-label={
                        state.isVideoEnabled
                          ? 'Turn off camera'
                          : 'Turn on camera'
                      }
                    >
                      {state.isVideoEnabled ? (
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-6 w-6'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-6 w-6'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
                          />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={toggleMicrophone}
                      className={`p-3 rounded-full transition-colors shadow-glow ${
                        state.isMicMuted
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gray-700/80 hover:bg-gray-600/90 text-white'
                      }`}
                      title={
                        state.isMicMuted
                          ? 'Unmute microphone'
                          : 'Mute microphone'
                      }
                      aria-pressed={state.isMicMuted}
                      aria-label={
                        state.isMicMuted
                          ? 'Unmute microphone'
                          : 'Mute microphone'
                      }
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='h-6 w-6'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                      >
                        {/* Base mic icon (same for ON/OFF) */}
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 11a7 7 0 01-14 0M5 11H3m18 0h-2M12 1a3 3 0 00-3 3v6a3 3 0 106 0V4a3 3 0 00-3-3M12 17v4m0 0h3m-3 0H9'
                        />
                        {/* Slash overlay when muted */}
                        {state.isMicMuted && (
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M4 4L20 20'
                          />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Remote Video */}
                <div className='rounded-2xl overflow-hidden relative liquid-soft'>
                  <div
                    className='px-4 py-2 text-white text-sm'
                    style={{ background: 'rgba(0,0,0,0.35)' }}
                  >
                    Remote Screen
                  </div>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className='w-full h-64 object-cover bg-black/40'
                  />
                  {state.peerLeft ? (
                    <div
                      className='flex items-center justify-center h-64 text-red-300'
                      style={{ background: 'rgba(0,0,0,0.35)' }}
                    >
                      <div className='text-center'>
                        <div className='text-2xl mb-2'>👋</div>
                        <div className='text-lg font-semibold'>
                          Participant Left
                        </div>
                        <div className='text-sm mt-1'>
                          Waiting for new participants...
                        </div>
                      </div>
                    </div>
                  ) : !state.remoteStream ? (
                    <div className='flex items-center justify-center h-64 text-gray-300'>
                      Waiting for other participants...
                    </div>
                  ) : null}
                  {/* Remote mic muted badge */}
                  {!state.peerLeft &&
                    state.remoteStream &&
                    state.isRemoteMicMuted && (
                      <div
                        className='absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 shadow-glow'
                        title='Remote mic muted'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-4 w-4'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 11a7 7 0 01-14 0M5 11H3m18 0h-2M12 1a3 3 0 00-3 3v6a3 3 0 106 0V4a3 3 0 00-3-3M12 17v4m0 0h3m-3 0H9'
                          />
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M4 4L20 20'
                          />
                        </svg>
                      </div>
                    )}
                  {/* Remote camera disabled overlay */}
                  {!state.peerLeft &&
                    state.remoteStream &&
                    !state.isRemoteVideoEnabled && (
                      <div className='absolute inset-0 flex items-center justify-center bg-black/60'>
                        <div className='text-center text-white'>
                          <div className='text-4xl mb-2'>📹</div>
                          <div className='text-sm'>Camera Off</div>
                        </div>
                      </div>
                    )}
                  {/* Floating reactions over remote video */}
                  <div className='pointer-events-none absolute inset-0 flex flex-col justify-end items-end p-2 space-y-2'>
                    {state.reactions
                      .filter((r) => r.senderId !== currentUserId)
                      .slice(-6)
                      .map((r) => (
                        <span
                          key={r.id}
                          className='text-3xl animate-liquid-float'
                          aria-hidden
                        >
                          {r.emoji}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              {/* Chat Panel */}
              <div className='lg:col-span-1'>
                <div className='h-96'>
                  <ChatPanel
                    messages={state.messages}
                    onSendMessage={sendMessage}
                    currentUserId={currentUserId}
                  />
                </div>
              </div>
            </div>

            {/* Reactions toolbar */}
            <div className='mt-4 flex flex-wrap gap-2'>
              {emojis.map((e) => (
                <button
                  key={e}
                  onClick={() => sendReaction(e)}
                  className='px-3 py-2 rounded-xl text-xl liquid-soft hover:brightness-110'
                  title='Send reaction'
                >
                  {e}
                </button>
              ))}
            </div>

            {/* Connection Status Info */}
            <div className='mt-6 p-4 liquid-soft'>
              <h3 className='font-semibold mb-2'>Connection Info</h3>
              <div className='text-sm text-ink-700 space-y-1'>
                <p>• My Camera: {state.isVideoEnabled ? 'On' : 'Off'}</p>
                <p>
                  • Remote Camera:{' '}
                  {state.peerLeft || !state.remoteStream
                    ? '-'
                    : state.isRemoteVideoEnabled
                    ? 'On'
                    : 'Off'}
                </p>
                <p>• My Mic: {state.isMicMuted ? 'Muted' : 'On'}</p>
                <p>
                  • Remote Mic:{' '}
                  {state.peerLeft || !state.remoteStream
                    ? '-'
                    : state.isRemoteMicMuted
                    ? 'Muted'
                    : 'On'}
                </p>
                <p>
                  • Local Stream: {state.localStream ? 'Active' : 'Inactive'}
                </p>
                <p>
                  • Remote Stream:{' '}
                  {state.peerLeft
                    ? 'Participant Left'
                    : state.remoteStream
                    ? 'Active'
                    : 'Waiting'}
                </p>
                <p>
                  • P2P Connection:{' '}
                  {state.peerLeft
                    ? 'Disconnected'
                    : state.isConnected
                    ? 'Success'
                    : 'Waiting'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions Section */}
        <div className='mt-8 p-6 liquid-card'>
          <h3 className='text-lg font-semibold text-blue-800 mb-3 tracking-tight'>
            How to Use
          </h3>
          <ul className='text-ink-700 space-y-2'>
            <li>• Two users with the same room code are required</li>
            <li>• Please allow camera and microphone permissions</li>
            <li>
              • Real-time video chat is available through WebRTC P2P connection
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
