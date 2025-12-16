# HealthQueue - Smart Healthcare Queue Management System

A comprehensive healthcare queue management system that allows patients to join doctor queues remotely, track their position in real-time, and get accurate wait time estimates. Built with MERN stack and real-time updates using Socket.IO.

## 🚀 Features

### Core Functionality
- **Remote Queue Management**: Patients can join doctor queues from anywhere
- **Real-time Updates**: Live position tracking and queue updates
- **Smart ETA Calculation**: Accurate wait time estimates based on queue position
- **Role-based Access**: Separate portals for patients and doctors

### Patient Features
- Join doctor queues remotely
- Real-time position tracking
- ETA updates and notifications
- Medicine ordering from local pharmacies
- Emergency ambulance booking
- Consultation history and ratings

### Doctor Features
- Queue management dashboard
- Patient status updates (start, complete, skip, no-show)
- Consultation time tracking
- Patient history and statistics
- Real-time queue monitoring

### Additional Services
- **Pharmacy Integration**: Order medicines with prescription upload
- **Emergency Services**: Quick ambulance booking with real-time tracking
- **Notifications**: Real-time alerts and updates

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation

### Frontend
- **React 18** with functional components and hooks
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Socket.IO Client** for real-time updates
- **React Hook Form** for form management
- **Lucide React** for icons

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd health-queue-project
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit .env file with your configuration
# MONGODB_URI=mongodb://localhost:27017/health-queue
# JWT_SECRET=your-super-secret-jwt-key-here

# Start the server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

### 4. Database Setup
Make sure MongoDB is running and accessible at the URI specified in your `.env` file.

## 🔧 Environment Variables

### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/health-queue

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Optional: Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Optional: Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## 📱 Usage

### Patient Flow
1. **Register/Login**: Create an account or sign in
2. **Choose City**: Select your city to find available doctors
3. **Select Doctor**: Browse by specialization and availability
4. **Join Queue**: Get ticket number and join the virtual queue
5. **Track Progress**: Monitor position and ETA in real-time
6. **Consultation**: Get notified when it's your turn

### Doctor Flow
1. **Register/Login**: Create doctor account with credentials
2. **Dashboard**: View current queue and patient list
3. **Manage Queue**: Update patient status and manage consultations
4. **Track Performance**: Monitor consultation times and statistics

## 🏗️ Project Structure

```
health-queue-project/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Authentication & validation
│   ├── server.js        # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   ├── App.js       # Main app component
│   │   └── index.js     # Entry point
│   ├── public/          # Static assets
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register/patient` - Patient registration
- `POST /api/auth/register/doctor` - Doctor registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Queue Management
- `GET /api/queue/doctors/:city` - Get doctors by city
- `POST /api/queue/join` - Join queue
- `GET /api/queue/status` - Get queue status
- `DELETE /api/queue/leave` - Leave queue
- `GET /api/queue/doctor-queue` - Get doctor's queue
- `PUT /api/queue/update-status/:queueId` - Update patient status

### Pharmacy
- `GET /api/pharmacy/city/:city` - Get pharmacies by city
- `GET /api/pharmacy/medicines/search` - Search medicines
- `POST /api/pharmacy/order` - Place medicine order

### Emergency Services
- `GET /api/ambulance/city/:city` - Get ambulances by city
- `POST /api/ambulance/emergency-sos` - Book emergency ambulance

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet.js security headers

## 📊 Real-time Features

- Live queue updates using Socket.IO
- Real-time position tracking
- Instant notifications for status changes
- Live ETA updates

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment
1. Set `NODE_ENV=production` in environment variables
2. Configure production MongoDB URI
3. Set secure JWT secret
4. Use PM2 or similar process manager

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `build` folder to your hosting service
3. Configure environment variables for production API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact: support@healthqueue.com

## 🔮 Future Enhancements

- Mobile app development
- AI-powered ETA predictions
- Integration with hospital management systems
- Telemedicine features
- Payment gateway integration
- Multi-language support

---

**HealthQueue** - Revolutionizing healthcare access, one queue at a time. 🏥✨
