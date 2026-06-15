# SafeTrip

A comprehensive tourist safety monitoring system with real-time tracking, emergency alerts, AI-powered wildlife detection, face verification, and RAG-based chatbot assistance.

## Features

### Tourist Features
- **Real-time Location Tracking**: GPS tracking with live updates on admin dashboard
- **Emergency SOS**: One-tap SOS button with rate limiting (5 requests/minute)
- **Digital ID Card**: QR code-based identification with photo
- **Face Verification**: AI-powered check-in verification using face-api.js
- **Wildlife Detection**: Camera-based wildlife detection using Groq Vision API
- **RAG Chatbot**: Hugging Face embeddings + Groq LLM for safety information
- **Geofence Alerts**: Automatic alerts when entering danger zones
- **Anomaly Detection**: AI-based behavioral anomaly detection

### Admin Features
- **Live Map View**: Real-time tourist locations on interactive Leaflet map
- **Incident Management**: Track and manage SOS, anomaly, geofence breach, and wildlife incidents
- **Analytics Dashboard**: Statistics, trends, and heatmaps using Recharts
- **Geofence Management**: Create and manage safe/danger/trail zones
- **Socket.io Integration**: Real-time alerts and updates

### Government Portal
- Access to incident reports and analytics for government officials

## Tech Stack

### Frontend (client/)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Routing**: react-router-dom
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Maps**: Leaflet + react-leaflet
- **Charts**: Recharts
- **Notifications**: react-hot-toast
- **Face Recognition**: face-api.js + TensorFlow.js
- **Camera**: react-webcam
- **PWA**: Service Worker + manifest.json

### Backend (server/)
- **Framework**: Express.js
- **Database**: PostgreSQL with pgvector extension
- **Real-time**: Socket.io
- **Authentication**: JWT + bcryptjs
- **File Upload**: Multer + Cloudinary
- **QR Codes**: qrcode
- **SMS**: Twilio
- **AI/ML**:
  - Groq SDK for chat completions and vision
  - Hugging Face Inference for embeddings
  - pdf-parse for document processing
- **Rate Limiting**: express-rate-limit
- **Validation**: express-validator

## Project Structure

```
safetrip/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── CompleteProfile.jsx
│   │   │   ├── TouristDashboard.jsx
│   │   │   ├── TouristSOS.jsx
│   │   │   ├── AdminMap.jsx
│   │   │   ├── AdminIncidents.jsx
│   │   │   ├── AdminAnalytics.jsx
│   │   │   └── GovPortal.jsx
│   │   ├── components/    # Reusable components
│   │   │   ├── DigitalIDCard.jsx
│   │   │   ├── FaceVerification.jsx
│   │   │   ├── WildlifeReport.jsx
│   │   │   ├── ChatBot.jsx
│   │   │   └── Navbar.jsx
│   │   ├── services/      # API services
│   │   │   ├── api.js     # Axios instance
│   │   │   └── socket.js  # Socket.io client
│   │   └── store/         # Zustand state management
│   │       └── authStore.js
│   ├── public/
│   │   ├── manifest.json  # PWA manifest
│   │   └── sw.js         # Service worker
│   ├── vercel.json       # Vercel deployment config
│   ├── .env.example       # Environment variables template
│   └── package.json
│
└── server/                 # Express backend
    ├── routes/            # API routes
    │   ├── auth.routes.js
    │   ├── tourist.routes.js
    │   ├── geofence.routes.js
    │   ├── sos.routes.js
    │   ├── incident.routes.js
    │   ├── wildlife.routes.js
    │   ├── chat.routes.js
    │   └── analytics.routes.js
    ├── controllers/       # Route controllers
    ├── services/          # Business logic
    │   ├── auth.service.js
    │   ├── tourist.service.js
    │   ├── geofence.service.js
    │   ├── anomaly.service.js
    │   ├── wildlife.service.js
    │   ├── groq.service.js
    │   └── embeddings.service.js
    ├── middleware/        # Express middleware
    │   ├── auth.middleware.js
    │   └── upload.middleware.js
    ├── config/            # Configuration files
    │   ├── db.js          # PostgreSQL connection
    │   └── schema.sql     # Database schema
    ├── scripts/           # Utility scripts
    │   └── ingestDocs.js  # RAG document ingestion
    ├── knowledge-base/    # RAG documents
    │   ├── trail-safety.txt
    │   ├── wildlife-guide.txt
    │   └── emergency-contacts.txt
    ├── Procfile           # Railway deployment
    ├── .env.example       # Environment variables template
    └── package.json
```

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL with pgvector extension
- Cloudinary account
- Twilio account
- Groq API key
- Hugging Face API key

### Frontend Setup (client/)

```bash
cd client
npm install
cp .env.example .env
# Edit .env with your API URL
```

### Backend Setup (server/)

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your credentials
```

### Environment Variables

**Server (.env):**
```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/safetrip
JWT_SECRET=your-secret-key-here
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
GROQ_API_KEY=your-groq-api-key
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
HUGGINGFACE_API_KEY=hf_your_token_here
```

**Client (.env):**
```
VITE_API_URL=http://localhost:5000
```

### Database Setup

1. Create PostgreSQL database:
```bash
createdb safetrip
```

2. Enable pgvector extension:
```sql
CREATE EXTENSION vector;
```

3. Run schema initialization:
```bash
cd server
psql -d safetrip -f config/schema.sql
```

4. Ingest RAG documents:
```bash
node scripts/ingestDocs.js
```

### Running Locally

**Start backend:**
```bash
cd server
npm run dev  # Development with nodemon
# or
npm start    # Production
```

**Start frontend:**
```bash
cd client
npm run dev
```

Access the application at http://localhost:5173

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Tourist
- `POST /api/tourists/complete-profile` - Complete tourist profile
- `GET /api/tourists/me` - Get my profile
- `GET /api/tourists/:id` - Get tourist by ID
- `GET /api/tourists/:id/card` - Get tourist card data

### Geofence
- `POST /api/geofences` - Create geofence (admin)
- `GET /api/geofences` - Get all geofences
- `POST /api/geofences/check` - Check point in geofence

### SOS
- `POST /api/sos/trigger` - Trigger SOS (rate limited)

### Incidents
- `POST /api/incidents` - Create incident
- `GET /api/incidents` - Get all incidents (admin)
- `PATCH /api/incidents/:id` - Update incident status

### Wildlife
- `POST /api/wildlife/detect` - Detect wildlife from image

### Chat
- `POST /api/chat` - RAG chatbot query

### Analytics
- `GET /api/analytics/summary` - Get summary stats
- `GET /api/analytics/heatmap` - Get incident heatmap
- `GET /api/analytics/trends` - Get incident trends
- `GET /api/analytics/recent-incidents` - Get recent incidents

### Health
- `GET /api/health` - Health check with uptime, DB status, active tourists

## Deployment

### Frontend (Vercel)
```bash
cd client
vercel deploy
```

### Backend (Railway)
```bash
cd server
railway up
```

## Live Deployment Links

- Frontend: [Add your Vercel URL here]
- Backend: [Add your Railway URL here]

## Security Features

- JWT authentication with role-based access control
- Rate limiting on SOS endpoint (5 requests/minute)
- Input validation on all POST routes using express-validator
- CORS configuration
- Password hashing with bcryptjs
- Face verification for check-in fraud detection

## PWA Features

- Offline support with service worker
- Installable on mobile devices
- Mobile-first responsive design
- Push notifications capability

## License

MIT
