# 🎓 Smart Doubt Exchange Platform

A full-stack MERN application where students post doubts anonymously, get answers from peers, upvote helpful responses, and track solved doubts — with a real-time OTP email verification system.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (cloud) |
| Auth | JWT + OTP via Nodemailer (Gmail) |
| Styling | Custom CSS with Google Fonts |
| Security | Helmet, express-rate-limit, bcryptjs |

---

## 📁 Project Structure

```
smart-doubt-exchange/
├── backend/
│   ├── models/         # User, OTP, Doubt, Notification
│   ├── routes/         # auth.js, doubts.js, users.js
│   ├── middleware/     # auth.js (JWT protect)
│   ├── utils/          # email.js, jwt.js
│   ├── server.js       # Express app entry
│   ├── .env.example    # Environment variables template
│   └── package.json
└── frontend/
    ├── public/
    └── src/
        ├── pages/      # Register, Login, VerifyOTP, Dashboard, etc.
        ├── components/ # Navbar
        ├── context/    # AuthContext
        ├── utils/      # api.js (Axios)
        ├── App.js
        └── styles.css
```

---

## ⚙️ Setup Guide

### Step 1: MongoDB Atlas

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas/database)
2. Create a **free cluster** (M0 tier)
3. Create a database user (username + password)
4. **Network Access**: Add `0.0.0.0/0` (allow all IPs) for development
5. Click **Connect** → **Drivers** → copy the connection string
6. Replace `<password>` and `<username>` with your credentials
7. The connection string looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/smart-doubt-exchange?retryWrites=true&w=majority
   ```

> ⚠️ **Important**: MongoDB Atlas automatically handles the TTL index on the OTP collection — OTPs expire after 10 minutes automatically.

---

### Step 2: Gmail App Password (for OTP emails)

1. Go to your Google Account → **Security**
2. Enable **2-Factor Authentication** (required)
3. Go to **App Passwords** → Select **Mail** → **Other**
4. Name it "SmartDoubt" and click **Generate**
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
6. Use this as `EMAIL_PASS` in your `.env` (without spaces)

---

### Step 3: Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI, Gmail credentials
npm install
npm run dev    # Development with nodemon
# OR
npm start      # Production
```

Your `.env` should look like:
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/smart-doubt-exchange?retryWrites=true&w=majority
JWT_SECRET=some_very_long_random_secret_key_here
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=abcdefghijklmnop
EMAIL_FROM=SmartDoubt <youremail@gmail.com>
OTP_EXPIRE_MINUTES=10
CLIENT_URL=http://localhost:3000
```

Test that backend is running: `http://localhost:5000/api/health`

---

### Step 4: Frontend Setup

```bash
cd frontend
npm install
npm start
```

App runs at: `http://localhost:3000`

---

## ✅ Features

### Authentication
- [x] Register with name, email, password
- [x] 6-digit OTP sent to email on registration
- [x] OTP auto-expires after 10 min (MongoDB TTL index)
- [x] Resend OTP (60s cooldown, max 5/15min)
- [x] Forgot password → OTP → Reset
- [x] JWT-based session (7 days)
- [x] Rate limiting on all auth endpoints

### Doubts
- [x] Post doubts with title, content, subject, tags, priority
- [x] Anonymous posting option
- [x] Filter by subject, status, sort order
- [x] Full-text search
- [x] Pagination
- [x] View count tracking

### Answers & Voting
- [x] Post answers (with anonymous option)
- [x] Upvote doubts and answers
- [x] Doubt author can **accept** best answer
- [x] Accepted answer marks doubt as **solved**
- [x] Answers sorted: accepted first, then by upvotes

### Reputation System
- +2 rep when your doubt is upvoted
- +5 rep when you post an answer
- +3 rep when your answer is upvoted
- +15 rep when your answer is accepted

### Notifications
- Real-time notifications for: new answer, upvotes, accepted answer
- Unread count badge in navbar
- Mark all as read
- Auto-refreshes every 30 seconds

### Leaderboard
- Top 10 users by reputation
- Shows doubts asked, answers given, badges

### Profile
- Edit name, bio, subjects of interest
- View your doubts with status
- Change password

---

## 🔒 Security Features

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with expiry
- Rate limiting: 5 OTP requests/15min, 10 login attempts/15min
- Helmet.js for HTTP security headers
- Express-validator for input sanitization
- Author privacy: anonymous posts anonymize author everywhere
- Email enumeration prevention in forgot-password

---

## 🗂️ API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/verify-email` | Verify OTP |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Send reset OTP |
| POST | `/api/auth/reset-password` | Reset with OTP |
| POST | `/api/auth/resend-otp` | Resend OTP |
| GET  | `/api/auth/me` | Get current user |

### Doubts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doubts` | List with filters |
| POST | `/api/doubts` | Create doubt |
| GET | `/api/doubts/:id` | Get single doubt |
| POST | `/api/doubts/:id/answers` | Add answer |
| PUT | `/api/doubts/:id/upvote` | Toggle upvote |
| PUT | `/api/doubts/:id/answers/:aid/upvote` | Upvote answer |
| PUT | `/api/doubts/:id/answers/:aid/accept` | Accept answer |
| PUT | `/api/doubts/:id/status` | Update status |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | My profile |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/change-password` | Change password |
| GET | `/api/users/notifications/all` | Notifications |
| PUT | `/api/users/notifications/read-all` | Mark all read |
| GET | `/api/users/leaderboard/top` | Top 10 |
| GET | `/api/users/my/doubts` | My doubts |

---

## 🚢 Deployment

### Backend → Railway / Render
1. Push code to GitHub
2. Connect to Railway/Render
3. Set all environment variables
4. Deploy

### Frontend → Vercel / Netlify
1. Set `REACT_APP_API_URL=https://your-backend-url.com/api`
2. Connect GitHub repo
3. Deploy

---

## 📧 OTP Email Flow

```
User Registers
     ↓
POST /api/auth/register
     ↓
OTP record created in MongoDB Atlas (expires in 10 min via TTL index)
     ↓
Nodemailer sends styled HTML email with 6-digit OTP
     ↓
User enters OTP on /verify-otp page
     ↓
POST /api/auth/verify-email
     ↓
OTP validated → marked as used → User.isVerified = true
     ↓
JWT token issued → User logged in
```

---

Built with ❤️ for students who hesitate to ask doubts in class.
