# All Electronic - Repair Service Management System

![Status](https://img.shields.io/badge/status-production-brightgreen)
![Node.js](https://img.shields.io/badge/node.js-v18+-green)
![MongoDB](https://img.shields.io/badge/mongodb-atlas-green)
![Vercel](https://img.shields.io/badge/vercel-deployed-black)

A professional web application for managing home appliance and electronics repair service requests with a secure admin dashboard.

## 🚀 Features

### Customer Portal
- **Repair Request Form**: Easy-to-use form for submitting repair requests
- **Service Categories**: Kitchen appliances, Washing machines, HVAC, Electronics
- **Real-time Validation**: Client-side form validation with helpful error messages
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop

### Admin Dashboard
- **Secure Authentication**: Database-driven login system with JWT tokens
- **Request Management**: View, search, and manage all repair requests
- **Status Updates**: Update repair status (pending, in-progress, completed, cancelled)
- **Payment Tracking**: Track payment status (payment-pending, processing, paid)
- **Search & Filter**: Find requests by ID, customer name, or email
- **Pagination**: Efficient handling of large request lists

## 🏗️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js with Vercel Serverless Functions
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Deployment**: Vercel

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/shyampunk76-debug/allelectronic.git
   cd allelectronic
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB Atlas**
   - Create a MongoDB Atlas cluster
   - Create a database named `allelectronic`
   - Add your IP address to Network Access (or allow 0.0.0.0/0 for testing)
   - Get your connection string

4. **Configure environment variables**
   
   Create a `.env` file (for local testing only):
   ```env
   MONGODB_URI_NEW=mongodb+srv://username:password@cluster.mongodb.net/allelectronic?retryWrites=true&w=majority
   JWT_SECRET=your-secure-random-string
   NODE_ENV=development
   ```
   
   **Important**: Never commit `.env` to git. It's already in `.gitignore`.

5. **Create admin user**
   ```bash
   node scripts/create-admin.js
   ```
   
   This creates an admin user:
   - Username: `Admin`
   - Password: `Passw0rd`

6. **Run local test server**
   ```bash
   node test-server.js
   ```
   
   Visit: `http://localhost:3001`

## 🌐 Deployment to Vercel

### 1. Deploy to Vercel
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel --prod
   ```

### 2. Configure Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

**MONGODB_URI_NEW**:
```
mongodb+srv://username:password@cluster.mongodb.net/allelectronic?retryWrites=true&w=majority
```
⚠️ **Important**: URL-encode special characters in password (e.g., `@` becomes `%40`)

**JWT_SECRET**:
```
your-secure-random-string-here
```
💡 Generate one: `openssl rand -hex 32`

**NODE_ENV**:
```
production
```

### 3. Redeploy after setting environment variables

## 📁 Project Structure

```
allelectronic/
├── index.html              # Customer-facing repair request page
├── admin.html              # Admin dashboard
├── script.js               # Customer page functionality
├── admin.js                # Admin dashboard functionality
├── styles.css              # Main styles
├── admin.css               # Admin dashboard styles
├── db.js                   # MongoDB connection handler
├── test-server.js          # Local development server
├── package.json            # Dependencies
├── vercel.json             # Vercel configuration
│
├── api/                    # Vercel serverless functions
│   ├── health.js           # Health check endpoint
│   ├── repair-request.js   # Submit repair requests
│   ├── admin/
│   │   ├── login.js        # Admin authentication
│   │   ├── requests.js     # List all requests (paginated)
│   │   ├── repair-request.js # Get single request
│   │   └── update-status.js  # Update request status
│   └── middleware/
│       └── auth.js         # JWT authentication middleware
│
├── models/
│   ├── AdminUser.js        # Admin user schema
│   └── RepairRequest.js    # Repair request schema
│
└── scripts/
    ├── create-admin.js     # Create admin users
    ├── list-admins.js      # List all admin users
    └── check-collections.js # Check database collections
```

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/health` | Health check | No |
| `POST` | `/api/repair-request` | Submit new repair request | No |
| `POST` | `/api/admin/login` | Admin login (returns JWT) | No |
| `POST` | `/api/admin/requests` | Get all requests (paginated) | Yes |
| `POST` | `/api/admin/repair-request` | Get single request details | Yes |
| `POST` | `/api/admin/update-status` | Update request status/payment | Yes |

## 🗄️ Database Schema

### Admin Users Collection (`adminusers`)
```javascript
{
  username: String (unique),
  password: String,
  email: String (unique),
  role: String (enum: ['admin', 'moderator']),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Repair Requests Collection (`repairrequests`)
```javascript
{
  id: String (unique, e.g., "REP-1731234567890"),
  name: String,
  email: String,
  phone: String,
  product: String,
  issue: String,
  serviceType: String (nullable),
  status: String (enum: ['pending', 'in-progress', 'completed', 'cancelled']),
  payment: String (enum: ['payment-pending', 'processing', 'paid']),
  createdAt: Date,
  updatedAt: Date
}
```

## 🛠️ Utility Scripts

### Create Admin User
```bash
node scripts/create-admin.js
```

### List All Admins
```bash
node scripts/list-admins.js
```

### Check Database Collections
```bash
node scripts/check-collections.js
```

## 🔒 Security

- ✅ JWT-based authentication with 8-hour token expiration
- ✅ Password stored in database (not environment variables)
- ✅ CORS enabled for cross-origin requests
- ✅ Input validation on both client and server
- ✅ Environment variables for sensitive data
- ✅ MongoDB connection string with secure credentials

## 📝 Admin Access

**Default Admin Credentials** (created by `create-admin.js`):
- Username: `Admin`
- Password: `Passw0rd`

⚠️ **Change the password after first login for production use!**

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

MIT License

---

**Developed by Shyampunk76** | [GitHub](https://github.com/shyampunk76-debug/allelectronic)