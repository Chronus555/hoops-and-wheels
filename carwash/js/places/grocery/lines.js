// What the friends say at the grocery store.

export const LINES = {
  hello: ['Hi! Can you help me shop?'],
  need: ['I need these!'],
  yes: ['Yes, that one!', 'Got it!', 'Thank you!'],
  extra: ['Ooh, that too!', 'Yum!'],
  done: ["That's everything!", 'All done! Time to pay!'],
  pay: ['Time to pay!'],
  coins: ['Coins, please!'],
  bye: ['Thank you! Bye!'],
};

export const ITEMS = {
  apple: ['🍎', 'Apple!'],
  banana: ['🍌', 'Banana!'],
  carrot: ['🥕', 'Carrot!'],
  bread: ['🍞', 'Bread!'],
  milk: ['🥛', 'Milk!'],
  cheese: ['🧀', 'Cheese!'],
  eggs: ['🥚', 'Eggs!'],
  strawberry: ['🍓', 'Strawberry!'],
  broccoli: ['🥦', 'Broccoli!'],
  watermelon: ['🍉', 'Watermelon!'],
  fish: ['🐟', 'Fish!'],
  cookies: ['🍪', 'Cookies!'],
};

export const COUNT = ['One!', 'Two!', 'Three!', 'Four!', 'Five!', 'Six!', 'Seven!', 'Eight!', 'Nine!', 'Ten!'];
export const EXTRA = [...Object.values(ITEMS).map(i => i[1]), ...COUNT];
