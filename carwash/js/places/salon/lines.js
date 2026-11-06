// What the friends say at the salon.

export const LINES = {
  hello: ['Hi! Can I get a new look?', 'Make me fancy!'],
  grow: ["It's growing!", 'Longer hair!'],
  snip: ['Snip snip!', 'A haircut!'],
  bald: ['Uh oh, no hair! Ha ha!'],
  spiky: ['Spiky!'],
  curly: ['Curly!'],
  fluffy: ['Fluffy!'],
  hat: ['What a cool hat!', 'I love it!'],
  glasses: ['I can see!'],
  mustache: ['Ha ha, a mustache!'],
  outfit: ['Looking good!', 'So stylish!'],
  mirror: ['Is that me?', 'Wow, look at me!'],
  photo: ['Cheese!'],
  bye: ['Thank you! Bye!'],
};

export const HAIR_COLORS = { red: ['#e63946', 'Red!'], orange: ['#f8961e', 'Orange!'], yellow: ['#ffd166', 'Yellow!'], green: ['#06d6a0', 'Green!'], blue: ['#4895ef', 'Blue!'], purple: ['#9b5de5', 'Purple!'], pink: ['#ff8fc7', 'Pink!'], brown: ['#7f4f24', 'Brown!'] };
export const EXTRA = Object.values(HAIR_COLORS).map(c => c[1]);
