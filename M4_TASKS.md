# Member 4 (M4) — Auth & Notifications Task List

> Module D: Notifications | Module E: Authentication
> Group SORA — IT3030 PAF 2026
> Branch: `feature/m4-notifications`

---

## PHASE 1 — Backend: Notification Service & Controller (Auth already done)

### 1.1 NotificationService.java
- [x] Create `NotificationService.java` in `/service/`
- [x] `getAll(Long userId)` — fetch all notifications for a user
- [x] `getUnread(Long userId)` — fetch only unread notifications
- [x] `getUnreadCount(Long userId)` — return unread count
- [x] `createNotification(Long recipientId, String title, String message, NotificationType type, String referenceUrl)` — create & save
- [x] `markAsRead(Long notificationId, Long userId)` — mark single as read (verify ownership)
- [x] `markAllAsRead(Long userId)` — mark all as read for a user
- [x] `deleteNotification(Long notificationId, Long userId)` — delete single (verify ownership)

### 1.2 NotificationController.java
- [x] Create `NotificationController.java` in `/controller/`
- [x] `GET /api/notifications` — list all notifications for logged-in user
- [x] `GET /api/notifications/unread` — list unread only
- [x] `GET /api/notifications/unread/count` — return `{ count: N }`
- [x] `POST /api/notifications` — create notification (admin/system use)
- [x] `PUT /api/notifications/{id}/read` — mark one as read
- [x] `PUT /api/notifications/read-all` — mark all as read
- [x] `DELETE /api/notifications/{id}` — delete one notification
- [x] Add proper `@Valid` request validation
- [x] Add proper error handling (404 if not found, 403 if not owner)

### 1.3 DTOs
- [x] Create `CreateNotificationRequest.java` — validated DTO for POST
- [x] Create `NotificationResponse.java` — response DTO (don't expose raw entity)

### 1.4 Backend Testing
- [ ] Test all 7 endpoints with Postman
- [ ] Verify 401 without token
- [ ] Verify 403/404 for wrong user/missing notification
- [ ] Verify pagination/ordering (newest first)

---

## PHASE 2 — Frontend: Notifications Page

### 2.1 NotificationsPage.jsx — Full UI
- [x] Fetch and display all notifications on page load
- [x] Show notification cards: title, message, type badge, timestamp
- [x] Visual difference between read and unread (bold/highlight)
- [x] "Mark as read" button on each unread notification
- [x] "Mark all as read" button at the top
- [x] "Delete" button on each notification
- [x] Empty state — friendly message when no notifications
- [x] Loading spinner while fetching
- [x] Error handling with toast messages

### 2.2 Filter & Sort
- [x] Filter tabs: All | Unread | by Type (Booking, Ticket, System)
- [x] Notifications sorted newest-first (default from API)

### 2.3 Update notificationService.js
- [x] Add `deleteNotification(id)` method
- [x] Add `createNotification(data)` method (for admin testing)
- [x] Verify all methods match the new backend endpoints

---

## PHASE 3 — Frontend: Notification Bell in Navbar

### 3.1 MainLayout.jsx — Bell Icon with Badge
- [x] Add bell icon (react-icons) next to user profile
- [x] Show red badge with unread count
- [x] Poll for unread count every 30 seconds (or on page focus)
- [x] Click bell → navigate to `/notifications`
- [x] Hide badge when count is 0

---

## PHASE 4 — Integration: Auto-trigger Notifications

### 4.1 Helper Method for Other Modules
- [x] Expose `NotificationService.createNotification()` as a clean API
- [ ] Document how M2/M3 should call it from their services:
  - M2: `BOOKING_APPROVED` / `BOOKING_REJECTED` → notify booker
  - M3: `TICKET_ASSIGNED` → notify assignee
  - M3: `NEW_COMMENT` → notify ticket owner
  - M3: `TICKET_STATUS_CHANGED` → notify ticket creator

### 4.2 Seed / Demo Notifications
- [ ] Create a `/api/notifications/seed` endpoint (dev only) to generate sample notifications for demo/viva
- [ ] OR create a Postman collection to seed test data

---

## PHASE 5 — Polish & Creativity (bonus marks)

### 5.1 Extra Features (pick 2-3)
- [ ] Toast popup when new notification arrives (react-hot-toast)
- [x] Relative timestamps ("2 minutes ago" using dayjs)
- [x] Notification type icons (different icon per type)
- [ ] Click notification → navigate to related page (referenceUrl)
- [ ] Swipe-to-dismiss on mobile
- [x] Dark/light notification cards based on read status
- [ ] Bulk select & delete

### 5.2 Admin Panel (if time permits)
- [ ] Admin can view all users
- [ ] Admin can send system-wide notifications
- [ ] Admin can change user roles (USER ↔ ADMIN)

---

## PHASE 6 — Git, Documentation & Viva Prep

### 6.1 Version Control
- [ ] Clean commit history on `feature/m4-notifications`
- [ ] Create PR → `dev` with proper description
- [ ] Review & merge into `dev`
- [ ] Final team merge `dev` → `main`

### 6.2 Postman Collection
- [ ] Export Postman collection with all 7+ endpoints
- [ ] Include sample request bodies and auth headers
- [ ] Save to `/docs/M4-Notifications.postman_collection.json`

### 6.3 Viva Prep
- [ ] Demo login flow (Google OAuth → JWT)
- [ ] Demo all notification CRUD in Postman
- [ ] Demo notifications page in browser
- [ ] Demo bell badge updating in real-time
- [ ] Be ready to explain: JWT flow, Spring Security config, role-based access

---

## Summary — What Gets You Marks

| Category | Marks | Your Evidence |
|----------|-------|---------------|
| REST API | 30 | 7 endpoints (GET, POST, PUT, DELETE) with validation |
| Client Web App | 15 | NotificationsPage + bell badge + filters |
| Authentication | 10 | Google OAuth + JWT (already done) |
| Version Control | 10 | Feature branch, clean commits, PRs |
| Documentation | 15 | Postman collection, README, code comments |
| Creativity | 10 | Real-time badge, toast alerts, relative time |
