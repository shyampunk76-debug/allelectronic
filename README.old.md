# All Electronic - Repair Request Website

A professional web application for managing home appliance and electronics repair service requests.

## Features

- **Modern, Responsive Design**: Mobile-friendly interface with smooth animations
- **Comprehensive Repair Request Form**: Captures customer information with validation
  - Name (required)
  - Email (required, validated)
  - Phone Number (required, validated)
  - Product Details (required)
  - Issue Description (required)
  - Service Type (optional category)

- **Real-time Form Validation**: Client-side validation with helpful error messages
- **Service Categories**: Kitchen appliances, washing machines, HVAC, electronics
- **Professional Contact Information**: Display business hours and contact details
- **Data Persistence**: Stores submissions locally (can be connected to backend database)

## Project Structure

```
allelectronic-website/
├── index.html           # Main HTML page
├── admin.html           # Admin dashboard
├── styles.css           # Frontend styling
├── admin.css            # Admin dashboard styling
├── script.js            # Form validation and interactivity
├── admin.js             # Admin console logic
├── db.js                # MongoDB connection helper
├── api/                 # Serverless API endpoints (Vercel)
│   ├── repair-request.js      # Handle repair request submissions
│   ├── health.js              # Health check endpoint
│   ├── admin/                 # Admin endpoints
│   │   ├── login.js           # Admin authentication
│   │   ├── requests.js        # Get all requests
│   │   ├── repair-request.js  # Get single request details
│   │   └── update-status.js   # Update request status
│   └── middleware/
│       └── auth.js            # JWT authentication middleware
├── models/              # Mongoose schemas
│   ├── AdminUser.js     # Admin user schema
│   └── RepairRequest.js # Repair request schema
├── package.json         # Node.js dependencies
├── vercel.json          # Vercel deployment config
├── .env.example         # Environment configuration template
├── .gitignore           # Git ignore rules
└── README.md            # Documentation (this file)
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (for production database)
- Vercel account (for deployment)

### Local Installation

1. Clone the repository:
```bash
git clone https://github.com/shyampunk76-debug/allelectronic-website.git
cd allelectronic-website
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the template:
```bash
cp .env.example .env
```

4. Add your environment variables to `.env`:
   - `MONGODB_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — Secret key for JWT tokens (generate with `openssl rand -hex 32`)
   - `ADMIN_USER` — Admin username (default: Admin)
   - `ADMIN_PASS` — Admin password (default: Passw0rd)

5. Test the API locally:
```bash
npm install -g vercel  # Install Vercel CLI
vercel dev            # Start local development server (simulates Vercel)
```

6. Open your browser and navigate to:
```
http://localhost:3000
```

## Frontend Features

### HTML Structure
- Sticky header with navigation
- Hero section with call-to-action
- Services showcase section
- Interactive repair request form
- Contact information section
- Responsive footer

### Form Validation Rules
- **Name**: Minimum 2 characters
- **Email**: Valid email format
- **Phone**: Minimum 10 digits (auto-formats as user types)
- **Product**: Minimum 3 characters
- **Issue**: Minimum 10 characters

### Interactive Features
- Real-time validation feedback
- Auto-formatting phone numbers
- Smooth scrolling between sections
- Success/error message displays
- Form auto-reset after successful submission

## Backend API Endpoints

### Public Endpoints

#### Submit Repair Request
```
POST /api/repair-request
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "5551234567",
  "product": "Samsung Refrigerator",
  "issue": "Ice maker not working properly",
  "serviceType": "Kitchen Appliances"
}

Response:
{
  "status": "success",
  "message": "Repair request submitted successfully",
  "submissionId": "REP-1234567890"
}
```

#### Health Check
```
GET /api/health
Response: { "status": "ok", "message": "All Electronic API is running" }
```

### Admin Endpoints (Authentication required in production)

#### Get All Repair Requests
```
GET /api/repair-requests
Response: { "status": "success", "count": 5, "data": [...] }
```

#### Get Specific Request
```
GET /api/repair-request/:id
```

#### Update Request Status
```
PUT /api/repair-request/:id
{
  "status": "in-progress" | "completed" | "cancelled"
}
```

#### Delete Request
```
DELETE /api/repair-request/:id
```

## Admin Console

The site includes a secure admin console for managing repair requests and tracking their status/payment.

## Admin Credentials

The default admin credentials are stored in MongoDB:

- **Username**: `Admin`
- **Password**: `Passw0rd`

You can add additional admin users directly to the `adminusers` collection in MongoDB Atlas.

### Admin User Schema
```javascript
{
  username: String,      // Unique username
  password: String,      // Plain text (should use bcrypt in production)
  email: String,         // Admin email
  role: String,          // admin, moderator
  isActive: Boolean,     // Whether account is active
  createdAt: Date,       // Creation timestamp
  updatedAt: Date        // Last update timestamp
}
```

### Admin Features

- **JWT Authentication**: Secure session tokens (8-hour expiration)
- **Pagination**: View up to 50 requests per page
- **Search**: Find requests by ID, customer name, or email
- **Status Tracking**: Track repair progress and payment status
- **Real-time Updates**: Changes save immediately to MongoDB (if configured)

## Data Storage

Repair requests and admin credentials are stored in MongoDB Atlas:

### MongoDB Setup

1. Create a MongoDB Atlas cluster (free tier available)
2. Create a database named `allelectronic`
3. Copy your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/allelectronic?retryWrites=true&w=majority`)
4. Add to Vercel environment variables:
   - `MONGODB_URI` = your connection string
5. Re-deploy the project
6. The API will automatically create collections for repair requests and admin users

### Repair Request Schema
```javascript
{
  _id: ObjectId,        // MongoDB ID
  id: String,           // Custom ID (REP-timestamp)
  name: String,         // Customer name
  email: String,        // Customer email
  phone: String,        // Customer phone (digits only)
  product: String,      // Product being repaired
  issue: String,        // Problem description
  serviceType: String,  // Category (optional)
  status: String,       // pending, in-progress, completed, cancelled
  paymentStatus: String,// payment-pending, processing, paid
  createdAt: Date,      // Creation timestamp
  updatedAt: Date       // Last update timestamp
}
```

## Customization

### Updating Service Categories
Edit the service categories in `index.html`:
1. Update `.services-grid` with new `.service-card` items
2. Update the `<select>` options in the form

### Changing Colors & Branding
Modify variables in `styles.css`:
- Primary color: `#667eea`
- Accent color: `#00d4ff`
- Dark color: `#1a1a2e`

### Adding Email Notifications
Update `server.js` to use nodemailer:
```javascript
const nodemailer = require('nodemailer');
// Configure SMTP settings from .env
// Send confirmation email on form submission
```

## Development

### Run in Development Mode
```bash
vercel dev
```

This simulates the Vercel serverless environment locally.

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Scripts

### In Browser Console
```javascript
// View all repair submissions
viewSubmissions()

// Clear all stored submissions
clearSubmissions()
```

## Future Enhancements

- [ ] User authentication and accounts
- [ ] Repair tracking with real-time updates
- [ ] Email notifications
- [ ] Payment integration
- [ ] Appointment scheduling
- [ ] Customer reviews and ratings
- [ ] Admin dashboard
- [ ] Mobile app

## Security Considerations

- Validate all inputs on both client and server
- Sanitize user inputs before storing
- Use HTTPS in production
- Implement rate limiting
- Add CSRF protection
- Store sensitive data securely

## License

MIT License - See LICENSE file for details

## Contact

**All Electronic**
- Phone: 1-800-REPAIR-1
- Email: info@allelectronic.com
- Hours: Mon-Sat 8AM-6PM, Sun 10AM-4PM

## Contributing

Contributions are welcome! Please create a pull request with your improvements.