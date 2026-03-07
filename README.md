# Smart Campus Operations Hub

> IT3030 — Platform for Application Frameworks (PAF) Assignment 2026
> Faculty of Computing — SLIIT
> **Group SORA**

A full-stack web application for managing campus facilities, bookings, maintenance tickets, and notifications — built with **Spring Boot** and **React**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 3.5.11, Spring Data JPA, Spring Security |
| Database | MySQL 8.0 |
| Authentication | OAuth 2.0 (Google), JWT |
| Frontend | React 19 (Vite), Tailwind CSS, React Router |
| CI/CD | GitHub Actions |
| Version Control | Git + GitHub |

---

## Project Structure

```
it3030-paf-2026-smart-campus-sora/
├── backend/                    # Spring Boot REST API
│   ├── src/main/java/com/smartcampus/smart_campus_api/
│   │   ├── config/             # CORS, Security configuration
│   │   ├── controller/         # REST controllers
│   │   ├── dto/                # Data Transfer Objects
│   │   ├── exception/          # Global error handling
│   │   ├── model/              # JPA entities
│   │   ├── repository/         # Spring Data repositories
│   │   ├── security/           # OAuth, JWT filters
│   │   └── service/            # Business logic
│   └── src/main/resources/
│       └── application.yml     # App configuration
├── frontend/                   # React SPA
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── context/            # Auth context (React Context API)
│       ├── layouts/            # Page layouts (navbar, footer)
│       ├── pages/              # Route-level page components
│       ├── services/           # API call modules (Axios)
│       └── utils/              # Helper functions
├── .github/workflows/          # CI pipeline
└── README.md
```

---

## Getting Started

### Prerequisites

- Java 17+
- Node.js 22+
- MySQL 8.0+
- Maven 3.9+ (or use the included `mvnw` wrapper)

### 1. Database Setup

```sql
CREATE DATABASE smart_campus_db;
-- Default credentials: root / root (update in application.properties)
```

### 2. Backend

```bash
cd backend
./mvnw spring-boot:run
```

The API starts at `http://localhost:8080`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173`

---

## API Endpoints Overview

| Module | Base Path | Owner |
|--------|-----------|-------|
| Facilities | `/api/facilities` | Member 1 |
| Bookings | `/api/bookings` | Member 2 |
| Tickets | `/api/tickets` | Member 3 |
| Notifications | `/api/notifications` | Member 4 |
| Auth | `/api/auth` | Member 4 |

---

## Git Branching Strategy

```
main          ← production-ready releases
  └── dev     ← integration branch
       ├── feature/m1-facilities
       ├── feature/m2-bookings
       ├── feature/m3-tickets
       └── feature/m4-auth-notifications
```

**Rules:**
- Never push directly to `main`
- Create feature branches from `dev`
- Open Pull Requests to merge into `dev`
- Merge `dev` into `main` only for releases

---

## Team — Group SORA

| Member | Module | Responsibility |
|--------|--------|---------------|
| M1 | Facilities & Assets | Facility CRUD, search/filter, facility UI |
| M2 | Booking Management | Booking CRUD, conflict detection, approval workflow |
| M3 | Tickets & Comments | Ticket CRUD, image upload, comments, ticket UI |
| M4 | Auth & Notifications | OAuth 2.0, JWT, role management, notification system |

---

## License

This project is for academic purposes only — IT3030 PAF Assignment 2026, SLIIT.
