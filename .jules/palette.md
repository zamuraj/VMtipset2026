## 2024-05-19 - Added ARIA labels to navigation and modal buttons
**Learning:** Found multiple icon-only buttons (`<Trophy/>`, `<Settings/>`, `<X/>`, `<Trash2/>`) without ARIA labels or titles. This is a common pattern in rapid React development with Lucide icons where developers forget that screen readers and mouse users need textual context for icons.
**Action:** When implementing icon-only buttons across the app, always enforce `aria-label` for screen readers and `title` for mouse hover tooltips to ensure accessibility for all users.
