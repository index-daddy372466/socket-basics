const public = "public_message";
const sending = "send_it";
const typing = "typing";
const createRoom = 'create_room'
const socketIoStart = (io) => {
  // Initiate socket connection
  io.on("connection", (socket) => {
    let user = socket.request.session
        ? socket.request.session.passport.user
        : "";


    // create a room
    socket.on(createRoom, room => {
      console.log('new room created: ' + room)
      // socket broadcasts new room into client side. (everyone can see, including the sender)
      socket.emit(createRoom,room)
    })
    // socket joins a room
    socket.on("join_room", (room) => {
      socket.join(room);

      // typing passes true/false
      socket.on(typing, (currentroom) => {
        let user = socket.request.session
          ? socket.request.session.passport.user
          : "";
        socket.to(currentroom).emit(typing, user["name"]);
      });
    });
    // detect keybaord
    socket.on("keyboard", (bool, currentroom) => {
      let user = socket.request.session
        ? socket.request.session.passport.user
        : "";
      socket.to(currentroom).emit("keyboard", bool, user["name"]);
    });

    // welcome message to any rooms (once)
    socket.on("welcome", (room) => {
      io.emit("welcome", "Welcome to " + room + "!");
      // join the specified room
    });

    // emit user's name to room
    socket.emit(
      "get_name", socket.request.session.passport.user
    );

    // server recieves public message from any socket
    socket.on(public, (msg, currentroom, photo) => {
      let user = socket.request.session
        ? socket.request.session.passport.user
        : "";
      io.to(currentroom).emit(sending, msg, user["name"], photo);
    });

    // disconnect socket
    socket.on("disconnect", () => {
      console.log("socket disconnected");
    });
  });
};

module.exports = socketIoStart;
