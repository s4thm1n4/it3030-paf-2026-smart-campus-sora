# 🚀 Smart Campus Operations Hub - Complete Setup Guide

## Prerequisites Installation

### 1. ✅ Java 17 (JDK) - ALREADY INSTALLED
- **Status:** Java 17.0.12 is installed at `C:\Program Files\Java\jdk-17`
- **Note:** Not in PATH, but the startup script handles this automatically
- To add to PATH permanently (optional):
  1. Search "Environment Variables" in Windows
  2. Add `C:\Program Files\Java\jdk-17\bin` to System PATH

### 2. ⚠️ Node.js 22+ - NEEDS INSTALLATION
- Download from: https://nodejs.org/ (LTS version)
- **Required for frontend development**
- After installation, verify with: `node -v` and `npm -v`

### 3. ⚠️ PostgreSQL 16+ - NEEDS INSTALLATION
- Download from: https://www.postgresql.org/download/windows/
- **Required for database**
- During installation:
  - Set password for `postgres` user (remember this!)
  - Default port: 5432
  - Add PostgreSQL to PATH when prompted
- After installation, verify with: `psql --version`

---

## Database Setup

### Step 1: Start PostgreSQL Service
Open PowerShell as Administrator and run:
```powershell
Start-Service postgresql-x64-16
```

### Step 2: Create Database
Open Command Prompt or PowerShell and run:
```bash
psql -U postgres
```
Enter your postgres password, then execute:
```sql
CREATE DATABASE smart_campus_db;
\q
```

Or use pgAdmin (GUI tool installed with PostgreSQL):
- Right-click on Databases → Create → Database
- Name: `smart_campus_db`

---

## Backend Setup

### Option 1: Using Startup Script (RECOMMENDED)
Simply run the provided PowerShell script:
```powershell
cd "F:\SLIIT\Y3 S2\PAF\it3030-paf-2026-smart-campus-sora"
.\start-backend.ps1
```

### Option 2: Manual Setup

#### Step 1: Set Java Environment (for current session)
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:PATH = "C:\Program Files\Java\jdk-17\bin;$env:PATH"
```

#### Step 2: Navigate to Backend Directory
```powershell
cd "F:\SLIIT\Y3 S2\PAF\it3030-paf-2026-smart-campus-sora\backend"
```

#### Step 3: Update Database Credentials (if needed)
Edit `src/main/resources/application.properties`:
- Update `spring.datasource.password` if your postgres password is different

#### Step 4: Run the Backend
```powershell
.\mvnw.cmd spring-boot:run
```

**What this does:**
- Downloads Maven dependencies (first time only)
- Compiles the Java code
- Starts the Spring Boot server on http://localhost:8080
- Creates database tables automatically (via JPA)

**Expected output:** 
```
Started Application in X.XXX seconds
```

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory
Open a **NEW** terminal window:
```powershell
cd "F:\SLIIT\Y3 S2\PAF\it3030-paf-2026-smart-campus-sora\frontend"
```

### Step 2: Install Dependencies
```powershell
npm install
```
This downloads all React dependencies (takes 1-2 minutes)

### Step 3: Run the Frontend
```powershell
npm run dev
```

**Expected output:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

## Accessing the Application

Once both servers are running:

1. **Frontend UI**: http://localhost:5173
2. **Backend API**: http://localhost:8080
3. **Health Check**: http://localhost:8080/api/health

---

## Quick Start Commands (After Initial Setup)

### Terminal 1 - Backend:
```powershell
cd "F:\SLIIT\Y3 S2\PAF\it3030-paf-2026-smart-campus-sora"
.\start-backend.ps1
```

Or manually:
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:PATH = "C:\Program Files\Java\jdk-17\bin;$env:PATH"
cd "F:\SLIIT\Y3 S2\PAF\it3030-paf-2026-smart-campus-sora\backend"
.\mvnw.cmd spring-boot:run
```

### Terminal 2 - Frontend:
```powershell
cd "F:\SLIIT\Y3 S2\PAF\it3030-paf-2026-smart-campus-sora\frontend"
npm run dev
```

---

## Troubleshooting

### ❌ "psql is not recognized"
- PostgreSQL is not installed or not in PATH
- Reinstall PostgreSQL and check "Add to PATH" option

### ❌ "npm is not recognized"
- Node.js is not installed or not in PATH
- Reinstall Node.js and restart terminal

### ❌ "Connection refused" or "Database error"
- PostgreSQL service is not running
- Database `smart_campus_db` doesn't exist
- Wrong credentials in `application.properties`

### ❌ "Port 8080 already in use"
- Another application is using port 8080
- Stop that application or change the port in `application.properties`

### ❌ "Port 5173 already in use"
- Another Vite dev server is running
- Stop it or change the port in `vite.config.js`

---

## Next Steps After Starting

1. **Create Test User**: Use the API or database to create users with different roles
2. **Test Authentication**: Try logging in through the frontend
3. **Explore Features**: Navigate through Facilities, Bookings, Tickets, Notifications

---

## Development Notes

- Backend uses JWT for authentication
- Frontend stores auth token in localStorage
- CORS is configured for http://localhost:5173
- File uploads go to `backend/uploads/` directory
- Database schema is auto-created by Hibernate

---

**Need Help?** Check the main README.md or contact your team members!

