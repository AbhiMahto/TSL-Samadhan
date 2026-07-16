# 🤝 Samadhan Portal (TSL Employee Gate Pass Request System)

Samadhan is an enterprise-grade mobile-first portal designed for **Tata Steel Limited (TSL)** employees to digitize, streamline, and automate the request-raising, routing, and approval workflow for material gate passes. It eliminates manual paperwork, physical signature hunting, and operational delays.

---

## 📋 Table of Contents
1. [Executive Summary & Problem Statement](#-executive-summary--problem-statement)
2. [Key Features](#-key-features)
3. [System Architecture](#-system-architecture)
4. [Request Workflow Lifecycle](#-request-workflow-lifecycle)
5. [Database Schema Reference](#-database-schema-reference)
6. [API Route Reference](#-api-route-reference)
7. [Installation & Setup Guide](#-installation--setup-guide)
8. [Verification Flow](#-verification-flow)
9. [📊 PPT Slide-by-Slide Presentation Guide](#-ppt-slide-by-slide-presentation-guide)

---

## 💡 Executive Summary & Problem Statement

### The Problem
At major manufacturing plants like Tata Steel, moving materials (both normal and hazardous) in and out of division gates requires rigorous authorization. Traditionally, this process relied on paper forms, manual approvals, physical hand-offs, and phone calls. This led to:
- **Lack of Tracking**: No central log of where a gate pass was stuck in the approval chain.
- **Delay in Clearances**: Significant time wasted seeking physical signatures from managers, IBMD, and Sales.
- **Security & Safety Risks**: Prone to unauthorized modifications or manual errors, especially when handling hazardous items.
- **Administrative Overhead**: Creating employee logins manually for large plant operations was slow and error-prone.

### The Solution: Samadhan
**Samadhan** is a digital solution that solves these bottlenecks:
- **Instant Digital Requests**: Employees raise gate passes directly from a mobile device.
- **Automated Workflow Routing**: Requests automatically route to supervisors, IBMD, and Sales based on the material type.
- **Robust Role-Based Control**: Enforces precise permissions across 5 roles (*Employee, Approver, IBMD, Sales, Administrator*).
- **Bulk Onboarding**: Seeding thousands of plant employees at once using admin Excel uploads.
- **Secure Activation**: Verify and active profiles with secure OTP verification.

#### 📱 App Preview
Here is a sneak peek of the **Samadhan Mobile App** (Sign-in and Home Dashboard):

<p align="center">
  <img src="screenshots/login.png" width="280" alt="Samadhan Login Screen" style="margin-right: 20px;" />
  <img src="screenshots/home.png" width="280" alt="Samadhan Home Dashboard" />
</p>

---

## ✨ Key Features
- **OTP Account Activation**: Secure first-time activation utilizing OTP verification (with simulated fallback for local development).
- **Hierarchical Structuring**: Built-in master models for Locations, Divisions, and Departments of Tata Steel.
- **Bulk Excel Provisioning & Central Registry**: Admins upload spreadsheet lists to onboard groups of employees instantly, feeding directly into the employee list directory.
  
  <p align="center">
    <img src="screenshots/admin%20upload.png" width="340" alt="Admin Excel Upload" style="margin-right: 20px;" />
    <img src="screenshots/list%20emp.png" width="340" alt="Employee Registry List" />
  </p>

- **Attachments Upload**: Upload up to 3 material verification photos/documents directly from the mobile app.
- **Dynamic Sequential Workflow**: Handles approval routing, conditional state checks for hazardous materials, and final closures.
- **Audit Logs & Progress Timelines**: Complete tracking showing who approved/rejected with time-stamps and remarks.
- **Email Alerts**: Automatic emails sent to designated approvers, IBMD, Sales, and employees on transition.

---

## 🏛️ System Architecture

The application is built on a clean, decoupled **Client-Server-Database** architecture. Below is a visual map of the system components and dependencies:

<p align="center">
  <img src="screenshots/arcj.png" width="800" alt="System Architecture Overview" />
</p>

```mermaid
graph TD
    subgraph Frontend [Expo Mobile App]
        View[UI Screen Components] -->|Read/Write State| Zustand[Zustand Store]
        Zustand -->|Retrieve Token| Storage[AsyncStorage]
        View -->|HTTP Request| Axios[Axios API Client with Interceptors]
    end

    subgraph Backend [Express.js API Server]
        Axios -->|JSON over HTTPS| Routes[Express Routes Router]
        Routes -->|Token Inspection| AuthMW[JWT Auth Middleware]
        AuthMW -->|Execute Business Logic| Controllers[Business Controllers]
        Controllers -->|Bulk Excel Import| Multer[Multer & XLSX Parser]
        Controllers -->|Send Alert Emails| Nodemailer[Nodemailer Mailer]
        Controllers -->|Verify Identity| OTP[Firebase OTP REST API / Mock fallback]
    end

    subgraph Database [Mongoose Connections]
        Controllers -->|Mongoose Queries| MongoDB[(MongoDB Atlas)]
    end
```

### Tech Stack Details
*   **Mobile App (Frontend)**: React Native with Expo (v51+), Zustand (State Store), Expo Router (File-based navigation), Tailwind CSS / NativeWind (Premium UI rendering), Axios (with request/response interceptors for JWT injection).
*   **Web Server (Backend)**: Node.js, Express.js, JWT (Token-based security), Multer (File uploads), XLSX (Excel parsing engine), Nodemailer (Alert dispatches).
*   **Database**: MongoDB Atlas managed cluster with Mongoose ORM.

---

## 🔄 Request Workflow Lifecycle

The portal implements a strict state machine routing pass requests based on item classification:

<p align="center">
  <img src="screenshots/worklfor.png" width="800" alt="Workflow State Machine Diagram" />
</p>

```mermaid
stateDiagram-v2
    [*] --> Draft: Employee creates request
    Draft --> Pending_Approver: Submit Request
    
    state Pending_Approver {
        [*] --> CheckApproverEmail
        CheckApproverEmail --> VerifyApproverRole
    }
    
    Pending_Approver --> Rejected: Approver Rejects (Add remarks)
    Pending_Approver --> Pending_IBMD: Approver Approves
    
    Pending_IBMD --> Rejected: IBMD Rejects (Add remarks)
    
    state Pending_IBMD {
        [*] --> CheckHazardous
        CheckHazardous --> NormalItem: Hazardous = No
        CheckHazardous --> HazardousItem: Hazardous = Yes
    }
    
    NormalItem --> Closed: IBMD inputs Lifting Date (Ends flow)
    HazardousItem --> Pending_Sales: IBMD Approves
    
    Pending_Sales --> Rejected: Sales Rejects (Add remarks)
    Pending_Sales --> Closed: Sales inputs Delivery Order (DO) No (Ends flow)
    
    Closed --> [*]
    Rejected --> [*]
```

### Step-by-Step Approval Walkthrough

Here is the exact journey of a material gate pass request, along with the actual screens:

#### 1️⃣ Step 1: Employee Raises Request
The requester fills out a structured gate pass form specifying the nature of items, Tata Steel plant area details, material metrics, and uploads up to 3 verification photos.

<p align="center">
  <img src="screenshots/submission.png" width="300" alt="Employee Request Submission" />
</p>

#### 2️⃣ Step 2: Supervisor Approval
The designated supervisor gets an email alert and reviews the request. They can either **Approve & Forward** it to the IBMD queue or **Reject** it (requires entering mandatory audit remarks).

<p align="center">
  <img src="screenshots/approver.png" width="300" alt="Supervisor Dashboard & Review Action" />
</p>

*If a supervisor needs to send a request back to draft, they enter rejection remarks:*

<p align="center">
  <img src="screenshots/remark.png" width="300" alt="Audit Rejection Remarks Input" />
</p>

#### 3️⃣ Step 3: IBMD Review & Branching
The request is audited by the **Industrial By-Product Management Division (IBMD)**.
* **For Normal Materials**: IBMD enters the scheduled **Lifting Date** which directly closes the request.
* **For Hazardous Materials**: IBMD reviews, approves, and forwards the ticket to Sales.

<p align="center">
  <img src="screenshots/ibmd.png" width="300" alt="IBMD Audit Queue" />
</p>

#### 4️⃣ Step 4: Sales DO Assignment (For Hazardous Items Only)
The Sales team verifies commercial clearances for hazardous materials, inputs the official **Delivery Order (DO) Number**, and closes the request.

<p align="center">
  <img src="screenshots/sales.png" width="300" alt="Sales DO Assignment" />
</p>

#### 5️⃣ Step 5: Gate Pass Closure
Once the final clearance is recorded, the request transitions to **Closed**. A full digital audit timeline is preserved showing everyone's signatures and timestamps.

<p align="center">
  <img src="screenshots/complte.png" width="300" alt="Completed Closed Request Details" />
</p>

---

## 🗄️ Database Schema Reference

The system utilizes five collections in MongoDB:

### 1. Employee Collection (`Employee`)
```javascript
{
  emp_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  password: { type: String, default: null }, // Null denotes inactive profile
  firstLogin: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  role: { type: String, enum: ['employee', 'admin', 'approver', 'ibmd', 'sales'] },
  createdAt: { type: Date, default: Date.now }
}
```

### 2. Request Collection (`Request`)
```javascript
{
  requestNo: { type: String, required: true, unique: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  employeeDetails: { emp_id: String, name: String, email: String },
  natureOfItems: { type: String, required: true },
  areaDetails: {
    location: String, locationId: ObjectId,
    division: String, divisionId: ObjectId,
    department: String, departmentId: ObjectId,
    pickupLocation: String
  },
  contactDetails: { contactPerson: String, contactNumber: String, userDept: String },
  approverDetails: { approverPNo: String, approverMailId: String },
  materialDetails: {
    itemType: String, itemCategory: String,
    hazardousItems: String, // 'Yes' or 'No'
    umc: String, umcRemarks: String, alloyType: String,
    itemDescription: String, quantity: Number, uom: String,
    weight: Number, remarks: String, reason: String
  },
  attachments: { attachment1: String, attachment2: String, attachment3: String },
  liftingDate: { type: String, default: null },
  doNo: { type: String, default: null },
  status: { type: String, enum: ['pending_approver', 'pending_ibmd', 'pending_sales', 'closed', 'rejected'] },
  timeline: [{
    status: String,
    actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    actionByName: String,
    actionByRole: String,
    remarks: String,
    timestamp: { type: Date, default: Date.now }
  }]
}
```

### 3. Master Data Collections (`Location`, `Division`, `Department`)
Stores TSL's organisational hierarchy to prevent manual entries and spelling mistakes:
- **Location**: `{ name: String, active: Boolean }`
- **Division**: `{ name: String, locationId: ObjectId, active: Boolean }`
- **Department**: `{ name: String, divisionId: ObjectId, active: Boolean }`

---

## 🔌 API Route Reference

All requests inside private dashboards expect a Bearer Token: `Authorization: Bearer <JWT_TOKEN>`.

### Authentication Router (`/api/auth`)
*   `POST /login`: Logs user in. Returns JWT token and details.
*   `POST /send-otp`: Sends mobile SMS OTP (or console-logged fallback) to register profile.
*   `POST /verify-otp`: Validates user-submitted OTP digits.
*   `POST /setup-password`: Sets initial password, deactivates `firstLogin` status, signs in.

### Request Router (`/api/requests`)
*   `POST /`: Initiates request (multipart/form-data for uploads).
*   `GET /my-requests`: Fetches requester's personal dashboard list.
*   `GET /pending`: Fetches lists pending review according to user role (Approver, IBMD, Sales).
*   `POST /:id/approver-approve`: Supervisor verification endpoint.
*   `POST /:id/ibmd-approve`: IBMD verification (collects `liftingDate` if non-hazardous).
*   `POST /:id/sales-close`: Sales validation (collects `doNo` to close hazardous pass).
*   `POST /:id/reject`: Rejection handler (returns request to draft, updates audit log).

---

## 🚀 Installation & Setup Guide

### 1. Database Setup
1. Set up a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Allow access from anywhere in Network Access (`0.0.0.0/0` for development).
3. Copy your Connection String (`mongodb+srv://...`).

### 2. Backend Config (`backend/`)
1. Create a `backend/.env` file:
   ```ini
   PORT=5001
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_signing_secret
   ADMIN_PASSWORD=admin123
   
   # Firebase Web App client config (Optional for actual SMS, empty for mock)
   FIREBASE_API_KEY=
   ```
2. Navigate & Run:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   *The server starts on port `5001` and hooks database models.*

### 3. Frontend Config (`frontend/`)
1. Create a `frontend/.env` file. Put your computer's local IP address (not localhost) if running on physical device:
   ```ini
   EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:5001
   ```
2. Navigate & Run:
   ```bash
   cd ../frontend
   npm install
   npx expo start
   ```
3. Use the **Expo Go** application on your mobile device to scan the QR code and load the app.

---

## ✅ Verification Flow

1.  **Login as Admin**: Use credentials `admin` and `admin123`. The app routes you to the file upload page.
2.  **Upload Employee Roster**: Upload `backend/employees.xlsx` containing test accounts (`EMP1001`, `EMP1002`, `EMP1003`). The console reports seeded profiles.
3.  **Account Setup**: 
    - Tap **Configure Account** on the mobile login screen.
    - Input Employee ID `EMP1001` and submit.
    - Check the development backend terminal or mobile alert for the **Mock OTP** (e.g. `123456`).
    - Input the OTP, set a password (e.g. `pass123`), and save.
4.  **Submit Gate Pass**: Log in as `EMP1001` / `pass123`. Raise a gate pass request, choose the supervisor's email address, and submit.
5.  **Run the Approval Loop**: Log in as the supervisor/approver to approve the request, then as IBMD, and finally as Sales (for hazardous materials) using the generated mock employee credentials.

---

## 📊 PPT Slide-by-Slide Presentation Guide
Use this structured roadmap to build your presentation slides for company reviews, engineering audits, or project evaluations.

### 🖼️ Slide 1: Title Slide (Project Launch)
*   **Slide Title**: Digitizing Material Clearances: The TSL Samadhan Portal
*   **Subtitle**: A Secure, Role-Based Employee Gate Pass Portal
*   **Slide Objective**: Hook the audience and outline the presentation structure.
*   **Key Talking Points**:
    *   Introduce Samadhan as an enterprise-grade mobile application designed specifically for Tata Steel Limited (TSL).
    *   Outline the mission: to eliminate paper, speed up gate pass requests, and build an auditable lifting history.
*   **Visual Suggestion**: Logo of Tata Steel beside a mockup image of the Samadhan mobile login screen.

### 🖼️ Slide 2: The Core Challenge (Current Pain Points)
*   **Slide Title**: Traditional Paper Gate Pass Pain Points
*   **Slide Objective**: Establish the business need and problems being solved.
*   **Key Talking Points**:
    *   *Lack of Visibility*: Employees don't know who has their gate pass request or where it is stuck.
    *   *Manual Friction*: Employees must track down supervisors, division managers, and sales officers physically.
    *   *Audit Vulnerabilities*: Physical registers are easily damaged, misplaced, or forged.
    *   *Lifting Delays*: Production delays caused by delayed material gate passes.
*   **Visual Suggestion**: A comparison chart or split graphic: "Manual Gate Pass (Slow, Unsecured)" vs. "Digital Request (Instant, Auditable)".

### 🖼️ Slide 3: Introducing Samadhan (The Value Proposition)
*   **Slide Title**: Introducing the Samadhan Portal
*   **Slide Objective**: Explain how the solution operates and its key features.
*   **Key Talking Points**:
    *   **Mobile-First Design**: Built with React Native & Expo so it runs easily on any iOS or Android phone inside the plant.
    *   **Automated Routing**: Directly notifies supervisors, IBMD, and Sales upon updates.
    *   **Pre-verified Master Data**: Ensures accurate data entry (Divisions, locations, and departments match TSL structures).
    *   **End-to-End Audits**: Every action is saved with the user's name, role, timestamp, and review remarks.
*   **Visual Suggestion**: High-level icon list displaying key capabilities (Mobile, Notifications, Master-Data, Audit Logs).

### 🖼️ Slide 4: System Architecture Overview
*   **Slide Title**: Decoupled, Secure System Architecture
*   **Slide Objective**: Walk technical stakeholders through the stack.
*   **Key Talking Points**:
    *   *Frontend Layer*: Expo framework and React Native ensure native performance, styling handled via NativeWind (Tailwind), state via Zustand.
    *   *Backend API Layer*: Express handles business logic, generates JWTs, and processes Excel files.
    *   *Security*: Authentication uses JSON Web Tokens (JWT) for secure route protection, and passwords hashed with Bcrypt.
    *   *Database Layer*: MongoDB Atlas offers cloud scalability, flexible Mongoose schemas, and indexes for fast queries.
*   **Visual Suggestion**: Draw or copy the Client-Server-Database Mermaid architecture diagram from this README.

### 🖼️ Slide 5: Role-Based Access Control (RBAC)
*   **Slide Title**: 5-Tier User Role Framework
*   **Slide Objective**: Explain the division of responsibilities.
*   **Key Talking Points**:
    *   **Employee**: Raises passes, adds material metrics, and uploads pictures.
    *   **Approver (Supervisor)**: First line of review; validates request details.
    *   **IBMD**: Evaluates material category and controls lifting schedule or routes hazardous items to Sales.
    *   **Sales**: Final authority for commercial/hazardous products, recording the official Delivery Order (DO) Number.
    *   **Admin**: Bulk-registers employees, seeds master plant databases, and coordinates user status.
*   **Visual Suggestion**: Matrix diagram or a grid summarizing permissions and responsibilities.

### 🖼️ Slide 6: The Intelligent Gate Pass Workflow
*   **Slide Title**: Gate Pass Verification Lifecycle
*   **Slide Objective**: Explain how the workflow changes based on item type (Normal vs. Hazardous).
*   **Key Talking Points**:
    *   Requests start as *Drafts* and advance to *Pending Approver* upon submission.
    *   Upon Supervisor approval, the ticket routes to *Pending IBMD*.
    *   **Branching Logic**:
        *   *Normal Material*: IBMD specifies the scheduled Lifting Date, and the request moves directly to *Closed*.
        *   *Hazardous Material*: IBMD validates, then routes to *Pending Sales*. Sales validates commercial agreements, enters a DO Number, and marks it *Closed*.
    *   Rejections at any stage route the pass back to the employee with remarks.
*   **Visual Suggestion**: Copy the Workflow State Machine diagram from this README.

### 🖼️ Slide 7: Account Activation & Provisioning Loop
*   **Slide Title**: Secure Provisioning & Account Activation
*   **Slide Objective**: Walk through the security design of the user onboarding process.
*   **Key Talking Points**:
    *   *Admin-Led Seeding*: Administrators upload the company roster via Excel, seeding Employee IDs, emails, phone numbers, and default roles.
    *   *Configure Account Screen*: Employees search their Employee ID.
    *   *OTP Challenge*: Firebase Auth REST API delivers a verification code.
    *   *Credentials Setup*: Once OTP is verified, employees configure their password, updating their state from inactive to active.
*   **Visual Suggestion**: A linear 4-step flowchart showing: Seeding -> ID Verification -> OTP Challenge -> Password Configuration.

### 🖼️ Slide 8: Database Design & Mongoose Schemas
*   **Slide Title**: Structured Database Foundation
*   **Slide Objective**: Present the backend data design.
*   **Key Talking Points**:
    *   **Employee Schema**: Stores roles, contact metrics, and activation status.
    *   **Request Schema**: Encapsulates locations, item categories, weight details, and files, alongside a sequential timeline array.
    *   **Hierarchical Location Master**: Strict reference relations mapping Locations to Divisions to Departments to secure clean input fields.
    *   **Indexes**: Query optimizations on `emp_id`, `requestNo`, and request `status`.
*   **Visual Suggestion**: Simplified JSON or relational entity layout of `Employee` and `Request` collections.

### 🖼️ Slide 9: Development Validation & Testing Matrix
*   **Slide Title**: Thorough Verification & Testing
*   **Slide Objective**: Demonstrate the software is reliable and ready.
*   **Key Talking Points**:
    *   Showcase standard test cases covering credentials validation, Excel importing, OTP challenge triggers, and workflow transitions.
    *   *Test Integrity*: Verification of automatic state switches, validation error handling (e.g. invalid file types), and secure JWT interceptors.
    *   All core functional tests passed with consistent response speeds.
*   **Visual Suggestion**: The testing matrix table showing Test ID, Target Module, Input, Expected Output, and Status (Passed).

### 🖼️ Slide 10: Future Roadmap: Scaling Samadhan
*   **Slide Title**: Future Scope & Smart Integrations
*   **Slide Objective**: Present the vision for product expansion.
*   **Key Talking Points**:
    *   **Dynamic QR Codes**: Generated in-app upon closure; security guards scan at the gate to instantly verify validity against the live server.
    *   **Native Push Alerts**: Real-time push notifications using Expo Notifications rather than relying solely on email updates.
    *   **PDF Exporter**: Single-click PDF receipts with official TSL branding and digital stamps.
    *   **Offline Support**: Local database synchronization so plant workers in cellular dead zones can draft/view requests.
*   **Visual Suggestion**: A timeline or visual map outlining future development phases.

### 🖼️ Slide 11: Summary & Q&A
*   **Slide Title**: Samadhan Portal: Value Delivered
*   **Slide Objective**: Wrap up the presentation and invite stakeholder discussion.
*   **Key Talking Points**:
    *   *Efficiency*: Saves hundreds of hours of manual signature-hunting weekly.
    *   *Security*: Comprehensive audit trail ensures strict compliance and safety.
    *   *Scalability*: Built on modern React Native + Express + MongoDB Atlas cloud technology.
    *   Open floor to questions.
*   **Visual Suggestion**: High-quality final screen display with support contact details and repository links.
