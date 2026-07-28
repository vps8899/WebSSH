import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { LogOut } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';
import './Terminal.css';

export default function Terminal({ socket, onDisconnect }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current || !socket) return;

    // Initialize Xterm
    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: '#0f111a',
        foreground: '#e2e8f0',
        cursor: '#3b82f6',
        selectionBackground: 'rgba(59, 130, 246, 0.3)',
        black: '#000000',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#8b5cf6',
        cyan: '#06b6d4',
        white: '#ffffff',
      },
      fontFamily: '"Fira Code", monospace',
      fontSize: 14,
      lineHeight: 1.2
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Route Xterm data to Socket.io
    term.onData((data) => {
      socket.emit('ssh-input', data);
    });

    // Handle Window Resize
    const handleResize = () => {
      fitAddon.fit();
      socket.emit('ssh-resize', {
        cols: term.cols,
        rows: term.rows,
        width: terminalRef.current.clientWidth,
        height: terminalRef.current.clientHeight
      });
    };

    window.addEventListener('resize', handleResize);
    
    // Initial size dispatch
    handleResize();

    // Route Socket.io data to Xterm
    socket.on('ssh-data', (data) => {
      term.write(data);
    });

    socket.on('ssh-error', (err) => {
      term.write(`\r\n\x1b[1;31m[Error] ${err}\x1b[0m\r\n`);
    });

    socket.on('ssh-close', () => {
      term.write('\r\n\x1b[1;33m[Connection Closed]\x1b[0m\r\n');
      onDisconnect();
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [socket, onDisconnect]);

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="dot dot-red"></span>
          <span className="dot dot-yellow"></span>
          <span className="dot dot-green"></span>
          <span className="title-text">Terminal</span>
        </div>
        <button className="btn btn-danger btn-sm" onClick={onDisconnect}>
          <LogOut size={16} />
          断开连接
        </button>
      </div>
      <div className="terminal-body" ref={terminalRef}></div>
    </div>
  );
}
