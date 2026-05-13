# ShadowCoach

ShadowCoach is a real-time interview feedback system with live video/audio analysis, designed to help candidates prepare for technical interviews. It provides a comprehensive AI-driven interview platform with resume analysis, dynamic role-specific question generation, real-time speaking analysis, and confidence estimation.

## Prerequisites

Before running the project on a new machine, ensure you have the following installed:
- **Node.js** (v18.0.0 or v20.0.0 recommended) and **npm**
- **Python** (3.9 or higher recommended)
- **Git**

This project uses external libraries (like FastAPI for the backend and React/Vite for the frontend). The setup instructions below will guide you through installing these dependencies on any computer.

## Setup Instructions

### 1. Clone the Repository

First, clone the project to your local machine:
```bash
git clone https://github.com/sripragnaneti/shadowCoach.git
cd shadowCoach
```

### 2. Backend Setup (FastAPI)

The backend handles AI processing, resume parsing, and interview logic. 

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a Python Virtual Environment:**
   It is highly recommended to use a virtual environment to avoid conflicting with system-wide packages.
   - On **Windows**:
     ```bash
     python -m venv .venv
     .venv\Scripts\activate
     ```
   - On **macOS/Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install Backend Dependencies:**
   Install the required Python libraries (like `fastapi`, `uvicorn`, `anthropic`, `python-docx`, etc.):
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Create a `.env` file in the `backend/` directory and add your Anthropic API key:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

5. **Start the Backend Server:**
   Run the FastAPI server using Uvicorn:
   ```bash
   python -m uvicorn app.main:app --reload --reload-dir app --host 127.0.0.1 --port 8000
   ```
   The backend API will be available at `http://127.0.0.1:8000`.

### 3. Frontend Setup (React & Vite)

The frontend provides the user interface for setup, the live interview dashboard, and feedback reports.

1. **Open a new terminal window** and navigate to the project root directory (`shadowCoach`):
   ```bash
   # If you are still in the backend folder:
   cd ..
   ```

2. **Install Frontend Dependencies:**
   Install the Node modules specified in `package.json` (like `react`, `vite`, `recharts`, etc.):
   ```bash
   npm install
   ```

3. **Start the Frontend Development Server:**
   Run Vite to serve the React application:
   ```bash
   npm run dev
   ```
   The frontend will be accessible at `http://localhost:5173` (or another port provided in your terminal).

## How it works

If you've noticed the application running without needing setup before, it's likely because the virtual environment (`.venv`) and `node_modules` were already set up on your machine. 

To run this repository on **any** computer without prior setup, following the `npm install` and `pip install` steps above is crucial, as those commands download all required third-party libraries locally.
