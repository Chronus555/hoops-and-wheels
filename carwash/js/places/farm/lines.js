// What's said on the farm.

export const LINES = {
  hello: ['Welcome to the farm!', "Let's grow some food!"],
  plant: ['Plant a seed!', 'Into the dirt!'],
  water: ['Grow, grow!', 'Water makes it grow!'],
  grown: ['Look, it grew!', 'Ready to pick!'],
  eat: ['Yum!', 'Munch munch!'],
  egg: ['An egg!'],
  chick: ['Peep peep! A baby chick!'],
  tractor: ['Vroom! Tractor ride!'],
  basket: ['Look at all our food!'],
};

export const CROPS = {
  carrot: ['🥕', 'Carrot!'], sunflower: ['🌻', 'Sunflower!'], strawberry: ['🍓', 'Strawberry!'],
  pumpkin: ['🎃', 'Pumpkin!'], corn: ['🌽', 'Corn!'], tomato: ['🍅', 'Tomato!'],
};
export const ANIMALS = {
  cow: ['🐄', 'The cow says moo!'], pig: ['🐖', 'The pig says oink!'], sheep: ['🐑', 'The sheep says baa!'],
  hen: ['🐔', 'The chicken says cluck!'], horse: ['🐴', 'The horse says neigh!'], duck: ['🦆', 'The duck says quack!'],
};
export const COUNT = ['One!', 'Two!', 'Three!', 'Four!', 'Five!', 'Six!', 'Seven!', 'Eight!', 'Nine!', 'Ten!'];
export const EXTRA = [...Object.values(CROPS).map(c => c[1]), ...Object.values(ANIMALS).map(a => a[1]), ...COUNT];
