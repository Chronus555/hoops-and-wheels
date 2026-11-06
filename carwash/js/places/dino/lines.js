// What's said at the dinosaur dig.

export const LINES = {
  hello: ["Let's dig for dinosaur bones!", 'Brush away the sand!'],
  all: ['We found all the bones!'],
  museum: ['Put the bones together!'],
  roar: ['Roar!'],
  egg: ['Crack, crack!'],
  hatch: ['A baby dinosaur! Rawr!'],
  next: ["Let's dig up another dinosaur!"],
  look: ['Look closely!'],
  bone: ['A bone!', 'Another bone!'],
};

export const DINO_NAMES = { trex: 'Tyrannosaurus rex!', tri: 'Triceratops!', longneck: 'Brachiosaurus!' };
export const COUNT = ['One!', 'Two!', 'Three!', 'Four!', 'Five!'];
export const EXTRA = [...Object.values(DINO_NAMES), ...COUNT];
