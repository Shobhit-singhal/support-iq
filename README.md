# SupportIQ

SupportIQ is an AI-powered customer support ticketing system consisting of a Next.js frontend, a Node.js/Express backend, and a Python/FastAPI machine learning microservice for ticket classification.

## Prerequisites

Before running the project, ensure you have the following installed on your system:
- **Node.js** (v18 or higher recommended)
- **Python** (v3.9 or higher recommended)
- **MongoDB**: Needs to be running locally on the default port `27017` (or update `backend/.env` with your connection string).

## Project Structure

- `frontend/` - Next.js React application
- `backend/` - Node.js Express API server
- `ml-service/` - Python FastAPI machine learning service

## Environment Variables

The project already contains `.env` and `.env.local` files for local development, but here is a quick overview:
- `backend/.env`: Configures the backend to use MongoDB at `mongodb://localhost:27017/ticketflow`, run on port `5000`, and connect to the ML service at `http://localhost:8001`.
- `frontend/.env.local`: Configures the frontend to connect to the backend API at `http://localhost:5000/api`.
- `ml-service/.env`: Configures the ML service to run on port `8001`.

---

## Quick Start (Recommended)

Once all dependencies are installed (see manual steps below), you can launch all three services at once from the project root:

```powershell
.\start.ps1
```

This opens three separate terminal windows — one for each service, and **automatically seeds the database** with demo accounts. To stop, simply close the individual windows.

> **First time?** You must complete the one-time setup steps below before using the quick start script.

---

## Manual Setup & Running

To set up and run from scratch, you will need to open **three separate terminal windows** and start each service.

### 1. Start the ML Service
The ML service categorizes tickets and analyzes sentiment.

```bash
cd ml-service
```

Create and activate a virtual environment (Windows):
```powershell
python -m venv .venv
.venv\Scripts\activate
```

*(On macOS/Linux, use: `source .venv/bin/activate`)*

Install dependencies:
```bash
pip install -r requirements.txt
```

Train the initial machine learning models (required before starting the server):
```bash
python training/train.py
```

Start the FastAPI server:
```bash
python main.py
```
*The ML service will now be running on `http://localhost:8001`.*

### 2. Start the Backend API
The backend serves as the main API and connects to the MongoDB database. Ensure MongoDB is running before proceeding.

Open a new terminal window:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Seed the database with demo accounts and teams:
```bash
npm run seed
```

Start the development server:
```bash
npm run dev
```
*The backend will now be running on `http://localhost:5000`.*

### 3. Start the Frontend
The frontend is the user interface for the ticketing system.

Open a new terminal window:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the Next.js development server:
```bash
npm run dev
```
*The frontend will now be running on `http://localhost:3000`.*

---

## Accessing the App

Once all three services are running, open your browser and go to **[http://localhost:3000](http://localhost:3000)**.

- The Backend API is accessible at `http://localhost:5000`.
- The ML Service API docs (Swagger UI) are accessible at `http://localhost:8001/docs`.

---

## Demo Accounts

All accounts use the password: **`Password123!`**

| Role | Email |
|---|---|
| Admin | `admin@supportiq.dev` |
| Agent (Billing team) | `agent.billing@supportiq.dev` |
| Agent (Tech team) | `agent.tech@supportiq.dev` |
| Agent (General team) | `agent.general@supportiq.dev` |
| Customer | `customer@supportiq.dev` |

---

## Testing the Full Flow

### Step 1 — Submit a ticket (Customer)
Log in as `customer@supportiq.dev` and click **New Ticket**. Try these examples:

**Billing issue** → AI classifies as: *Billing, High priority, Negative sentiment*
> **Subject:** `I was charged twice for my subscription`
> **Description:** `My credit card was charged twice on October 1st for the monthly subscription. The amount was $49.99 each time. I need a refund for the duplicate charge as soon as possible.`

**Technical bug** → AI classifies as: *Technical, High priority, Negative sentiment*
> **Subject:** `App crashes when uploading files`
> **Description:** `Every time I try to upload a file larger than 5MB using the upload button on the dashboard, the app crashes and shows a white screen. This has been happening since yesterday's update.`

**General question** → AI classifies as: *General, Low priority, Neutral sentiment*
> **Subject:** `Question about account settings`
> **Description:** `Hi, I was wondering if it is possible to change my display name in the account settings. I looked around but could not find the option anywhere on the settings page.`

---

### Step 2 — Handle the ticket (Agent)
Log in as the matching agent (e.g. `agent.billing@supportiq.dev` for billing tickets):
- Change **status**: Open → In Progress → Resolved
- **Assign** the ticket to yourself
- Post a **reply** in the conversation thread
- Post an **internal note** (only visible to agents/admins, hidden from the customer)

---

### Step 3 — Rate the experience (Customer)
After an agent marks the ticket as **Resolved** or **Closed**, log back in as `customer@supportiq.dev`, open the ticket, and a ⭐ **CSAT rating form** (1–5 stars) will appear at the bottom.

---

### Step 4 — View dashboards (Admin)
Log in as `admin@supportiq.dev` and explore:
- **Agents** — resolved volume, avg response/resolution time, SLA compliance, avg CSAT per agent
- **SLA** — how many tickets are on track, at risk, or breached; breach rate over time
- **CSAT** — satisfaction trend over time, broken down by category and by agent
- **Users** — create new agent/admin accounts and reset passwords