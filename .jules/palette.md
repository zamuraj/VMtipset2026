## 2024-06-17 - Graceful Empty States for Derived Data
**Learning:** Dynamically calculated widgets (like top scorer, form slump) show broken or confusing UI text (e.g., `( rätt senaste 5)`) when they rely on derived data that does not exist yet (e.g., before the tournament begins or before users have picks).
**Action:** Always provide explicit, friendly empty states (e.g., "Inväntar resultat") for dynamically generated stats widgets to prevent broken UI strings and maintain user trust, especially in dashboards.

## 2024-06-21 - Accessible Match Cards
**Learning:** The project used `div` elements with `onClick` handlers for the main interactive match cards in the Schedule view. This is a common anti-pattern that prevents screen readers from understanding the element's interactive nature and breaks native keyboard navigation (Tab focus, Space/Enter activation).
**Action:** Always convert interactive `div` elements to semantic `<button>` tags. Apply `w-full text-left` to preserve original block-level layout, and ensure explicit focus styling (e.g. `focus:outline-none focus-visible:ring-2`) is included for keyboard accessibility.
