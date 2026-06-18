## 2024-06-17 - Graceful Empty States for Derived Data
**Learning:** Dynamically calculated widgets (like top scorer, form slump) show broken or confusing UI text (e.g., `( rätt senaste 5)`) when they rely on derived data that does not exist yet (e.g., before the tournament begins or before users have picks).
**Action:** Always provide explicit, friendly empty states (e.g., "Inväntar resultat") for dynamically generated stats widgets to prevent broken UI strings and maintain user trust, especially in dashboards.

## 2024-06-25 - Consistent Disabled States
**Learning:** While opacity visually dims a disabled button, users on desktop still expect their cursor to change when hovering over non-interactive elements. Missing `cursor-not-allowed` on disabled buttons causes micro-friction and makes it unclear if a button is disabled or just styled differently.
**Action:** Always combine `disabled:opacity-50` with `disabled:cursor-not-allowed` on buttons to provide complete visual feedback.
