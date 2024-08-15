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
const mixMeUp = (password,name) => {
  let a = [];
  let p = [...password]
  let u = [...name]
  let randomChar;
  console.log(p)
  console.log(u)
  let ten = 10
  // while(ten > 0){
  //   // let idx = p.indexOf(genRandom(p,p.length));
  //   // randomChar = p.slice(idx,idx+1);
  //   // console.log(randomChar)
  //   ten-=1
    
  //   console.log(ten)
  //   console.log(genRandom(p,p.length))
  // }
  // while(u.length > 0){
  //   return null;
  // }
}
const  checkAuthenticated = (req,res,next) =>{
  
  if(req.user){
    console.log(req.cookies)
    console.log(req.session)
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
// middleware
initializePassport(passport)
// pass static html/css
// app.use(express.static("client/public"));
app.use(express.json());
app.use(cookieParser())
app.use(
  session({
    name:'uniqueCookieName',
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

// home (conditional)
app.route('/').get((req,res)=>{
  if(req.user){
    res.redirect('/chat')
  }
  else{
    res.redirect('/login')
  }
})
app.use((req,res,next)=>{
  // track hash security middleware
  if(req.user){
    let user = req.session.passport.user;
    mixMeUp(user.password,user.name)
  }
  next();
})
// logout
app.get('/logout', checkAuthenticated, (req,res)=>{
  // clear cookies      
  // logout function                           
  req.logout(()=>{
    res.redirect('/')
  })
})
// login
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
// io.on("connection", (socket) => {  console.log("User connected via socket");
//   // get chat message
//   socket.on("chat message", (pay) => {
//     console.log('message received')
//     console.log("message: " + pay);
    
//     // broadcast across all clients
//     io.sockets.emit('chat message','all can see ['+pay+']')

//     // broadcast to all client except your own 
//     socket.broadcast.emit('chat message','you  can see ['+pay+'] but not the sender')
//   });
//   // disconnect
//   socket.on("disconnect", () => {
//     console.log("User-disconnected");
//   });
// });
  

// app listen
app.listen(PORT,()=>{
  console.log(`listening on port ${PORT}`)
})
// server listen
// server.listen(PORT, () => {
//   console.log(connection);
// });