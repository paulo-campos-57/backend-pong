import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Pong Multiplayer API',
            version: '1.0.0',
            description: 'API e documentação de eventos Socket.IO para o jogo Pong Multiplayer',
            contact: {
                email: 'paulo.m.campos6601@gmail.com, esteladelac.oli@gmail.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        externalDocs: {
            description: 'Repositório no GitHub',
            url: 'https://github.com/paulo-campos-57/backend-pong'
        },
        servers: [
            {
                url: 'http://localhost:4000',
                description: 'Servidor de Desenvolvimento'
            },
            {
                url: 'https://url.onrender.com',
                description: 'Servidor de Produção'
            }
        ],
        tags: [
            {
                name: 'HTTP',
                description: 'Endpoints HTTP REST'
            },
            {
                name: 'Socket.IO',
                description: 'Eventos WebSocket do Socket.IO'
            }
        ]
    },
    apis: ['./server.js', './game/gameLogic.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;