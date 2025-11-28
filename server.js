import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Game } from './game/gameLogic.js';

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = process.env.PORT || 4000;
const activeGames = {};
let gameIdCounter = 1;

app.get('/', (req, res) => {
    res.send('Pong Multiplayer Server is running.');
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        activeGames: Object.keys(activeGames).length,
        games: Object.keys(activeGames)
    });
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('create_game', ({ playerName, maxScore }) => {
        const gameId = `G${gameIdCounter++}`;
        const newGame = new Game(playerName, "Waiting...", maxScore, gameId, io);

        newGame.players.player1.socketId = socket.id;
        activeGames[gameId] = newGame;

        socket.join(gameId);
        socket.emit('game_created', { gameId, playerRole: 'player1' });
        console.log(`Game created with ID: ${gameId} by ${playerName}`);
        newGame.broadcastState('Aguardando o segundo jogador...');
    });

    socket.on('join_game', ({ playerName, gameId }) => {
        const game = activeGames[gameId];

        if (!game) {
            return socket.emit('game_error', 'Partida não encontrada.');
        }

        if (game.players.player2.socketId) {
            return socket.emit('game_error', 'Partida cheia.');
        }

        game.players.player2.socketId = socket.id;
        game.players.player2.name = playerName;
        game.players.player2.isReady = true;

        socket.join(gameId);
        socket.emit('game_joined', { gameId, playerRole: 'player2' });

        game.broadcastState(`O jogador ${playerName} entrou. A partida vai começar!`);
        game.startGame();
        console.log(`Game ${gameId}: ${playerName} joined. Starting game.`);
    });

    socket.on('move_paddle', ({ gameId, direction }) => {
        const game = activeGames[gameId];
        if (!game || !game.isRunning) return;

        const playerRole = (game.players.player1.socketId === socket.id) ? 'player1' :
            (game.players.player2.socketId === socket.id) ? 'player2' : null;

        if (!playerRole) return;

        const paddle = (playerRole === 'player1') ? game.paddle1 : game.paddle2;

        let dy = 0;
        if (direction === 'up') dy = -1;
        else if (direction === 'down') dy = 1;

        paddle.setDirection(dy);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        for (const gameId in activeGames) {
            const game = activeGames[gameId];
            if (game.players.player1.socketId === socket.id || game.players.player2.socketId === socket.id) {
                game.stopGame();
                delete activeGames[gameId];
                io.to(gameId).emit('game_log', 'O adversário desconectou. O jogo foi encerrado.');
                console.log(`Game ${gameId} ended due to player disconnection.`);
                break;
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});