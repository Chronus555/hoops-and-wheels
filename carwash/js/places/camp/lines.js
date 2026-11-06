// What's said at the campground.

export const LINES = {
  hello: ["Let's go camping!", 'What a nice day!'],
  tent: ['Our tent is ready!'],
  logs: ['More logs!'],
  fire: ['A cozy campfire!'],
  night: ['Night time! Look at the stars!'],
  toast: ['Golden and yummy!', 'Yum, a toasty marshmallow!'],
  burnt: ['Oops! Crunchy!'],
  raw: ['Squishy!'],
  stars: ['Connect the stars!'],
  peek: ['Peekaboo!'],
};

export const CRITTERS = {
  owl: ['🦉', 'An owl! Hoo hoo!'], raccoon: ['🦝', 'A raccoon!'], bunny: ['🐰', 'A bunny!'],
  hedgehog: ['🦔', 'A hedgehog!'], deer: ['🦌', 'A deer!'], fireflies: ['✨', 'Fireflies!'],
};
export const PICTURES = {
  car: ['🚗', 'It is a car!'], fish: ['🐟', 'It is a fish!'], rocket: ['🚀', 'It is a rocket!'], bear: ['🐻', 'It is a bear!'],
};
export const COUNT = ['One!', 'Two!', 'Three!', 'Four!', 'Five!', 'Six!'];
export const EXTRA = [...Object.values(CRITTERS).map(c => c[1]), ...Object.values(PICTURES).map(p => p[1]), ...COUNT];
