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

    // Poll creation and voting
    const pollButton = app.querySelector(".chat-screen #poll-button");
    const pollModal = document.getElementById("poll-modal");
    const closeModal = document.querySelector(".close");

    pollButton.addEventListener("click", function() {
        pollModal.style.display = "block";
    });

    closeModal.addEventListener("click", function() {
        pollModal.style.display = "none";
    });

    window.addEventListener("click", function(event) {
        if (event.target == pollModal) {
            pollModal.style.display = "none";
        }
    });

    document.getElementById("create-poll").addEventListener("click", function() {
        const question = document.getElementById("poll-question").value;
        const options = Array.from(document.querySelectorAll(".poll-option")).map(input => input.value);
        if (question.length === 0 || options.some(opt => opt.length === 0)) {
            return;
        }
        socket.emit("createPoll", { username: uname, question, options });
        pollModal.style.display = "none";
        document.getElementById("poll-question").value = "";
        document.querySelectorAll(".poll-option").forEach(input => input.value = "");
    });

    socket.on("newPoll", (poll) => {
        renderPoll(poll);
    });

    socket.on("updateResults", (voteCounts) => {
        updatePollResults(voteCounts);
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

    function renderPoll(poll) {
        let messageContainer = app.querySelector(".chat-screen .messages");
        let el = document.createElement("div");
        el.setAttribute("class", "poll-message");

        let pollHtml = `
            <div>
                <div class="name">${poll.username}</div>
                <div class="question">${poll.question}</div>
                <div class="options">`;

        poll.options.forEach(option => {
            pollHtml += `<button class="poll-option" data-pollId="${poll.id}" data-option="${option}">${option} (<span class="vote-count">0</span>)</button>`;
        });

        pollHtml += `</div></div>`;

        el.innerHTML = pollHtml;
        messageContainer.appendChild(el);

        const optionButtons = el.querySelectorAll(".poll-option");
        optionButtons.forEach(button => {
            button.addEventListener("click", function() {
                const pollId = button.getAttribute("data-pollId");
                const option = button.getAttribute("data-option");
                socket.emit("vote", {
                    pollId: pollId,
                    option: option,
                    username: uname // Send username with vote
                });

                // Disable other options
                optionButtons.forEach(optButton => {
                    if (optButton !== button) {
                        optButton.disabled = true;
                    }
                });

                button.disabled = true; // Disable selected option after voting
            });
        });

        messageContainer.scrollTop = messageContainer.scrollHeight - messageContainer.clientHeight;
    }

    function updatePollResults(voteCounts) {
        const pollMessages = document.querySelectorAll(".poll-message");
        pollMessages.forEach(pollMessage => {
            const optionButtons = pollMessage.querySelectorAll(".poll-option");
            let maxCount = 0;
            let maxOption = null;

            optionButtons.forEach(button => {
                const option = button.getAttribute("data-option");
                const countSpan = button.querySelector(".vote-count");
                const count = voteCounts[option] || 0;
                countSpan.innerText = count;

                // Determine the option with the maximum votes
                if (count > maxCount) {
                    maxCount = count;
                    maxOption = button;
                }
            });

            // Highlight the option with the maximum votes
            optionButtons.forEach(button => {
                if (button === maxOption) {
                    button.classList.add("max-vote-option");
                } else {
                    button.classList.remove("max-vote-option");
                }
            });
        });
    }
})();
