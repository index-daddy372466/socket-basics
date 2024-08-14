const LocalStrategy = require("passport-local").Strategy;

const Users = [
  {
    id: 1,
    name: "kyle",
    password: "kyle123",
  },
  {
    id: 2,
    name: "sam",
    password: "sam555",
  },
  {
    id: 3,
    name: "brock",
    password: "brock321",
  },
];

// get user by email
const getUserByName = (name) => {
  return Users.find((user) => user.name === name); // returns user object
};
// get user by id
const getUserById = (id) => {
  return Users.find((user) => user.id === id); // returns user object
};
function initialize(passport){
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField:'password',
        session: true,
      },
      (username, password, done) => {
        // authentication method
        const user = getUserByName(username);
        try {
          if (!user) {
            done(null, false, { message: "user not found" });
          }
          if (user.password !== password) {
            done(null, false, { message: "wrong password" });
          }
          delete user.password;
          const payload = { id: user.id, name: user.name };
          done(null, payload);
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
};

module.exports = initialize
