export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Spelled the way they sound, so text-to-speech says the letter name
// ("bee") instead of guessing ("A" is often read as "uh").
export const LETTER_NAMES = {
  A: 'ay', B: 'bee', C: 'see', D: 'dee', E: 'ee', F: 'eff', G: 'jee', H: 'aitch', I: 'eye',
  J: 'jay', K: 'kay', L: 'el', M: 'em', N: 'en', O: 'oh', P: 'pee', Q: 'cue', R: 'are',
  S: 'ess', T: 'tee', U: 'you', V: 'vee', W: 'double you', X: 'ex', Y: 'why', Z: 'zee',
};

// Starter letters for level 1, mixed with the letters in the child's name.
export const STARTER_LETTERS = ['A', 'B', 'C', 'D', 'E', 'O', 'S'];

// Beginning sounds: one clear picture per letter.
export const WORDS = [
  { L: 'A', word: 'apple', pic: '🍎' }, { L: 'B', word: 'ball', pic: '🏀' },
  { L: 'C', word: 'car', pic: '🚗' }, { L: 'D', word: 'dog', pic: '🐶' },
  { L: 'E', word: 'egg', pic: '🥚' }, { L: 'F', word: 'fish', pic: '🐟' },
  { L: 'G', word: 'goat', pic: '🐐' }, { L: 'H', word: 'hat', pic: '🎩' },
  { L: 'J', word: 'juice', pic: '🧃' }, { L: 'K', word: 'kite', pic: '🪁' },
  { L: 'L', word: 'lion', pic: '🦁' }, { L: 'M', word: 'moon', pic: '🌙' },
  { L: 'N', word: 'nose', pic: '👃' }, { L: 'O', word: 'octopus', pic: '🐙' },
  { L: 'P', word: 'pig', pic: '🐷' }, { L: 'R', word: 'robot', pic: '🤖' },
  { L: 'S', word: 'sun', pic: '☀️' }, { L: 'T', word: 'truck', pic: '🚚' },
  { L: 'U', word: 'umbrella', pic: '☂️' }, { L: 'V', word: 'van', pic: '🚐' },
  { L: 'W', word: 'watermelon', pic: '🍉' }, { L: 'Y', word: 'yo-yo', pic: '🪀' },
  { L: 'Z', word: 'zebra', pic: '🦓' },
];

export const RHYMES = [
  [{ word: 'cat', pic: '🐱' }, { word: 'hat', pic: '🎩' }],
  [{ word: 'car', pic: '🚗' }, { word: 'star', pic: '⭐' }],
  [{ word: 'bee', pic: '🐝' }, { word: 'tree', pic: '🌳' }],
  [{ word: 'moon', pic: '🌙' }, { word: 'spoon', pic: '🥄' }],
  [{ word: 'goat', pic: '🐐' }, { word: 'boat', pic: '⛵' }],
  [{ word: 'cake', pic: '🎂' }, { word: 'snake', pic: '🐍' }],
  [{ word: 'mouse', pic: '🐭' }, { word: 'house', pic: '🏠' }],
  [{ word: 'bear', pic: '🐻' }, { word: 'chair', pic: '🪑' }],
  [{ word: 'fox', pic: '🦊' }, { word: 'box', pic: '📦' }],
  [{ word: 'truck', pic: '🚚' }, { word: 'duck', pic: '🦆' }],
  [{ word: 'frog', pic: '🐸' }, { word: 'log', pic: '🪵' }],
  [{ word: 'king', pic: '🤴' }, { word: 'ring', pic: '💍' }],
];

export const COLORS = [
  { hex: '#e63946', name: 'red' },
  { hex: '#f77f00', name: 'orange' },
  { hex: '#ffbe0b', name: 'yellow' },
  { hex: '#2a9d8f', name: 'green' },
  { hex: '#3a86ff', name: 'blue' },
  { hex: '#8338ec', name: 'purple' },
  { hex: '#ff70a6', name: 'pink' },
  { hex: '#2b2d42', name: 'black' },
];

export const STICKERS = [
  { id: 'racecar', pic: '🏎️', name: 'race car' },
  { id: 'firetruck', pic: '🚒', name: 'fire truck' },
  { id: 'police', pic: '🚓', name: 'police car' },
  { id: 'ambulance', pic: '🚑', name: 'ambulance' },
  { id: 'taxi', pic: '🚕', name: 'taxi' },
  { id: 'bus', pic: '🚌', name: 'bus' },
  { id: 'pickup', pic: '🛻', name: 'pickup truck' },
  { id: 'truck', pic: '🚚', name: 'delivery truck' },
  { id: 'tractor', pic: '🚜', name: 'tractor' },
  { id: 'motorcycle', pic: '🏍️', name: 'motorcycle' },
  { id: 'scooter', pic: '🛵', name: 'scooter' },
  { id: 'bike', pic: '🚲', name: 'bike' },
  { id: 'van', pic: '🚐', name: 'van' },
  { id: 'suv', pic: '🚙', name: 'blue car' },
  { id: 'car', pic: '🚗', name: 'red car' },
  { id: 'rocket', pic: '🚀', name: 'rocket' },
  { id: 'helicopter', pic: '🚁', name: 'helicopter' },
  { id: 'basketball', pic: '🏀', name: 'basketball' },
  { id: 'trophy', pic: '🏆', name: 'trophy' },
  { id: 'medal', pic: '🥇', name: 'gold medal' },
  { id: 'sneaker', pic: '👟', name: 'sneaker' },
  { id: 'cap', pic: '🧢', name: 'cap' },
  { id: 'jersey', pic: '🎽', name: 'jersey' },
  { id: 'flag', pic: '🏁', name: 'finish flag' },
  { id: 'light', pic: '🚦', name: 'traffic light' },
  { id: 'gas', pic: '⛽', name: 'gas pump' },
  { id: 'wrench', pic: '🔧', name: 'wrench' },
  { id: 'tire', pic: '🛞', name: 'tire' },
  { id: 'train', pic: '🚂', name: 'train' },
  { id: 'monster', pic: '👾', name: 'monster' },
  { id: 'ufo', pic: '🛸', name: 'flying saucer' },
  { id: 'planet', pic: '🪐', name: 'planet' },
  { id: 'astronaut', pic: '🧑‍🚀', name: 'astronaut' },
  { id: 'cookie', pic: '🍪', name: 'cookie' },
  { id: 'robot', pic: '🤖', name: 'robot' },
];

export const FOODS = [
  { one: 'cookie', many: 'cookies', pic: '🍪' },
  { one: 'strawberry', many: 'strawberries', pic: '🍓' },
  { one: 'donut', many: 'donuts', pic: '🍩' },
  { one: 'apple', many: 'apples', pic: '🍎' },
  { one: 'cupcake', many: 'cupcakes', pic: '🧁' },
  { one: 'carrot', many: 'carrots', pic: '🥕' },
];

export const SHAPES = {
  circle: { name: 'circle', color: '#3a86ff' },
  square: { name: 'square', color: '#ffbe0b' },
  triangle: { name: 'triangle', color: '#e63946' },
  rectangle: { name: 'rectangle', color: '#2a9d8f' },
  star: { name: 'star', color: '#ffd166' },
  heart: { name: 'heart', color: '#ff70a6' },
  oval: { name: 'oval', color: '#8338ec' },
  diamond: { name: 'diamond', color: '#f77f00' },
};
export const BASIC_SHAPES = ['circle', 'square', 'triangle', 'rectangle'];
export const ALL_SHAPES = Object.keys(SHAPES);

// Pictures to build, one shape at a time. Coordinates are on a 400×400 board, listed in
// build order (later pieces sit on top). "fancy" swaps in a harder shape from level 2.
export const BLUEPRINTS = [
  {
    id: 'rocket', name: 'rocket', payoff: 'launch',
    slots: [
      { shape: 'rectangle', x: 150, y: 130, w: 100, h: 160, color: '#e9ecef' },
      { shape: 'triangle', x: 150, y: 50, w: 100, h: 80, color: '#e63946' },
      { shape: 'circle', fancy: 'star', x: 170, y: 160, w: 60, h: 60, color: '#3a86ff' },
      { shape: 'triangle', x: 96, y: 220, w: 54, h: 70, color: '#e63946' },
      { shape: 'triangle', x: 250, y: 220, w: 54, h: 70, color: '#e63946' },
    ],
  },
  {
    id: 'robot', name: 'robot', payoff: 'dance',
    slots: [
      { shape: 'rectangle', x: 125, y: 166, w: 150, h: 130, color: '#adb5bd' },
      { shape: 'square', x: 152, y: 66, w: 96, h: 96, color: '#ced4da' },
      { shape: 'rectangle', fancy: 'oval', x: 166, y: 96, w: 68, h: 30, color: '#3a86ff' },
      { shape: 'triangle', fancy: 'star', x: 180, y: 16, w: 40, h: 46, color: '#ffbe0b' },
      { shape: 'circle', fancy: 'heart', x: 176, y: 200, w: 48, h: 48, color: '#e63946' },
      { shape: 'square', x: 140, y: 300, w: 50, h: 50, color: '#495057' },
    ],
  },
  {
    id: 'car', name: 'car', payoff: 'drive',
    slots: [
      { shape: 'rectangle', x: 50, y: 190, w: 300, h: 80, color: '#e63946' },
      { shape: 'square', x: 150, y: 110, w: 84, h: 84, color: '#e63946' },
      { shape: 'square', fancy: 'diamond', x: 168, y: 128, w: 48, h: 48, color: '#d6f1ff' },
      { shape: 'circle', x: 80, y: 238, w: 76, h: 76, color: '#2b2d42' },
      { shape: 'circle', x: 244, y: 238, w: 76, h: 76, color: '#2b2d42' },
      { shape: 'circle', fancy: 'oval', x: 322, y: 204, w: 24, h: 32, color: '#ffe066' },
    ],
  },
];

export const RIDERS = [
  { pic: '🐶', name: 'dog' }, { pic: '🐱', name: 'cat' }, { pic: '🐷', name: 'pig' },
  { pic: '🐸', name: 'frog' }, { pic: '🐵', name: 'monkey' }, { pic: '🐰', name: 'bunny' },
  { pic: '🦁', name: 'lion' }, { pic: '🐼', name: 'panda' },
];

export const PRAISE = ['Great job', 'You got it', 'Awesome', 'Way to go', 'Super', 'Nice work', 'Wow'];

// Off-screen activities that carry the learning into real life.
export const CHALLENGES = [
  { pic: '🚗', text: 'Find 3 red cars next time you go outside.', say: 'Next time you go outside, find 3 red cars!' },
  { pic: '🛞', text: 'Count the wheels on a real car.', say: 'Count the wheels on a real car. How many are there?' },
  { pic: '🏀', text: 'Bounce a ball 5 times and count out loud.', say: 'Bounce a ball 5 times and count out loud!' },
  { pic: '🧺', text: 'Toss socks into a laundry basket and count the baskets.', say: 'Toss socks into a laundry basket. How many baskets can you make?' },
  { pic: '🔢', text: 'Spot the number 4 on a license plate or sign.', say: 'Look for the number 4 on a license plate or a sign!' },
  { pic: '🔤', text: 'Find the first letter of your name on a sign.', say: 'Find the first letter of your name on a sign!' },
  { pic: '📏', text: 'Line up toy cars from smallest to biggest.', say: 'Line up your toy cars from smallest to biggest!' },
  { pic: '🎨', text: 'Sort toy cars into groups by color.', say: 'Sort your toy cars into groups by color!' },
  { pic: '🎵', text: 'Say a word that rhymes with "car".', say: 'Tell a grown-up a word that rhymes with car!' },
  { pic: '👣', text: 'Count your steps from the door to the car.', say: 'Count your steps from the door to the car!' },
];

export const LEVEL_INFO = {
  race: [
    'Race to 10. Die shows 1–3 dots; tap the road once per step while the numbers are read aloud.',
    'Race to 20. Die shows 1–5 dots; child names how many dots before driving.',
    'Race to 20. Die shows 1–6 dots; child names how many dots before driving.',
  ],
  parking: [
    '3 parking spots, numbers 1–5 shown on the car (matching).',
    '4 spots, listening only, numbers 0–10.',
    '5 spots, listening only, numbers 0–20.',
  ],
  hoop: [
    'Find capital letters (starting with the letters in their name).',
    'Find any capital letter, plus beginning sounds ("apple starts with…").',
    'Beginning sounds, rhyming pictures and lowercase letters.',
  ],
  monster: [
    'Feed the monster exactly 1–5 treats, then tap thumbs up (counting out a set).',
    'Feed 2–8 treats, and pick the plate with more.',
    'Story problems (adding and taking away up to 6), more/less, and feeding up to 10.',
  ],
  build: [
    'Circle, square, triangle, rectangle. Dashed outlines show where each piece goes.',
    'Adds star, heart, oval and diamond. Outlines are hidden, so the child listens for the name.',
    'Sometimes describes the shape instead of naming it ("the shape with 3 sides").',
  ],
  train: [
    'AB patterns (dog, cat, dog, cat…): what comes next?',
    'AB, AAB, ABB and ABC patterns.',
    'Harder patterns (AABB) and finding a missing rider in the middle.',
  ],
};

Object.assign(LEVEL_INFO, {
  letterpark: [
    '3 spots, capital letters shown on the car (matching).',
    '4 spots, listening only, all capital letters.',
    '5 spots, capital and lowercase letters.',
  ],
  trace: [
    'Trace 3 capital letters (letters in his name first) on a wide road with start dots.',
    'Any capital letter or number 0–9, on a narrower road.',
    'Write his whole name, letter by letter, on a narrow road.',
  ],
  drum: [
    'Words with 1–2 beats. The drum shows the beats first, then he copies.',
    'Words with 1–3 beats, no demo: he works out the beats himself.',
    'Words with up to 4 beats (wa-ter-mel-on), no demo.',
  ],
  blend: [
    'The robot says compound words in parts (cup… cake); he picks the picture.',
    'Two-beat words in parts (mon… key).',
    'Three- and four-beat words in parts (el… uh… fant).',
  ],
  sort: [
    'Sort cars into 2 garages by color.',
    'Sort by color (3 garages) or by shape.',
    'Sort by shape, or by kind: animals, food and things that go.',
  ],
  size: [
    'Tap the biggest or the smallest of 3.',
    'Line up 3 from smallest to biggest.',
    'Line up 4, sometimes from biggest to smallest.',
  ],
  band: [
    'Repeat the band\'s tune, starting at 2 notes; it grows as he gets it right.',
    'Starts at 3 notes.',
    'Starts at 4 notes.',
  ],
  listen: [
    'One-step directions ("Tap the dog").',
    'Two-step directions ("Tap the dog, then the star").',
    'Three-step directions.',
  ],
});

export const GAME_NAMES = {
  race: 'Race Track', parking: 'Parking Lot', monster: 'Monster Munch',
  hoop: 'Hoop Shot', letterpark: 'Letter Parking', trace: 'Trace It', drum: 'Beat Drum', blend: 'Robot Talk',
  build: 'Build It!', train: 'Pattern Train', sort: 'Clean-up Sort', size: 'Big & Small',
  band: 'Animal Band', listen: 'Listen & Tap',
};

export const GAME_ICONS = {
  race: '🏁', parking: '🅿️', monster: '👾',
  hoop: '🏀', letterpark: '🔤', trace: '✏️', drum: '🥁', blend: '🤖',
  build: '🚀', train: '🚂', sort: '📦', size: '🐘',
  band: '🎵', listen: '👂',
};

// The home screen is four learning worlds, so he can focus on one area at a time.
export const WORLDS = [
  { id: 'numbers', name: 'Numbers', say: 'Numbers and counting', games: ['race', 'parking', 'monster'] },
  { id: 'letters', name: 'Letters', say: 'Letters and sounds', games: ['hoop', 'letterpark', 'trace', 'drum', 'blend'] },
  { id: 'shapes', name: 'Shapes', say: 'Shapes, patterns and sorting', games: ['build', 'train', 'sort', 'size'] },
  { id: 'brain', name: 'Memory', say: 'Memory and listening', games: ['band', 'listen'] },
];

export const worldOf = game => WORLDS.find(w => w.games.includes(game))?.id || null;

// Words split into beats, spelled so text-to-speech says each piece clearly.
export const BEAT_WORDS = [
  { word: 'dog', pic: '🐶', parts: ['dog'] }, { word: 'cat', pic: '🐱', parts: ['cat'] },
  { word: 'car', pic: '🚗', parts: ['car'] }, { word: 'ball', pic: '🏀', parts: ['ball'] },
  { word: 'sun', pic: '☀️', parts: ['sun'] }, { word: 'fish', pic: '🐟', parts: ['fish'] },
  { word: 'bus', pic: '🚌', parts: ['bus'] }, { word: 'cake', pic: '🎂', parts: ['cake'] },
  { word: 'monkey', pic: '🐵', parts: ['mun', 'key'] }, { word: 'apple', pic: '🍎', parts: ['ap', 'pull'] },
  { word: 'rabbit', pic: '🐰', parts: ['rab', 'bit'] }, { word: 'rocket', pic: '🚀', parts: ['rock', 'it'] },
  { word: 'pizza', pic: '🍕', parts: ['peet', 'suh'] }, { word: 'zebra', pic: '🦓', parts: ['zee', 'bruh'] },
  { word: 'panda', pic: '🐼', parts: ['pan', 'duh'] }, { word: 'cookie', pic: '🍪', parts: ['cook', 'ee'] },
  { word: 'pencil', pic: '✏️', parts: ['pen', 'sill'] }, { word: 'taco', pic: '🌮', parts: ['tah', 'co'] },
  { word: 'elephant', pic: '🐘', parts: ['el', 'uh', 'fant'] }, { word: 'banana', pic: '🍌', parts: ['buh', 'nan', 'uh'] },
  { word: 'kangaroo', pic: '🦘', parts: ['kang', 'guh', 'roo'] }, { word: 'butterfly', pic: '🦋', parts: ['but', 'er', 'fly'] },
  { word: 'dinosaur', pic: '🦕', parts: ['die', 'nuh', 'sore'] }, { word: 'broccoli', pic: '🥦', parts: ['brock', 'uh', 'lee'] },
  { word: 'crocodile', pic: '🐊', parts: ['crock', 'uh', 'dial'] }, { word: 'hamburger', pic: '🍔', parts: ['ham', 'burr', 'gur'] },
  { word: 'watermelon', pic: '🍉', parts: ['wah', 'ter', 'mel', 'un'] }, { word: 'helicopter', pic: '🚁', parts: ['heh', 'lee', 'cop', 'ter'] },
  { word: 'caterpillar', pic: '🐛', parts: ['cat', 'er', 'pill', 'er'] }, { word: 'motorcycle', pic: '🏍️', parts: ['mo', 'ter', 'sigh', 'cull'] },
];

export const COMPOUNDS = [
  { word: 'cupcake', pic: '🧁', parts: ['cup', 'cake'] }, { word: 'rainbow', pic: '🌈', parts: ['rain', 'bo'] },
  { word: 'snowman', pic: '⛄', parts: ['snow', 'man'] }, { word: 'popcorn', pic: '🍿', parts: ['pop', 'corn'] },
  { word: 'pancake', pic: '🥞', parts: ['pan', 'cake'] }, { word: 'ladybug', pic: '🐞', parts: ['lady', 'bug'] },
  { word: 'sunflower', pic: '🌻', parts: ['sun', 'flower'] }, { word: 'toothbrush', pic: '🪥', parts: ['tooth', 'brush'] },
  { word: 'airplane', pic: '✈️', parts: ['air', 'plane'] }, { word: 'hot dog', pic: '🌭', parts: ['hot', 'dog'] },
  { word: 'football', pic: '🏈', parts: ['foot', 'ball'] }, { word: 'fire truck', pic: '🚒', parts: ['fire', 'truck'] },
];

export const THINGS = [
  { pic: '🐶', name: 'dog' }, { pic: '🐱', name: 'cat' }, { pic: '🚗', name: 'car' }, { pic: '🏀', name: 'ball' },
  { pic: '🌳', name: 'tree' }, { pic: '🍎', name: 'apple' }, { pic: '⭐', name: 'star' }, { pic: '🚂', name: 'train' },
  { pic: '🐸', name: 'frog' }, { pic: '🎈', name: 'balloon' }, { pic: '🍌', name: 'banana' }, { pic: '🚀', name: 'rocket' },
  { pic: '🐟', name: 'fish' }, { pic: '🎩', name: 'hat' }, { pic: '🦆', name: 'duck' }, { pic: '🌙', name: 'moon' },
];

export const KINDS = {
  animals: { label: '🐾', say: 'animals', items: ['🐶', '🐱', '🐷', '🐸', '🐵', '🐰'] },
  food: { label: '🍽️', say: 'food', items: ['🍎', '🍌', '🍪', '🍕', '🥕', '🍩'] },
  go: { label: '🚦', say: 'things that go', items: ['🚗', '🚌', '🚒', '🚜', '🚲', '🚀'] },
};

export const SIZE_THINGS = [
  { pic: '🐻', one: 'bear', many: 'bears' }, { pic: '🏀', one: 'ball', many: 'balls' },
  { pic: '🚗', one: 'car', many: 'cars' }, { pic: '⭐', one: 'star', many: 'stars' },
  { pic: '🐟', one: 'fish', many: 'fish' }, { pic: '🎈', one: 'balloon', many: 'balloons' },
  { pic: '🐘', one: 'elephant', many: 'elephants' }, { pic: '🍎', one: 'apple', many: 'apples' },
];

export const BAND = [
  { pic: '🐸', name: 'frog', color: '#2a9d8f', freq: 262 },
  { pic: '🐥', name: 'chick', color: '#ffbe0b', freq: 330 },
  { pic: '🐻', name: 'bear', color: '#e76f51', freq: 392 },
  { pic: '🐳', name: 'whale', color: '#3a86ff', freq: 523 },
];
