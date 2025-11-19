# Admin User Management Scripts

This directory contains utility scripts for managing admin users in the MongoDB database.

## create-admin.js

Creates admin users in the MongoDB database.

### Usage:

```bash
# Run from project root
node scripts/create-admin.js
```

### Default Admin Users Created:

1. **Username**: `admin`
   - Password: `Admin@2025`
   - Email: `admin@allelectronic.com`
   - Role: admin

2. **Username**: `shyampunk76`
   - Password: `SecurePass123!`
   - Email: `shyampunk76@allelectronic.com`
   - Role: admin

### Customization:

Edit the `adminUsers` array in `create-admin.js` to add/modify users:

```javascript
const adminUsers = [
  {
    username: 'your_username',
    password: 'your_password',
    email: 'your_email@domain.com',
    role: 'admin', // or 'moderator'
    isActive: true
  }
];
```

### Notes:

- Script will skip users that already exist
- Passwords are stored as plain text (use bcrypt for production)
- Requires `.env` file with `MONGODB_URI` configured
- Script automatically closes connection after completion

### Security Warning:

⚠️ **Change default passwords immediately after first login!**
⚠️ **For production, implement password hashing with bcrypt**
