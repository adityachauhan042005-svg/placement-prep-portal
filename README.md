# Placement Prep Portal 🚀

A full-stack web application designed to help students prepare for software placements through structured DSA practice, interview preparation, placement notes, and resume building.

## 🌟 Features

* 🔐 User Registration & Login
* 🔑 JWT-based Authentication
* 📊 DSA Progress Tracker
* 🧠 DSA Question Bank
* 📚 Placement Notes
* 🎤 Interview Preparation
* 📄 Resume Builder
* 🌙 Dark Mode
* 📱 Responsive Design
* 📈 DSA Progress Visualization
* 💾 MongoDB-based Progress Storage

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* Chart.js

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

### Authentication & Security

* JWT (JSON Web Tokens)
* bcrypt
* Protected API Routes

---

## 📂 Project Structure

```text
Placement-Prep-Portal/
│
├── backend/
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── progress.js
│   │   └── user.js
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── assets/
│   │   └── images/
│   │       └── hero.png
│   ├── auth.js
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── script.js
│   └── style.css
│
├── .gitignore
├── package.json
└── package-lock.json
```

---

## 📊 DSA Progress Tracker

The DSA Progress Tracker allows users to record and monitor their problem-solving progress.

Users can track:

* Number of questions solved
* Topic
* Difficulty
* Platform
* Date
* Recent Progress
* Difficulty-wise Statistics

Progress data is stored in MongoDB and protected using JWT authentication.

---

## 🧠 DSA Question Bank

A dedicated question bank for practicing DSA problems with organized questions and interview-oriented explanations.

---

## 🎤 Interview Preparation

The Interview Preparation section provides technical interview questions and answers covering important placement-related concepts.

---

## 📚 Placement Notes

Important placement preparation notes are organized in one place for quick revision.

---

## 📄 Resume Builder

The Resume Builder provides a structured interface for creating placement-ready resume content.

---

## 🔐 Authentication

The application uses JWT-based authentication.

* User Registration
* User Login
* Password Hashing using bcrypt
* JWT Token Generation
* Protected Progress APIs
* Authorization using Bearer Tokens

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/adityachauhan042005-svg/placement-prep-portal.git
cd placement-prep-portal
```

### 2. Install Dependencies

Install root dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the `backend` folder.

Example:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 4. Start Backend Server

```bash
node server.js
```

Backend runs on:

```text
http://localhost:5000
```

### 5. Run Frontend

Open the frontend using VS Code Live Server or any local server.

---

## 🔒 Security

Sensitive files such as `.env` and dependencies such as `node_modules` are excluded using `.gitignore`.

---

## 🚀 Future Improvements

* More DSA Questions
* Advanced Progress Analytics
* More Interview Categories
* Resume PDF Export
* Placement Roadmap
* User Personalization

---

## 👨‍💻 Author

**Aditya Chauhan**
B.Tech Computer Science & Engineering

---

⭐ If you find this project useful, consider giving the repository a star.
