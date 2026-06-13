# 🛡️ Disaster Relief QR System

A secure and intelligent disaster relief management platform designed to streamline beneficiary registration, identity verification, and aid distribution. The system uses QR-based identification, facial verification, and centralized tracking to ensure that relief resources reach the right beneficiaries while preventing duplicate claims and fraud.

## 🚀 Live Demo

https://disaster-relief-qr-system.onrender.com/

---

## ✨ Key Features

* 🔐 Secure JWT Authentication
* 👥 Beneficiary Registration & Management
* 🎫 Automatic QR Code Generation
* 📷 Face Recognition Verification
* 📦 Aid Distribution Tracking
* 🚫 Duplicate Aid Prevention System
* 📊 Admin Analytics Dashboard
* 📁 CSV & Excel Report Export
* ☁️ MongoDB Atlas Cloud Database
* 📱 Responsive User Interface

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript (ES6)
* Chart.js
* Face API.js
* QR Scanner Libraries

### Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* JWT Authentication
* bcryptjs

### Deployment

* Render
* GitHub

---

## 📂 Project Structure

```text
Disaster-Relief-QR-System
│
├── backend
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── seed.js
│   └── server.js
│
├── frontend
│   ├── css
│   ├── js
│   ├── models
│   ├── login.html
│   ├── register.html
│   ├── scan.html
│   ├── admin.html
│   └── dashboard.html
│
├── package.json
└── README.md
```

---

## 🔄 System Workflow

### 1. Beneficiary Registration

Field workers register beneficiaries by entering personal details and capturing facial data. A unique QR code is generated for each beneficiary.

### 2. Identity Verification

At aid distribution centers, beneficiaries present their QR code and undergo facial verification to confirm identity.

### 3. Aid Distribution

Authorized workers distribute aid packages while the system records every transaction and prevents duplicate claims.

### 4. Monitoring & Reporting

Administrators can monitor relief activities through dashboards and export records in CSV or Excel format for auditing purposes.

---

## ⚙️ Installation

### Clone Repository

```bash
git clone <repository-url>
cd Disaster-Relief-QR-System
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file inside the `backend` folder:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

### Run Application

```bash
npm start
```

Open:

```text
http://localhost:5000
```

---

## 👤 Demo Credentials

### Administrator

```text
Username: admin
Password: admin123
```

### Field Worker

```text
Username: worker
Password: worker123
```

---

## 🔒 Security Features

* Password Hashing using bcryptjs
* JWT Based Authentication
* Protected API Routes
* Role-Based Access Control
* Duplicate Aid Prevention Logic
* Centralized Beneficiary Verification

---

## 📈 Future Enhancements

* SMS Notifications
* Multi-Agency Integration
* Geo-location Based Relief Tracking
* Mobile Application Support
* Real-Time Disaster Monitoring

---

## 👨‍💻 Author

**Aditya Patil**

GitHub: https://github.com/AdityaPatil2006

---

## ⭐ Support

If you found this project useful, consider giving it a star on GitHub.


Developed to improve transparency, accountability, and efficiency in disaster relief operations through secure digital verification and centralized resource management.
