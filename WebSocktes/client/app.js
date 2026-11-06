
const chatArea = document.getElementById("chat-area");
const textInput = document.getElementById("text-input");
const sendBtn = document.getElementById("send-btn");

const WS = new WebSocket("ws://localhost:9000");
const events = new EventSource("http://localhost:9000/events");

const userId = Math.floor(Math.random() * 1000);
const messages = [];

WS.onopen = () => {
    console.log("Подключились к WebSocket");
};

WS.onclose = () => {
    console.log("WebSocket отключился");
};

WS.onerror = (error) => {
    console.error("Ошибка WebSocket:", error);
};

WS.onmessage = (event) => {
    try {
        const jsonData = JSON.parse(event.data);

        messages.push(jsonData);
        renderChat();

        console.log("Получено сообщение:", jsonData);
    } catch (error) {
        console.error("Ошибка обработки сообщения:", error);
    }
};

events.onopen = () => {
    console.log("Подключились к SSE");
};

events.onerror = (error) => {
    console.error("Ошибка SSE подключения:", error);
};

events.addEventListener("connected", (event) => {
    const data = JSON.parse(event.data);

    console.log("Новый пользователь:", data);
});

events.addEventListener("new-message", (event) => {
    const data = JSON.parse(event.data);

    console.log("SSE: новое сообщение:", data);
});

sendBtn.onclick = () => {
    const message = textInput.value.trim();

    if (message.length === 0) {
        alert("Сообщение не может быть пустым");
        return;
    }

    if (WS.readyState !== WebSocket.OPEN) {
        alert("Нет подключения к серверу");
        return;
    }

    const jsonMessage = {
        userId,
        message
    };

    WS.send(JSON.stringify(jsonMessage));

    console.log("Отправили сообщение:", jsonMessage);

    messages.push(jsonMessage);

    renderChat();

    textInput.value = "";
};


function renderChat() {
    chatArea.innerHTML = ""
    messages.forEach(m => {
        chatArea.innerHTML +=
            `
        <span><b>Пользователь ${m.userId}</b>: ${m.message}</span><br>
        `
    })
}