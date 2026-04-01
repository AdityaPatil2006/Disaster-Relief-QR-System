# 🛡️ SmartRelief
### **A Unified AI-Powered Platform for Secure Disaster Resource Coordination**

> *Transforming chaotic disaster relief into a synchronized, data-driven, and fraud-proof operation.*

---

## 🌍 The Mission
In the wake of a disaster, coordination is the difference between life and death. **SmartRelief** was built to solve the "Coordination Gap" between Government agencies and NGOs. By creating a unified digital hub, we ensure that every unit of aid is tracked, every beneficiary is verified, and no resource is wasted through duplication or fraud.

## ⚠️ The Challenge
Current relief efforts are often plagued by:
*   **Invisible Duplication:** Multiple agencies giving the same aid to the same people because they don't share data.
*   **Identity Theft:** Scammers using lost or shared ID cards to "double-dip" into limited resources.
*   **The "Black Hole" of Resources:** Difficulty in seeing exactly where aid is going in real-time.
*   **Uneven Recovery:** Inaccessible or remote areas being forgotten while urban centers are over-supplied.

## 💡 The SmartRelief Solution
We’ve built a **Zero-Trust Verification Ecosystem** that uses 21st-century technology to manage 21st-century crises.

### **Key Innovations:**
*   **AI-Biometric Trust:** No more relying on easily lost ID cards. Our **Face-ID verification** ensures aid reaches the *actual* person in need.
*   **Smart Cooldown Engine:** An automated regulator that blocks duplicate aid across *all* participating agencies in real-time.
*   **Unified QR Identity:** A single, fast-scan QR identity that bridges the gap between different NGOs and Government bodies.
*   **Strategic Analytics:** A powerful dashboard that provides "Live Heatmaps" of recovery, allowing leaders to pivot resources where they are needed most.

---

## 🛠️ The Tech Stack (Engineered for Reliability)
*   **Backend:** High-performance **Node.js & Express.js** API.
*   **Database:** **MongoDB** (NoSQL) for flexible, real-time data synchronization.
*   **Security:** **JWT (JSON Web Tokens)** & Role-Based Access (Admin/Field Worker).
*   **Biometrics:** **face-api.js** library for high-speed facial landmark matching.
*   **Scanning:** **ZXing Engine** for robust mobile-camera QR scanning.
*   **Frontend:** Modern **Glassmorphism UI** built with HTML5, CSS3, and ES6+ JS.
*   **Data Science:** **Chart.js** for real-time analytics and **XLSX** for automated reporting.

---

## 🚀 THE COMPLETE USER GUIDE (Step-by-Step)

### **🛒 1. Initial Setup**
1.  **Start the Engine:** In your terminal, navigate to the `backend` folder and run `node server.js`. The system will start on port 5000.
2.  **Populate Data (Optional):** Run `node backend/seed.js` to fill the dashboard with sample data for demonstration.
3.  **Open the App:** Open `frontend/index.html` in your web browser.

### **📝 2. Beneficiary Onboarding (Field Worker)**
1.  **Navigate:** Go to the **Register Beneficiary** page.
2.  **Enter Details:** Fill in the survivor's Name, Phone, and Address. 
3.  **Capture Bio:** Use the camera on the page to take a reference photo. This is essential for the AI Face-ID matching later.
4.  **Assign Priority:** Set their status to **High, Medium, or Low** based on vulnerability.
5.  **Submit:** Save the record and confirm their unique **Digital QR ID** is created.

### **📦 3. Aid Distribution (The High-Security Process)**
1.  **Navigate:** Go to the **Scan QR** page.
2.  **Scan QR:** Use your device camera to scan the survivor's QR code.
3.  **Verify Face-ID:** Once scanned, the system will open the camera for a split-second **Biometric Match** to verify the person's identity.
4.  **Select Items:** Choose the aid products being distributed (e.g., Food Package, Medical Kit).
5.  **Finalize:** Click "Distribute Aid." The system will check the **Global Cooldown Protocol** across all agencies. If they have already received these items, the transaction will be **Auto-Blocked**.

### **📊 4. Monitoring & Governance (Admin/Command Center)**
1.  **Dashboard:** Log in as an **Admin** to see a live summary of total recovery effort.
2.  **Analyze Maps:** Use the regional charts to identify underserved areas.
3.  **Fraud Check:** Monitor the **Duplicate Blocks** counter to see where the system prevented inefficient resource use.
4.  **Audit:** Click **Export Excel/CSV** to download a full, transparent record of all relief activity.

---

## 🛑 Anti-Fraud & Integrity
SmartRelief isn't just a database; it's a **Regulatory Engine**. By enforcing a "Composite Unique Index" (Name + Phone) and cross-agency cooldowns, we ensure that the integrity of the relief supply chain remains unbroken.
