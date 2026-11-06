// What's said in the art studio.

export const LINES = {
  hello: ["Let's paint!", 'Make a picture!'],
  rainbow: ['Rainbow!'],
  glitter: ['Sparkly!'],
  clear: ['A new page!'],
  save: ['On the fridge!', 'Beautiful!'],
  page: ['Color the picture!'],
  wow: ['Wow!', 'So pretty!', 'I love it!'],
  eraser: ['Oops, erase!'],
  big: ['Big brush!'],
  small: ['Little brush!'],
};

export const PAINTS = {
  red: ['#ef233c', 'Red!'], orange: ['#f8961e', 'Orange!'], yellow: ['#ffd166', 'Yellow!'], green: ['#2dc653', 'Green!'],
  blue: ['#4895ef', 'Blue!'], purple: ['#9b5de5', 'Purple!'], pink: ['#ff8fc7', 'Pink!'], brown: ['#8d5a3b', 'Brown!'],
  black: ['#2b2d42', 'Black!'], white: ['#ffffff', 'White!'],
};
export const STAMPS = { star: ['⭐', 'Star!'], heart: ['❤️', 'Heart!'], car: ['🚗', 'Car!'], ball: ['🏀', 'Basketball!'], paw: ['🐾', 'Paw prints!'], flower: ['🌸', 'Flower!'] };
export const EXTRA = [...Object.values(PAINTS).map(p => p[1]), ...Object.values(STAMPS).map(s => s[1])];
