## 2025-05-15 - Hardcoded Admin Credentials
**Vulnerability:** Admin email and password were hardcoded in the frontend source code (src/app.jsx).
**Learning:** Hardcoding credentials makes them visible to anyone with access to the source code or the client-side bundle.
**Prevention:** Always use environment variables for sensitive configuration and ensure those variables are excluded from version control via .gitignore.
