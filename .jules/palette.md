## 2024-05-16 - Icon-only buttons accessibility pattern
**Learning:** Found multiple icon-only buttons lacking accessible names in the main navigation and application header.
**Action:** Always add descriptive, localized `aria-label` attributes to any `<button>` element that only contains an icon (e.g. from `lucide-react`) to ensure screen readers can accurately interpret the interface.
