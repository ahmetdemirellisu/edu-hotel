# EDU HOTEL — Full Stack Reservation & Management System

A full-stack reservation and hotel management system developed for **Sabancı University EDU Hotel (Guesthouse)** as part of the **ENS491 / ENS492 Graduation Project**.

**Team**
- Elmar Alasgarov
- Timur Aghayev

---

# System Architecture

Frontend (React + Vite)  
⬇  
REST API (Node.js + Express)  
⬇  
Prisma ORM  
⬇  
PostgreSQL (Docker)

The system follows a workflow-driven architecture with strict backend validation and enum-based state management.

---

# Technology Stack

## Backend
- Node.js + Express
- PostgreSQL
- Prisma ORM
- JWT authentication
- bcrypt password hashing
- Multer (file uploads)
- Nodemailer (email notifications)
- CORS + cookie-parser

## Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Radix UI
- react-router-dom
- i18next (localization)

---

# Default Ports

| Service        | Port |
|---------------|------|
| Backend API   | 3000 |
| Frontend      | 5173 |
| PostgreSQL    | 5440 (Docker mapped) |

Backend allows CORS from:
```
http://localhost:5173
```

---

# Database & Docker Setup

Start PostgreSQL container:

```bash
docker run --name edu-hotel-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgrespw \
  -e POSTGRES_DB=edu_hotel \
  -p 5440:5432 \
  -d postgres
```

Verify container:

```bash
docker ps
```

---

# Prisma Setup

From the backend directory:

Generate Prisma client:
```bash
npx prisma generate
```

Run migrations:
```bash
npx prisma migrate dev
```

Seed initial data (49 rooms):
```bash
node prisma/seed.js
```

---

# Running the Project

## 1️⃣ Backend

```bash
cd backend
npm install
npm start
```

Backend runs at:
```
http://localhost:3000
```

---

## 2️⃣ Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:
```
http://localhost:5173
```

---

# Core Backend Modules

## Authentication & Role Management

- Secure login & registration
- Password hashing using bcrypt
- JWT-based session handling (1 hour expiration)
- Role system implemented via Prisma enums

### User Roles
- `USER`
- `ADMIN`
- `HOTEL_STAFF`

### User Types
- `STUDENT`
- `STAFF`
- `SPECIAL_GUEST`
- `OTHER`

---

## Reservation Engine

Reservations are created as **pre-reservation requests** and move through a defined lifecycle.

### Reservation Status

- `PENDING`
- `APPROVED`
- `REJECTED`
- `CANCELLED`
- `REFUND_REQUESTED`
- `REFUNDED`

### Implemented Backend Validation Rules

- Personal bookings limited to **5 consecutive nights**
- Maximum **30 days advance reservation**
- **Sunday check-in blocked**
- **Saturday check-in + Sunday check-out blocked**
- Invoice validation (National ID / Tax Number)
- Event code required for Corporate/Education bookings
- Guest list stored as structured JSON
- Strict server-side validation on all inputs

---

## Payment Verification Workflow

Manual receipt verification is implemented.

### Payment Status

- `NONE`
- `PENDING_VERIFICATION`
- `APPROVED`
- `REJECTED`

### Receipt Handling

- Accepts PDF / PNG / JPG / JPEG
- Max file size: 5MB
- Stored in:
  - `paymentRecieptsPending/`
  - `paymentRecieptsAprooved/`
- On approval:
  - File moved to approved directory
  - Reservation status updated
- On rejection:
  - Payment marked as rejected

---

## Admin Dashboard

Provides real-time system statistics:

- Pending & approved reservations
- Guests currently staying
- Expected check-ins today
- Room availability distribution
- Occupancy rate calculation

Endpoint:
```
GET /admin/dashboard-stats
```

---

## Room Management

Rooms stored and managed via database.

### Room Status

- `AVAILABLE`
- `OCCUPIED`
- `MAINTENANCE`

---

## Blacklist System

Blacklist enforcement prevents:

- User login
- Reservation creation

Implemented via middleware and authentication checks.

---

# System Characteristics

- Workflow-driven backend architecture
- Enum-based state management
- Strict server-side validation
- Manual payment verification process
- Relational data modeling with Prisma
- Modular route structure
- Graduation-level full-stack implementation

---

# Academic Context

Developed for:

**ENS491 / ENS492 — Graduation Project**  
Sabancı University  
2026
