require("dotenv").config();
const express = require("express"),
  app = express(),
  http = require("http"),
  server = http.createServer(app),
  { Server } = require("socket.io"),
  io = new Server(server),
  // io = require('socket.io')(server, { wsEngine: 'ws' }); 
  PORT = !process.env.PORT ? 4447 : process.env.PORT,
  AXI = !process.env._AXI_ ? 4448 : process.env._AXI_,
  path = require("path"),
  cors = require("cors"),
  passport = require("passport"),
  initializePassport = require("./passport-config.js"),
  session = require("express-session"),
  cookieParser = require("cookie-parser"),
  fs = require("fs"),
  MemoryStore = require("memorystore")(session),
  { setMaxListeners } = require("events"),
  socketIoStart = require("./socketio.js"),
  docker = "http://localhost:6786",
  { createProxyMiddleware } = require("http-proxy-middleware");

let messages = {},
  activeUsers = [],
  rooms = [];

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
    res.redirect("/home");
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
app.use(cors());
app.use(
  "/api/docker",
  createProxyMiddleware({ target: docker + "/api/docker" })
);
app.use("/api/home", createProxyMiddleware({ target: docker + "/api/home" }));
app.use("/numbers", createProxyMiddleware({ target: docker + "/api/numbers" }));
app.set("views", path.resolve(__dirname, "../client/public/views"));
app.set("view engine", "ejs");
initializePassport(passport, activeUsers);
app.use(express.json());
app.use(cookieParser());
setMaxListeners(20);
app.use(sessionMiddleware);
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
io.engine.use(sessionMiddleware);
let userbool = false;

// socket io
socketIoStart(io);

// read cursewords.json & route
app.route("/words/curse").get((req, res) => {
  let string = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "lib/cursewords.json"), {
      encoding: "utf-8",
    })
  );
  const { words } = string;
  const alternate = { words: ["fuck", "shit", "fag"] };

  if (!words) {
    res.json(alternate);
  } else {
    res.json({ words: words });
  }
});

app.route("/").get((req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/home");
  } else {
    res.redirect("/login");
  }
});
// home page GET
app.route("/home").get(checkAuthenticated, (req, res) => {
  res.render("home.ejs");
});

// login page
app.route("/login").get(checkNotAuthenticated, (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/public/index.html"));
});
// login attempt
app.route("/login-attempt").post(
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/",
  })
);
// logout GET
app.get("/logout", checkAuthenticated, (req, res) => {
  let user = req.user;

  for (let i = 0; i < activeUsers.length; i++) {
    if (activeUsers[i].id == user.id) {
      console.log(activeUsers[i]);
      activeUsers.splice(activeUsers.indexOf(activeUsers[i]), 1);
    }
  }
  console.log("");
  console.log("remaining active users");
  console.log(activeUsers);
  req.logout(() => {
    res.redirect("/");
  });
});

// exisiting rooms
app.get("/rooms/existing", checkAuthenticated, (req, res) => {
  let roomData = [...rooms];
  if (rooms.length < 1) {
    res.json({ room: "no data" });
  } else {
    res.json({ room: roomData });
  }
});
app.post("/rooms/check", (req, res) => {
  if (!rooms.includes(req.body.room)) {
    res.status(403).json({ err: "unauthorized!" });
  } else {
    res.json({ data: true });
  }
});

// clear rooms
app.route("/room/clear").get(checkAuthenticated, (req, res) => {
  rooms = [];
  for (let property in messages) {
    if (messages.hasOwnProperty(property)) {
      delete messages[property];
    }
  }
  res.redirect("/home");
});
// create a room
app.post("/room/create", checkAuthenticated, (req, res) => {
  console.log(req.body.room);
  let { room } = req.body;
  messages[room] = [];
  // console.log("room on post");
  // console.log(room);
  try {
    if (room && (!rooms.includes(room) || rooms.indexOf(room) == -1)) {
      rooms.push(room);
      console.log(rooms);
      res.json({ room: rooms });
    } else {
      res.status(404).json({ rooms: undefined });
    }
  } catch (err) {
    throw err;
  }
});
app.get("/room/:room", checkAuthenticated, (req, res) => {
  if (!rooms.includes(req.params.room)) {
    res.status(403).json({ err: "unauthorized!" });
  } else {
    res.render("chat.ejs", {
      room: req.params.room,
    });
  }
});
// store messages in fake db
app.get("/room/:room/:message", (req, res) => {
  const { room, message } = req.params;
  // push message into array;
  // messages = [...messages,message]
  // res.json({messages:messages})
  let obj = { message: message, sender: req.user.name };
  messages[room] = [...messages[room], obj];
  res.json({ messages: messages[room] });
  // res.redirect('/room/'+room)
});
// get messages in fake db
app.get("/:room/sec/messages", (req, res) => {
  const { room } = req.params;
  if (messages[room].length > 0) {
    res.json({ messages: messages[room] });
  } else {
    res.json({ messages: "no messages" });
  }
  // res.redirect('/room/'+room)
});

// app listen
// app.listen(PORT, () => {
//   console.log(`listening on port ${PORT}`);
// });
server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

// 404
app.use(function (req, res) {
  res.status(404).json({
    error: "This result brought you here! 404 not found",
  });
});
