import { validateUserToken } from "../utils/token.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */

export function authenticationMiddleware(req, res, next) {
  // check if the request has an authorization header
  const authHeader = req.headers["authorization"];

  // if the authorization header is not present, call the next middleware
  if (!authHeader) return next();

  if (!authHeader.startsWith("Bearer")) {
    return res
      .status(400)
      .json({ error: "Authorization header must start with Bearer" });
  }

  const [_, token] = authHeader.split(" "); // split the authorization header into the Bearer and the token

  const payload = validateUserToken(token);

  req.user = payload; // attach the payload to the request object

  next(); // call the next middleware
}

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 *
 * @returns {import("express").Response} The response object
 */

// This middleware function checks if the user is authenticated by verifying the presence of a valid user ID in the request object. If the user is not authenticated, it returns a 401 Unauthorized response. Otherwise, it calls the next middleware in the stack.
export function ensureAuthenticated(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "You must be logged in to access this resource" });
  }
  next();
}
