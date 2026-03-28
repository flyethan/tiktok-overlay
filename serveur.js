const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { WebcastPushConnection } = require("tiktok-live-connector");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];

// WebSocket
wss.on("connection", (ws) => {
    clients.push(ws);

    ws.on("message", (message) => {
        const data = JSON.parse(message);

        // broadcast uniquement à la même room
        clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    });

    ws.on("close", () => {
        clients = clients.filter(c => c !== ws);
    });
});

// TikTok LIVE (REMPLACE par ton pseudo)
const tiktokUsername = "tonpseudo";

const tiktokLive = new WebcastPushConnection(tiktokUsername);

tiktokLive.connect()
    .then(() => console.log("TikTok connecté"))
    .catch(err => console.error(err));

tiktokLive.on("gift", (gift) => {
    const message = {
        type: "gift",
        username: gift.sender.username,
        avatar: gift.sender.profilePictureUrl,
        amount: gift.repeatCount || 1,
        room: tiktokUsername // même room que user
    };

    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
});

// fichiers web
app.use(express.static("public"));

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log("Serveur lancé"));