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
  session = require('express-session'),
  cookieParser = require('cookie-parser')
  const MemoryStore = require("memorystore")(session);
let genRandom = (arr,len) => Math.floor(Math.random()*len)
const  checkAuthenticated = (req,res,next) =>{
  
  if(req.user){
    next();
  }
  else{
    res.redirect('/login')
  }
}
const  checkNotAuthenticated = (req,res,next) =>{
  if(!req.user){
    next();
  }
  else{
    res.redirect('/chat')
  }
}

const sessionMiddleware = session({
  name:'uniqueCookieName',
  cookie: { maxAge: 21600000, secure: false,sameSite:'strict',httpOnly: true },
  store: new MemoryStore({
    checkPeriod: 21600000,
  }),
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
})
// middleware
initializePassport(passport)
// pass static html/css
// app.use(express.static("client/public"));
app.use(express.json());
app.use(cookieParser())
app.use(sessionMiddleware);
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize())
app.use(passport.session())
io.engine.use(sessionMiddleware)

// home (conditional)
app.route('/').get((req,res)=>{
  if(req.user){
    res.redirect('/chat')
  }
  else{
    res.redirect('/login')
  }
})

// login attempt
app.route('/login-attempt').post(passport.authenticate('local',{successRedirect:'/chat',failureRedirect:'/'}))


// login page 
app.route('/login').get(checkNotAuthenticated,(req,res)=>{
  res.sendFile(path.resolve(__dirname,'../client/public/index.html'))
})

// chat page GET
app.route('/chat').get(checkAuthenticated,(req,res)=>{
  console.log(req.cookies)
  res.sendFile(path.resolve(__dirname,'../client/public/chat.html'))
})
  
// logout GET
app.get('/logout', checkAuthenticated, (req,res)=>{
  req.logout(()=>{
    res.redirect('/')
  })
})

// socket connection
io.on("connection", (socket) => { 
    // get all connected clients
  const userSession = socket.request.session.passport.user;
  // capture session & define socket.id as session id
  console.log(userSession)
  socket.id = userSession.id;
  console.log("User connected via socket");

  // get chat message
  socket.on("chat message", (pay) => {
    console.log('message received')
    console.log("message: " + pay);
    
    // broadcast across all clients
    // io.sockets.emit('chat message','all can see ['+pay+']')

    // broadcast to all client except your own 
    // socket.broadcast.emit('chat message','you  can see ['+pay+'] but not the sender')
    socket.broadcast.emit('chat message',pay,userSession.name)
  });
  // disconnect
  socket.on("disconnect", () => {
    socket.removeAllListeners();
    console.log("User-disconnected");
  });
});

// app listen
// app.listen(PORT,()=>{
//   console.log(`listening on port ${PORT}`)
// })

// server listen
server.listen(PORT, () => {
  console.log(connection);
});