document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('login-modal');
    const usernameInput = document.getElementById('username-input');
    const loginButton = document.getElementById('login-button');
    const messagesArea = document.getElementById('messages-area');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    let username = localStorage.getItem('chat_username');
    let socket;

    // Check if user is logged in
    if (!username) {
        loginModal.classList.remove('hidden');
    } else {
        connectWebSocket();
    }

    // Login Logic
    loginButton.addEventListener('click', () => {
        const name = usernameInput.value.trim();
        if (name) {
            username = name;
            localStorage.setItem('chat_username', username);
            loginModal.classList.add('hidden');
            connectWebSocket();
        }
    });

    // Allow Enter key to submit login
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginButton.click();
        }
    });

    function connectWebSocket() {
        let wsUrl;

        // 1. If running on Localhost
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            wsUrl = 'ws://localhost:8080';
        }
        // 2. If running on Render (served by the Node server)
        else if (location.hostname.includes('onrender.com')) {
            const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
            wsUrl = `${protocol}//${location.host}`;
        }
        // 3. If running on GitHub Pages (or file://), connect to the Render backend
        else {
            wsUrl = 'wss://chat-iqw0.onrender.com';
        }
        console.log(`Connecting to ${wsUrl}...`);
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('Connected to WebSocket');
            addSystemMessage('Connected to the chat room.');
        };

        socket.onmessage = (event) => {
            // The echo server returns the exact string we sent.
            // In a real app, we'd expect a JSON object.
            // We'll try to parse it, or treat it as a simple string if it fails.
            try {
                const data = JSON.parse(event.data);
                addMessage(data.user, data.text, data.timestamp, false);
            } catch (e) {
                // If it's not JSON, it might be a raw string or system message
                // For the echo server, if we send JSON, it returns JSON string.
                console.log('Received raw message:', event.data);
            }
        };

        socket.onclose = () => {
            console.log('Disconnected from WebSocket');
            addSystemMessage('Disconnected from server. Reconnecting...');
            setTimeout(connectWebSocket, 3000);
        };

        socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };
    }

    function sendMessage() {
        const text = messageInput.value.trim();
        if (text && socket && socket.readyState === WebSocket.OPEN) {
            const messageData = {
                user: username,
                text: text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            // Send as JSON string
            socket.send(JSON.stringify(messageData));

            // Optimistically add to UI (since echo server will send it back, we might duplicate if we don't handle it carefully)
            // For a standard chat app, usually the server broadcasts to everyone including sender, 
            // OR broadcasts to everyone else and sender adds it locally.
            // With echo.websocket.org, it sends back to ONLY us.
            // So we will rely on the onmessage to display it to avoid duplication logic complexity here.
            // BUT, to make it feel responsive, we can add it immediately and ignore the echo if we had a unique ID.
            // For simplicity with this specific echo server, we'll just wait for the echo.
            // actually, echo.websocket.org echoes back to the client that sent it. It doesn't broadcast to others.
            // So this "chat room" will only be a chat with yourself unless we use a real broadcast server.
            // I will add a note about this.

            // For better UX in this demo, I'll add it immediately as "You"
            // and I won't process the echo if it matches what I just sent (simplistic dedup).

            // Actually, let's just rely on the echo for now to prove the websocket works.
            // addMessage('You', text, messageData.timestamp, true);

            messageInput.value = '';
        }
    }

    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function addMessage(user, text, time, isSentByMe) {
        // Determine if the message is from the current user based on name
        // (In a real app, use IDs)
        const isMe = user === username;

        const messageDiv = document.createElement('div');
        messageDiv.className = `flex items-start group ${isMe ? 'justify-end' : ''}`;

        let content = '';

        if (isMe) {
            content = `
                <div class="flex flex-col items-end max-w-[75%]">
                    <div class="flex items-baseline space-x-2 mb-1">
                        <span class="text-xs text-gray-500 dark:text-gray-400">${time}</span>
                        <span class="font-bold text-sm text-gray-900 dark:text-gray-100">You</span>
                    </div>
                    <div class="bg-primary text-white p-3 rounded-2xl rounded-tr-none shadow-sm text-left">
                        <p class="text-sm">${escapeHtml(text)}</p>
                    </div>
                </div>
                <img src="https://i.pravatar.cc/150?u=${user.length}" alt="Me" class="w-10 h-10 rounded-full object-cover ml-3 mt-1">
            `;
        } else {
            content = `
                <img src="https://i.pravatar.cc/150?u=${user.length}" alt="User" class="w-10 h-10 rounded-full object-cover mr-3 mt-1">
                <div class="flex flex-col max-w-[75%]">
                    <div class="flex items-baseline space-x-2 mb-1">
                        <span class="font-bold text-sm text-gray-900 dark:text-gray-100">${escapeHtml(user)}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">${time}</span>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-700">
                        <p class="text-sm">${escapeHtml(text)}</p>
                    </div>
                </div>
            `;
        }

        messageDiv.innerHTML = content;
        messagesArea.appendChild(messageDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    function addSystemMessage(text) {
        const div = document.createElement('div');
        div.className = 'flex justify-center my-2';
        div.innerHTML = `<span class="text-xs text-gray-400 bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded-full">${text}</span>`;
        messagesArea.appendChild(div);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
