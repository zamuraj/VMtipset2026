## 2025-05-15 - Hardcoded Admin Credentials
**Vulnerability:** Admin email and password were hardcoded in the frontend source code (src/app.jsx).
**Learning:** Hardcoding credentials makes them visible to anyone with access to the source code or the client-side bundle.
**Prevention:** Always use environment variables for sensitive configuration and ensure those variables are excluded from version control via .gitignore.

## 2026-05-27 - Remove Hardcoded Football API Key
**Vulnerability:** A hardcoded API key for the Football API was found in `src/app.jsx`.
**Learning:** Keys might have been added directly to code for quick prototyping, making them visible to anyone with access to the source code or the client-side bundle.
**Prevention:** Always use environment variables for sensitive keys. For Vite applications, use `.env` files and access them via `import.meta.env.VITE_*`. Ensure `.env` is listed in `.gitignore` and provide an `.env.example` file for safe key sharing templates.
## 2024-05-28 - Client-Side Hashing for Authentication
**Vulnerability:** Passwords (specifically for admin logins) were compared in plaintext against `user.password` stored in Firebase, exposing credentials if the database was compromised.
**Learning:** To securely handle existing data architecture without massive backend changes, client-side hashing (using Web Crypto API `SHA-256`) can be implemented before persisting or verifying credentials.
**Prevention:** Always hash credentials (even if it's on the client before storing in a NoSQL DB without a dedicated auth service) and avoid comparing plaintext passwords in source code or database records.
