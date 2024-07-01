const express = require("express");
const path = require("path");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname, "/public")));

let polls = [];
let pollVotes = {};

io.on("connection", function(socket) {
    socket.on("newuser", function(username) {
        socket.broadcast.emit("update", username + " joined the conversation");
    });

    socket.on("exituser", function(username) {
        socket.broadcast.emit("update", username + " left the conversation");
    });

    socket.on("chat", function(message) {
        socket.broadcast.emit("chat", message);
    });

    socket.on("createPoll", function(poll) {
        poll.id = polls.length + 1;
        polls.push(poll);
        pollVotes[poll.id] = {};
        poll.options.forEach(option => {
            pollVotes[poll.id][option] = 0;
        });
        io.emit("newPoll", poll);
    });

    socket.on("vote", function(vote) {
        const { pollId, option, username } = vote;

        // Check if user has already voted for this poll
        if (pollVotes[pollId] && !pollVotes[pollId][username]) {
            pollVotes[pollId][username] = true;
            pollVotes[pollId][option] += 1;
            io.emit("updateResults", pollVotes[pollId]);
        }
    });
});

server.listen(2000, function() {
    console.log("Server running on port 2000");
});
