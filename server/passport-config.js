const LocalStrategy = require("passport-local").Strategy;
const crypto = require('crypto')
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
  {
    id: 4,
    name: "josh",
    password: "josh0",
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
        session: true,
      },
      (username, password, done) => {
    
        // authentication method
        try {
        const user = getUserByName(username);
          if (!user) {
            done(null, false, { message: "user not found" });
          }
          else if (user.password !== password) {
            console.log('wrong password')
            done(null, false, { message: "wrong password" });
          }
        else{
          user.password = crypto.hash('sha1',password)
          const payload = { id: user.id, name: user.name, password:user.password };
          console.log('login success')
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
};
module.exports = initialize

