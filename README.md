# Design Change Impact Predictor for Product Lifecycle Management (PLM)

An enterprise-grade full-stack web application designed for Product Lifecycle Management (PLM). It utilizes Bill of Materials (BOM) graph traversal algorithms and predictive severity scoring to evaluate the multi-tier impact of engineering design changes before implementation.

---

## 🌟 Key Features

- **Mandatory Authentication & Protected Routes**: Email + Password sign up and log in, hashed with bcrypt and managed via JWT session tokens.
- **Role-Based Access Control (RBAC)**:
  - 👨‍💻 **Engineer**: Propose change requests and view automated impact predictions.
  - 📊 **Manager**: Approve or reject change requests with mandatory audit trail rationale.
  - 🛡️ **Admin**: Full system governance and user access control.
- **Multi-Level BOM Hierarchy & Where-Used Explorer**: Interactive tree view of product assemblies, sub-assemblies, and child components with live search and reverse dependency tracing.
- **Automated Impact Prediction Engine**: Traverses the BOM graph to evaluate connected component dependencies and generates:
  - 0-100 Severity Impact Score (Critical, High, Medium, Low)
  - Estimated Cost Delta ($)
  - Estimated Lead Time Schedule Delay (Days)
  - Model Confidence Score (%)
  - Plain-Language AI Engineering Rationale
- **Executive Analytics Dashboard**: Key KPI metric cards, component category distribution charts (Recharts), and status matrix.
- **Audit Trail & Governance Log**: Complete historical record of change request submissions, approval decisions, comments, user roles, and timestamps.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Tailwind CSS v4, Lucide React Icons, Recharts
- **Backend**: Node.js, Express.js
- **Database**: SQLite with indexed tables for fast graph traversal
- **Authentication**: JWT (`jsonwebtoken`) & password hashing (`bcryptjs`)

---

## 📦 Project Structure

```
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # Navbar, Create CR Modal
│   │   ├── context/            # AuthContext (JWT & Session State)
│   │   ├── pages/              # Auth, Dashboard, Products/BOM, Change Requests, Impact Details, Audit Logs
│   │   ├── api.js              # Axios instance with token interceptors
│   │   ├── App.jsx             # Router & Protection Layout
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Express Backend & Database
│   ├── database/
│   │   ├── db.js               # SQLite connection & Promise wrappers
│   │   ├── schema.js           # Auto-migrations & foreign key indexes
│   │   └── seed.js             # Pre-seeded PLM products, BOM tree, and demo ECN
│   ├── engine/
│   │   └── impactPredictor.js  # BOM graph traversal & prediction scoring engine
│   ├── middleware/
│   │   └── auth.js             # JWT & role protection middleware
│   ├── routes/                 # Auth, Products, Parts, Change Requests, Dashboard, Audit Logs
│   ├── config.js
│   ├── server.js               # Main Express entry point
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18+)
- npm

### 1. Install Backend Dependencies & Start Server
```bash
cd server
npm install
node server.js
```
*The backend server runs on `http://localhost:5000` and automatically initializes database schemas and demo seed data.*

### 2. Install Frontend Dependencies & Start App
```bash
cd client
npm install
npm run dev
```
*The React frontend app runs on `http://localhost:3000`.*

---

## 🔑 Demo Account Credentials

Use the 1-click demo buttons on the login screen or enter these credentials:

| Persona | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Lead Avionics Engineer** | `engineer@acmplm.com` | `Password123!` | Engineer |
| **Engineering Program Manager** | `manager@acmplm.com` | `Password123!` | Manager |
| **Chief Technology Officer** | `admin@acmplm.com` | `Password123!` | Admin |

---

## 📊 Database Schema Summary

- `users`: User profiles, hashed passwords, and roles (`engineer`, `manager`, `admin`).
- `products`: High-tech products (e.g., Apex-V Drone, Titan-EV Power Pack).
- `parts`: BOM components with hierarchical `parent_part_id`, category, supplier, cost, and lead time.
- `change_requests`: Engineering Change Requests (ECN) targeting specific components.
- `impact_predictions`: Automated risk predictions for affected parts.
- `audit_logs`: Governance audit logs recording status changes and approval comments.

---

## 📄 License
ISC License
