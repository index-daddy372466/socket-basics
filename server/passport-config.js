const LocalStrategy = require("passport-local").Strategy;
const crypto = require("crypto");
const randomGen = () => {
  let randoms = [];
  let salt = 11;
  let chars = [...new Array(127).fill("")]
    .map((x, i) => String.fromCharCode(i + 127))
    .filter((j, idx) => idx > 32);
  let gen = () => chars[Math.floor(Math.random() * chars.length)];
  while (salt > 0) {
    randoms.push(gen());
    salt--;
  }
    return randoms.join``;
};

function initialize(passport, activeUsers) {
  // get user by id
  const getUserById = (id) => {
    return activeUsers.find((user) => user.id === id); // returns user object
  };
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        session: true,
      },
      async (username, password, done) => {
        // authentication method
        try {
          if (!username) {
            done(null, false, { message: "user not found" });
          } else {
            let hash = randomGen()
            const payload = { id: hash, name: username };
            console.log(payload);
            activeUsers.push(payload);
            console.log("login success");
            done(null, payload);
          }
        } catch (err) {
          throw new Error(err);
        }
      }
    )
  );

  // serialize/deserialize
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((user, done) => {
    let id = getUserById(user.id);
    let userObj = id;
    done(null, userObj);
  });
}
module.exports = initialize;
