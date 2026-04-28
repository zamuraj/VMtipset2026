## 2024-05-20 - Missing ARIA Labels on Navigation Icons
**Learning:** Identified a pattern where critical navigation and header action buttons are purely icon-based (using lucide-react) without `aria-label` or `title` attributes. This severely impacts accessibility for screen readers and leaves desktop users without hover tooltips.
**Action:** Add `aria-label` and `title` to all icon-only buttons across the app to ensure baseline accessibility and usability.
