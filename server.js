const WebSocket = require('ws');

const PORT = process.env.PORT || 5555;
const wss = new WebSocket.Server({ port: PORT });

let gameState = {};

// Helper function to generate a random hex color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

wss.on('connection', (ws) => {
    // Generate unique ID based on timestamp
    const playerId = Date.now().toString();
    
    // Assign random positions and a randomized color
    gameState[playerId] = {
        x: Math.floor(Math.random() * 700),
        y: Math.floor(Math.random() * 500),
        color: getRandomColor()
    };

    // Send the client its personal ID configuration
    ws.send(JSON.stringify({ type: "init", id: playerId }));

    // Listen to movement updates from players
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (gameState[playerId]) {
                gameState[playerId].x = data.x;
                gameState[playerId].y = data.y;
            }
        } catch (e) {
            console.error("Invalid data received");
        }
    });


    ws.on('close', () => {
        delete gameState[playerId];
    });
});

// Broadcast the entire game state to ALL connected players 60 times a second
setInterval(() => {
    const payload = JSON.stringify({ type: "state", state: gameState });
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}, 1000 / 60);

console.log(`Stable multiplayer server is running on port ${PORT}`);
