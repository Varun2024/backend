# Authentication 01: Token-in-a-Diary

> One-sentence hook: the simplest possible token-based auth, built with a plain in-memory object — so you can see what a "session" actually is before frameworks hide it.

## What is this?

A tiny Express app that implements a homemade authentication flow with three routes:

1. `POST /signup` — accept name/email/password, generate a token, remember the user under that token.
2. `POST /me` — given a token, return the stored user info.
3. `POST /private-data` — given a valid token, return "access granted".

The "database" is a plain JavaScript object called `DIARY` mapping `token → user`. There are no cookies, no JWT, no sessions library, no password hashing. Everything is manual and in memory. That's the point: to see the moving parts.

## Why it matters

Every real auth system boils down to the same three questions:

1. Who is this user? (identification — signup / login)
2. How do they prove they're still that user on later requests? (token, cookie, session id)
3. What are they allowed to do? (authorization)

Once you've built the naive version, `express-session`, JWT, Passport, and OAuth all become "the same idea with better security guarantees".

## The code in this folder

`index.js`:

```js
import express from 'express';

const app = express();
app.use(express.json());

const DIARY = {};           // token -> { name, email, password }
const EMAILS = new Set();   // to prevent duplicate signups

app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (EMAILS.has(email)) {
    res.status(400).json({ message: 'Email already exists' });
  }
  const token = `${Date.now()}`;
  DIARY[token] = { name, email, password };
  EMAILS.add(email);
  return res.status(201).json({ message: 'User created successfully', token });
});

app.post('/me', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Token is required' });
  if (!(token in DIARY)) return res.status(400).json({ message: 'Invalid token' });
  const entry = DIARY[token];
  return res.status(200).json({ message: 'User details fetched successfully', entry });
});

app.post('/private-data', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Token is required' });
  if (!(token in DIARY)) return res.status(400).json({ message: 'Invalid token' });
  return res.json({ data: 'access granted to private data' });
});

app.listen(8000, () => { console.log('Server is running on port http://localhost:8000'); });
```

Notice:

- `"type": "module"` in `package.json` — that's why `import` works.
- `express.json()` middleware parses JSON request bodies into `req.body`.
- `token = ${Date.now()}` — a millisecond timestamp. Predictable, guessable, and reusable across users if they sign up on the same ms. Real systems use `crypto.randomUUID()` or signed JWTs.
- `DIARY[token] = { ..., password }` — storing the plaintext password. Never do this in a real app. Hash with bcrypt/argon2.
- The duplicate-email check has a bug: it sends a 400 but doesn't `return`, so execution falls through and the signup succeeds anyway. See "Try this next".

## Run it

```bash
npm install
npm start
```

Then in another terminal:

```bash
# Sign up
curl -X POST -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@x.com","password":"pw"}' \
  http://localhost:8000/signup
# -> { "message": "User created successfully", "token": "1731..." }

# Fetch profile
curl -X POST -H 'Content-Type: application/json' \
  -d '{"token":"1731..."}' \
  http://localhost:8000/me

# Access protected route
curl -X POST -H 'Content-Type: application/json' \
  -d '{"token":"1731..."}' \
  http://localhost:8000/private-data
```

## Try this next

1. **Fix the fall-through bug.** Add `return` before the 400 response in `/signup`. Retry signing up the same email — the second attempt should now cleanly fail.
2. **Extract an `authMiddleware`.** Both `/me` and `/private-data` duplicate the token check. Move it to `app.use` middleware that sets `req.user = DIARY[token]`.
3. **Hash the password.** `npm i bcrypt` and store `await bcrypt.hash(password, 10)` instead of plaintext. Add a `/login` route that verifies with `bcrypt.compare`.

## Gotchas

- **In-memory state resets on every restart.** `DIARY` is a plain object — every crash wipes all users. A real app needs a database.
- **Tokens never expire.** `DIARY[token]` lives forever. Real tokens should have a TTL and be revocable.
- **Plaintext passwords.** Never store passwords as-is. This example does it only to keep the code visible; step 3 above fixes it.
- **Tokens in the request body.** Real APIs use the `Authorization: Bearer <token>` header (see the sibling `authentication-session` folder for that pattern).
- **No HTTPS.** Sending a token over plain HTTP means anyone on the network can steal it. Always use TLS in production.
