# Quick Fix Guide: Password Security

This guide shows exactly what needs to be changed to implement secure password hashing.

## Files to Modify

### 1. Update `scripts/create-admin.js`

Add bcrypt hashing when creating users:

```javascript
// At the top of the file, add:
const bcrypt = require('bcryptjs');

// In the loop where users are created, replace:
// const newUser = new AdminUser(userData);

// With:
const hashedPassword = await bcrypt.hash(userData.password, 10);
const newUser = new AdminUser({
  ...userData,
  password: hashedPassword
});
```

**Full replacement for lines 50-60:**

```javascript
// Hash the password before creating the user
const hashedPassword = await bcrypt.hash(userData.password, 10);

// Create new user with hashed password
const newUser = new AdminUser({
  username: userData.username,
  password: hashedPassword,
  email: userData.email,
  role: userData.role,
  isActive: userData.isActive
});

await newUser.save();
console.log(`✅ Created user "${userData.username}" with role "${userData.role}"`);
```

---

### 2. Update `api/admin/login.js`

Replace plain text comparison with bcrypt:

```javascript
// At the top of the file, add:
const bcrypt = require('bcryptjs');

// Replace lines 36-40:
// if (adminUser.password !== password) {
//   console.log('Invalid password for user:', username);
//   return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
// }

// With:
const isValidPassword = await bcrypt.compare(password, adminUser.password);
if (!isValidPassword) {
  console.log('Invalid password for user:', username);
  return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
}
```

---

### 3. Update `api/admin/change-password.js`

If you're changing passwords, hash them:

```javascript
// Add at top:
const bcrypt = require('bcryptjs');

// When updating password, hash it first:
const hashedPassword = await bcrypt.hash(newPassword, 10);
user.password = hashedPassword;
await user.save();
```

---

### 4. Update `api/admin/user-management.js`

When creating new users via admin panel:

```javascript
// Add at top:
const bcrypt = require('bcryptjs');

// Before creating AdminUser:
const hashedPassword = await bcrypt.hash(password, 10);
const newUser = new AdminUser({
  username,
  password: hashedPassword,
  email,
  role
});
```

---

## Testing After Changes

1. **Delete existing admin users** (they have plain text passwords):
   ```javascript
   // Connect to MongoDB
   await mongoose.connect(process.env.MONGODB_URI_NEW);
   await mongoose.connection.collection('adminusers').deleteMany({});
   ```

2. **Create new admin user** with hashed password:
   ```bash
   node scripts/create-admin.js
   ```

3. **Test login** at `/admin.html`:
   - Username: `Admin`
   - Password: `Passw0rd`

4. **Verify password is hashed** in database:
   - Should start with `$2a$` or `$2b$`
   - Should be 60 characters long
   - Should NOT be readable plain text

---

## Quick Implementation Script

Want to apply all fixes at once? Let me know and I can apply these changes automatically!

## Verification

After implementing, verify by:
1. Creating a new admin user
2. Checking the password in MongoDB (should be hashed)
3. Logging in successfully
4. Ensuring old plain-text passwords no longer work

---

*Note: bcryptjs is already installed in package.json, so no additional dependencies needed!*
