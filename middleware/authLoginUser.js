const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const verifyJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token not found" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // console.log(token);
    const decoded = await promisify(jwt.verify)(
      token,
      process.env.JWT_KEY,
      { ignoreExpiration: false } // verificar se o token está expirado
    );
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }
    console.error(error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = verifyJWT;
