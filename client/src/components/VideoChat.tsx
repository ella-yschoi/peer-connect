import React, { useState } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';

const VideoChat: React.FC = () => {
  const { state, localVideoRef, remoteVideoRef, joinRoom, leaveRoom } =
    useWebRTC();
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

            {/* Video Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
              </div>

              {/* Remote Video */}
              <div className='bg-gray-900 rounded-lg overflow-hidden'>
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
              </div>
            </div>

            {/* Connection Status Info */}
            <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
              <h3 className='font-semibold mb-2'>Connection Info</h3>
              <div className='text-sm text-gray-600 space-y-1'>
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
