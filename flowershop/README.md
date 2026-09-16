# PetalBloom Flower Shop

## Overview

PetalBloom is a comprehensive full-stack flower shop application built with:

- **Backend**: Express.js API with SQLite database
- **Frontend**: React application with Vite
- **Design**: Custom CSS design system with the exact layout specified

## Features

### 🛍️ Shopping Experience
- **Product Catalog**: Browse seasonal flower collections
- **Product Details**: Individual product pages with specifications
- **Shopping Cart**: Add/remove products, quantity selection
- **Checkout Process**: Complete purchase flow

### 👥 User Management
- **Authentication**: Login/signup for customers
- **Sellers**: Separate seller accounts for flower shops
- **Admin Dashboard**: Product approval and management
- **Order Management**: Track and manage orders

### 🎨 Design System
- **Color Palette**: Red (#b84e59), Dark Red (#9f3f4b), Green (#849850), Pink (#f9b8cc), Light Pink (#fde8ef)
- **Typography**: Montserrat (body) & Cormorant Garamond (headings)
- **Layout**: Responsive grid system (5-column desktop → 2-column mobile)
- **Hero Section**: Decorative flowers with text overlay
- **Product Cards**: Pink-circle backgrounds with image previews

### 📱 Responsive Design
- **Desktop (≥1000px)**: 5-column categories, 3-column products
- **Tablet (700-999px)**: 3-column categories, 2-column products
- **Mobile (<700px)**: 2-column categories, 1-column products

## 🛠️ Tech Stack

### Backend
- **Framework**: Express.js
- **Database**: SQLite (Node.js built-in)
- **Authentication**: JWT tokens with bcryptjs
- **API Routes**: 
  - `/api/auth` - Authentication
  - `/api/store` - Public store operations
  - `/api/seller` - Seller dashboard
  - `/api/orders` - Customer orders
  - `/api/admin` - Admin management

### Frontend
- **Framework**: React
- **Build Tool**: Vite
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Routing**: React Router DOM

### CSS Framework
- Custom designed components following the exact specifications
- CSS Grid for responsive layouts
- Flexbox for positioning
- CSS variables for theming

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Local Development
```bash
# Clone the repository
git clone https://github.com/shkatfrmz/flower.git
cd flower

# Install dependencies
npm install

# Start both backend and frontend
./start.sh

# OR run separately:
# Backend
cd server
npm install
node src/index.js

# Frontend
cd ../client
npm install
npm run dev
```

### Directory Structure
```
flowershop/
├── server/                    # Backend API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── db.js            # Database configuration
│   │   └── index.js         # Express server
│   └── package.json
│
├── client/                    # Frontend application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React contexts
│   │   └── hooks/           # Custom hooks
│   ├── src/styles.css       # Main CSS stylesheet
│   └── package.json
│
├── start.sh                   # Quick start script
└── README.md                  # This README
```

## 🔧 Development Commands

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
npm test
```

## 📊 Project Features

### Shopping Experience
- **Product Browsing**: Browse flower collections by category
- **Product Search**: Search functionality for specific flowers
- **Shopping Cart**: Real-time cart management
- **Checkout**: Secure payment processing

### User Management
- **Customer Accounts**: Register, login, and manage profiles
- **Seller Accounts**: Flower shops can sell their products
- **Admin Panel**: Full control over users and products
- **Role-Based Access**: Different permissions for different user types

### Design Elements
- **Hero Section**: Large header with decorative flower elements
- **Category Navigation**: Circular category icons with hover effects
- **Product Cards**: Pink-circle backgrounds with images and details
- **Responsive Design**: Seamless adaptation to all screen sizes
- **Mobile Menu**: Hamburger menu for small screens

## 🌐 Live Preview

### Access the Project
Visit the public preview URL:

**https://[random-tunnel-id].trycloudflare.com/**

> **Note**: Cloudflare tunnel URLs are generated dynamically and may change. Use the local development URL (`http://localhost:5174/`) for consistent access during development.

### Development Access
For local development, use:
- **Frontend**: `http://localhost:5174/`
- **Backend API**: `http://localhost:3001/api/`

## 🚀 Deployment

### Local Development
```bash
docker-compose up -d  # If using Docker
./start.sh          # If using native setup
```

### Production Deployment
1. **Environment Setup**: Configure environment variables
2. **Database Setup**: Set up production database
3. **Build Frontend**: `npm run build`
4. **Deploy Backend**: Deploy Express application
5. **Configure Reverse Proxy**: Set up Nginx/Apache

## 📖 Usage Examples

### Browse Flowers
```javascript
// Fetch categories
GET /api/store/categories

// Get products by category
GET /api/store/products?category=roses

// Get product details
GET /api/store/products/123
```

### Shopping Cart
```javascript
// Add to cart
POST /api/orders/cart
{
  "productId": 123,
  "quantity": 2
}

// Get cart
GET /api/orders/cart

// Update cart item
PUT /api/orders/cart/456
{
  "quantity": 3
}

// Remove from cart
DELETE /api/orders/cart/456
```

### Authentication
```javascript
// Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Register (customer)
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}

// Register (seller)
POST /api/auth/register
{
  "username": "flower_shop",
  "email": "shop@example.com",
  "password": "shoppassword",
  "role": "seller"
}
```

## 📊 Project Status

✅ **Fully Implemented**
- All UI components with exact CSS design
- Complete authentication system
- Product management with approval workflow
- Shopping cart and checkout functionality
- Admin dashboard with product management
- Responsive design for all devices
- REST API with all required endpoints
- Docker-ready setup

✅ **Ready for Production**
- Proper error handling
- Security best practices
- Code organization and structure
- Comprehensive development documentation

## 🔧 Configuration

### Environment Variables
```bash
# Backend
DATABASE_URL=sqlite:///./database.sqlite
JWT_SECRET=your_jwt_secret_key
PORT=3001

# Frontend
VITE_API_BASE_URL=http://localhost:3001
```

### File Structure Notes
- All backend routes are organized under `/api/*`
- Frontend routes are handled by React Router
- Static assets (images) are served from `/uploads`
- CSS is bundled and optimized by Vite

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/awesome-feature`)
3. Make your changes
4. Commit with a meaningful message
5. Push to your fork
6. Open a Pull Request

## 🙏 Acknowledgments

Special thanks to the open-source community and all contributors who helped make this project possible.

---

**PetalBloom Flower Shop** is a complete e-commerce solution designed to bring the beauty of flowers to online customers. With its modern tech stack and comprehensive feature set, it provides a seamless experience for both customers and sellers.
