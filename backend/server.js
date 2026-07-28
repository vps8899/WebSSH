const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('ssh2');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Allow CORS for local development (if frontend is run on a different port)
app.use(cors());

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity in WebSSH, but can be restricted
        methods: ["GET", "POST"]
    }
});

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

io.on('connection', (socket) => {
    console.log(`[Socket] New connection established: ${socket.id}`);
    const sshClient = new Client();
    let stream;

    // Handle incoming SSH connection request
    socket.on('ssh-connect', (credentials) => {
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
                        stream.write(data);
                    });

                    // Handle terminal resize from Web Browser
                    socket.on('ssh-resize', (size) => {
                        if (stream) {
                            stream.setWindow(size.rows, size.cols, size.height, size.width);
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
                host: credentials.host,
                port: credentials.port || 22,
                username: credentials.username,
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
        sshClient.end();
    });
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`WebSSH Server is running on port ${PORT}`);
});
