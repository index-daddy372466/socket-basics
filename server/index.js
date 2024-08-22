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
const fs = require("fs");

const MemoryStore = require("memorystore")(session);
const { setMaxListeners } = require("events");
const socketIoStart = require("./socketio.js");

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

app.set("views", path.resolve(__dirname, "../client/public/views"));
app.set("view engine", "ejs");
initializePassport(passport);
// pass static html/css
// app.use(express.static("client/public"));
app.use(express.json());
app.use(cookieParser());
setMaxListeners(20);
app.use(sessionMiddleware);
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
io.engine.use(sessionMiddleware);
// cursewords from wiki page
let cursewords = [];
// home (conditional)
app.route("/").get((req, res) => {
  // let readWiki = fs.readFileSync(
  //   path.resolve(__dirname, "../client/public/views/wiki.ejs"),
  //   { encoding: "utf-8" }
  // );
  // console.log(readWiki);
  if (req.isAuthenticated()) {
    res.redirect("/home");
  } else {
    res.redirect("/login");
  }
});

// home page GET
// app.route('/home').get(checkAuthenticated, (req,res)=>{
// res.render('home.ejs')
// })
app.route("/home").get((req, res) => {
  res.render("home.ejs");
});

// spawn wiki by writing file from url
app.get("/wiki/write", async (req, res) => {
  // testing to write a clone files from wikipedia page swear words
  try {
    let filename = "/wiki.ejs";
    let file = await fetch(
      "https://en.wiktionary.org/wiki/Category:English_swear_words"
    )
      .then((r) => r.text())
      .then((d) => {
        return d;
      });
    console.log(
      fs.existsSync(
        path.resolve(__dirname, "../client/public/views/" + filename)
      )
    );
    if (
      !fs.existsSync(
        path.resolve(__dirname, "../client/public/views/" + filename)
      )
    ) {
      fs.writeFileSync(
        Buffer.from(
          path.resolve(__dirname, "../client/public/views/" + filename)
        ),
        file,
        { encoding: "utf-8" }
      );
    }
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});
// wiki page GET
// if wiki file exists
app.route("/wiki/clone").get((req, res) => {
  res.render("wiki.ejs");
});
// post curse words
app.post("/wiki/curse", (req, res) => {
  const { words } = req.body; // array of curse words
  console.log(words);
  if (words.length < 1) {
    res.json({ words: "no words" });
  } else {
    if (cursewords.length < 1) {
      cursewords.push(...words);
      cursewords = cursewords.slice(1, cursewords.length);
    }
    res.json({ words: cursewords.flat() });
  }
});

// get curse words
app.get("/wiki/curse", (req, res) => {
  res.json({
    words: cursewords.length < 1 ? "nothing here" : cursewords.flat(),
  });
});

// chat page GET
app.route("/chat").get(checkAuthenticated, (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/public/chat.html"));
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
  req.logout(() => {
    res.redirect("/");
  });
  console.log(req.user);
});
let rooms = [];

// clear rooms
app.route('/rooms/clear').get((req,res)=>{
  rooms = [];
  res.redirect('/home')
})
// create a room
app.post("/create/room", (req, res) => {
  const { room } = req.body;
  console.log("room on post");
  console.log(room);
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

// exisiting rooms
app.get("/room/exisiting", (req, res) => {
  let roomData = [...rooms];
  if (rooms.length < 1) {
    res.json({ room: "no data" });
  } else {
    res.json({ room: roomData });
  }
});

app.get("/room/:room", (req, res) => {
  if (!rooms.includes(req.params.room)) {
    res.status(403).json({ err: "unauthorized!" });
  } else {
    res.json({ room: req.params.room });
  }
});

// socket io
socketIoStart(io);

// app listen
app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

// server listen
// server.listen(PORT, () => {
//   console.log(connection);
// });
