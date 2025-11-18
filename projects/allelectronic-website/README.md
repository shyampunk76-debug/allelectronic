# All Electronic - Repair Request Website

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Node.js](https://img.shields.io/badge/node.js-25.2.1-green)
![GitHub](https://img.shields.io/badge/github-integrated-blue)

A professional web application for managing home appliance and electronics repair service requests with an admin dashboard.

## 🚀 Quick Start

```bash
# Navigate to this project
cd projects/allelectronic-website

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your MongoDB URI and credentials

# Start development server
npm run dev
# OR for local testing
node test-server.js
```

## 📋 Features

- **Modern, Responsive Design**: Mobile-friendly interface with smooth animations
- **Repair Request Form**: Captures customer information with real-time validation
  - Name, Email, Phone, Product Details, Issue Description
  - Service Categories (Kitchen, Washing Machines, HVAC, Electronics)
  - Form validation and error messages
  
- **Admin Dashboard**: Secure admin console for managing requests
  - View all repair requests with pagination
  - Search by ID, customer name, or email
  - Update repair and payment status
  - JWT-based authentication (8-hour token expiration)

- **MongoDB Integration**: Persistent storage for requests and admin credentials
  - Repair requests collection
  - Admin users collection with role-based access

## 🏗️ Project Structure

```
allelectronic-website/
├── index.html                 # Main landing page with repair form
├── admin.html                 # Admin dashboard
├── styles.css                 # Main site styling
├── admin.css                  # Admin dashboard styling
├── script.js                  # Frontend form and modal logic
├── admin.js                   # Admin console functionality
│
├── api/                       # Vercel serverless functions
│   ├── index.js              # Main API entry point
│   ├── health.js             # Health check endpoint
│   ├── repair-request.js     # POST repair requests
│   │
│   ├── admin/                # Protected admin endpoints
│   │   ├── login.js          # POST JWT authentication
│   │   ├── requests.js       # GET all repair requests (paginated)
│   │   ├── repair-request.js # GET/PUT single request details
│   │   └── update-status.js  # PUT update request status
│   │
│   └── middleware/
│       └── auth.js           # JWT verification middleware
│
├── models/                    # Mongoose database schemas
│   ├── AdminUser.js          # Admin user schema
│   └── RepairRequest.js      # Repair request schema
│
├── test-server.js            # Local development server
└── package.json              # Dependencies and scripts
```

## ⚙️ Environment Setup

1. **Configure MongoDB:**
   ```env
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/allelectronic
   ```

2. **Admin Credentials:**
   ```env
   ADMIN_USER=Admin
   ADMIN_PASS=YourSecurePassword
   JWT_SECRET=your-super-secret-jwt-key
   ```

3. **Server Settings:**
   ```env
   PORT=3000
   NODE_ENV=development
   ```

## 🌐 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/health` | Health check | No |
| `POST` | `/api/repair-request` | Submit repair request | No |
| `POST` | `/api/admin/login` | Admin authentication | No |
| `GET` | `/api/admin/requests` | List all requests | Yes |
| `GET` | `/api/admin/repair-request` | Get specific request | Yes |
| `PUT` | `/api/admin/update-status` | Update request status | Yes |

## 🚀 Deployment

### Vercel (Production)
```bash
npm install -g vercel
vercel deploy --prod
```

### Local Development
```bash
node test-server.js
```
Visit: http://localhost:3000

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Deployment**: Vercel serverless functions
- **Styling**: CSS3 with Flexbox/Grid

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints for tablets and desktop
- Touch-friendly interface
- Optimized performance

## 🔒 Security Features

- JWT-based authentication
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## 📊 Admin Dashboard Features

- Request status management
- Payment tracking
- Search and filter functionality
- Responsive data tables
- Real-time updates

## 🤝 Contributing

This project is part of the [Shyampunk76 Portfolio](../../README.md). For contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - See main repository for details.

---

**Part of the [Shyampunk76 Development Portfolio](../../README.md)**