## 2024-05-19 - Added ARIA labels to navigation and modal buttons
**Learning:** Found multiple icon-only buttons (`<Trophy/>`, `<Settings/>`, `<X/>`, `<Trash2/>`) without ARIA labels or titles. This is a common pattern in rapid React development with Lucide icons where developers forget that screen readers and mouse users need textual context for icons.
**Action:** When implementing icon-only buttons across the app, always enforce `aria-label` for screen readers and `title` for mouse hover tooltips to ensure accessibility for all users.
## 2026-05-17 - Added Loading States and Labels
**Learning:** It's common for inputs to lack explicit labels for screen readers when placeholder text is relied upon exclusively. We can improve this without affecting the visual design by using visually hidden `sr-only` labels. Also, operations that are completely synchronous and rely on local state could benefit from an artificial micro-delay (e.g. 600ms) paired with a loading spinner to communicate to users that processing is occurring, enhancing the perceived experience.
**Action:** Always ensure inputs have `<label>` elements, even if hidden with `sr-only`. If an action has no inherent delay but triggers a significant UI change (like login), adding a brief loading state can improve the 'UX feel'.
## 2024-05-20 - Added Focus Visible Styles
**Learning:** Inputs that use `outline-none` without replacement styling remove visual focus indication, making keyboard navigation difficult. This is a common accessibility issue.
**Action:** Always provide explicit focus styles (e.g. `focus:ring-2`) when overriding the browser's default `outline` to maintain keyboard accessibility.
## 2024-05-18 - [Added Empty State to Head-2-Head View]
**Learning:** The Head-2-Head view was showing a blank space below the selection dropdowns when players hadn't been selected, leading to a potentially confusing experience. Implementing a styled empty state with clear instructions and an illustrative icon enhances the UI.
**Action:** Always verify what the UI displays when required state variables (like selected items in a comparison view) are empty or uninitialized, and proactively add helpful "empty states" using existing design tokens.
## 2024-05-18 - Missing focus ring with `outline-none`
**Learning:** Found several input components (admin inputs, edit modal, head2head) using Tailwind `outline-none` but missing visual focus rings. When you remove default outlines, screen reader and keyboard users lose their visual focus cues.
**Action:** Always pair `outline-none` with explicit focus classes like `focus:ring-2 focus:ring-indigo-500/50` to maintain accessibility for keyboard navigation.
