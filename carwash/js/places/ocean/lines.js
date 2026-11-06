// What's said on the ocean dive.

export const LINES = {
  hello: ["Let's explore the ocean!", 'Dive, dive, dive!'],
  dark: ['It is getting dark!', 'Deeper and deeper!'],
  light: ['Lights on!'],
  treasure: ['Treasure!', 'Shiny gems!'],
  surface: ['Back to the top!'],
  ink: ['Squirt! Ink!'],
  puff: ['Puff!'],
  song: ['The whale is singing!'],
  bottom: ['The bottom of the sea!'],
};

export const CREATURES = {
  fish: 'A fish!', puffer: 'A pufferfish!', turtle: 'A sea turtle!', whale: 'A whale!', octopus: 'An octopus!',
  jelly: 'A jellyfish!', squid: 'A squid!', crab: 'A crab!', star: 'A starfish!',
};
export const COUNT = ['One!', 'Two!', 'Three!', 'Four!', 'Five!', 'Six!', 'Seven!', 'Eight!', 'Nine!'];
export const EXTRA = [...Object.values(CREATURES), ...COUNT];
