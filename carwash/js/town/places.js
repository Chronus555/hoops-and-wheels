// Every play place in Sudsy Town. A place is loaded only when the child walks in,
// so adding places doesn't slow down the start. Order = order along the street.

export const PLACES = [
  { id: 'garage', load: () => import('../places/garage/index.js') },
  { id: 'court', load: () => import('../places/court/index.js') },
  { id: 'roads', load: () => import('../places/roads/index.js') },
  { id: 'construction', load: () => import('../places/construction/index.js') },
  { id: 'racetrack', load: () => import('../places/racetrack/index.js') },
  { id: 'bakery', load: () => import('../places/bakery/index.js') },
  { id: 'doctor', load: () => import('../places/doctor/index.js') },
  { id: 'salon', load: () => import('../places/salon/index.js') },
  { id: 'grocery', load: () => import('../places/grocery/index.js') },
  { id: 'fire', load: () => import('../places/fire/index.js') },
  { id: 'robot', load: () => import('../places/robot/index.js') },
  { id: 'monster', load: () => import('../places/monster/index.js') },
  { id: 'music', load: () => import('../places/music/index.js') },
  { id: 'art', load: () => import('../places/art/index.js') },
];
