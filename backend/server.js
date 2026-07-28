const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('ssh2');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io (CORS is restricted by default in Socket.io v3+, preventing unauthorized cross-origin connections)
const io = new Server(server);

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

io.on('connection', (socket) => {
    console.log(`[Socket] New connection established: ${socket.id}`);
    let sshClient = null;
    let stream = null;

    // Handle incoming SSH connection request
    socket.on('ssh-connect', (credentials) => {
        // Basic input validation to prevent server crash
        if (!credentials || typeof credentials !== 'object' || !credentials.host || !credentials.username) {
            socket.emit('ssh-error', 'Invalid credentials format');
            return;
        }

        // Prevent multiple connections on the same socket (connection leak)
        if (sshClient) {
            sshClient.end();
        }
        
        sshClient = new Client();

        console.log(`[SSH] Attempting connection to ${credentials.host}:${credentials.port} for user ${credentials.username}`);
        
        try {
            sshClient.on('ready', () => {
                console.log(`[SSH] Connection ready for ${socket.id}`);
                socket.emit('ssh-ready');
                
                // Open a shell
                sshClient.shell({ term: 'xterm-color' }, (err, shellStream) => {
                    if (err) {
                        socket.emit('ssh-error', 'Error opening shell: ' + err.message);
                        sshClient.end();
                        return;
                    }
                    stream = shellStream;
                    
                    // Route data from SSH server to Web Browser
                    stream.on('data', (data) => {
                        socket.emit('ssh-data', data.toString('utf-8'));
                    });
                    
                    // Route data from Web Browser to SSH server
                    socket.on('ssh-input', (data) => {
                        // Prevent server crash if stream is not ready
                        if (stream) {
                            stream.write(data);
                        }
                    });

                    // Handle terminal resize from Web Browser
                    socket.on('ssh-resize', (size) => {
                        if (stream && size && typeof size.rows === 'number' && typeof size.cols === 'number') {
                            stream.setWindow(size.rows, size.cols, size.height || 0, size.width || 0);
                        }
                    });

                    stream.on('close', () => {
                        console.log(`[SSH] Stream closed for ${socket.id}`);
                        socket.emit('ssh-close');
                        sshClient.end();
                    });
                });
            }).on('error', (err) => {
                console.error(`[SSH] Connection error:`, err.message);
                socket.emit('ssh-error', 'SSH Connection Error: ' + err.message);
            }).on('close', () => {
                console.log(`[SSH] Connection closed for ${socket.id}`);
                socket.emit('ssh-close');
            }).connect({
                host: credentials.host.trim().replace(/[\u200B-\u200D\uFEFF]/g, ''),
                port: parseInt(credentials.port, 10) || 22,
                username: credentials.username.trim(),
                password: credentials.password,
                privateKey: credentials.privateKey,
                readyTimeout: 30000 // 30 seconds timeout
            });
        } catch (e) {
            socket.emit('ssh-error', 'Internal error: ' + e.message);
        }
    });

    // Clean up when socket connection drops
    socket.on('disconnect', () => {
        console.log(`[Socket] Connection disconnected: ${socket.id}`);
        if (stream) {
            stream.end();
        }
        if (sshClient) {
            sshClient.end();
        }
    });
});

// Fallback to index.html for SPA routing (Express 5 compatible)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Force port 3999 to avoid any environment variable caching issues with PM2 or Docker zombie proxies
const PORT = process.env.PORT || 3999;
server.listen(PORT, '127.0.0.1', () => {
    console.log(`WebSSH Server is running on port ${PORT}`);
});
