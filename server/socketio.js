const public = "public_message";
const sending = "send_it";
const typing = "typing";
const socketIoStart = (io) => {
  // Initiate socket connection
  io.on("connection", (socket) => {
    // socket joins a room
    socket.on("join_room", (room) => {
      socket.join(room);

      // typing passes true/false
    
      socket.on(typing, ( currentroom) => {
        let user = socket.request.session ? socket.request.session.passport.user : '';
        socket.to(currentroom).emit(typing,user["name"]);
      }); 
    });
    // detect keybaord
    socket.on('keyboard', (bool, currentroom) => {
      let user = socket.request.session  ? socket.request.session.passport.user : '';
      socket.to(currentroom).emit('keyboard', bool, user["name"]);
    }); 

    // detect if user is logged in or not
    // if (socket.request.session.passport) {
    //   console.log("session active");
    // } else {
    //   console.log("session not active");
    // }

    // welcome message to any rooms (once)
    socket.on("welcome", (room) => {
      io.emit("welcome", "Welcome to " + room + "!");
      // join the specified room
    });

    // emit user's name to room
    socket.emit("get_name", socket.request.session ? socket.request.session.passport.user : '');

    // server recieves public message from any socket
    socket.on(public, (msg, currentroom) => {
      let user = socket.request.session ? socket.request.session.passport.user : '';

      // server sends message back to client
      // socket.broadcast.emit('send-to-room', msg, user.name);

      // send to the current room, but cannot see your own message
      // socket.to(currentroom).emit('send_it', msg, user['name']);
      // similar to socket.broadcast.emit(event)
      io.to(currentroom).emit(sending, msg, user["name"]);
    });

    // disconnect socket
    socket.on("disconnect", () => {
      console.log("socket disconnected");
    });
  });
};

module.exports = socketIoStart;
