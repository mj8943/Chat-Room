(function() {
    const app = document.querySelector(".app");
    const socket = io();

    let uname;

    app.querySelector(".join-screen #join-user").addEventListener("click", function() {
        let username = app.querySelector(".join-screen #username").value;
        if (username.length === 0) {
            return;
        }
        socket.emit("newuser", username);
        uname = username;
        app.querySelector(".join-screen").classList.remove("active");
        app.querySelector(".chat-screen").classList.add("active");
    });

    app.querySelector(".chat-screen #send-message").addEventListener("click", function() {
        let message = app.querySelector(".chat-screen #message-input").value;
        let fileInput = app.querySelector(".chat-screen #image-input");
        let file = fileInput.files[0];

        if (file) {

            let reader = new FileReader();
            reader.onload = function(e) {
                socket.emit("chat", {
                    username: uname,
                    text: message,
                    image: e.target.result
                });
                renderMessage("my", {
                    username: uname,
                    text: message,
                    image: e.target.result
                });
                fileInput.value = ""; // Clear the file input
                app.querySelector(".chat-screen #message-input").value = "";
            }
            reader.readAsDataURL(file);
        } else if (message.length > 0) {
            renderMessage("my", {
                username: uname,
                text: message
            });
            socket.emit("chat", {
                username: uname,
                text: message
            });
            app.querySelector(".chat-screen #message-input").value = "";
        }
    });

    app.querySelector(".chat-screen #exit-chat").addEventListener("click", function() {
        socket.emit("exituser", uname);
        window.location.href = window.location.href;
    });

    socket.on("update", function(update) {
        renderMessage("update", update);
    });

    socket.on("chat", function(message) {
        renderMessage("other", message);
    });

    function renderMessage(type, message) {
        let messageContainer = app.querySelector(".chat-screen .messages");
        let el = document.createElement("div");

        if (type == "my") {
            el.setAttribute("class", "message my-message");
        } else if (type == "other") {
            el.setAttribute("class", "message other-message");
        } else if (type == "update") {
            el.setAttribute("class", "update");
            el.innerText = message;
            messageContainer.appendChild(el);
            return;
        }

        if (message.image) {
            el.innerHTML = `
                <div>
                    <div class="name">${type === "my" ? "You" : message.username}</div>
                    <div class="text">${message.text}</div>
                    <img src="${message.image}" class="image">
                </div>
            `;
        } else {
            el.innerHTML = `
                <div>
                    <div class="name">${type === "my" ? "You" : message.username}</div>
                    <div class="text">${message.text}</div>
                </div>
            `;
        }

        messageContainer.appendChild(el);
        messageContainer.scrollTop = messageContainer.scrollHeight - messageContainer.clientHeight;
    }
})();
