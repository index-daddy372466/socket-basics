require("dotenv").config();
let PORT = process.env.PORT || 4447;
const express = require("express"),
  app = express(),
  // http = require("http"),
  httpServer = app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
  }),
  habits = require('./lib/habits.js'),
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
app.route("/words/curse").get(checkViolation, (req, res) => {
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

app.route("/").get(checkViolation, (req, res) => {
  console.log(habits)
  if (req.isAuthenticated()) {
    res.redirect("/home");
  } else {
    res.redirect("/login");
  }
});
// home page GET
app.route("/home").get(checkAuthenticated, checkViolation, (req, res) => {
  habits.home++
  console.log(habits)
  let obj = activeUsers.find((user) => user.id == req.user.id);
  let checkNoIcon = !obj.hasOwnProperty("icon");
  res.render("home.ejs", {
    checkIcon: checkNoIcon,
  });
});

// character selection
app.route("/char-selection").get(checkNoIcon,checkViolation, (req, res) => {
  habits.character++
  console.log(habits)
  res.render("character.ejs");
});
// test - post animal to a user in activeUsers
app.route("/char/icon").post(checkViolation, checkNoIcon, (req, res) => {
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
app.route("/char/photo").get(checkViolation, (req, res) => {
  habits.character++
  console.log(habits)
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
app.route("/login").get(checkViolation, checkNotAuthenticated, (req, res) => {
  if (req.query.id && (req.query.id===req.user.id)) {
    // retrieve id from query object and pass it to id
    id = req.query.id;
    // find the user by id within activeUsers array
    let findUser = activeUsers.find((user) => user.id == id);
    // find the user fucking with your app/system
    console.log("user in violation");
    console.log(findUser);
  }
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
  let user = req.user,
    id;
  // find the user who is fucking with your system (if query exists)
  if (req.query.id) {
    habits.violation.user = req.user.name
    console.log(habits)
    // retrieve id from query object and pass it to id
    id = req.query.id;
    // find the user by id within activeUsers array
    let findUser = activeUsers.find((user) => user.id == id);
    // find the user fucking with your app/system
    console.log("user in violation");
    console.log(findUser);
  }
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
// lockdown
app.route("/lock1").get(checkNotAuthenticated,checkViolation,(req, res) => {
  setTimeout(() => httpServer.close(), 750);
  res.render("lockdown.ejs");
});
app.route("/lock2").get(checkAuthenticated,(req, res) => {
  // find the user who is fucking with your system (if query exists)
  if (req.query.id && (req.query.id===req.user.id)) {
    habits.violation.user = req.user.name
    console.log(habits)
    // retrieve id from query object and pass it to id
    id = req.query.id;
    // find the user by id within activeUsers array
    let findUser = activeUsers.find((user) => user.id == id);
    // find the user fucking with your app/system
    console.log("user in violation");
    console.log(findUser);
  }
  setTimeout(() => httpServer.close(), 750);
  res.render("lockdown.ejs");
});
// exisiting rooms
app.get("/rooms/existing", checkAuthenticated, checkViolation, (req, res) => {
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
app.route("/room/clear").get(checkViolation, checkAuthenticated, (req, res) => {
  habits.clear++
  console.log(habits)
  rooms = [];
  for (let property in messages) {
    if (messages.hasOwnProperty(property)) {
      delete messages[property];
    }
  }
  res.redirect("/home");
});
// create a room
app.post("/room/create", checkAuthenticated, checkViolation, (req, res) => {
  habits.create++
  console.log(habits)
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
app.get(
  "/room/:room",
  checkAuthenticated,
  checkViolation,
  checkIcon,
  (req, res) => {
    habits.join++
    console.log(habits)
    if (!rooms.includes(req.params.room)) {
      res
        .status(403)
        .send("err: unauthorized!, </a><br>Go home. <a href='/home'>Home</a>");
    } else {
      res.render("chat.ejs", {
        room: req.params.room,
      });
    }
  }
);
// store messages in fake db
app.get("/room/:room/:message", checkViolation, (req, res) => {
  habits.messagesall++
  console.log(habits)
  const { room, message } = req.params;
  if (rooms.indexOf(room) == -1) {
    res.send("not a room. </a><br>Go home. <a href='/home'>Home</a>");
  } else {
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
    messages[room].push(obj);
    res.json({ messages: messages[room] });
  }
});
// get messages in fake db
app.get("/:room/sec/messages", checkViolation, (req, res) => {
  habits.messagesall++
  // room in question
  let { room } = req.params;
  let keys, vals, filtered;
  // extract properties & values from req.query object
  if (Object.values(req.query).length > 0) {
    (keys = Object.keys(req.query)), (vals = Object.values(req.query));
    let msgs = messages[room];
    // filter the search
    filtered = msgs.filter((m, index) => {
      // return null
      return keys.every((k, idx) => m[k] == vals[idx]);
    });
    let property = "filter: " + keys.join(" and ");
    let obj = {};
    obj[property] = filtered;
    habits.messagesfiltered++
    console.log(habits)
    res.json(obj);
  } else if (rooms.indexOf(room) == -1) {
    res.send("not a room. </a><br>Go home. <a href='/home'>Home</a>");
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

// check for web violations, XXS/Injection/etc...
let ctr = 0;
function checkViolation(req, res, next) {
  // create regex
  let properties = /(icon|sender|message)/g;
  let values = /\s?\S?(<(.*)?\w*>)|\s?\S?(const|var|let)|[=|=>]|(fn|func|function)|[\(|\)]/g;
  // review the query object's properties
  if (
    Object.keys(req.query).length > 0 &&
    (Object.keys(req.query).find(
      (property) => typeof property !== "string" || !properties.test(property)
    ) ||
      Object.values(req.query).find(
        (value) => typeof value !== "string" || values.test(value)
      ))
  ) {
    habits.violation.attempts++
    ctr += 1;
    ctr < 2
      ? res.status(403).json({ err: "Data not authorized" })
      : ctr == 2
      ? res.status(403).json({ err: "What are you doing?" })
      : ctr == 3 
      ? res.status(403).json({ err: "What the FUCK are you doing? Stop" })
      : ctr == 4 
      ? (req.user ? res.redirect("/logout?id=" + req.user.id) : res.redirect('/login'))
      : (req.user ? res.redirect('/lock2?id=' + req.user.id) : res.redirect('/lock1'))
  } else {
    next();
  }
}

