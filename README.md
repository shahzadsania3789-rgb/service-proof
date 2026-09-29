# ServiceProof

## Service Operations and Payment Control Platform

ServiceProof is a full-stack web-based platform designed to help service-based organizations manage service jobs, technician assignments, work evidence, verification, payment requests, approvals, and audit activities through a centralized workflow.

The platform connects operational work with evidence verification and payment control, providing better visibility, accountability, and traceability.

---

## Project Overview

In many service organizations, service jobs, technician assignments, work evidence, approvals, and payment records are managed through separate tools such as spreadsheets, emails, messaging applications, and manual records.

This can result in:

* Scattered operational information
* Manual evidence verification
* Difficulty tracking service jobs
* Payment delays or errors
* Limited accountability
* Lack of a centralized audit trail

ServiceProof addresses these issues by providing a structured workflow that connects the complete service process.

---

## Main Workflow

```text
Create Service Job
        ↓
Assign Technician
        ↓
Perform Service Work
        ↓
Complete Assignment
        ↓
Submit Evidence
        ↓
Evidence Verification
        ↓
Approved / Rejected / Correction Required
        ↓
Payment Request
        ↓
Finance Approval
        ↓
Payment Processing
        ↓
Paid
        ↓
Audit Log
```

If evidence requires correction, the technician can resubmit evidence for another review.

---

## Main Features

### Authentication

* User registration and login
* Session management
* Protected application routes
* Secure authentication using Better Auth

### Role-Based Access Control

ServiceProof supports different roles and permissions:

* **ADMIN**
* **OPERATIONS**
* **FINANCE**
* **TECHNICIAN**

Each role has access to specific operations according to its permissions.

### Service Job Management

Authorized users can:

* Create service jobs
* View service jobs
* Assign technicians
* Track job status
* Manage job information

### Technician Job Management

Technicians can:

* View assigned jobs
* Accept assignments
* Start assigned work
* Complete assignments
* Submit evidence

### Evidence Management

The evidence module allows technicians to submit proof of completed work.

Supported evidence types include:

* PHOTO
* DOCUMENT
* COMPLETION_NOTE

Evidence can be reviewed and marked as:

* PENDING
* APPROVED
* REJECTED
* CORRECTION_REQUIRED

### Payment Control

Payment requests are connected to approved service jobs.

The payment workflow is:

```text
PENDING
   ↓
APPROVED
   ↓
PROCESSING
   ↓
PAID
```

Other possible states include:

* REJECTED
* FAILED
* CANCELLED

Payment requests cannot be created for service jobs that have not reached the required approval state.

### Audit Logging

Important system activities are recorded in the audit log.

Examples include:

* Job created
* Job assigned
* Evidence submitted
* Evidence approved
* Evidence rejected
* Correction requested
* Payment requested
* Payment approved
* Payment rejected
* Payment processing
* Payment completed

Audit records contain information such as the user, action, entity, description, timestamp, and metadata.

---

## System Modules

The main modules of ServiceProof are:

1. Authentication
2. Dashboard
3. Service Jobs
4. My Jobs
5. Evidence Review
6. Payment Requests
7. Audit Logs

---

## User Roles

| Role       | Main Responsibilities                                              |
| ---------- | ------------------------------------------------------------------ |
| ADMIN      | Organization, users, jobs, evidence, payments and audit management |
| OPERATIONS | Create jobs, assign technicians and review evidence                |
| FINANCE    | Review and manage payment requests                                 |
| TECHNICIAN | Manage assigned jobs and submit evidence                           |

---

## Technology Stack

| Technology   | Purpose                               |
| ------------ | ------------------------------------- |
| Next.js      | Full-stack web application framework  |
| React        | User interface                        |
| TypeScript   | Type-safe development                 |
| Tailwind CSS | Styling and responsive UI             |
| Better Auth  | Authentication and session management |
| Prisma ORM   | Database access                       |
| PostgreSQL   | Relational database                   |
| Git & GitHub | Version control                       |

---

## System Architecture

```text
┌─────────────────────────────────┐
│       Next.js + React UI        │
│          Tailwind CSS           │
└───────────────┬─────────────────┘
                ↓
┌─────────────────────────────────┐
│     Next.js App Router / API    │
└───────────────┬─────────────────┘
                ↓
┌─────────────────────────────────┐
│  Better Auth + Role Permissions │
└───────────────┬─────────────────┘
                ↓
┌─────────────────────────────────┐
│           Prisma ORM            │
└───────────────┬─────────────────┘
                ↓
┌─────────────────────────────────┐
│          PostgreSQL DB           │
└─────────────────────────────────┘
```

---

## Database Entities

The main database entities include:

```text
User
Organization
ServiceJob
Assignment
Evidence
EvidenceVerification
PaymentRequest
PaymentApproval
AuditLog
```

Main relationship:

```text
Organization
      ↓
ServiceJob
      ↓
Assignment
      ↓
Evidence
      ↓
EvidenceVerification

ServiceJob
      ↓
PaymentRequest
      ↓
PaymentApproval

Organization
      ↓
AuditLog
```

---

## Service Job Status

Service jobs can move through the following lifecycle:

```text
DRAFT
  ↓
ASSIGNED
  ↓
IN_PROGRESS
  ↓
EVIDENCE_SUBMITTED
  ↓
UNDER_REVIEW
  ↓
APPROVED
  ↓
PAYMENT_PENDING
  ↓
PAID
```

Additional states:

```text
REJECTED
CORRECTION_REQUIRED
CANCELLED
```

---

## Security

ServiceProof includes several security and data-control mechanisms:

* Authentication using Better Auth
* Role-based authorization
* Permission checks
* Organization-level data isolation
* Protected API routes
* Business-rule validation
* Payment approval controls
* Audit logging

Users can only access organizational data permitted by their authentication and authorization context.

---

## Project Structure

The project follows a Next.js App Router structure.

```text
serviceproof/
│
├── app/
│   ├── api/
│   ├── dashboard/
│   ├── service-jobs/
│   ├── my-jobs/
│   ├── evidence-review/
│   ├── payment-requests/
│   ├── audit-logs/
│   └── ...
│
├── lib/
│   ├── auth.ts
│   ├── auth-client.ts
│   ├── authorization.ts
│   ├── permissions.ts
│   ├── prisma.ts
│   └── audit.ts
│
├── prisma/
│   └── schema.prisma
│
├── public/
│
├── .env
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

> Environment files containing secrets should not be committed to the repository.

---

## Installation

Clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/serviceproof.git
```

Move into the project directory:

```bash
cd serviceproof
```

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Create a local `.env` file and configure the required environment variables.

Example:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/serviceproof"
BETTER_AUTH_URL="http://localhost:3000"
```

Do not commit `.env` or other files containing passwords, API keys, or secret credentials.

---

## Database Setup

After configuring PostgreSQL, run:

```bash
npx prisma validate
```

Generate Prisma Client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev
```

---

## Run the Development Server

Start the application:

```bash
npm run dev
```

Open the application in your browser:

```text
http://localhost:3000
```

---

## Useful Commands

### Start Development Server

```bash
npm run dev
```

### Build Project

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Validate Prisma Schema

```bash
npx prisma validate
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Run Prisma Migration

```bash
npx prisma migrate dev
```

---

## Project Development Status

The ServiceProof platform includes the core implementation for:

* Authentication
* Role-based authorization
* Organization-based access
* Service job management
* Technician assignments
* Evidence submission
* Evidence verification
* Payment requests
* Payment approvals
* Payment status management
* Audit logging
* Dashboard navigation

The system is being developed incrementally with testing and UI improvements throughout the development process.

---

## Future Enhancements

Possible future enhancements include:

* Email notifications
* Automated reminders
* Cloud file storage
* Advanced reporting
* Analytics
* External payment gateway integration
* Mobile-friendly technician experience
* Notification center
* Advanced organization management
* Additional audit and reporting features

---

## Purpose

ServiceProof is developed as a full-stack academic/FYP project demonstrating the practical implementation of:

* Authentication
* Authorization
* Role-based access control
* Database design
* REST/API development
* Business workflows
* Evidence verification
* Payment control
* Audit logging
* Modern web application development

---

## License

This project is developed for academic and educational purposes.
