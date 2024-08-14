require('dotenv').config()
const express = require("express"),
  app = express(),
  http = require("http"),
  server = http.createServer(app),
  { Server } = require("socket.io"),
  io = new Server(server),
  PORT = 4447,
  path = require('path'),
  connection = "Connected to " + PORT,
  passport = require('passport'),
   initializePassport  = require('./passport-config.js'),
  session = require('express-session')
  const MemoryStore = require("memorystore")(session);
const  checkAuthenticated = (req,res,next) =>{
  console.log(req.user)
  if(req.user.id && req.user.name){
    next();
  }
  else{
    res.redirect('/login')
  }
}
const  checkNotAuthenticated = (req,res,next) =>{
  console.log(req.user)
  if(!req.user){
    next();
  }
  else{
    res.redirect('/chat')
  }
}
// middleware
initializePassport(passport)
// pass static html/css
// app.use(express.static("client/public"));
app.use(express.json());
app.use(
  session({
    cookie: { maxAge: 21600000, secure: false, httpOnly: false },
    store: new session.MemoryStore({
      checkPeriod: 21600000,
    }),
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize())
app.use(passport.session())



// chat
app.route('/login').get(checkNotAuthenticated,(req,res)=>{
  res.sendFile(path.resolve(__dirname,'../client/public/index.html'))
})

// routes
app.route('/profile').post(passport.authenticate('local',{successRedirect:'/chat',failureRedirect:'/'}))


// chat
app.route('/chat').get(checkAuthenticated,(req,res)=>{
  res.sendFile(path.resolve(__dirname,'../client/public/chat.html'))
})

// socket connection
io.on("connection", (socket) => {  console.log("User connected via socket");
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
