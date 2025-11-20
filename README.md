# All Electronic - Repair Service Management System

A comprehensive web application for managing electronic and appliance repair requests with secure admin access, built with Node.js, Express, and MongoDB.

## 🚀 Features

### Customer Features
- **Online Repair Request Submission** - Easy-to-use form for customers
- **Service Category Selection** - Kitchen Appliances, Washing Machines, HVAC, Electronics
- **Real-time Form Validation** - Email, phone, and field validation
- **Character Counter** - Track issue description length (500 chars max)
- **Responsive Design** - Works on desktop and mobile devices

### Admin Features
- **Secure Authentication** - JWT tokens with bcrypt password hashing
- **Role-Based Access Control** - Admin and User roles with different permissions
- **Repair Request Management** - View, edit, and delete requests
- **Manual Entry** - Add repair requests directly from admin console
- **Status Tracking** - Pending, In-Progress, Completed, Cancelled
- **Payment Management** - Payment-Pending, Processing, Paid
- **Export Functionality** - Export to Excel (.xlsx) and PDF formats
- **User Management** - Create, edit, and delete staff users (Admin only)
- **Password Security** - Change password with current password verification
- **Data Table Features** - Sortable, paginated, with column filtering

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js v14+, Express.js v5.1.0
- **Database**: MongoDB Atlas with Mongoose ODM v7.5.0
- **Authentication**: JWT (jsonwebtoken v9.0.0), bcryptjs v2.4.3
- **Deployment**: Vercel Serverless Functions
- **Export Libraries**: SheetJS (xlsx v0.18.5), jsPDF v2.5.1

## 📁 Project Structure

```
allelectronic/
├── api/                          # Serverless API endpoints
│   ├── admin/                    # Admin-specific endpoints
│   │   ├── change-password.js    # Password management
│   │   ├── delete-requests.js    # Bulk delete requests
│   │   ├── login.js              # Admin authentication
│   │   ├── repair-request.js     # Admin request operations
│   │   ├── requests.js           # Fetch all requests
│   │   ├── update-status.js      # Update status/payment
│   │   └── user-management.js    # User CRUD operations
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── health.js                 # Health check endpoint
│   ├── index.js                  # API info endpoint
│   └── repair-request.js         # Public repair request submission
├── models/                       # Mongoose database models
│   ├── AdminUser.js              # Admin user schema
│   └── RepairRequest.js          # Repair request schema
├── scripts/                      # Utility scripts
│   ├── check-collections.js      # Database inspection
│   ├── create-admin.js           # Create admin users
│   ├── list-admins.js            # List all admins
│   └── README.md                 # Scripts documentation
├── admin.html                    # Admin dashboard UI
├── admin.css                     # Admin styles
├── admin.js                      # Admin functionality (1500+ lines)
├── index.html                    # Customer-facing page
├── styles.css                    # Public page styles
├── script.js                     # Public page functionality
├── db.js                         # MongoDB connection handler
├── test-server.js                # Local development server
├── package.json                  # Dependencies and scripts
├── vercel.json                   # Vercel deployment config
└── .gitignore                    # Git ignore rules
```

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v14 or higher
- MongoDB Atlas account (free tier works)
- Git
- Vercel account (for deployment)

### Local Development Setup

1. **Clone the repository:**
```bash
git clone https://github.com/shyampunk76-debug/allelectronic.git
cd allelectronic
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create `.env` file in the root directory:**
```env
MONGODB_URI_NEW=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret_key
NODE_ENV=production
```
Replace with your actual MongoDB Atlas connection string and a secure random JWT secret (minimum 32 characters).

4. **Create an admin user:**
```bash
node scripts/create-admin.js
```
Follow the prompts to create your first admin account.

5. **Test locally:**
```bash
node test-server.js
```
Visit `http://localhost:3001` in your browser.

### Deployment to Vercel

1. **Install Vercel CLI (optional):**
```bash
npm install -g vercel
```

2. **Connect GitHub repository to Vercel:**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Configure project settings

3. **Add environment variables in Vercel dashboard:**
   - `MONGODB_URI_NEW` - Your MongoDB connection string
   - `JWT_SECRET` - Random secure string (32+ characters)
   - `NODE_ENV` - Set to `production`

4. **Deploy:**
   - Push to main branch for automatic deployment
   - Or use `vercel --prod` from CLI

## 📖 Usage Guide

### Customer Portal (index.html)
1. Navigate to the homepage
2. Fill out the repair request form:
   - Name, Email, Phone (required)
   - Service Category (optional)
   - Product/Appliance Name (required)
   - Issue Description (required, max 500 chars)
3. Click "Submit Request"
4. Receive confirmation message

### Admin Console (admin.html)

**Login:**
1. Click "Login" button on homepage
2. Enter credentials (username and password)
3. Redirected to Admin or User Console based on role

**Admin Role Capabilities:**
- ✅ View all repair requests in sortable table
- ✅ Add requests manually via form
- ✅ Update status (Pending, In-Progress, Completed, Cancelled)
- ✅ Update payment status (Payment-Pending, Processing, Paid)
- ✅ Export selected requests (Excel/PDF)
- ✅ Manage users (create, edit roles, reset passwords, delete)
- ✅ Change own password
- ✅ Delete single or bulk requests

**User Role Capabilities:**
- ✅ View all repair requests
- ✅ Update status and payment
- ✅ Export requests
- ✅ Change own password
- ❌ Cannot manage users
- ❌ Cannot delete requests

## 🔒 Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Authentication**: 8-hour token expiration
- **Role-Based Access Control**: Admin vs User permissions
- **CORS Configuration**: Enabled for API endpoints
- **Environment Variables**: Sensitive data stored securely
- **Password Validation**: Minimum 4 characters (configurable)
- **Current Password Verification**: Required for password changes
- **Secure Headers**: Content-Type and Authorization headers

## 📡 API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/repair-request` | Submit new repair request |
| GET | `/api/health` | Health check status |
| GET | `/api/` | API information |

### Admin Endpoints (Requires JWT Token)
| Method | Endpoint | Description | Admin Only |
|--------|----------|-------------|------------|
| POST | `/api/admin/login` | Authenticate user | No |
| GET | `/api/admin/requests` | Get all requests | No |
| POST | `/api/admin/repair-request` | Create request manually | No |
| PUT | `/api/admin/update-status` | Update status/payment | No |
| DELETE | `/api/admin/delete-requests` | Delete requests | Yes |
| POST | `/api/admin/change-password` | Change own password | No |
| GET | `/api/admin/user-management` | List all users | Yes |
| POST | `/api/admin/user-management` | Create new user | Yes |
| PUT | `/api/admin/user-management` | Update user role/password | Yes |
| DELETE | `/api/admin/user-management` | Delete user | Yes |

## 🗄️ Database Schema

### AdminUser Collection
```javascript
{
  username: String,         // Required, unique
  password: String,         // Required, bcrypt hashed
  email: String,            // Optional, unique if provided
  role: String,             // 'admin' or 'user'
  isActive: Boolean,        // Default: true
  createdAt: Date,          // Auto-generated
  updatedAt: Date,          // Auto-updated
  createdBy: String,        // Username who created this user
  lastPasswordChange: Date  // Timestamp of last password change
}
```

### RepairRequest Collection
```javascript
{
  id: String,              // Unique: REP-{timestamp}-{random}
  name: String,            // Required
  email: String,           // Required
  phone: String,           // Required
  serviceType: String,     // Optional: Kitchen, Washing, HVAC, Electronics
  product: String,         // Required
  issue: String,           // Required
  status: String,          // Default: 'pending'
  payment: String,         // Default: 'payment-pending'
  createdAt: Date,         // Auto-generated
  updatedAt: Date          // Auto-updated
}
```

## 🔧 Utility Scripts

Located in `/scripts` directory:

```bash
# Create a new admin user
node scripts/create-admin.js

# List all admin users in database
node scripts/list-admins.js

# Check database collections and counts
node scripts/check-collections.js
```

## 🌐 Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `MONGODB_URI_NEW` | MongoDB connection string | Yes | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT signing | Yes | `random-32-char-string` |
| `NODE_ENV` | Environment mode | No | `production` or `development` |

## 📦 Dependencies

### Production Dependencies
- `bcryptjs` v2.4.3 - Password hashing
- `cors` v2.8.5 - Cross-Origin Resource Sharing
- `dotenv` v16.0.3 - Environment variable management
- `express` v5.1.0 - Web framework
- `jsonwebtoken` v9.0.0 - JWT authentication
- `mongoose` v7.5.0 - MongoDB ODM

### Frontend Libraries (CDN)
- `xlsx` v0.18.5 - Excel export
- `jspdf` v2.5.1 - PDF generation
- `jspdf-autotable` v3.5.31 - PDF table formatting

## 🎨 UI Features

### Data Table
- Sortable columns
- Pagination (10, 25, 50, 100 items per page)
- Bulk selection with checkboxes
- Inline editing for status and payment
- Hover effects for better UX
- Responsive horizontal scrolling
- Color-coded status rows
- Expandable issue descriptions

### Export Features
- Excel (.xlsx) with formatted headers and column widths
- PDF (landscape A4) with page numbers and styling
- Export selected rows only
- Timestamp in filename

## 🐛 Troubleshooting

### Common Issues

**Problem**: Cannot connect to MongoDB  
**Solution**: Check `MONGODB_URI_NEW` in `.env`, ensure IP whitelist in MongoDB Atlas

**Problem**: Login fails with correct credentials  
**Solution**: Ensure passwords are bcrypt hashed, recreate user with `create-admin.js`

**Problem**: JWT token invalid  
**Solution**: Verify `JWT_SECRET` matches between server and Vercel, check token expiration

**Problem**: Changes not reflecting on live site  
**Solution**: Ensure code is pushed to GitHub, check Vercel deployment logs

## 📝 License

This project is proprietary software owned by **All Electronic**.  
All rights reserved. Unauthorized copying or distribution is prohibited.

## 👥 Support & Contact

For technical support, bug reports, or feature requests:
- **GitHub Issues**: https://github.com/shyampunk76-debug/allelectronic/issues
- **Developer**: Shyam Shah (@shyampunk76-debug)

---

**Version**: 2.0.0  
**Last Updated**: November 20, 2025  
**Status**: Production Ready ✅
