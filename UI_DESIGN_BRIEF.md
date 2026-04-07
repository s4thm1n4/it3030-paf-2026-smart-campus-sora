# Smart Campus Operations Hub — UI/UX Design Brief

> For: UI/UX Designer
> Project: University Campus Management System
> Stack: React 19 + Tailwind CSS 4 + Vite
> Icons: react-icons (Heroicons v2 — `HiOutline*`)

---

## What This App Does

A university campus management system where students/staff can:
- Browse campus facilities (labs, lecture halls, meeting rooms)
- Book facilities for events/classes
- Report maintenance issues (broken AC, leaking pipe, etc.)
- Get notified when bookings are approved or tickets are updated

**Two user roles:**
- `USER` — can browse, book, create tickets, view notifications
- `ADMIN` — can approve/reject bookings, assign tickets, manage users

---

## Pages & Routes

| Route | Page | Status | Role |
|---|---|---|---|
| `/login` | Login | Done | Public |
| `/` | Dashboard/Home | Stub | All |
| `/facilities` | Facilities Catalogue | Stub | All |
| `/bookings` | Booking Management | Stub | All |
| `/tickets` | Maintenance Tickets | Stub | All |
| `/notifications` | Notifications | Done | All |
| `/admin` | Admin Panel | Stub | Admin only |

---

## Page-by-Page Data & Actions

### 1. Login (`/login`)
**Status:** Done — Google OAuth button, centered card layout

---

### 2. Dashboard / Home (`/`)
**Status:** Stub — needs design

**Should show:**
- Welcome message with user's name
- Quick stats cards (e.g., pending bookings, open tickets, unread notifications)
- Recent activity feed
- Quick-action buttons (New Booking, Report Issue)

---

### 3. Facilities Catalogue (`/facilities`)
**Status:** Stub — needs full design

**Data per facility:**
```
name:        "Lecture Hall A"
type:        LECTURE_HALL | LABORATORY | MEETING_ROOM | AUDITORIUM | EQUIPMENT | SPORTS_FACILITY | OTHER
description: "Main lecture hall with projector and 200 seats"
location:    "Building C, Floor 2"
capacity:    200
status:      ACTIVE | OUT_OF_SERVICE | UNDER_MAINTENANCE
imageUrl:    "/uploads/facility-1.jpg"
```

**User actions:**
- Browse/search facilities (filter by type, status, capacity)
- View facility details
- (Admin) Create / Edit / Delete facility

**Design needs:**
- Card grid layout for browsing
- Search bar + filter dropdowns
- Status badges (green=Active, yellow=Maintenance, red=Out of Service)
- Detail modal or page
- (Admin) Create/Edit form

---

### 4. Booking Management (`/bookings`)
**Status:** Stub — needs full design

**Data per booking:**
```
facility:      Facility object (name, location)
bookingDate:   "2026-04-15"
startTime:     "09:00"
endTime:       "11:00"
purpose:       "Guest Lecture on AI"
attendeeCount: 45
status:        PENDING | APPROVED | REJECTED | CANCELLED
adminRemarks:  "Approved. Please clean up after."
requestedBy:   User object (name, email)
reviewedBy:    User object (admin who reviewed)
```

**User actions:**
- Create new booking (select facility, date, time, purpose, attendees)
- View "My Bookings" list
- Cancel a pending booking
- (Admin) View all bookings
- (Admin) Approve / Reject with remarks

**Design needs:**
- Booking form (date picker, time picker, facility dropdown)
- Booking list with status tabs (All | Pending | Approved | Rejected)
- Status badges with colors
- Admin approval view with remarks textarea
- Conflict warning if time slot taken

---

### 5. Maintenance Tickets (`/tickets`)
**Status:** Stub — needs full design

**Data per ticket:**
```
title:          "Projector not working"
description:    "The projector in Room 201 shows no signal..."
category:       ELECTRICAL | PLUMBING | HVAC | IT_NETWORK | FURNITURE | CLEANING | SECURITY | OTHER
priority:       LOW | MEDIUM | HIGH | CRITICAL
status:         OPEN | IN_PROGRESS | RESOLVED | CLOSED | REJECTED
location:       "Building A, Room 201"
contactPhone:   "0771234567"
imageUrls:      ["img1.jpg", "img2.jpg", "img3.jpg"]  (up to 3)
assignedTo:     User object (technician)
resolutionNotes: "Replaced HDMI cable, projector working now"
createdBy:      User object
comments:       Comment[] (thread of messages)
```

**Comment data:**
```
content:   "Technician will visit tomorrow at 10 AM"
author:    User object (name, profilePictureUrl)
createdAt: timestamp
```

**User actions:**
- Create ticket (form with image upload, up to 3 images)
- View ticket list (filter by status, priority, category)
- View ticket detail with comment thread
- Add comments to a ticket
- (Admin) Assign ticket to technician
- (Admin/Technician) Update status, add resolution notes

**Design needs:**
- Ticket creation form with drag-and-drop image upload
- Ticket list with priority/status color coding
- Ticket detail page with:
  - Status timeline/workflow visualization
  - Image gallery
  - Comment thread (like chat)
  - Assignment section
- Priority badges: LOW=gray, MEDIUM=blue, HIGH=orange, CRITICAL=red
- Category icons

---

### 6. Notifications (`/notifications`)
**Status:** Done — functional, ready for design polish

**Data per notification:**
```
title:        "Booking Approved"
message:      "Your booking for Lecture Hall A on March 25 has been approved."
type:         BOOKING_APPROVED | BOOKING_REJECTED | TICKET_STATUS_CHANGED | TICKET_ASSIGNED | NEW_COMMENT | SYSTEM
referenceUrl: "/bookings"
read:         true/false
createdAt:    timestamp (shown as "2 hours ago")
```

**Current features:**
- Filter tabs: All | Unread | Bookings | Tickets | System
- Type-colored cards with icons
- Mark as read / Mark all as read
- Delete individual notifications
- Bell icon in navbar with unread count badge (polls every 30s)

**Type color mapping:**
| Type | Color | Icon |
|---|---|---|
| BOOKING_APPROVED | Green | CheckCircle |
| BOOKING_REJECTED | Red | XCircle |
| TICKET_STATUS_CHANGED | Blue | Wrench |
| TICKET_ASSIGNED | Purple | UserPlus |
| NEW_COMMENT | Yellow | ChatBubble |
| SYSTEM | Gray | Bell |

---

### 7. Admin Panel (`/admin`)
**Status:** Stub — needs design

**Should include:**
- User management table (view all users, change roles)
- Booking approvals queue
- System-wide notification sender
- Overview stats (total users, pending bookings, open tickets)

---

## Navigation Structure

**Top navbar (always visible when logged in):**
```
[Smart Campus]   Home   Facilities   Bookings   Tickets   [Bell+Badge]   [UserName]   [Logout]
```

- Bell icon links to `/notifications`
- Red badge shows unread count (hidden when 0, shows "9+" if >9)
- Nav items highlight when active (indigo background)
- Mobile: nav links hidden (needs hamburger menu or bottom nav)

---

## Current Design Tokens

**Colors (Tailwind):**
- Primary: `indigo-600` / `indigo-700`
- Backgrounds: `gray-50` (page), `white` (cards/navbar)
- Text: `gray-900` (headings), `gray-600` (body), `gray-400` (muted)
- Success: `green-600` / `green-50`
- Error: `red-600` / `red-50`
- Warning: `yellow-600` / `yellow-50`
- Info: `blue-600` / `blue-50`
- Accent: `purple-600` / `purple-50`

**Typography:**
- Headings: `text-2xl font-bold` (page titles)
- Subheadings: `text-lg font-semibold`
- Body: `text-sm` to `text-base`
- Labels: `text-sm font-medium`
- Muted: `text-xs text-gray-400`

**Spacing:**
- Page: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`
- Cards: `p-4` to `p-8`, `rounded-lg`, `border border-gray-200`
- Gaps: `gap-3` to `gap-6`

**Components:**
- Buttons: `px-4 py-2 rounded-lg font-medium transition-colors`
- Badges: `px-2 py-0.5 rounded-full text-xs font-medium`
- Inputs: Tailwind form defaults with `rounded-lg border-gray-300`

**Breakpoints:**
- Mobile first (default)
- `sm:` 640px (tablet)
- `lg:` 1024px (desktop)

---

## Design Deliverables Needed

1. **Consistent design system** — unified across all pages
2. **Dashboard** — stats, quick actions, recent activity
3. **Facilities** — card grid, search/filter, detail view, CRUD forms
4. **Bookings** — booking form, list with status tabs, admin approval view
5. **Tickets** — creation form with image upload, detail page with comments, status workflow
6. **Admin panel** — user table, approval queue, stats
7. **Mobile responsive** — hamburger menu or bottom nav for mobile
8. **Empty states** — for when lists are empty
9. **Loading states** — spinners, skeleton loaders
10. **Error states** — form validation, API error feedback

---

## Constraints

- Must use **Tailwind CSS** (no external CSS frameworks like Bootstrap)
- Icons from **react-icons** (Heroicons v2 preferred)
- Toast notifications via **react-hot-toast**
- Date formatting via **dayjs**
- No additional UI libraries unless discussed
