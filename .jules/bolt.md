## 2026-05-27 - O(N^2) render bottleneck resolution
**Learning:** React render loops referencing `.find()` on arrays for correlated data lookups cause O(N*M) bottlenecks during re-renders, significantly degrading UI performance.
**Action:** Always extract correlated lookups into O(1) Javascript Maps outside of the render loop (optionally cached with `useMemo` if applicable) to reduce complexity to O(N+M).
