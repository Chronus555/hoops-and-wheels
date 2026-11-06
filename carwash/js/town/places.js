// Every play place in Sudsy Town. A place is loaded only when the child walks in,
// so adding places doesn't slow down the start. Order = order along the street.

export const PLACES = [
  { id: 'garage', load: () => import('../places/garage/index.js') },
  { id: 'court', load: () => import('../places/court/index.js') },
  { id: 'roads', load: () => import('../places/roads/index.js') },
  { id: 'construction', load: () => import('../places/construction/index.js') },
  { id: 'racetrack', load: () => import('../places/racetrack/index.js') },
];
