// What's said at home, from bath time to bedtime. The bedtime stories are original.

export const LINES = {
  hello: ['Bath time!', "Let's get ready for bed!"],
  soap: ['Bubbles!', 'Scrub a dub dub!'],
  rinse: ['Splish splash!'],
  duck: ['Quack quack!'],
  teeth: ['Brush brush brush!'],
  sparkly: ['Sparkly teeth!'],
  dry: ['All dry!', 'So fluffy!'],
  pajamas: ['Cozy pajamas!'],
  teddy: ['I love my teddy!'],
  yawn: ['Yawn! I am sleepy.'],
  night: ['Good night!', 'Sweet dreams!'],
  morning: ['Good morning!'],
};

export const STORIES = [
  [['🚗', 'Once upon a time, a little red car was very sleepy.'], ['🌙', 'It drove home under the big yellow moon.'], ['🏠', 'It parked in its cozy garage and turned off its lights.'], ['💤', 'Good night, little car. Sweet dreams!']],
  [['🏀', 'Once upon a time, a bouncy orange ball played all day.'], ['⭐', 'Bounce, bounce, it bounced up to the stars.'], ['🛏️', 'Then it rolled into bed and gave a big yawn.'], ['💤', 'Good night, little ball. Sweet dreams!']],
];
export const COUNT = ['One!', 'Two!', 'Three!', 'Four!', 'Five!', 'Six!', 'Seven!', 'Eight!', 'Nine!', 'Ten!'];
export const EXTRA = [...STORIES.flat().map(p => p[1]), ...COUNT];
