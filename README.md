# DockGen AI: Agentic Dockerfile Generator

DockGen AI is a full-stack web application that uses an agentic AI to autonomously generate a production-ready Dockerfile from any JavaScript-related GitHub repository. It then goes a step further by building a real Docker image from that repository, all in one click.

---

## Live URLs

https://dockgen-ai.onrender.com
---

## Key Features

* **AI-Powered Generation:** Autonomously generates a multi-stage Dockerfile by analyzing a repo's tech stack (React, Next.js, Vue, etc.).
* **Real Image Building:** Clones the repository, injects the AI-generated Dockerfile, and runs `docker build` to create a real, runnable image.
* **Asynchronous Polling:** Handles long build times (2-5+ min) by immediately returning a build ID and polling the backend for status, preventing frontend timeouts.
* **Build History:** Saves every build attempt (pending, success, or failed) to a MongoDB database.
* **Modern UI:** Clean, responsive, and dark-mode-ready interface built with Next.js and Shadcn/UI.

---

##  Tech Stack
This project was built using the exact stack specified in the assignment.

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS, Shadcn/UI |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **AI Agent** | Google Gemini (via LangChain.js) |
| **DevOps** | Docker, Git, `node-fetch`, `child_process` |

---

## Getting Started

This is a monorepo containing a separate `frontend` and `backend`. You will need two terminals to run the project locally.

### Prerequisites

* Node.js (v18+ recommended)
* Git
* Docker (Must be installed and running)
* A Google AI Studio API Key
* A MongoDB Atlas Connection String
* A GitHub Personal Access Token (PAT) with `repo` scope

---

### 1. Backend Setup (Terminal 1)

1.  **Navigate to the backend:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create your environment file:**
    ```bash
    touch .env
    ```

4.  **Add your secret keys** to the `.env` file. (See the "Environment Variables" section below for details).

5.  **Start the backend server:**
    ```bash
    npm run dev
    ```

    The server will start on `http://localhost:8080` and connect to your MongoDB database.

---

### 2. Frontend Setup (Terminal 2)

1.  **Navigate to the frontend:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the frontend server:**
    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:3000`.

---

### 3. (CRITICAL) Docker Permissions

The backend server's `dockerService.js` file calls the `docker` command directly. On Linux, this will fail with a "Permission Denied" error unless you do one of the following:

**Solution : Add user to `docker` group**
Run this command once, then **log out and log back in** for it to take effect.
```bash
sudo usermod -aG docker $USER
```
---

## Environment Variables

The backend requires a `.env` file in the `backend/` directory with the following keys:

```.env
# Get from Google AI Studio (https://ai.google.dev/)
GOOGLE_API_KEY=your_google_api_key_goes_here

# Get from MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
# Make sure to replace <username>, <password>, and the cluster URL
MONGO_URI=mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/dockgen?retryWrites=true&w=majority
```

-----

## 📡 API Endpoints

### `POST /api/generate`

Starts a new Dockerfile generation and build job.

  * **Body:**
    ```json
    {
      "repoUrl": "https://github.com/user/repo",
      "pat": "ghp_YourAccessToken"
    }
    ```
  * **Success Response (202 Accepted):** Returns immediately with a build ID for polling.
    ```json
    {
      "message": "Build started. Polling for status...",
      "buildId": "60d...a"
    }
    ```
  * **Failure Response (4xx/5xx):**
    ```json
    {
      "error": "Error message (e.g., GitHub service failed, AI failed, etc.)"
    }
    ```

### `GET /api/build/status/:id`

Polls for the status and results of a build job.

  * **URL Parameter:**

      * `id`: The `buildId` received from the `POST /api/generate` request.

  * **Response (200 OK):**

    ```json
    {
      "status": "pending" | "success" | "failed",
      "dockerfile": "...",
      "buildLogs": "..."
    }
    ```
---
