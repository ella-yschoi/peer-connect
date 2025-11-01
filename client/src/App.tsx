import VideoChat from './components/VideoChat';

function App() {
  return (
    <div className='min-h-screen liquid-bg relative'>
      <div className='blob-layer'>
        <div
          className='blob blob--blue animate-blob-drift'
          style={{ top: '-8rem', left: '-6rem' }}
        />
        <div
          className='blob blob--indigo animate-blob-drift'
          style={{ top: '-10rem', right: '-8rem', animationDelay: '4s' }}
        />
        <div
          className='blob blob--violet animate-blob-drift'
          style={{ bottom: '-12rem', left: '20%', animationDelay: '8s' }}
        />
      </div>
      <div className='relative'>
        <VideoChat />
      </div>
    </div>
  );
}

export default App;
