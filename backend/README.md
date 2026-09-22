# CloudFileStorageApp Backend

Express and Mongoose API scaffold for CloudFileStorageApp.

Run `npm install`, copy `.env.example` to `.env`, and start with `npm run dev` or `npm start`.



## Auth endpoints (B1 — done)
| Endpoint | Method | Auth | Description |

| /api/auth/register | POST | No | Create account |
| /api/auth/login | POST | No | Log in, returns JWT |
| /api/auth/me | GET | Bearer token | Get logged-in user |

## Shared helpers
- `utils/apiResponse.js` — use for all responses
- `middleware/authMiddleware.js` — protects routes, sets `req.user`
- `models/User.js` — has `user.matchPassword(password)`

## Status
B1 complete and tested.