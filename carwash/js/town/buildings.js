// What each place looks like from the street. Each building is about 450 wide and
// stands on the sidewalk; the element with class "door" opens when it's tapped.

export const BUILDINGS = {
  garage: {
    width: 450,
    html: `<div class="roof"></div><div class="wallb"></div>
      <div class="sign">Sudsy Garage</div>
      <div class="bubbles"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="door"><div class="brushes"></div><div class="shutter"></div></div>`,
  },
  court: {
    width: 450,
    html: `<div class="gymwall"></div><div class="gymroof"></div><div class="ballsign"><i></i></div>
      <div class="hoopsign"><b></b></div><div class="door gymdoor"><div class="shutter"></div></div>`,
  },
  roads: {
    width: 450,
    html: `<div class="depot"></div><div class="depotroof"></div><div class="lightpole"><i></i><i></i><i></i></div>
      <div class="busstop"><b>🚌</b></div><div class="door depotdoor"><div class="busnose"></div><div class="shutter"></div></div>`,
  },
  construction: {
    width: 450,
    html: `<div class="crane"><i class="mast"></i><i class="jib"></i><i class="cable"></i><i class="block"></i></div>
      <div class="dirtpile"></div><div class="fence"></div><div class="door gate"><div class="hazard"></div><div class="shutter"></div></div>`,
  },
  racetrack: {
    width: 450,
    html: `<div class="stand"></div><div class="standroof"></div><div class="flags"><i></i><i></i><i></i></div>
      <div class="door archway"><div class="checker"></div><div class="shutter"></div></div>`,
  },
  bakery: {
    width: 450,
    html: `<div class="shopwall"></div><div class="awning"></div><div class="bigsign">🧁</div>
      <div class="window wl">🎂</div><div class="door shopdoor"><div class="shutter"></div></div>`,
  },
  doctor: {
    width: 450,
    html: `<div class="clinicwall"></div><div class="clinicroof"></div><div class="redcross"></div>
      <div class="window wl">🩺</div><div class="door clinicdoor"><div class="shutter"></div></div>`,
  },
  salon: {
    width: 450,
    html: `<div class="salonwall"></div><div class="awning purple"></div><div class="bigsign">✂️</div><div class="barberpole"></div>
      <div class="door shopdoor"><div class="shutter"></div></div>`,
  },
  grocery: {
    width: 450,
    html: `<div class="storewall"></div><div class="awning green"></div><div class="bigsign">🛒</div>
      <div class="fruitstand">🍎🍌🍉</div><div class="door shopdoor right"><div class="shutter"></div></div>`,
  },
  fire: {
    width: 450,
    html: `<div class="firewall"></div><div class="fireroof"></div><div class="bigsign">🚒</div>
      <div class="door firedoor"><div class="shutter"></div></div>`,
  },
};
