module.exports = habits = {
  // query

  // create a room
  create:0,
  // home page hits
  home: 0,
  // leaving room hits
  leave: 0,
  // join room hits
  join: 0,
  // clear room hits
  clear: 0,

  violation:{
    attempts:0,
    user:undefined,
  },
  // violation hits
  sendmessage: 0, 
  // send message hits (post)
  messagesall: 0,
  //all messages hits (read)
  messagesfiltered: 0,
  // filtering through messages hits
  character: 0,
  // choose character hits
};
