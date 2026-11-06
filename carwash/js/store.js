// Saved on the iPad: the cars waiting on the road and the finished cars in the lot.

import { VEHICLE_TYPES, DRIVER_KINDS, COLOR_NAMES } from './art.js';
import { pick } from './stage.js';

const KEY = 'sudsy-garage-v1';
export const MAX_PARKED = 8;

export function newCar(avoidTypes = []) {
  const types = VEHICLE_TYPES.filter(t => !avoidTypes.includes(t));
  const driver = pick(DRIVER_KINDS);
  return {
    id: Math.random().toString(36).slice(2, 10),
    type: pick(types.length ? types : VEHICLE_TYPES),
    driver,
    passengers: Array.from({ length: 4 }, () => pick(DRIVER_KINDS.filter(d => d !== driver))),
    color: pick(COLOR_NAMES.filter(c => c !== 'rainbow' && c !== 'white')),
    wheels: ['classic', 'classic'],
    pump: [1, 1],
    topper: null,
    horn: 'honk',
    stickers: [],
    paintURL: null,
    mudSeed: Math.floor(Math.random() * 1e9) + 1,
  };
}

function fresh() {
  const waiting = [];
  for (let i = 0; i < 3; i++) waiting.push(newCar(waiting.map(c => c.type)));
  return { waiting, parked: [] };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.waiting) && Array.isArray(s.parked)) {
      // The app was closed with a car in the garage: park it.
      if (s.current) s.parked.unshift(s.current);
      s.current = null;
      s.parked.length = Math.min(s.parked.length, MAX_PARKED);
      return s;
    }
  } catch { /* first run or private mode */ }
  return fresh();
}

export const state = load();

export function save() {
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return;
    } catch {
      // Out of room: drop the spray paint of the oldest painted car and retry.
      const old = [...state.parked].reverse().find(c => c.paintURL);
      if (!old) return;
      old.paintURL = null;
    }
  }
}

// Takes a car out of the lot (or off the road) to drive it into the garage.
export function takeCar(id) {
  let i = state.waiting.findIndex(c => c.id === id);
  if (i >= 0) {
    const [car] = state.waiting.splice(i, 1);
    state.waiting.splice(i, 0, newCar(state.waiting.map(c => c.type)));
    state.current = car;
    save();
    return car;
  }
  i = state.parked.findIndex(c => c.id === id);
  if (i >= 0) {
    const [car] = state.parked.splice(i, 1);
    state.current = car;
    save();
    return car;
  }
  return null;
}

export function parkCar(car) {
  state.parked = state.parked.filter(c => c.id !== car.id);
  state.parked.unshift(car);
  state.current = null;
  if (state.parked.length > MAX_PARKED) state.parked.length = MAX_PARKED;
  save();
}
