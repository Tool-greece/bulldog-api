const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function(req, res, next) {
  //get token from header
  const token = req.header("x-auth-token");

  //if no token
  if (!token) {
    return res.status(403).json({errors: [{msg: "no token, authorization denied "}]});
  }

  //Verify
  try {
    const decoded = jwt.verify(token, config.get("jwtSecret"));

    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({errors: [{msg: "Invalid token" }]});
  }
};
