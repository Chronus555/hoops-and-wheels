// What's said at the train yard.

export const LINES = {
  hello: ['All aboard the train!', "Let's build the track!"],
  track: ['The track is ready!'],
  gap: ['Oops! We need more track!'],
  go: ['Choo choo! Here we go!'],
  tunnel: ['Into the tunnel!'],
  bridge: ['Over the bridge!'],
  back: ['Back at the station!'],
  full: ['The train is full!'],
};
export const CARS = [
  ['#ef476f', 'Red car!', '🪵', 'Logs!'],
  ['#4895ef', 'Blue car!', '🧸', 'Teddy bears!'],
  ['#ffd166', 'Yellow car!', '🍎', 'Apples!'],
];
export const COUNT = ['One!', 'Two!', 'Three!'];
export const EXTRA = [...CARS.flatMap(c => [c[1], c[3]]), ...COUNT];
