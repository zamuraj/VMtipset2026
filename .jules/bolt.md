## 2026-05-05 - Avoid repetitive calculations inside nested loops
**Learning:** Found a case where a deterministic function calculating match results was executed inside a nested loop mapping over users and matches. Moving this deterministic function out and saving its values to a dictionary before the loops reduced the time complexity significantly.
**Action:** When working with nested loops or repetitive calls on static arrays, precalculate deterministic functions and cache results in objects/arrays outside the loop to be accessed via fast O(1) lookup.
