// What's said at the harbor.

export const LINES = {
  hello: ['Welcome to the harbor!', 'Help the big ship!'],
  push: ['Push, push!'],
  docked: ['The ship is docked! Hooray!'],
  bye: ['Bye bye, big ship!'],
  back: ['Here comes another ship!'],
  cast: ['Cast the line!'],
  horn: ['Toot toot!'],
  gull: ['Squawk!'],
  light: ['The lighthouse is shining!'],
};
export const CATCHES = [['🐟', 'A fish!'], ['🦀', 'A crab!'], ['👢', 'A boot! Silly!'], ['💰', 'Treasure!'], ['🐙', 'An octopus!'], ['🐠', 'A fish!']];
export const COUNT = ['One!', 'Two!', 'Three!', 'Four!'];
export const EXTRA = [...CATCHES.map(c => c[1]), ...COUNT];
