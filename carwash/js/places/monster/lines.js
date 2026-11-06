// What the monster says (in a deep monster voice).

export const LINES = {
  hello: ['Rawr! Hello!', 'Make me a monster!'],
  yum: ['Yum yum!', 'Delicious!', 'More, please!'],
  yuck: ['Yucky!', 'No thank you!'],
  socks: ['Mmm, socks! My favorite!'],
  burp: ['Excuse me!'],
  tickle: ['Hee hee! That tickles!', 'Ha ha ha!'],
  rawr: ['Rawr!'],
  look: ['I love my new look!', 'Rawr! So cool!'],
  big: ['I am getting so big!'],
};

export const EYES = ['One eye!', 'Two eyes!', 'Three eyes!', 'Four eyes!', 'Five eyes!'];
export const PART_NAMES = {
  round: 'Round!', tall: 'Tall!', wide: 'Wide!', wiggly: 'Wiggly!',
  smile: 'A big smile!', fangs: 'Little fangs!', tongue: 'Silly tongue!', oh: 'Oh!',
  horns: 'Horns!', antennae: 'Antennae!', ears: 'Fuzzy ears!', none: 'All done!',
  plain: 'Plain!', spots: 'Spots!', stripes: 'Stripes!', stars: 'Stars!',
};
export const COLOR_SAY = { '#06d6a0': 'Green!', '#9b5de5': 'Purple!', '#4895ef': 'Blue!', '#ff8fc7': 'Pink!', '#f8961e': 'Orange!', '#ef476f': 'Red!', '#ffd166': 'Yellow!' };
export const EXTRA = [...EYES, ...Object.values(PART_NAMES), ...Object.values(COLOR_SAY)];
