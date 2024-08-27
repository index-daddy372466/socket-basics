const LocalStrategy = require("passport-local").Strategy;
const randomGen = require('./lib/randomGen.js')
function initialize(passport, activeUsers) {
  // get user by id
  const getUserById = (id) => {
    return activeUsers.find((user) => user.id === id); // returns user object
  };
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "username",
        passReqField: true,
        session: true,
      },
      async (username, _, done) => {
        // authentication method
        try {
          if (!username) {
            done(null, false, { message: "user not found" });
          } else {
            let hash = randomGen(1);
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
