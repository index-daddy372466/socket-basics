module.exports = randomGen = (l) => {
    let randoms = [];
    let salt = 11;
    let chars = [...new Array(127).fill("")]
      .map((x, i) => String.fromCharCode(i + [30,60,90,120,150,180,210,240,270,300][Math.floor(Math.random()*10)]))
      .filter((j, idx) => idx > 32 || !/s*/g.test(j));
    let gen = () => chars[Math.floor(Math.random() * chars.length)];
    while (salt > l) {
      randoms.unshift(gen());
      salt--;
    }
    return randoms.join``;
  };