# Carwash Management App

## Overview
The **Carwash Management App** is a React Native mobile application designed for carwash businesses to manage services (vehicles and carpets), attendants, and payments. The app supports offline-first functionality, with local data storage and synchronization to MongoDB when internet connectivity is available.

---

## Tech Stack
- **Frontend:** React Native
- **Styling:** NativeWind (native-tailwind)
- **Local storage:** Realm DB / WatermelonDB / SQLite (recommended: Realm for easier sync with MongoDB Atlas)
- **Backend/DB:** MongoDB Atlas (with Realm Sync or custom Node.js API)
- **Build System:** React Native CLI or Expo

---

## Features
### Onboarding & Authentication
- Welcome slides (shown once per install).
- Phone number + password authentication.
- Password reset with OTP.
- JWT-based session management.
- Optional biometric login.

### Roles & Permissions
- **Owner/Manager:** Manage attendants, settings, and view reports.
- **Attendant:** Record jobs (vehicle/carpet).

### Vehicle Jobs
- Record vehicle by registration number.
- Select attendant & vehicle category (Motorcycle, Sedan, SUV, etc.).
- Auto-fill price from category, editable.
- Mark payment status (paid/unpaid/partial).
- Option to attach notes and photos.

### Carpet Jobs
- Record by customer name.
- Select attendant.
- Enter amount.
- Mark payment status.

### Attendant Management
- Add, edit, and deactivate attendants.

### Payments
- Payment methods: cash, mobile money (M-Pesa), card (optional future integration).
- Receipt view and share (PDF optional).

### Offline-first & Sync
- Works fully offline.
- Automatic and manual sync modes.
- Conflict handling (last-writer-wins, with manager override for critical fields).

### Reporting
- Daily summary: jobs, revenue, and per-attendant performance.
- Filters by date, category, attendant.
- Export to CSV.

### Settings
- Business details (name, address, pricing).
- Sync preferences (auto/manual).
- Notifications for sync reminders.

---

## Data Models
### Attendant
```json
{
  _id: ObjectId,
  name: string,
  phone: string,
  role: "attendant" | "manager",
  active: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### VehicleJob
```json
{
  _id: ObjectId,
  registrationNumber: string,
  category: string,
  attendantId: ObjectId,
  price: number,
  notes?: string,
  photos?: [string],
  payment: { status: "paid" | "unpaid" | "partial", method?: string, amountPaid?: number },
  createdAt: Date,
  updatedAt: Date,
  syncStatus?: "pending" | "synced" | "failed" | "conflict"
}
```

### CarpetJob
```json
{
  _id: ObjectId,
  customerName: string,
  attendantId: ObjectId,
  amount: number,
  notes?: string,
  payment: { status: "paid" | "unpaid" | "partial", method?: string, amountPaid?: number },
  createdAt: Date,
  updatedAt: Date,
  syncStatus?: "pending" | "synced" | "failed" | "conflict"
}
```

---

## API Endpoints (Example)
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/reset-password`
- `GET /attendants`
- `POST /jobs` (vehicle or carpet)
- `PUT /jobs/:id`
- `POST /sync/push`
- `GET /sync/pull?since=timestamp`
- `GET /reports/daily`

---

## Sync Workflow
1. Jobs created/edited offline are queued locally.
2. On connectivity, pending changes are pushed to server.
3. Server responds with success/failure/conflict.
4. Client pulls server changes since last sync timestamp.

---

## UI / UX
- Clean NativeWind UI.
- Tabs for Vehicles and Carpets.
- Floating Action Button (FAB) for adding new jobs.
- Reports and Sync status in settings.

---

## Non-Functional Requirements
- **Performance:** Job creation <200ms.
- **Security:** JWT tokens, encrypted storage, secure credential handling.
- **Scalability:** Multi-business support (isolated data).
- **Accessibility:** Proper contrast, labels, and touch target sizes.

---

## Milestones
**MVP (2–4 weeks):** Onboarding, authentication, add/view jobs (vehicles/carpets), local storage, attendants list, basic sync.

**Polish (2–3 weeks):** Reports, payments, improved sync handling, conflict resolution.

**Production (2–4 weeks):** QA, monitoring (Sentry), app store deployment.

---

## Next Steps
1. Confirm local DB (Realm recommended).
2. Build wireframes for key flows.
3. Define API in detail (OpenAPI).
4. Start MVP sprint backlog.

---

## License
TBD

