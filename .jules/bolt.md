## 2024-08-01 - Pre-calculate derived matching data to avoid O(P*M) bottleneck
**Learning:** In the `leaderboard` useMemo, iterating over `activePlayers` and invoking `get1X2` for every match inside a nested loop causes a large number of redundant function calls. The total complexity acts like O(P * M).
**Action:** Always pre-calculate derived shared logic such as match outcomes or filtered match maps outside of the user/player loops when resolving tournament standings. This reduces function calls and simplifies complexity toward O(P + M).
