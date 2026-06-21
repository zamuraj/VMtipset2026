## 2024-06-17 - Graceful Empty States for Derived Data
**Learning:** Dynamically calculated widgets (like top scorer, form slump) show broken or confusing UI text (e.g., `( rätt senaste 5)`) when they rely on derived data that does not exist yet (e.g., before the tournament begins or before users have picks).
**Action:** Always provide explicit, friendly empty states (e.g., "Inväntar resultat") for dynamically generated stats widgets to prevent broken UI strings and maintain user trust, especially in dashboards.
## 2026-06-21 - Accessible Toggle Buttons
**Learning:** Icon-only buttons and custom toggle groups frequently lack ARIA labels and pressed states.
**Action:** Always add `aria-pressed` for toggle buttons and `aria-label` for icon-only buttons.
