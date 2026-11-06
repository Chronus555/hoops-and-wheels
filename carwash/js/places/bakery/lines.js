// What the friends say at the bakery.

export const LINES = {
  hello: ["Let's bake a cake!", 'Hi, baker!'],
  mix: ['Stir stir stir!', 'Mix it up!'],
  ready: ['Ready to bake!'],
  bake: ['Into the oven!'],
  done: ['Ding! The cake is ready!'],
  frosting: ['Frosting!', 'Yummy frosting!'],
  sprinkles: ['Sprinkles!'],
  wish: ['Make a wish!'],
  hooray: ['Hooray!'],
  yum: ['Yum!', 'Delicious!', 'More cake, please!'],
  pickle: ['Yuck! A pickle!'],
  sock: ['Yucky! Who put a sock in the cake?'],
  burp: ['Excuse me!'],
  again: ["Let's make another cake!"],
  candle: ['Candles!'],
};

export const INGREDIENTS = {
  flour: { emoji: '🌾', say: 'Flour!', color: '#f3e0b5' },
  egg: { emoji: '🥚', say: 'Egg!', color: '#ffe8a3' },
  milk: { emoji: '🥛', say: 'Milk!', color: '#fffaf0' },
  butter: { emoji: '🧈', say: 'Butter!', color: '#ffe066' },
  sugar: { emoji: '🍬', say: 'Sugar!', color: '#fff0f6' },
  chocolate: { emoji: '🍫', say: 'Chocolate!', color: '#7f4f24' },
  strawberry: { emoji: '🍓', say: 'Strawberry!', color: '#ff8fab' },
  blueberry: { emoji: '🫐', say: 'Blueberries!', color: '#7b6cf6' },
  banana: { emoji: '🍌', say: 'Banana!', color: '#ffd166' },
  pickle: { emoji: '🥒', say: 'A pickle?', color: '#95d5b2', silly: 'pickle' },
  sock: { emoji: '🧦', say: 'A sock? Silly!', color: '#adb5bd', silly: 'sock' },
};

export const EXTRA = [...Object.values(INGREDIENTS).map(i => i.say), 'Three!', 'Two!', 'One!', 'Four!', 'Five!', 'Six!', 'Seven!', 'Eight!', 'Nine!', 'Ten!'];
