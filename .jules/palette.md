## 2024-05-18 - [Added Empty State to Head-2-Head View]
**Learning:** The Head-2-Head view was showing a blank space below the selection dropdowns when players hadn't been selected, leading to a potentially confusing experience. Implementing a styled empty state with clear instructions and an illustrative icon enhances the UI.
**Action:** Always verify what the UI displays when required state variables (like selected items in a comparison view) are empty or uninitialized, and proactively add helpful "empty states" using existing design tokens.
