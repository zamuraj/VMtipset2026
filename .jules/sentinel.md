## 2024-05-24 - Exposed Firebase Configuration
**Vulnerability:** Firebase configuration, including API key, auth domain, and project ID, were hardcoded in `src/firebase.js`.
**Learning:** Hardcoding API keys and configuration directly in the source code can lead to unauthorized access and abuse if the repository is public or inadvertently exposed.
**Prevention:** Always use environment variables for sensitive configuration data. In Vite projects, use `.env` files and `import.meta.env`, ensuring `.env` files are in `.gitignore`. Provide a `.env.example` file for developer reference.
