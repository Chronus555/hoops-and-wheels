// What's said at the space station.

export const LINES = {
  hello: ['Ready for space?', "Let's build a rocket!"],
  astro: ['Helmet on! Ready!'],
  need: ['Build the rocket first!'],
  blast: ['Blast off!'],
  float: ['Wheee! Floating in space!'],
  comet: ['A comet! Zoom!'],
  flag: ['I planted a flag!'],
};
export const PARTS = [['🔥', 'Engine!'], ['⛽', 'Fuel tank!'], ['🪟', 'Capsule!']];
export const PLANETS = {
  earth: ['🌍', 'Earth! Our home!'], moon: ['🌕', 'The Moon!'], mars: ['🔴', 'Mars! The red planet!'],
  jupiter: ['🟠', 'Jupiter! The biggest planet!'], saturn: ['🪐', 'Saturn! Look at the rings!'],
};
export const COUNTDOWN = ['Ten!', 'Nine!', 'Eight!', 'Seven!', 'Six!', 'Five!', 'Four!', 'Three!', 'Two!', 'One!'];
export const EXTRA = [...PARTS.map(p => p[1]), ...Object.values(PLANETS).map(p => p[1]), ...COUNTDOWN, 'One!', 'Two!', 'Three!'];
