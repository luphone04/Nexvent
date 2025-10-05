# **Nexvent – Event Management Platform**

### 👥 **Team Members**
- **Wai Yan Paing**  
- **Lu Phone Maw**

---
## **Screen Shots**
**Attendes**
<img width="1395" height="789" alt="Screenshot 2025-10-05 at 19 58 39" src="https://github.com/user-attachments/assets/c9d86424-7ded-4faf-a99c-2d45ab4ab309" />

##  **Overview**
**Nexvent** is an innovative event management platform designed to simplify how events are **created, managed, and attended**.  
It empowers **organizers** to host events of any scale while allowing **attendees** to seamlessly discover, register, and track their participation.  
Supporting multiple event types and industries, Nexvent offers a smooth, interactive experience for all users.

---

##  **Key Features**
- **Event Creation & Management** – Create, edit, and manage events with details such as title, date, description, and registration limits.  
- **Event Discovery** – Explore events across industries and categories using intelligent search and filters.  
- **Registration & Tracking** – Register for events and view your participation history in one place.  
- **Dynamic Dashboard** – Get real-time updates for upcoming and past events.  
- **User Interaction** – Stay informed with event details, announcements, and updates.  
- **Responsive Design** – Optimized for both desktop and mobile experiences.  

---

##  **Tech Stack**

###  **Frontend**
- **Next.js 15.5.2** – React framework for building full-stack web applications  
- **React 19** – Modern UI library for interactive components  
- **TypeScript** – Type-safe JavaScript for reliable development  
- **Tailwind CSS** – Utility-first styling framework  
- **Shadcn/UI** – Reusable and accessible UI components  

---

###  **Backend**
- **Next.js API Routes** – Serverless API endpoints  
- **NextAuth.js** – Authentication and session management  
- **Prisma ORM** – Object-relational mapper for database management  
- **bcryptjs** – Secure password hashing and encryption  

---

###  **Database**
- **PostgreSQL 16** – Relational database for structured event and user data  

---

###  **QR Code System**
- **qrcode** – Generates unique QR codes for event passes  
- **html5-qrcode** – Enables real-time QR code scanning via camera  

---

### ☁️ **Deployment & Infrastructure**
- **Azure Virtual Machine (Ubuntu 24.04)** – Reliable and scalable cloud hosting  

---

## ✅ **Project Requirements Met**
- ✅ Built with **Next.js**  
- ✅ Includes **REST API** performing CRUD operations on **at least three entities**  
- ✅ Fully **original project**, not forked or cloned  
- ✅ Includes complete **README.md** documentation  

---

##  **Getting Started**

### **1. Clone the Repository**
```bash
git clone https://github.com/your-username/nexvent.git
cd nexvent

### **2. Install Dependencies**
```bash
npm install
# or
yarn install

### **3. Run the Development Server**
```bash
npm run dev
# or
yarn dev


Open http://localhost:3000
 in your browser to view the app.

### ** Configuration**
```bash
Create a .env.local file in the root directory and include the following:

DATABASE_URL=your_postgresql_connection_string
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000


