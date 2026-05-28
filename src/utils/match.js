export const get1X2 = (g1, g2) => {
  if (g1 === null || g2 === null) return null;
  return g1 > g2 ? '1' : g1 < g2 ? '2' : 'X';
};
