const express = require("express"),
  app = express(),
  http = require("http"),
  server = http.createServer(app),
  { Server } = require("socket.io"),
  io = new Server(server),
  PORT = 4447,
  connection = "Connected to " + PORT;

// middleware

// pass static html/css
app.use(express.static("client/public"));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));


let c = 0;
// connect
io.on("connection", (socket) => {
  c += 1;
  console.log(c + ": User connected via socket");

  // get chat message
  socket.on("chat message", (pay) => {
    console.log('message received')
    console.log("message: " + pay);
    
    // broadcast across all clients
    io.sockets.emit('chat message','all can see ['+pay+']')

    // broadcast to all client except your own 
    socket.broadcast.emit('chat message','you  can see ['+pay+'] but not the sender')
  });
  

  // disconnect
  socket.on("disconnect", () => {
    console.log("User-disconnected");
  });
});

server.listen(PORT, () => {
  console.log(connection);
});
