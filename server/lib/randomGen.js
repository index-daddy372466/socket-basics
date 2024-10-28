const { createHash } = require('crypto')

module.exports = function createId(id){
  // const cipher = createCipheriv("aes-256-gcm", key, salt);
  // const encryptId = cipher.update(id, "utf-8", "hex") + cipher.final("hex");
  // return encryptId;
  const hash = createHash('sha1').update(id).digest('hex')
  // console.log('hash')

  return hash
}; 