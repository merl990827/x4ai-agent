# X4AI Agent: AxFlow Pipeline Demonstration

This repository, **x4ai-agent**, serves as a practical demonstration for integrating and driving an **AxFlow pipeline** using the `createAxLLMClient` utility. The primary goal is to showcase how to build and interact with a robust, structured AI agent powered by the **AxFlow** framework, specifically designed to handle complex, multi-step tasks.

-----

## ✨ Features

  * **AxFlow Integration:** Core logic for defining and executing an AxFlow pipeline.
  * **`createAxLLMClient` Usage:** Clear example of using the client for seamless interaction with the defined pipeline.
  * **Modular Agent Design:** Demonstrates best practices for structuring an AI agent.
  * **Front-end Example:** Includes a basic front-end interface (see `front-end/`) to interact with the agent.

-----

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

You will need the following software installed:

  * **Node.js** (LTS version recommended)
  * **npm** or **yarn**
  * **AxFlow API Key:** You will need an API key to run the agent.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/merl990827/x4ai-agent.git
    cd x4ai-agent
    ```

2.  **Install dependencies:**
    This project contains both agent and front-end code. Navigate to the appropriate directory and install dependencies.

    ```bash
    # Install dependencies for the agent (if applicable)
    npm install

    # Install dependencies for the front-end
    cd front-end
    npm install
    cd ..
    ```

    *(**Note:** If the main directory contains a `package.json` for the agent, run `npm install` there as well.)*

3.  **Configure Environment Variables:**
    Create a file named `.env` in the root directory and add your AxFlow API key:

    ```
    AXFLOW_API_KEY="YOUR_AXFLOW_API_KEY_HERE"
    ```

### Running the Agent

You will typically need to start both the agent's backend (if separate) and the front-end application.

1.  **Start the Front-end Application:**
    Navigate to the front-end directory and run the start script:

    ```bash
    cd front-end
    npm run dev # or npm start, depending on the front-end framework
    ```

2.  **View the App:**
    The application should now be running, likely accessible at `http://localhost:3000` or a similar port. Check your console for the exact URL.

-----

## 📁 Project Structure

This repository is structured to separate the agent's logic from its user interface:

| Directory | Purpose |
| :--- | :--- |
| **`dreams/`** | Contains agent configurations, logic, or pipeline definitions. This is likely where the core AxFlow pipeline resides. |
| **`front-end/`** | The web application interface for interacting with the AI agent. (Built with HTML, CSS, JavaScript/TypeScript). |
| **`.gitignore`** | Specifies files and directories that Git should ignore. |

-----

## ⚙️ Built With

The project uses the following key technologies:

  * **AxFlow:** The core framework for building the AI agent and pipelines.
  * **TypeScript / JavaScript:** Used for agent logic and front-end development.
  * **HTML / CSS:** Used for the front-end user interface.

-----

## 📚 More About AxFlow

**AxFlow** is an open-source framework designed to help you build, run, and scale production-ready AI agents and language model applications.

For more information on the **AxFlow** framework, including detailed documentation on pipelines and the `createAxLLMClient`, please visit the official website:

**[https://x4ai.org/](https://x4ai.org/)**
