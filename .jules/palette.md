## 2024-06-17 - Graceful Empty States for Derived Data
**Learning:** Dynamically calculated widgets (like top scorer, form slump) show broken or confusing UI text (e.g., `( rätt senaste 5)`) when they rely on derived data that does not exist yet (e.g., before the tournament begins or before users have picks).
**Action:** Always provide explicit, friendly empty states (e.g., "Inväntar resultat") for dynamically generated stats widgets to prevent broken UI strings and maintain user trust, especially in dashboards.

## 2024-06-25 - ARIA Pressed for Button Segmented Controls
**Learning:** When using standard `<button>` elements to create segmented toggle controls (like time filters), users on screen readers miss critical active state feedback if they lack `aria-pressed`. Simple Tailwind class toggles (`bg-indigo-600` vs `bg-slate-100`) are invisible to assistive tech.
**Action:** Always append `aria-pressed={isActive}` on filter buttons acting as toggles, and pair with explicit keyboard focus rings (`focus-visible:ring-2`) to ensure full accessibility for interactive dashboard controls.