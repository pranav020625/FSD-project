# Hostel Management System (HostelSphere)

A modern, production-ready, full-stack **Hostel Management System** built with **Node.js, Express.js, MongoDB Atlas (Mongoose), and Vanilla JavaScript**.

Designed for colleges, universities, and residential campuses to streamline room occupancy, fee collections, student records, grievances, visitor passes, and institutional announcements.

---

## 🚀 Live Demo & Development Credentials

* **Web Portal URL:** `http://localhost:5000`
* **API Health Check:** `http://localhost:5000/api/health`

### 🔑 Pre-seeded Demo Accounts

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Chief Warden (Admin)** | `admin@hostel.com` | `Admin@123` | Full access to manage rooms, fees, students, notices |
| **Student 1** | `aarav@hostel.com` | `Student@123` | Allocated to Room A-101 (B.Tech CSE, 3rd Year) |
| **Student 2** | `rohan@hostel.com` | `Student@123` | Allocated to Room A-101 (Roommate with Aarav) |
| **Student 3** | `ananya@hostel.com` | `Student@123` | Allocated to Room B-101 (B.Tech ECE, 2nd Year) |

> ⚠️ **Note:** The passwords above are for local development/demonstration purposes and should be replaced with strong secrets in production.

---

## 🌟 Key Features

### 👨‍💼 Administrator / Warden Portal
* **Live Dashboard & Analytics:** Real-time metrics on total students, occupied beds, pending fees, active grievances, and visitor passes. Interactive visual charts powered by Chart.js.
* **Student Directory:** Full CRUD operations, roll number lookup, filtering by branch, year, status, and assigned room.
* **Room & Bed Management:** Visual card layout with live capacity progress bars. Assign and relocate students with automated capacity checks and duplicate protection.
* **Hostel Fee Invoicing:** Generate fee invoices, record offline/online payments, auto-calculate outstanding balances, and dynamically flag overdue accounts.
* **Grievance Resolution Desk:** Filter complaints by urgency and category (Electricity, Plumbing, Mess, Internet). Add official warden response notes and mark tickets resolved.
* **Visitor Gate Pass System:** Digital security log to approve guest requests and log arrival/departure timestamps.
* **Broadcast Notice Board:** Publish campus circulars with expiration date scheduling and urgency tags.
* **Reports & Data Export:** Generate academic cohort reports and download one-click student directory CSV exports.

### 🎓 Student Resident Portal
* **Resident Dashboard:** At-a-glance view of allocated room, roommates, fee balance, active complaints, and latest notices.
* **My Living Space:** Detailed room specifications, list of assigned roommates with contact links, and included room facilities.
* **Fee Status & Receipts:** Itemized breakdown of invoiced fees, payment history, balance due, and printable payment voucher receipts.
* **Grievance Lodgement:** Submit maintenance and food quality complaints with priority tags and track warden resolution updates in real time.
* **Visitor Pass Requests:** Submit visitor entry requests for parents and guests with date and timing details.
* **Institutional Bulletin Board:** View active circulars, mess timings, and emergency rules.
* **Profile Management:** Update contact phone, emergency guardian details, and permanent address.

---

## 🛠️ Technologies Used

### Backend
* **Runtime:** Node.js (v18+)
* **Framework:** Express.js
* **Database & ODM:** MongoDB Atlas / Mongoose
* **Authentication:** JSON Web Tokens (JWT) & bcryptjs password hashing
* **Security:** Helmet, CORS, and Express-Rate-Limit
* **Environment Variables:** dotenv

### Frontend
* **Core:** HTML5 Semantic Structure & Vanilla JavaScript (ES6+ Modular Architecture)
* **Styling:** Vanilla CSS3 Design System with Custom Variables & Glassmorphism
* **Icons:** Font Awesome 6
* **Visualizations:** Chart.js
* **Responsiveness:** Desktop, Laptop, Tablet, and Mobile devices (375px to 1920px)

---

## 📁 Project Structure

```text
hostel-management-system/
│
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── controllers/
│   │   ├── authController.js      # Register, Login, Me, Update Profile
│   │   ├── studentController.js   # Student CRUD & room sync
│   │   ├── roomController.js      # Room CRUD & student assignment
│   │   ├── feeController.js       # Invoicing & payment recording
│   │   ├── complaintController.js # Grievance tracking & resolution
│   │   ├── visitorController.js   # Visitor pass requests & gate logs
│   │   ├── noticeController.js    # Bulletin announcements
│   │   └── reportController.js    # Aggregations & institutional stats
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT authentication guard
│   │   ├── roleMiddleware.js      # Role authorization (Admin/Student)
│   │   └── errorMiddleware.js     # Centralized error handler
│   ├── models/
│   │   ├── User.js                # Auth credentials model
│   │   ├── Student.js             # Student demographic model
│   │   ├── Room.js                # Room & occupancy model
│   │   ├── Fee.js                 # Fee invoice model
│   │   ├── Complaint.js           # Grievance model
│   │   ├── Visitor.js             # Visitor pass model
│   │   └── Notice.js              # Announcement model
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── roomRoutes.js
│   │   ├── feeRoutes.js
│   │   ├── complaintRoutes.js
│   │   ├── visitorRoutes.js
│   │   ├── noticeRoutes.js
│   │   └── reportRoutes.js
│   ├── seed/
│   │   ├── seedAdmin.js           # Quick admin creation script
│   │   └── seedSampleData.js      # Comprehensive realistic Indian college data
│   ├── tests/
│   │   └── api.test.js            # Automated backend integration test suite
│   └── server.js                  # Main server & static asset host
│
├── frontend/
│   ├── index.html                 # Modern landing page
│   ├── login.html                 # Portal login with demo quick-fill
│   ├── register.html              # Student registration page
│   ├── admin/
│   │   ├── dashboard.html         # Admin live analytics & charts
│   │   ├── students.html          # Student directory & management
│   │   ├── rooms.html             # Room visual cards & bed allocations
│   │   ├── fees.html              # Fee invoicing & payment recording
│   │   ├── complaints.html        # Grievance management desk
│   │   ├── visitors.html          # Visitor gate pass log
│   │   ├── notices.html           # Broadcast bulletin board
│   │   └── reports.html           # Institutional reports & CSV export
│   ├── student/
│   │   ├── dashboard.html         # Student living overview
│   │   ├── profile.html           # Resident profile & contacts
│   │   ├── room.html              # My room & roommate details
│   │   ├── fees.html              # My invoices & payment receipts
│   │   ├── complaints.html        # Lodge & track grievances
│   │   ├── visitors.html          # Request visitor passes
│   │   └── notices.html           # View hostel announcements
│   ├── css/
│   │   ├── style.css              # Core tokens, buttons, badges, modals
│   │   ├── dashboard.css          # Sidebar, topbar, grid layout
│   │   └── responsive.css         # Responsive mobile breakpoints
│   └── js/
│       ├── api.js                 # Central fetch client & toast helper
│       ├── auth.js                # Auth state, login/logout, route guards
│       ├── dashboard.js           # Chart.js metrics & dashboard widgets
│       ├── students.js            # Student CRUD & modal forms
│       ├── rooms.js               # Room allocation controllers
│       ├── fees.js                # Fee payment workflows & receipt modal
│       ├── complaints.js          # Grievance lodgement & warden reply
│       ├── visitors.js            # Visitor approval & timing log
│       ├── notices.js             # Notice broadcast controller
│       └── reports.js             # Analytics charts & CSV generation
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Prerequisites & Setup

### Prerequisites
* **Node.js:** v18.0.0 or higher
* **npm:** v9.0.0 or higher
* **MongoDB:** Local MongoDB Server or MongoDB Atlas Account

---

## 📦 Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd hostel-management-system
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to create `.env`:
   ```bash
   cp .env.example .env
   ```

   Configure your parameters in `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/hostel_management_system
   JWT_SECRET=supersecret_hostel_jwt_key_2026_dev_prod
   NODE_ENV=development
   ```

4. **Seed Sample Data (Admin, Students, Rooms, Fees, Notices):**
   ```bash
   npm run seed
   ```

5. **Start the Application:**
   ```bash
   npm start
   ```
   Or for development with automatic reloads:
   ```bash
   npm run dev
   ```

6. **Open in Web Browser:**
   Visit `http://localhost:5000`

---

## 🌐 MongoDB Atlas Setup Instructions

To deploy using cloud-hosted **MongoDB Atlas**:

1. **Create an Account:** Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register.
2. **Build a Database Cluster:** Select the Free M0 Sandbox cluster in your desired region.
3. **Configure Database Access:**
   * Create a database user with username and strong password.
   * Grant `Read and write to any database` permissions.
4. **Configure Network Access:**
   * Add IP Address `0.0.0.0/0` (Allow Access from Anywhere) or your server's static IP.
5. **Get Connection String:**
   * Click **Connect** > **Drivers** > Select **Node.js**.
   * Copy the connection URI string.
6. **Update `.env`:**
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/hostel_management_system?retryWrites=true&w=majority
   ```
7. **Run Seeding & Server:**
   ```bash
   npm run seed
   npm start
   ```

---

## 🧪 Automated Testing

Run the built-in automated backend integration test suite:

```bash
npm test
```

This tests:
* `POST /api/auth/register` & `POST /api/auth/login`
* `GET /api/auth/me` with JWT authentication
* Role-based authorization & route protection
* Student creation and room allocation synchronization
* Capacity enforcement (blocking assignments when rooms are full)
* Fee creation & automatic payment status computation
* Grievance lodgement, response, and resolution
* Visitor pass requests, warden approval, and timestamps
* Notice board publishing and active date filtering
* MongoDB live statistical aggregations

---

## 📡 Complete REST API Reference

### 🔐 Authentication
* `POST /api/auth/register` - Register a new resident student
* `POST /api/auth/login` - Authenticate student or warden and retrieve JWT token
* `GET /api/auth/me` - Get profile of currently authenticated user
* `PUT /api/auth/profile` - Update user profile details
* `POST /api/auth/logout` - Invalidate session

### 👥 Student Management
* `GET /api/students` - List all students (Search, filter by branch/year/status, pagination) `[Admin]`
* `GET /api/students/:id` - Get student details with room, fees, and grievance history `[Private]`
* `POST /api/students` - Register a new student with room allocation `[Admin]`
* `PUT /api/students/:id` - Update student information & room assignments `[Admin]`
* `DELETE /api/students/:id` - Delete student record and unassign room `[Admin]`

### 🛏️ Room Management
* `GET /api/rooms` - List all rooms with filter by block/type/occupancy `[Private]`
* `GET /api/rooms/:id` - Get room details with assigned roommates list `[Private]`
* `POST /api/rooms` - Create a new hostel room `[Admin]`
* `PUT /api/rooms/:id` - Edit room capacity and parameters `[Admin]`
* `DELETE /api/rooms/:id` - Delete room and unassign allocated students `[Admin]`
* `POST /api/rooms/:id/assign` - Assign student to room with capacity check `[Admin]`
* `POST /api/rooms/:id/remove` - Remove student from room `[Admin]`

### 💳 Fee Management
* `GET /api/fees` - List all fees (Admin) or current student fees (Student) `[Private]`
* `GET /api/fees/:id` - Get single fee invoice `[Private]`
* `POST /api/fees` - Create fee invoice for student `[Admin]`
* `PUT /api/fees/:id` - Update invoice / record payment `[Admin]`
* `DELETE /api/fees/:id` - Delete fee record `[Admin]`

### 📢 Grievances & Complaints
* `GET /api/complaints` - List complaints (filtered for students, all for warden) `[Private]`
* `GET /api/complaints/:id` - Get complaint details `[Private]`
* `POST /api/complaints` - Lodge a new complaint `[Private]`
* `PUT /api/complaints/:id` - Update status / add warden response `[Private]`
* `DELETE /api/complaints/:id` - Remove complaint `[Private]`

### 🏷️ Visitor Gate Passes
* `GET /api/visitors` - List visitor passes `[Private]`
* `GET /api/visitors/:id` - Get visitor pass details `[Private]`
* `POST /api/visitors` - Submit visitor entry request `[Private]`
* `PUT /api/visitors/:id` - Approve / Reject pass or log in/out times `[Private]`
* `DELETE /api/visitors/:id` - Delete visitor record `[Private]`

### 📌 Notices & Announcements
* `GET /api/notices` - List active announcements (Students) or all (Admin) `[Public/Private]`
* `GET /api/notices/:id` - Get notice details `[Public/Private]`
* `POST /api/notices` - Broadcast announcement `[Admin]`
* `PUT /api/notices/:id` - Edit announcement `[Admin]`
* `DELETE /api/notices/:id` - Delete notice `[Admin]`

### 📊 Reports & Analytics
* `GET /api/reports/dashboard-stats` - Live aggregation stats for dashboard cards & charts `[Admin]`
* `GET /api/reports/detailed` - Institutional distribution by branch, year, and block `[Admin]`

---

## 🔮 Future Improvements

1. **Online Payment Gateway:** Integration with Razorpay / Stripe for automated instant fee settlement.
2. **Biometric & QR Gate Check-in:** QR-code based instant visitor verification at the campus security gate.
3. **SMS & Email Notifications:** Automated SMS alerts to parents for visitor pass entries and payment reminders.
4. **Mess & Attendance Tracking:** Daily biometric meal attendance and customized diet preference selection.
5. **Inventory & Asset Tracking:** Tracking hostel assets (furniture, electrical appliances, sports equipment).

---

## 📄 License

This project is licensed under the ISC License. Open for educational and institutional deployment.
