# Shyampunk76's Development Portfolio

![Projects](https://img.shields.io/badge/projects-multiple-blue)
![Languages](https://img.shields.io/badge/languages-JavaScript%20%7C%20C%2B%2B%20%7C%20Python-green)
![GitHub](https://img.shields.io/badge/github-integrated-success)

Welcome to my comprehensive development portfolio! This repository contains all my programming projects organized by technology and purpose.

## 📁 Repository Structure

### 🌐 Web Development Projects
- **[All Electronic Website](./projects/allelectronic-website/)** - Professional repair request website
  - Node.js, Express, MongoDB
  - Admin dashboard with JWT authentication
  - Vercel deployment ready
  - Responsive design

### 💻 C++ Projects  
- **[C++ Projects](./projects/cpp-projects/)** - C++ applications and utilities
  - Console applications
  - GUI applications  
  - Data structures and algorithms

### 🐍 Python Projects
- **[Python Projects](./projects/python-projects/)** - Python scripts and applications
  - Automation scripts
  - Data analysis tools
  - Web scraping utilities

### 📚 Learning & Tutorials
- **[Tutorials](./projects/tutorials/)** - Educational content and practice projects
  - Code examples
  - Practice exercises
  - Documentation

## 🚀 Featured Project: All Electronic Website

A complete web application for managing home appliance repair services:

**Tech Stack:**
- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Authentication: JWT-based admin system
- Deployment: Vercel serverless functions

**Features:**
- Customer repair request form with validation
- Admin dashboard for request management
- Real-time status tracking
- Responsive mobile-friendly design

[→ View Project Details](./projects/allelectronic-website/)

## 🛠️ Technologies & Skills

- **Web Development**: JavaScript, Node.js, HTML5, CSS3, Express.js
- **Programming Languages**: C++, Python
- **Databases**: MongoDB, SQL
- **Tools & Platforms**: Git, VS Code, Vercel, GitHub
- **Frameworks**: Express.js, Mongoose ODM

## 📊 Quick Stats

- **Active Projects**: Multiple ongoing developments
- **Primary Focus**: Full-stack web development
- **Learning**: Advanced JavaScript, Database design
- **Status**: Actively maintained and updated

## 🔗 Navigation

| Project Category | Description | Link |
|------------------|-------------|------|
| **Web Projects** | Full-stack web applications | [Browse →](./projects/allelectronic-website/) |
| **C++ Projects** | System programming & algorithms | [Browse →](./projects/cpp-projects/) |
| **Python Projects** | Automation & data tools | [Browse →](./projects/python-projects/) |
| **Tutorials** | Learning materials & examples | [Browse →](./projects/tutorials/) |

## 📞 Connect

- **GitHub**: [@shyampunk76-debug](https://github.com/shyampunk76-debug)
- **Portfolio**: This repository showcases my development journey

---

⭐ **Star this repository if you find my projects useful!**

*Last updated: November 2025*

## Features

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

## Project Structure

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
├── db.js                      # MongoDB connection helper
├── package.json               # Dependencies and scripts
├── vercel.json                # Vercel deployment config
├── .env.example               # Environment variable template
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## Quick Start

### Prerequisites

- Node.js v14+ (for local development)
- MongoDB Atlas account (for database)
- Vercel account (for deployment)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/shyampunk76-debug/allelectronic-website.git
cd allelectronic-website
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and add:
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret for JWT tokens (generate: `openssl rand -hex 32`)
- `ADMIN_USER` - Default admin username (default: Admin)
- `ADMIN_PASS` - Default admin password (default: Passw0rd)

4. **Run locally (with Vercel CLI):**
```bash
npx vercel dev
```

Open http://localhost:3000

## Usage

### Public Features

1. **Submit Repair Request**
   - Click on the main page form
   - Fill in customer info and repair details
   - Submit to create a request (stored in MongoDB)
   - Get a confirmation ID

2. **Admin Access**
   - Click the 🔐 **Admin** button in navbar
   - Log in with credentials (default: Admin/Passw0rd)
   - Redirected to admin dashboard
   - View and manage all repair requests

### Admin Features

- **View Requests**: Browse all repair requests with pagination (50 per page)
- **Search**: Filter by submission ID, customer name, or email
- **Update Status**: Change repair status
  - pending → in-progress → completed → cancelled
- **Track Payment**: Update payment status
  - payment-pending → processing → paid
- **View Details**: See full request information

## API Endpoints

### Public Endpoints

**Submit Repair Request**
```
POST /api/repair-request
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "5551234567",
  "product": "Samsung Refrigerator",
  "issue": "Ice maker not working",
  "serviceType": "Kitchen Appliances"
}

Response: { "status": "success", "submissionId": "REP-..." }
```

**Health Check**
```
GET /api/health
Response: { "status": "ok", "message": "All Electronic API is running" }
```

### Admin Endpoints (Requires JWT Token)

**Login**
```
POST /api/admin/login
{ "username": "Admin", "password": "Passw0rd" }
Response: { "status": "success", "token": "eyJh..." }
```

**Get All Requests**
```
GET /api/admin/requests?page=1
Headers: { "Authorization": "Bearer <token>" }
Response: { "status": "success", "count": 50, "data": [...] }
```

**Get Request Details**
```
GET /api/admin/repair-request/:id
Headers: { "Authorization": "Bearer <token>" }
```

**Update Request Status**
```
PUT /api/admin/repair-request/:id
Headers: { "Authorization": "Bearer <token>" }
{
  "status": "in-progress",
  "paymentStatus": "processing"
}
```

## Database Schema

### AdminUser Collection

```javascript
{
  _id: ObjectId,
  username: String,      // Unique username
  password: String,      // Plain text (use bcrypt in production)
  email: String,         // Unique email
  role: String,          // 'admin' or 'moderator'
  isActive: Boolean,     // Account status
  createdAt: Date,
  updatedAt: Date
}
```

### RepairRequest Collection

```javascript
{
  _id: ObjectId,
  id: String,            // Custom ID: REP-{timestamp}
  name: String,
  email: String,
  phone: String,         // Digits only
  product: String,
  issue: String,
  serviceType: String,   // Optional category
  status: String,        // pending, in-progress, completed, cancelled
  paymentStatus: String, // payment-pending, processing, paid
  createdAt: Date,
  updatedAt: Date
}
```

## Environment Variables

Create a `.env` file with:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/allelectronic?retryWrites=true&w=majority

# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET=your_random_hex_string_here

# Default Admin Credentials
ADMIN_USER=Admin
ADMIN_PASS=Passw0rd

# Vercel Environment (auto-set)
VERCEL_ENV=production
```

## Deployment

### Deploy to Vercel

1. **Link to Vercel:**
```bash
vercel link
```

2. **Add environment variables** in Vercel dashboard:
   - Settings → Environment Variables
   - Add: MONGODB_URI, JWT_SECRET, ADMIN_USER, ADMIN_PASS

3. **Deploy:**
```bash
vercel deploy --prod
```

Or push to GitHub and auto-deploy:
```bash
git push origin main
```

The site is now live at `allelectronic-website.vercel.app`

## Local Development

### Run Development Server

```bash
npx vercel dev
```

This simulates the Vercel serverless environment locally.

### File Changes During Development

- **Frontend**: Edit `.html`, `.css`, `.js` files - hot reload works
- **API**: Edit `/api/*` files - requires server restart
- **Database**: Uses MongoDB Atlas (shared with production)

## Security Notes

- **JWT Tokens**: 8-hour expiration, stored in localStorage
- **Admin Authentication**: Queries MongoDB for credentials
- **CORS**: Enabled for cross-origin requests
- **Production**: Use bcrypt for password hashing, HTTPS only

## Customization

### Change Service Categories

Edit `index.html` service options in the form:
```html
<option value="Kitchen Appliances">Kitchen Appliances</option>
<option value="Washing Machines">Washing Machines</option>
<!-- Add more... -->
```

### Change Colors

Edit `styles.css` variables:
```css
:root {
  --primary: #667eea;
  --accent: #00d4ff;
  --dark: #1a1a2e;
}
```

### Change Contact Info

Edit footer section in `index.html`:
```html
<p>Phone: 1-800-REPAIR-1</p>
<p>Email: info@allelectronic.com</p>
```

## Troubleshooting

**Cannot login to admin?**
- Check MONGODB_URI is set correctly
- Verify AdminUser collection exists in MongoDB
- Default credentials: Admin / Passw0rd

**Repair requests not saving?**
- Ensure MONGODB_URI is set in Vercel environment
- Check MongoDB Atlas network access allows Vercel IPs

**JWT token expired?**
- Tokens expire after 8 hours
- User must log in again
- Token is stored in localStorage

## Future Enhancements

- [ ] Email notifications for status updates
- [ ] Password hashing with bcrypt
- [ ] Two-factor authentication
- [ ] Repair history and analytics
- [ ] Customer account dashboard
- [ ] Payment integration
- [ ] Appointment scheduling

## License

MIT License

## Contact

**All Electronic**
- Phone: 1-800-REPAIR-1
- Email: info@allelectronic.com
- Hours: Mon-Sat 8AM-6PM, Sun 10AM-4PM

## Support

For issues or questions, please create a GitHub issue or contact support.
