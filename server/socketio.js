const socketIoStart = (io) => {
  // Initiate socket connection
  io.on("connection", (socket) => {

    // define user's session
    const userSession = socket.request.session.passport.user;

    // server receives chat message from any socket
    socket.on("chat message", (pay) => {
    
      // broadcast across all clients
      // option - 1
    //   io.sockets.emit("chat message", pay, userSession.name);
      // option - 2
      socket.broadcast.emit("chat message", pay, userSession.name);

    });
  });
};

module.exports = socketIoStart
