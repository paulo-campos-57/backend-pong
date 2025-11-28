const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 10;

class Paddle {
    constructor(x) {
        this.x = x;
        this.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
        this.width = PADDLE_WIDTH;
        this.height = PADDLE_HEIGHT;
        this.speed = 8;
        this.dy = 0;
    }

    update() {
        this.y += this.dy * this.speed;

        if (this.y < 0) {
            this.y = 0;
        } else if (this.y + this.height > CANVAS_HEIGHT) {
            this.y = CANVAS_HEIGHT - this.height;
        }
    }

    setDirection(dy) {
        this.dy = dy;
    }
}

class Ball {
    constructor() {
        this.width = BALL_SIZE;
        this.height = BALL_SIZE;
        this.reset();
    }

    reset() {
        this.x = CANVAS_WIDTH / 2 - this.width / 2;
        this.y = CANVAS_HEIGHT / 2 - this.height / 2;
        this.x_orientation = Math.random() > 0.5 ? 1 : -1;
        this.y_orientation = Math.random() > 0.5 ? 1 : -1;
        this.speed = 5;
    }

    update(p1, p2) {
        if (this.y + this.height >= CANVAS_HEIGHT || this.y <= 0) {
            this.y_orientation *= -1;
        }

        this.x += this.speed * this.x_orientation;
        this.y += this.speed * this.y_orientation;

        this.checkPaddleCollision(p1);
        this.checkPaddleCollision(p2);
    }

    checkPaddleCollision(paddle) {
        if (
            this.x < paddle.x + paddle.width &&
            this.x + this.width > paddle.x &&
            this.y < paddle.y + paddle.height &&
            this.y + this.height > paddle.y
        ) {
            if (
                (this.x_orientation === -1 && paddle.x < CANVAS_WIDTH / 2) ||
                (this.x_orientation === 1 && paddle.x > CANVAS_WIDTH / 2)
            ) {
                this.x_orientation *= -1;
                this.speed += 0.5;
            }
        }
    }
}

class Game {
    constructor(p1Name, p2Name, maxScore, gameId, io) {
        this.gameId = gameId;
        this.io = io;
        this.maxScore = maxScore;

        this.players = {
            player1: { name: p1Name, score: 0, socketId: null, isReady: true },
            player2: { name: p2Name, score: 0, socketId: null, isReady: false }
        };

        this.ball = new Ball();
        this.paddle1 = new Paddle(10);
        this.paddle2 = new Paddle(CANVAS_WIDTH - PADDLE_WIDTH - 10);

        this.isRunning = false;
        this.gameLoopInterval = null;
        this.tickRate = 1000 / 60;
    }

    startGame() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.ball.reset();

        this.gameLoopInterval = setInterval(() => this.update(), this.tickRate);
        this.broadcastState('Game Started');
    }

    stopGame() {
        this.isRunning = false;
        clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = null;
    }

    update() {
        if (!this.isRunning) return;

        this.paddle1.update();
        this.paddle2.update();
        this.ball.update(this.paddle1, this.paddle2);

        this.checkScoring();
        this.broadcastState();
    }

    checkScoring() {
        if (this.ball.x + this.ball.width > CANVAS_WIDTH) {
            this.players.player1.score++;
            this.ball.reset();
            this.broadcastState(`${this.players.player1.name} marcou um ponto!`);
        }
        else if (this.ball.x < 0) {
            this.players.player2.score++;
            this.ball.reset();
            this.broadcastState(`${this.players.player2.name} marcou um ponto!`);
        }

        if (this.players.player1.score >= this.maxScore || this.players.player2.score >= this.maxScore) {
            this.stopGame();
            const winner = this.players.player1.score > this.players.player2.score ? this.players.player1.name : this.players.player2.name;
            this.io.to(this.gameId).emit('game_over', { winner: winner });
        }
    }

    broadcastState(logMessage = null) {
        const state = {
            players: {
                p1: { name: this.players.player1.name, score: this.players.player1.score, isReady: this.players.player1.isReady },
                p2: { name: this.players.player2.name, score: this.players.player2.score, isReady: this.players.player2.isReady }
            },
            ball: { x: this.ball.x, y: this.ball.y, width: this.ball.width, height: this.ball.height },
            paddle1: { y: this.paddle1.y, width: this.paddle1.width, height: this.paddle1.height, x: this.paddle1.x },
            paddle2: { y: this.paddle2.y, width: this.paddle2.width, height: this.paddle2.height, x: this.paddle2.x },
            is_running: this.isRunning,
            maxScore: this.maxScore,
            gameId: this.gameId,
            canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }
        };

        this.io.to(this.gameId).emit('game_state', state);
        if (logMessage) {
            this.io.to(this.gameId).emit('game_log', logMessage);
        }
    }
}

export { Game, PADDLE_HEIGHT, PADDLE_WIDTH, BALL_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT };