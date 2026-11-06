const http = require('http');
const WebSocket = require("ws");

const server = http.createServer();
const wsServer = new WebSocket.Server({ server });

let clients = [];
let messages = [];
let sse = [];

server.on('request', (req, res) => {

    res.setHeader(
        'Access-Control-Allow-Origin',
        'http://127.0.0.1:5500'
    );

    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type'
    );

    if (req.url === '/events') {
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            'Access-Control-Allow-Origin': 'http://127.0.0.1:5500'
        });

        sse.push(res);
        console.log('sse-пользователь подключился');

        res.on('close', () => {
            sse = sse.filter(client => client !== res);
            console.log('sse-пользователь отключился');
        });
    } else {

        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Сервер работает. Используйте /events для SSE или подключитесь по WebSocket.");
    }
});

const broadCastSse = (event, data) => {
    sse.forEach(client => {
        client.write(`event: ${event}\n`);
        client.write(`data: ${JSON.stringify(data)}\n\n`);
    });
};

function onConnect(wsClient) {
    console.log("Новый пользователь подключился по WebSocket");
    clients.push(wsClient);

    broadCastSse('connected', {
        message: 'подключился новый пользователь'
    });

    wsClient.on("message", (message) => {
        // В библиотеке ws версии 8+ message приходит в виде Buffer.
        // Переводим его в строку перед чтением или отправкой.
        const messageString = message.toString();
        console.log("Получено по WS:", messageString);

        try {
            const jsonMessage = JSON.parse(messageString);
            console.log("Распарсенный JSON:", jsonMessage);

            // Рассылаем остальным WS-клиентам
            clients
                .filter(c => c !== wsClient)
                .forEach(c => c.send(JSON.stringify(jsonMessage)));

            // Дублируем в SSE
            broadCastSse('new-message', jsonMessage);
        }
        catch (error) {
            console.error("Ошибка парсинга JSON:", error.message);
        }
    });

    wsClient.on("close", () => {
        clients = clients.filter(c => c !== wsClient);
        console.log("Пользователь отключился от WebSocket");
    });
}

wsServer.on('connection', onConnect);

// Запуск сервера делаем строго ОДИН раз внутри метода listen
server.listen(9000, () => {
    console.log('Сервер успешно запущен на http://localhost:9000');
});
