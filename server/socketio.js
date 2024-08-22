const public = "public_message";
const join = "join_room";
const socketIoStart = (io) => {
  // Initiate socket connection
  io.on("connection", (socket) => {

      // socket joins a room
    socket.on(join, (room) => {
      socket.join(room);
    });

    // detect if user is logged in or not
    if (socket.request.session.passport) {
      console.log("session active");
      socket.id = socket.request.session.passport.user.id;
    } else {
      console.log("session not active");
    }

    // welcome message to any rooms (once)
    socket.once("welcome", (room) => {
      console.log(room);
      io.emit("welcome", "Welcome to " + room + "!");
      // join the specified room
      socket.join(room);
    });

    // server recieves public message from any socket
    socket.on(public, (msg, currentroom) => {
      let user = socket.request.session.passport.user;
      console.log("informataion: ");
      console.log("");
      console.log(user);
      console.log(msg);
      console.log(currentroom);

      // server sends message back to client
      socket.broadcast.emit(public, msg, user.name);
    });
    // disconnect socket
    socket.on("disconnect", () => {
      console.log("socket disconnected");
    });
  });
};

module.exports = socketIoStart;
