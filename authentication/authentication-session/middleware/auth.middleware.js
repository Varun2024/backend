import jwt from "jsonwebtoken";

export const autheticationMiddleware = async function (req, res, next) {
  try {
    // for stateful
    // const sessionId = req.headers["session-id"];

    // jwt
    const tokenHeader = req.headers["authorization"];
    if (!tokenHeader) {
      return next();
    }
    if (!tokenHeader.startsWith("Bearer")) {
      return res
        .status(400)
        .json({ error: "auth header must start with Bearer" });
    }

    // Breaks the tokenHeader string into a list of words, separating them wherever there is a space.[1] extracts the second item from an array which is the auth token
    const token = tokenHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    next();
  }
};

export const ensuredAuthenticated = async function (req, res, next) {
  if (!req.user) {
    return res.status(401).json({error: "You must be authenticated to acces"})
  }
  next()
}

// closure fucntion example :  When  restrictToRole executes, it returns the inner anonymous function and completes its lifecycle. Normally, role would vanish. But because the returned function forms a closure, it holds a permanent reference to role, allowing it to keep updating the same value across multiple distinct calls.
export const restrictToRole = function (role) {
  return function(req, res, next) {
    if (req.user.role !== role) {
      return res.status(401).json({error: 'You are not authorized'})
    }
    return next()
  }
}


