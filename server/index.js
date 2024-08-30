require("dotenv").config();
let PORT = process.env.PORT || 4447;
const express = require("express"),
  app = express(),
  // http = require("http"),
  httpServer = app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
  }),
  { Server } = require("socket.io"),
  io = new Server(httpServer);
(AXI = !process.env._AXI_ ? 4448 : process.env._AXI_),
  (path = require("path")),
  (cors = require("cors")),
  (passport = require("passport")),
  (initializePassport = require("./passport-config.js")),
  (session = require("express-session")),
  (cookieParser = require("cookie-parser")),
  (fs = require("fs")),
  (MemoryStore = require("memorystore")(session)),
  ({ setMaxListeners } = require("events")),
  (socketIoStart = require("./socketio.js")),
  (docker = "http://localhost:9998"),
  ({ createProxyMiddleware } = require("http-proxy-middleware"));
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

const checkIcon = (req, res, next) => {
  if (req.user) {
    console.log(activeUsers);
    console.log("checking icon");
    console.log(req.user);
    let getActive = activeUsers.filter((x) => x.id == req.user.id);
    console.log(getActive);
    if (getActive[0].hasOwnProperty("icon")) {
      next();
    } else {
      res.redirect("/char-selection");
    }
  }
};
// check is a user already has a profile photo.
const checkNoIcon = (req, res, next) => {
  // if user is not logged in and not
  if (!req.user) {
    console.log("user and icon not found. going login");
    res.redirect("/login");
  }
  // if user is logged in, but does not have an icon set
  else if (
    req.user &&
    !activeUsers.filter((u) => req.user.id === u.id)[0].icon
  ) {
    console.log("choose a character");
    next();
  } else {
    console.log("user & icon is found. going home");
    res.redirect("/home");
  }
};

const sessionMiddleware = session({
  name: "uniqCkie",
  cookie: {
    maxAge: 1800000,
    secure: false,
    sameSite: "strict",
    httpOnly: true,
  },
  store: new MemoryStore({
    checkPeriod: 1800000,
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
app.use(express.static(path.resolve(__dirname, "../client/public")));
initializePassport(passport, activeUsers);
app.use(express.json());
app.use(cookieParser());
setMaxListeners(20);
app.use(sessionMiddleware);
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
io.engine.use(sessionMiddleware);

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
  let obj = activeUsers.find((user) => user.id == req.user.id);
  let checkNoIcon = !obj.hasOwnProperty("icon");
  res.render("home.ejs", {
    checkIcon: checkNoIcon,
  });
});

// character selection
app.route("/char-selection").get(checkNoIcon, (req, res) => {
  res.render("character.ejs");
});
// test - post animal to a user in activeUsers
app.route("/char/icon").post(checkNoIcon, (req, res) => {
  const { icon } = req.body;
  console.log(icon);
  try {
    if (req.user) {
      // console.log(req.user.id)
      activeUsers.find((user) => user.id == req.user.id).icon = icon;
      let curruser = activeUsers.filter((user) => user.id == req.user.id);
      console.log(curruser);

      res.json({ icon: icon });
    }
  } catch (err) {
    throw err;
  }
});

// icon picture GET
app.route("/char/photo").get((req, res) => {
  if (req.user) {
    let obj = activeUsers.find((user) => user.id === req.user.id);
    if (!obj.hasOwnProperty("icon")) {
      res.send(
        `Choose a character. <a href="/char-selection">Choose character</a><br>Go home. <a href="/home">Home</a>`
      );
    } else {
      res.json({ icon: obj.icon });
    }
  } else {
    res.send(`Sign in. <a href="/login">Sign in</a>`);
  }
});
// login page
app.route("/login").get(checkNotAuthenticated, (req, res) => {
  res.render("index.ejs");
});
// login attempt
app.route("/login-attempt").post(
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/char-selection",
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
app.get("/room/:room", checkAuthenticated, checkIcon, (req, res) => {
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
  var offset =
    Math.floor(new Date().getTimezoneOffset() / 60) * (60 * 60 * 1000);
  let timestamp = new Date().getTime() - offset;
  let activeuser = activeUsers.find((u) => u.id == req.user.id);
  let obj = {
    message: message,
    sender: req.user.name,
    icon: activeuser.icon,
    timestamp: timestamp,
  };
  messages[room] = [...messages[room], obj];
  res.json({ messages: messages[room] });
  // res.redirect('/room/'+room)
});
// get messages in fake db
app.get("/:room/sec/messages", (req, res) => {
  const { room } = req.params;
  const { icon, message, sender } = req.query;
  let keys,vals,filtered
  if (Object.values(req.query).length > 0) {
    keys = Object.keys(req.query), vals = Object.values(req.query);
    let msgs = messages[room];
    // filter the search
    filtered = msgs.filter((m,index)=> {
      // return null
      return keys.every((k,idx)=>(m[k]==vals[idx]))
    })
    console.log(keys.join(','))
    let property = 'filter: ' + keys.join(' and ')
    let obj = {}
    obj[property] = filtered
    res.json(obj)
    
  } else {
    if (messages[room].length > 0) {
      res.json({ messages: messages[room] });
    } else {
      res.json({ messages: "no messages" });
    }
  }

  // res.redirect('/room/'+room)
});

// 404
app.use(function (req, res) {
  res.status(404).json({
    error: "This result brought you here! 404 not found",
  });
});
