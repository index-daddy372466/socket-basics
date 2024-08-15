require("dotenv").config();
const express = require("express"),
  app = express(),
  http = require("http"),
  server = http.createServer(app),
  { Server } = require("socket.io"),
  io = new Server(server),
  PORT = 4447,
  path = require("path"),
  connection = "Connected to " + PORT,
  passport = require("passport"),
  initializePassport = require("./passport-config.js"),
  session = require("express-session"),
  cookieParser = require("cookie-parser");
const MemoryStore = require("memorystore")(session);
const socketIoStart = require('./socketio.js')

const checkAuthenticated = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.redirect("/login");
  }
};
const checkNotAuthenticated = (req, res, next) => {
  if (!req.user) {
    next();
  } else {
    res.redirect("/chat");
  }
};

const sessionMiddleware = session({
  name: "uniqueCookieName",
  cookie: {
    maxAge: 21600000,
    secure: false,
    sameSite: "strict",
    httpOnly: true,
  },
  store: new MemoryStore({
    checkPeriod: 21600000,
  }),
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
});
// middleware
initializePassport(passport);
// pass static html/css
// app.use(express.static("client/public"));
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  next();
});
app.use(sessionMiddleware);
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
io.engine.use(sessionMiddleware);

// home (conditional)
app.route("/").get((req, res) => {
  if (req.user) {
    res.redirect("/chat");
  } else {
    res.redirect("/login");
  }
});

// login attempt
app.route("/login-attempt").post(
  passport.authenticate("local", {
    successRedirect: "/chat",
    failureRedirect: "/",
  })
);

// login page
app.route("/login").get(checkNotAuthenticated, (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/public/index.html"));
});

// chat page GET
app.route("/chat").get(checkAuthenticated, (req, res) => {
  console.log(req.cookies);
  io.on("connection", (socket) => {
    socket.id = req.cookies["uniqueCookieName"];
  });
  res.sendFile(path.resolve(__dirname, "../client/public/chat.html"));
});

// logout GET
app.get("/logout", checkAuthenticated, (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

socketIoStart(io);

// app listen
// app.listen(PORT,()=>{
//   console.log(`listening on port ${PORT}`)
// })

// server listen
server.listen(PORT, () => {
  console.log(connection);
});
