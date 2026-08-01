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
      
      let translatedMsg = errMsg;
      if (errMsg) {
        const lowerMsg = errMsg.toLowerCase();
        if (lowerMsg.includes('all configured authentication methods failed')) {
          translatedMsg = '🔑 认证失败：用户名、密码或私钥错误，请仔细核对。';
        } else if (lowerMsg.includes('enotfound') || lowerMsg.includes('eai_again')) {
          translatedMsg = '🌍 找不到主机：请检查 IP 或域名是否填写正确（不要带多余的空格）。';
        } else if (lowerMsg.includes('econnrefused')) {
          translatedMsg = '🛑 连接被拒绝：服务器可能未开放此端口（通常是22），或者 SSH 服务未启动。';
        } else if (lowerMsg.includes('etimedout')) {
          translatedMsg = '⏳ 连接超时：服务器可能已关机、网络不通，或防火墙拦截了此端口。';
        } else if (lowerMsg.includes('ehostunreach')) {
          translatedMsg = '🚫 主机不可达：服务器可能已关机或网络连接存在问题。';
        } else if (lowerMsg.includes('handshake failed')) {
          translatedMsg = '🤝 握手失败：目标端口可能运行的不是 SSH 服务。';
        } else if (lowerMsg.includes('private key') || lowerMsg.includes('asn1') || lowerMsg.includes('invalid key')) {
          translatedMsg = '🔐 密钥错误：私钥格式无效，请检查内容是否完整（须包含 BEGIN/END 标志）。';
        } else {
          translatedMsg = `⚠️ 连接失败：${errMsg}`;
        }
      }
      
      setError(translatedMsg);
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
