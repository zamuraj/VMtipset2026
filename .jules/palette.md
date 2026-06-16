## 2025-06-16 - Admin Filter Switch Refactor
**Learning:** Refactoring non-semantic `<div onClick>` switches to `<button role="switch">` requires moving the text label inside the button itself, replacing the external `<label>` wrapper. This ensures the entire surface area remains clickable while vastly improving screen reader interpretation.
**Action:** Always check the interactive bounds and text inclusion when refactoring custom toggle switches, ensuring `aria-checked` and `focus-visible:ring` are present.
