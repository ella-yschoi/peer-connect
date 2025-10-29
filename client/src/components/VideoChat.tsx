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
    <div className='min-h-screen bg-gray-100 p-4'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center gap-3 mb-2'>
            <img
              src='/peerconnect-icon.png'
              alt='PeerConnect icon'
              className='h-10 w-10'
            />
            <h1 className='text-4xl font-bold text-gray-800'>PeerConnect</h1>
          </div>
          <p className='text-gray-600'>WebRTC P2P Video Chat</p>
        </div>

        {/* Room Join Section */}
        {!state.isInRoom && (
          <div className='bg-white rounded-lg shadow-md p-6 mb-8'>
            <h2 className='text-2xl font-semibold mb-4'>Join Room</h2>
            <div className='flex gap-4'>
              <input
                type='text'
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder='Enter room code'
                className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <button
                onClick={handleJoinRoom}
                disabled={isJoining || !roomInput.trim()}
                className='px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed'
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </div>
          </div>
        )}

        {/* Video Chat Section */}
        {state.isInRoom && (
          <div className='bg-white rounded-lg shadow-md p-6'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-2xl font-semibold'>Room: {state.roomId}</h2>
              <div className='flex items-center gap-4'>
                <div
                  className={`px-3 py-1 rounded-full text-sm ${
                    state.isConnected
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {state.isConnected ? 'Connected' : 'Connecting...'}
                </div>
                <button
                  onClick={handleLeaveRoom}
                  className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600'
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
                <div className='bg-gray-900 rounded-lg overflow-hidden relative'>
                  <div className='bg-gray-800 px-4 py-2 text-white text-sm'>
                    My Screen
                  </div>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className='w-full h-64 object-cover'
                    style={{ backgroundColor: '#1f2937' }}
                  />
                  {!state.localStream && (
                    <div className='absolute inset-0 flex items-center justify-center text-gray-400'>
                      Loading local stream...
                    </div>
                  )}
                  {/* Camera disabled overlay */}
                  {!state.isVideoEnabled && (
                    <div className='absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75'>
                      <div className='text-center text-white'>
                        <div className='text-4xl mb-2'>📹</div>
                        <div className='text-sm'>Camera Off</div>
                      </div>
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
                          className='text-3xl animate-bounce'
                          aria-hidden
                        >
                          {r.emoji}
                        </span>
                      ))}
                  </div>
                  {/* Camera toggle button */}
                  <div className='absolute bottom-4 right-4'>
                    <button
                      onClick={toggleVideoCamera}
                      className={`p-3 rounded-full transition-colors ${
                        state.isVideoEnabled
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                      title={
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
                  </div>
                </div>

                {/* Remote Video */}
                <div className='bg-gray-900 rounded-lg overflow-hidden relative'>
                  <div className='bg-gray-800 px-4 py-2 text-white text-sm'>
                    Remote Screen
                  </div>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className='w-full h-64 object-cover bg-gray-800'
                  />
                  {state.peerLeft ? (
                    <div className='flex items-center justify-center h-64 text-red-400 bg-gray-800'>
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
                    <div className='flex items-center justify-center h-64 text-gray-400'>
                      Waiting for other participants...
                    </div>
                  ) : null}
                  {/* Remote camera disabled overlay */}
                  {!state.peerLeft &&
                    state.remoteStream &&
                    !state.isRemoteVideoEnabled && (
                      <div className='absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75'>
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
                          className='text-3xl animate-bounce'
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
                  className='px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-xl'
                  title='Send reaction'
                >
                  {e}
                </button>
              ))}
            </div>

            {/* Connection Status Info */}
            <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
              <h3 className='font-semibold mb-2'>Connection Info</h3>
              <div className='text-sm text-gray-600 space-y-1'>
                <p>• My Camera: {state.isVideoEnabled ? 'On' : 'Off'}</p>
                <p>
                  • Remote Camera:{' '}
                  {state.peerLeft || !state.remoteStream
                    ? '-'
                    : state.isRemoteVideoEnabled
                    ? 'On'
                    : 'Off'}
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
        <div className='mt-8 bg-blue-50 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-blue-800 mb-3'>
            How to Use
          </h3>
          <ul className='text-blue-700 space-y-2'>
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
