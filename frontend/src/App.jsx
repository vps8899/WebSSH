import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import ConnectForm from './components/ConnectForm';
import TerminalComponent from './components/Terminal';

function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Connect to the Socket.io server
    // For production, this should be relative or configured.
    // Assuming backend runs on the same host or we serve frontend statically from backend.
    const newSocket = io({
      path: '/socket.io', // default path
      autoConnect: true
    });
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const handleConnect = (credentials) => {
    if (!socket) return;
    setIsConnecting(true);
    setError(null);

    socket.emit('ssh-connect', credentials);

    const onReady = () => {
      setIsConnecting(false);
      setIsConnected(true);
      cleanup();
    };

    const onError = (errMsg) => {
      setIsConnecting(false);
      setError(errMsg);
      cleanup();
    };

    const cleanup = () => {
      socket.off('ssh-ready', onReady);
      socket.off('ssh-error', onError);
    };

    socket.on('ssh-ready', onReady);
    socket.on('ssh-error', onError);
  };

  const handleDisconnect = () => {
    if (socket) {
      socket.emit('disconnect-ssh'); // Optional: Custom event to gracefully close if needed
      // Actually we just disconnect and reconnect the socket to get a fresh state
      socket.disconnect();
      socket.connect();
    }
    setIsConnected(false);
    setIsConnecting(false);
  };

  if (isConnected && socket) {
    return <TerminalComponent socket={socket} onDisconnect={handleDisconnect} />;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {error && (
        <div style={{
          backgroundColor: '#ef4444',
          color: 'white',
          padding: '1rem',
          textAlign: 'center',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10
        }}>
          {error}
        </div>
      )}
      <ConnectForm onConnect={handleConnect} isConnecting={isConnecting} />
    </div>
  );
}

export default App;
