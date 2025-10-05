# **Nexvent – Event Management Platform**

### 👥 **Team Members**
- [**Wai Yan Paing** ](https://github.com/Lucas1792003) 
- [**Lu Phone Maw**   ](https://github.com/Luphone04)
---

### **Website Link**
- https://fin-customer.southeastasia.cloudapp.azure.com/nexvent
---
### **Project Repo**
- [**Nextvent Project** ](https://github.com/luphone04/Nexvent)

---
### **Data Models**
- Users
- Registrations
- Events

---
##  **Screenshots**

###  **Attendees**

**Home / Welcome**  
_Landing page with CTAs to browse events and a featured-events showcase._  
<img width="1395" alt="Nexvent Attendee Home" src="https://github.com/user-attachments/assets/c9d86424-7ded-4faf-a99c-2d45ab4ab309" />

**Dashboard**  
_Attendee dashboard showing upcoming events, attendance stats, and quick access to registrations._  
<img width="1397" alt="Nexvent Attendee Dashboard" src="https://github.com/user-attachments/assets/3dcf99d4-9ba5-4b77-aa1b-1a60405bb6da" />

**Event Detail**  
_Event detail page indicating “Already Registered” status with date, venue, price, and capacity._  
<img width="1397" alt="Nexvent Event Detail" src="https://github.com/user-attachments/assets/b98366ab-073b-4c5a-8216-255b7343f055" />

**Ticket (QR)**  
_Digital event ticket with a unique check-in QR code plus download and print options._  
<img width="1393" alt="Nexvent QR Ticket" src="https://github.com/user-attachments/assets/42493431-e4ad-461e-8570-97171bf77594" />

---

###  **Organizer**

**Organizer Dashboard**  
_Organizer dashboard displaying event statistics, upcoming schedules, and management tools._  
<img width="1395" alt="Nexvent Organizer Dashboard" src="https://github.com/user-attachments/assets/a7abc6d8-01fd-4e98-830d-4f8af551c6e7" />

**Create Event**  
_Form interface for organizers to create new events with key details and configurations._  
<img width="1399" alt="Nexvent Create Event" src="https://github.com/user-attachments/assets/4596bdbb-2cab-4ba6-90b7-7da9650e52fb" />

**Edit Event**  
_Editable form allowing organizers to update existing event information and settings._  
<img width="1399" alt="Nexvent Edit Event" src="https://github.com/user-attachments/assets/bc43551a-05df-4c4d-a695-bafcdfdc2e7a" />

**Attendee List**  
_Event attendee management table showing registration details and attendance status._  
<img width="1398" alt="Nexvent Event Check-In" src="https://github.com/user-attachments/assets/b6387b63-f888-495e-b521-269ca4ed7053" />


**Event Check-In**  
_QR-based event check-in system for verifying attendee entries in real time._  
<img width="1395" alt="Nexvent Attendee List" src="https://github.com/user-attachments/assets/de838c54-d805-4d3f-be45-7e5872c425d5" />

---

###  **Admin**

**Admin Dashboard**  
_Admin dashboard providing a system overview of users, events, and registrations._  
<img width="1394" alt="Nexvent Admin Dashboard" src="https://github.com/user-attachments/assets/a2915634-366d-42cb-a992-60962860e333" />

**All Users**  
_Comprehensive user management panel with role assignment and account controls._  
<img width="1394" alt="Nexvent All Users" src="https://github.com/user-attachments/assets/7e0088f7-b92b-41fd-bb92-13c10046946a" />

**All Events**  
_Administrative event overview displaying event status, organizers, and registration data._  
<img width="1397" alt="Nexvent All Events" src="https://github.com/user-attachments/assets/6c2cccf8-0d62-40a3-8cfc-02efd66879e5" />

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


