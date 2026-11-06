// The Car Wash & Garage place: the parking lot out front, and the garage with its
// five stations inside.

import { openLot } from './lot.js';
import { openGarage } from './garage.js';
import { takeCar, parkCar } from './store.js';

export default {
  id: 'garage',
  open(ctx) {
    function lot(arrivingId) {
      document.body.dataset.screen = 'lot';
      openLot({
        arrivingId,
        onHome: () => ctx.exit(),
        onPick(id) {
          const car = takeCar(id);
          if (!car) return lot();
          document.body.dataset.screen = 'garage';
          openGarage(car, saved => {
            parkCar(saved);
            lot(saved.id);
          });
        },
      });
    }
    lot();
  },
};
