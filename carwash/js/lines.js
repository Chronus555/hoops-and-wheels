// Everything the animal drivers say. tools/voice/collect_carwash.mjs reads this file,
// so every line here gets recorded with the natural voice.

import { STICKERS, NUMBER_WORDS } from './art.js';

export const LINES = {
  hello: ['Hi!', 'Hello!', 'Hi there!', "Let's go!"],
  muddy: ["I'm so muddy!", 'Can you wash my car?', 'Look at all this mud!', 'I need a bath!'],
  tickle: ['Hee hee!', 'That tickles!', 'Beep beep!', 'Ha ha ha!', 'Hi there!'],
  splash: ['Wheee!', 'So splashy!', 'Splish splash!', 'Hee hee!'],
  bubbles: ['Bubbles!', 'So many bubbles!', 'Ooh, bubbles!'],
  scrub: ['Scrub scrub!', 'That feels nice!', 'That tickles!'],
  mud: ['Uh oh, mud!', 'Splat!', 'Oh no, mud!', 'Muddy again!'],
  clean: ['Sparkly clean!', 'Wow, so shiny!', 'Thank you!', 'I love it!'],
  dry: ['So fluffy!', 'All dry!'],
  up: ['Going up!', 'Whoa, up high!'],
  down: ['Going down!'],
  wheels: ['Cool wheels!', 'Ooh, new wheels!', 'I like these!'],
  bumpy: ['Bumpy bumpy!'],
  pump: ['Bigger!', 'Big tires!', 'Whoa!'],
  pop: ['Whoops!', 'Oh no!'],
  fix: ['Fix it up!', 'Clink clank!'],
  siren: ['Wee woo!'],
  hoop: ['Swish!', 'Nothing but net!'],
  crown: ['So fancy!'],
  propeller: ['Whirr!'],
  rocket: ['Blast off!'],
  cone: ['Yum!'],
  paint: ['So pretty!', 'I love it!', 'My new color!', 'Wow!'],
  red: ['Red!'],
  orange: ['Orange!'],
  yellow: ['Yellow!'],
  green: ['Green!'],
  blue: ['Blue!'],
  purple: ['Purple!'],
  pink: ['Pink!'],
  white: ['White!'],
  rainbow: ['Rainbow!'],
  full: ['All full!', 'Yum, thank you!'],
  cheese: ['Cheese!'],
  bye: ['Bye bye!', 'Thank you!', 'Vroom vroom!', 'See you later!'],
  pick: ['Pick me!', 'Me next!'],
  dance: ['Dance party!'],
};

// Sticker names and counting words are spoken too.
export const EXTRA = [...Object.values(STICKERS).map(s => s.say), ...NUMBER_WORDS];
