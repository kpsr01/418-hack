# Snack Swap - 418 Hackathon Project

This project was developed for the **418 Hackathon**, hosted by **Enigma** under **Aeon 2025**.

## Description

Snack Swap is a web application designed to help users make healthier snack choices. Users can scan the barcode (or QR code containing product information) of a snack using their device's camera. The application then identifies the snack and suggests healthier alternatives, allowing users to earn rewards for making better choices.

The core idea is: **Swap the Sweet. Stay Elite.**

## Features

*   **Snack Scanning:** Uses the device camera to scan snack barcodes/QR codes via `html5-qrcode`.
*   **Healthier Alternatives:** (Functionality to be implemented) Suggests healthier snack options based on the scanned item.
*   **Reward System:** (Functionality to be implemented) Users can potentially earn points or rewards for scanning and choosing healthier snacks.
*   **Responsive UI:** Built with React, Bootstrap, and Tailwind CSS for a modern user experience.

## Tech Stack

*   **Frontend Framework:** React (`^19.0.0`)
*   **Build Tool:** Vite (`^6.2.0`)
*   **Routing:** React Router DOM (`^7.5.0`)
*   **UI Libraries:**
    *   Bootstrap (`^5.3.5`) & React Bootstrap (`^2.10.9`)
    *   Tailwind CSS (`^4.1.3`)
*   **QR/Barcode Scanning:** html5-qrcode (`^2.3.8`)
*   **State Management:** React Context API (implied by `src/context/AppContext.jsx`)
*   **Linting:** ESLint (`^9.21.0`)

### External APIs & Development Tools

*   **Nutritional Information:** [Open Food Facts API](https://world.openfoodfacts.org/data) - Used to fetch product nutritional values from scanned barcodes.
*   **AI Assistance (Alternative Suggestions - Placeholder):** OpenRouter used to call the Llama 3.3 API (intended for generating healthier snack suggestions, implementation pending).
*   **Icons/Images:** [Iconfinder](https://www.iconfinder.com/) - Used as a source for some PNG images/icons used in the project.
*   **AI Assistance (Code Generation):** Google Gemini 2.5 Pro - Used to assist in code generation and development.

## Project Structure

```
.
├── public/              # Static assets served directly
├── src/
│   ├── assets/          # Assets used within components (images, fonts)
│   │   ├── Landing.jsx
│   │   ├── Navbar.jsx
│   │   ├── Scanner.jsx      # Core QR/barcode scanning component
│   │   ├── SnackResult.jsx # Displays scan results/alternatives
│   │   ├── Rewards.jsx
│   │   ├── Contact.jsx
│   │   └── ... (and associated CSS)
│   ├── context/         # React Context for state management (AppContext.jsx)
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Main application component with routing
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── .env                 # Environment variables (ensure this is in .gitignore if contains secrets)
├── .gitignore           # Files ignored by Git
├── eslint.config.js     # ESLint configuration
├── index.html           # Main HTML entry point
├── package.json         # Project metadata and dependencies
├── package-lock.json    # Exact dependency versions
├── README.md            # This file
└── vite.config.js       # Vite configuration
```

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Install dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using yarn:
    ```bash
    yarn install
    ```
3.  **Environment Variables:**
    Create a .Env file and provide a openrouter API key in this format:
    VITE_OPENROUTER_API_KEY = Your_api_key

## Available Scripts

In the project directory, you can run:

*   **`npm run dev`** or **`yarn dev`**
    Runs the app in development mode using Vite. Open [http://localhost:5173](http://localhost:5173) (or the port specified by Vite) to view it in the browser. The page will reload if you make edits.

*   **`npm run build`** or **`yarn build`**
    Builds the app for production to the `dist` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

*   **`npm run preview`** or **`yarn preview`**
    Serves the production build locally. This is useful for checking the final build before deployment.


## Future Improvements

*   Detection of food product without Barcodes and fetch Nutritional values.
*   Implement backend logic for user authentication and storing rewards.
*   Develop the logic for suggesting healthier alternatives based on scanned snacks.
*   Expand the reward system details.
*   Improve error handling for the scanner and API calls.
*   Add unit and integration tests.
