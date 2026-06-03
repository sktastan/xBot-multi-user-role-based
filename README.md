# Enterprise RAG: Role-Based Intelligent Assistant

This project is a high-performance, full-stack application demonstrating **Retrieval-Augmented Generation (RAG)** with a robust **Role-Based Access Control (RBAC)** system. It allows organizations to provide an AI assistant that tailors its knowledge, tone, and permissions based on the user's specific department and hierarchy.

---

## 🌟 Core Features

-   **Streaming AI Responses**: Real-time interaction using Server-Sent Events (SSE) for a fluid chat experience.
-   **Multi-Provider Support**: Seamlessly switch between LLM providers (Ollama, OpenAI, Claude, Gemini, Hugging Face).
-   **Role-Driven Context**: The AI's knowledge base and suggestions change dynamically based on the user's assigned role.
-   **Admin Orchestration**: A dedicated management interface for assigning roles and monitoring system health.
-   **Persistence**: Complete conversation history and multi-session support per user.

---

## 🎭 Role-Based Approach

The system is designed around the principle of **Contextual Security**. Roles are assigned via the Admin Panel, influencing both the UI experience and the RAG retrieval logic.

### Available Roles & Behaviors:

| Role | Primary Data Access | AI Personality / Task Focus |
| :--- | :--- | :--- |
| **C-Level Executives** | Strategic plans, high-level financial KPIs | Summarization, trend analysis, and strategic forecasting. |
| **Finance Team** | Tax docs, payroll policies, budget reports | Highly analytical, precise with numbers, focus on compliance. |
| **HR Team** | Employee handbooks, benefits, hiring guides | Empathetic, privacy-focused, focus on policy clarification. |
| **Engineering Dept.** | Technical docs, API specs, system architecture | Code-heavy, technical troubleshooting, focus on documentation. |
| **Marketing Team** | Brand guidelines, campaign history, SEO data | Creative brainstorming, copy editing, brand alignment. |
| **Employee Level** | General company info, IT requests, schedules | General assistance, task-oriented, helpful and direct. |

### How it Works:
1.  **Admin Assignment**: An administrator uses the Admin Panel to link a `userEmail` to one of the roles above.
2.  **Metadata Filtering**: During the RAG process, the backend adds a filter to the vector search, ensuring a Marketing user only retrieves documents tagged for "Marketing" or "General".
3.  **System Prompting**: The LLM is initialized with a system message specific to the role (e.g., *"You are a technical assistant for the Engineering Department..."*).

---

## 🏗️ Technical Stack

### Frontend (React + TypeScript)
-   **Vite**: For ultra-fast development and optimized production builds.
-   **Lucide React**: For a clean, professional iconography system.
-   **React Markdown**: Renders complex AI responses including code blocks and tables.
-   **Axios & Fetch API**: Handles RESTful communication and SSE streaming.

### Backend (FastAPI + Python)
-   **FastAPI**: Asynchronous API layer for high-concurrency chat handling.
-   **RAG Engine**: Implements document chunking, embedding generation, and vector retrieval.
-   **Streaming Controller**: Manages the life cycle of LLM generation and data delivery via chunks.
-   **Pydantic**: Strict data validation for incoming prompts and role assignments.

---

## 📂 Project Structure

```text
app/
├── backend/
│   ├── main.py             # FastAPI entry point & API routing
│   ├── rag/
│   │   ├── core/           # Embedding logic & vector search implementation
│   │   └── documents/      # Source knowledge (PDFs, TXT, MD) tagged by role
│   └── requirements.txt    # Python ecosystem dependencies
└── frontend/
    ├── src/
    │   ├── components/     # UI components (Chatbot, AdminPanel, etc.)
    │   └── styles/         # Scoped CSS for role-based themes
    └── tsconfig.json       # TypeScript configuration
```

---

## 🚀 Quick Start & Setup

### 1. Prerequisites
-   **Python 3.10+**
-   **Node.js 18+**
-   **Ollama** (Required for local RAG and specific local models)

### 2. Automated One-Click Setup
The project includes a comprehensive `setup.bat` script that automates the entire environment configuration.

1.  Ensure **Ollama** is installed and running on your machine.
2.  Double-click **`setup.bat`** in the root directory.
    -   This script will:
        -   Create a Python virtual environment (`venv`).
        -   Install all backend dependencies from `requirements.txt`.
        -   Install all frontend dependencies via `npm`.
        -   Pull the required Ollama models (`embeddinggemma` and `qwen3:0.6b`).

### 3. Running the Application
Once setup is complete, you can start the services using the provided batch files:

1.  **Start Backend**: Run `python_run.bat`. (Server starts on `http://localhost:8000`)
2.  **Start Frontend**: Run `npm_run.bat`. (Dashboard accessible at `http://localhost:5173`)

---

## 🔑 Demo Credentials
After completing the initial setup via the UI:
-   **User Login**: `jane_doe@mail.com` / `password123`
-   **Admin Login**: `john_doe@mail.com` / `admin123`

---
## 🔍 RAG Pipeline Deep Dive

1.  **Ingestion**: Documents are loaded from `backend/rag/documents/`.
2.  **Tagging**: Documents are metadata-tagged based on the target audience (e.g., `role: finance`).
3.  **Vectorization**: Text is converted into embeddings (numerical representations of meaning).
4.  **Query & Filter**: When a user queries, the system identifies the user's role and filters the vector database to only search through allowed documents.
5.  **Augmented Generation**: The top-k relevant chunks are combined with a role-specific system prompt and sent to the LLM.

---

## 📝 Example Role-Based Scenarios

**Scenario A: Engineering Role**
-   *Input:* "How do I deploy the frontend?"
-   *Result:* AI retrieves the `deployment_specs.md` and provides step-by-step shell commands.

**Scenario B: HR Role**
-   *Input:* "What is the policy on remote work?"
-   *Result:* AI retrieves `remote_policy_2024.pdf` and explains the 10 AM - 3 PM core hours requirement.

**Scenario C: C-Level Role**
-   *Input:* "Give me a summary of Q3 performance."
-   *Result:* AI retrieves the latest financial reports and generates a bulleted executive summary.

---
Demo Web Page: 
https://serdartastan-xbot-multi-user-role-based.hf.space

Demo User: 
Email Address: jane_doe@mail.com
Password: 12345

Admin Page: 
https://serdartastan-xbot-multi-user-role-based.hf.space/admin/

Demo Admin: 
Email Address: john_doe@mail.com
Password: 12345

---
This project was developed in VS Code using Google Gemini Code Assistant (gemini-2.5-flash).
