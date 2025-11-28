import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Game } from './game/gameLogic.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import cors from 'cors';

const app = express();
const server = createServer(app);

app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
}));

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["*"]
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});

const PORT = process.env.PORT || 4000;
const activeGames = {};
let gameIdCounter = 1;

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Pong API Docs"
}));

// Endpoint para o JSON do Swagger
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

/**
 * @swagger
 * /:
 *   get:
 *     tags: [HTTP]
 *     summary: Verifica se o servidor está rodando
 *     description: Retorna uma mensagem confirmando que o servidor está ativo
 *     responses:
 *       200:
 *         description: Servidor ativo
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Pong Multiplayer Server is running.
 */
app.get('/', (req, res) => {
    res.send('Pong Multiplayer Server is running.');
});

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [HTTP]
 *     summary: Status de saúde do servidor
 *     description: Retorna informações sobre o estado do servidor e jogos ativos
 *     responses:
 *       200:
 *         description: Status do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 activeGames:
 *                   type: number
 *                   example: 2
 *                 games:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["G1", "G2"]
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        activeGames: Object.keys(activeGames).length,
        games: Object.keys(activeGames)
    });
});

/**
 * @swagger
 * components:
 *   schemas:
 *     GameState:
 *       type: object
 *       properties:
 *         players:
 *           type: object
 *           properties:
 *             p1:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 score:
 *                   type: number
 *                 isReady:
 *                   type: boolean
 *             p2:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 score:
 *                   type: number
 *                 isReady:
 *                   type: boolean
 *         ball:
 *           type: object
 *           properties:
 *             x:
 *               type: number
 *             y:
 *               type: number
 *             width:
 *               type: number
 *             height:
 *               type: number
 *         paddle1:
 *           type: object
 *           properties:
 *             x:
 *               type: number
 *             y:
 *               type: number
 *             width:
 *               type: number
 *             height:
 *               type: number
 *         paddle2:
 *           type: object
 *           properties:
 *             x:
 *               type: number
 *             y:
 *               type: number
 *             width:
 *               type: number
 *             height:
 *               type: number
 *         is_running:
 *           type: boolean
 *         maxScore:
 *           type: number
 *         gameId:
 *           type: string
 *         canvas:
 *           type: object
 *           properties:
 *             width:
 *               type: number
 *             height:
 *               type: number
 */

/**
 * @swagger
 * /socket.io:
 *   get:
 *     tags: [Socket.IO]
 *     summary: Conexão WebSocket
 *     description: |
 *       ## Eventos do Cliente para o Servidor
 *       
 *       ### create_game
 *       Cria uma nova partida
 *       ```javascript
 *       socket.emit('create_game', {
 *         playerName: 'João',
 *         maxScore: 5
 *       });
 *       ```
 *       **Resposta:** `game_created` com `{ gameId: 'G1', playerRole: 'player1' }`
 *       
 *       ---
 *       
 *       ### join_game
 *       Entra em uma partida existente
 *       ```javascript
 *       socket.emit('join_game', {
 *         playerName: 'Maria',
 *         gameId: 'G1'
 *       });
 *       ```
 *       **Resposta:** `game_joined` com `{ gameId: 'G1', playerRole: 'player2' }`
 *       
 *       **Erro:** `game_error` se a partida não existir ou estiver cheia
 *       
 *       ---
 *       
 *       ### move_paddle
 *       Move a raquete do jogador
 *       ```javascript
 *       socket.emit('move_paddle', {
 *         gameId: 'G1',
 *         direction: 'up' // ou 'down' ou 'stop'
 *       });
 *       ```
 *       
 *       ---
 *       
 *       ## Eventos do Servidor para o Cliente
 *       
 *       ### game_state
 *       Enviado a cada frame do jogo (60 FPS)
 *       ```javascript
 *       socket.on('game_state', (state) => {
 *         // state contém posições de bola, raquetes, scores, etc
 *       });
 *       ```
 *       
 *       ### game_created
 *       Confirmação de criação de partida
 *       ```javascript
 *       socket.on('game_created', ({ gameId, playerRole }) => {
 *         console.log('Partida criada:', gameId);
 *       });
 *       ```
 *       
 *       ### game_joined
 *       Confirmação de entrada na partida
 *       ```javascript
 *       socket.on('game_joined', ({ gameId, playerRole }) => {
 *         console.log('Entrou na partida:', gameId);
 *       });
 *       ```
 *       
 *       ### game_log
 *       Mensagens de log do jogo
 *       ```javascript
 *       socket.on('game_log', (message) => {
 *         console.log('Log:', message);
 *       });
 *       ```
 *       
 *       ### game_over
 *       Partida finalizada
 *       ```javascript
 *       socket.on('game_over', ({ winner }) => {
 *         console.log('Vencedor:', winner);
 *       });
 *       ```
 *       
 *       ### game_error
 *       Erro ao tentar entrar em uma partida
 *       ```javascript
 *       socket.on('game_error', (errorMessage) => {
 *         console.error('Erro:', errorMessage);
 *       });
 *       ```
 *     responses:
 *       101:
 *         description: Conexão WebSocket estabelecida
 */

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
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});