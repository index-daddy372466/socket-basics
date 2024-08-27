const { createProxyMiddleware } = require("http-proxy-middleware"),
// docker = "http://localhost:6786"
docker = "http://localhost:9998"


// configure proxy for Authentication Server (docker container)
function proxyAuthentication(app){
// pull home, login & logout routes from authentication server

}

module.exports.proxyAuthentication = proxyAuthentication