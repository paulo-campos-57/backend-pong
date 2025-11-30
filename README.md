<div align="center">
  <h1>
    <img src="https://skillicons.dev/icons?i=nodejs,javascript" /><br>Pong Multiplayer - Backend
  </h1>
</div>

Backend para jogo Pong multiplayer em tempo real usando Socket.IO, Express e Node.js.

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6.1-blue.svg)](https://socket.io/)
[![Express](https://img.shields.io/badge/Express-4.18.2-lightgrey.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Sobre

Este é o servidor backend que gerencia partidas multiplayer de Pong em tempo real. Permite que dois jogadores em diferentes computadores joguem juntos através de WebSockets.

### Funcionalidades

- Criação e gerenciamento de partidas multiplayer
- Comunicação em tempo real via Socket.IO
- Sistema de pontuação configurável
- Detecção de colisões e física do jogo
- Documentação interativa com Swagger
- Suporte a CORS para múltiplas origens
- Reconexão automática em caso de queda

## Deploy

O backend está hospedado no Render:

**URL de Produção:** `https://backend-pong.onrender.com`

**Documentação API:** `https://backend-pong.onrender.com/api-docs`

## Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Socket.IO** - WebSocket para comunicação em tempo real
- **Swagger** - Documentação interativa da API
- **CORS** - Controle de acesso entre origens

## Instalação Local

### Pré-requisitos

- Node.js 18.x ou superior
- npm ou yarn

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/paulo-campos-57/backend-pong.git
cd backend-pong
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

4. Acesse:
- **Servidor:** `http://localhost:4000`
- **Health Check:** `http://localhost:4000/health`
- **Documentação:** `http://localhost:4000/api-docs`

## Como Funciona

### Fluxo do Jogo

1. **Jogador 1** cria uma partida
2. Servidor gera um `gameId` único (ex: G1)
3. **Jogador 2** entra usando o `gameId`
4. Servidor inicia o loop do jogo (60 FPS)
5. Ambos jogadores recebem atualizações em tempo real
6. Partida termina quando alguém atinge a pontuação máxima

### Constantes do Jogo

```javascript
CANVAS_WIDTH = 800px
CANVAS_HEIGHT = 500px
PADDLE_HEIGHT = 100px
PADDLE_WIDTH = 10px
BALL_SIZE = 10px
TICK_RATE = 60 FPS
```

## Eventos Socket.IO

### Cliente → Servidor

| Evento | Parâmetros | Descrição |
|--------|-----------|-----------|
| `create_game` | `{ playerName, maxScore }` | Cria nova partida |
| `join_game` | `{ playerName, gameId }` | Entra em partida existente |
| `move_paddle` | `{ gameId, direction }` | Move raquete ('up', 'down', 'stop') |

### Servidor → Cliente

| Evento | Dados | Descrição |
|--------|-------|-----------|
| `game_created` | `{ gameId, playerRole }` | Confirmação de criação |
| `game_joined` | `{ gameId, playerRole }` | Confirmação de entrada |
| `game_state` | `{ players, ball, paddle1, paddle2, ... }` | Estado do jogo (60x/seg) |
| `game_log` | `string` | Mensagens de log |
| `game_error` | `string` | Mensagens de erro |
| `game_over` | `{ winner }` | Fim da partida |

## Endpoints HTTP

### `GET /`
Verifica se o servidor está rodando.

**Resposta:**
```
Pong Multiplayer Server is running.
```

### `GET /health`
Status de saúde do servidor.

**Resposta:**
```json
{
  "status": "ok",
  "activeGames": 2,
  "games": ["G1", "G2"]
}
```

### `GET /api-docs`
Documentação interativa Swagger UI.

## Configuração

### Variáveis de Ambiente

```bash
PORT=4000  # Porta do servidor (padrão: 4000)
```

### CORS

Por padrão, aceita requisições de qualquer origem. Para produção, modifique em `server.js`:

```javascript
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://seu-frontend.vercel.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true
}));
```

## Testando

### Teste de Saúde
```bash
curl https://backend-pong.onrender.com/health
```

### Teste de Conexão Socket.IO
Use o console do navegador:
```javascript
const socket = io('https://backend-pong.onrender.com');
socket.on('connect', () => console.log('Conectado!'));
socket.emit('create_game', { playerName: 'Test', maxScore: 5 });
```

## Scripts

```json
{
  "start": "node server.js",        // Produção
  "dev": "nodemon server.js"        // Desenvolvimento
}
```

## Troubleshooting

### Servidor não conecta
- Verifique se o backend está rodando: acesse `/health`
- Plano Free do Render hiberna após 15 min de inatividade
- Aguarde 20-30 segundos na primeira requisição

### Erro de CORS
- Verifique a configuração de CORS em `server.js`
- Adicione a origem do seu frontend na lista de origens permitidas

### Partida não inicia
- Certifique-se de que dois jogadores entraram
- Verifique o console do servidor para logs
- Confirme que `x_orientation` está inicializado no `Ball.reset()`

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Desenvolvedores

- **Estela Lacerda** - [GitHub](https://github.com/EstelaLacerda)
- **Paulo Campos** - [GitHub](https://github.com/paulo-campos-57)
  
---

É possível ver um caso de uso deste servidor backend no seguinte <a href='https://github.com/paulo-campos-57/frontend-pong' target='_blank'>repositório</a>.
