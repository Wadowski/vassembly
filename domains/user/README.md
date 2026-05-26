# `@vassembly/user`

## Admin Bootstrap

After deploying the DB-backed authorization security fix, you must configure initial admin users in MongoDB.

### Setting Up Admin Users

Admin access is now verified against the `users` collection's `role` field. New users default to `role: 'user'`. To grant admin access:

#### Option 1: MongoDB Client (One-time)

Connect to your MongoDB instance and update users:

```javascript
db.users.updateOne(
  { _id: ObjectId("<user-id>") },
  { $set: { role: "admin" } }
);
```

#### Option 2: Bulk Update for Known Users

```javascript
db.users.updateMany(
  { email: { $in: ["admin1@example.com", "admin2@example.com"] } },
  { $set: { role: "admin" } }
);
```

### Verifying Admin Access

After setting roles, test that admin endpoints work:

```bash
# Get admin user's auth token (requires login with correct password)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Use token to call admin-only endpoint
curl -X GET http://localhost:3000/system-agents \
  -H "Authorization: Bearer <token>"
```

If you get `403 Forbidden`, verify:
1. User's `role` field is set to `"admin"` in MongoDB
2. Token was generated after role was set (re-login if needed)
3. Auth service picked up role from DB (check logs)

### Authorization Layer

The new authorization system:
- **Verifies JWT** with `userId` claim (no longer trusts `role` claim)
- **Checks DB** via `domains/user/queries/assertHasRole` to confirm actual user role
- **Throws 403** if role doesn't match requirements (avoids user enumeration)

### Security Notes

- **Never ship hardcoded roles** in code
- **Always verify via DB** at request time (done automatically)
- **Roles are case-sensitive** (`"admin"` vs `"Admin"` are different)
- **Default is USER** if field is missing
