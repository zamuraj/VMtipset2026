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

## 2026-05-26 - Added Empty State to Snackis (Chat)
**Learning:** The 'Snackis' chat tab was rendering an entirely blank space when no messages existed. This can make the app feel broken or unpopulated. Implementing a clear, stylized empty state with a call-to-action improves user experience significantly by explaining the current state and encouraging interaction.
**Action:** Always provide visually distinct 'empty states' for lists and dynamic collections (like chat messages or groups) when their length is zero to maintain a polished and user-friendly interface.

## 2024-05-22 - Chat Loading and Empty States
**Learning:** Using `try...finally` with a discrete state `isSendingChat` avoids double submission in asynchronous `addDoc` Firestore operations. We also verified you can bypass Firebase UI auth directly via localStorage injection to test UI states.
**Action:** Always wrap async submit actions with `disabled={isSubmitting}` and provide a `Loader2` or visual feedback. Use explicit empty states (e.g., `MessageSquare` with helpful text) for lists that can be empty to encourage user interaction.

## 2024-05-25 - Added loading state to async button
**Learning:** Adding loading states (`isSendingChat`) to forms lacking them improves UX and prevents double submission of messages.
**Action:** Always add loading indicators, like `Loader2`, to data submission buttons for better user feedback.

## 2024-05-23 - Add Confirmation to Destructive Delete Actions
**Learning:** Destructive actions without confirmation dialogues easily lead to accidental data loss or disruption, especially on mobile devices where fat-fingering is common.
**Action:** When creating functionality for deleting records or documents, always include a user confirmation step (e.g. `window.confirm`) to prevent accidental actions.
## 2026-05-27 - Unhandled Registrations Empty State and GODKÄNN Loading State
**Learning:** Found an opportunity to improve the "Ohanterade Anmälningar" section in the admin tab by adding a rewarding "inbox zero" empty state. Also realized the "GODKÄNN" button lacked visual feedback for the async Firestore operation, creating a risk of double-clicks.
**Action:** Always provide explicit, rewarding empty states for admin action queues when cleared. Always add state tracking (like `approvingId`) and a disabled spinner state (`Loader2`) to buttons triggering network requests.

## 2024-05-31 - Added aria-current to Nav and Contextual Titles to Disabled Buttons
**Learning:** Bottom navigation bars lacking `aria-current="page"` make it difficult for screen reader users to identify the currently active tab. Also, disabled action buttons without contextual `title` text leave mouse users guessing why they cannot interact with the button (e.g. waiting for async request vs validation failure).
**Action:** Always enforce `aria-current="page"` on the active element in navigation menus. Always provide contextual `title` text for disabled buttons to explicitly communicate the reason for the disabled state.

## 2026-05-30 - Contextual Disabled States and Navigation Accessibility
**Learning:** Found an opportunity to improve the registration form's submit button. By default, disabled buttons provide no feedback to the user on *why* they are disabled. Adding a dynamic `title` attribute explaining the requirements (e.g. "Du måste tippa alla 72 matcher (3 kvar)") makes the interaction significantly more intuitive. Furthermore, the bottom `<nav>` bar lacked ARIA markup to indicate the active tab to screen readers, and the notification toggle lacked `aria-expanded`.
**Action:** Always provide contextual `title` text for disabled state buttons, especially in forms. When building navigation bars and toggles, strictly enforce `aria-label`, `aria-current="page"`, and `aria-expanded` attributes for keyboard and screen reader accessibility.
## 2026-06-01 - Avoid native alert calls for inline toasts
**Learning:** Native \`alert()\` calls block the UI thread, halt Javascript execution, and offer no design control, looking out of place in modern, polished React apps (like this application).
**Action:** Always replace \`alert()\` implementations with a lightweight custom state-based toast notification system (e.g. \`useState\` with \`setTimeout\`) that renders non-blocking UI components. Ensure that missing imports for any icons or tools used in the toast UI (like \`X\` or \`ShieldCheck\` from \`lucide-react\`) are added to prevent \`ReferenceError\` runtime crashes.
