// Grocery Store, two stations:
//  - Shop: a friend shows a picture list of 3 things. Tap or drag food from the
//    shelves into the cart; list items get a tick (anything else can go in too).
//  - Checkout: tap each item onto the scanner (beep!), the register counts them,
//    then tap that many coins into the register, counting out loud. Ka-ching! The
//    shopper waves goodbye and the next one comes in.

import { div, pick, wait, toStage, useStyle } from '../../core/stage.js';
import { sfx, tone } from '../../core/sound.js';
import { talk, talkText } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { dragThing } from '../../core/tools.js';
import { Friend, FRIEND_KINDS, OUTFITS } from '../../core/friends.js';
import { LINES, ITEMS, COUNT } from './lines.js';

const KEYS = Object.keys(ITEMS);
const sounds = {
  beep: () => tone(1850, 0.12, { type: 'square', vol: 0.06 }),
  coin: () => { tone(1975, 0.1, { vol: 0.15 }); tone(2637, 0.25, { vol: 0.12, at: 0.08 }); },
  kaching: () => { tone(1318, 0.15, { type: 'triangle', vol: 0.2 }); tone(1760, 0.5, { type: 'triangle', vol: 0.2, at: 0.12 }); },
  plop: () => tone(400, 0.12, { to: 200, vol: 0.25 }),
};
const CART = { x: 440, y: 520, w: 300, h: 220 };

export default {
  id: 'grocery',
  open(ctx) {
    useStyle('js/places/grocery/style.css');
    document.body.dataset.screen = 'grocery';
    const g = makeScene({ cls: 'grocery', onHome: leave });
    const { fx, screen } = g;

    let shopper = null;
    let list = [];
    let cart = [];
    let scanned = 0;
    let paid = 0;
    let lastKind = null;

    // ================= shop ===============================================================
    const shop = div('panel p-shop', '<div class="wall"></div><div class="floor"></div><div class="sign">🛒</div>');
    const shelves = div('shelves', '<i></i><i></i><i></i>', shop);
    KEYS.forEach((k, i) => {
      const item = div('food', ITEMS[k][0], shelves);
      item.style.left = `${40 + (i % 4) * 150}px`;
      item.style.top = `${Math.floor(i / 4) * 170 + 30}px`;
      item.addEventListener('pointerdown', e => {
        e.stopPropagation();
        const p0 = toStage(e.clientX, e.clientY);
        const ghost = div('foodghost', ITEMS[k][0], g.dragLayer);
        ghost.style.transform = `translate(${p0.x - 50}px,${p0.y - 50}px)`;
        dragThing(e, {
          move: p => { ghost.style.transform = `translate(${p.x - 50}px,${p.y - 50}px)`; },
          end: (p, moved) => {
            const inCart = p.x > CART.x - 40 && p.x < CART.x + CART.w + 40 && p.y > CART.y - 120 && p.y < CART.y + CART.h;
            if (moved && !inCart) {
              ghost.style.transition = 'transform .3s';
              ghost.style.transform = `translate(${p0.x - 50}px,${p0.y - 50}px)`;
              setTimeout(() => ghost.remove(), 300);
              return;
            }
            ghost.style.transition = 'transform .35s ease-in';
            ghost.style.transform = `translate(${CART.x + 100 + Math.random() * 100}px,${CART.y + 20}px) scale(.8)`;
            setTimeout(() => { ghost.remove(); toCart(k); }, 350);
          },
        });
      });
    });
    const cartEl = div('cart', '<div class="basket"></div><div class="items"></div><i class="w1"></i><i class="w2"></i><div class="handle"></div>', shop);
    const listEl = div('shoplist', '', shop);
    const shopperBox = div('shopperbox', '', shop);

    function drawList() {
      listEl.innerHTML = list.map(k => `<span class="${cart.includes(k) ? 'got' : ''}">${ITEMS[k][0]}</span>`).join('');
      cartEl.querySelector('.items').innerHTML = cart.slice(-10).map((k, i) => `<span style="left:${20 + (i % 5) * 50}px;top:${Math.floor(i / 5) * -34 + 40}px">${ITEMS[k][0]}</span>`).join('');
    }
    async function toCart(k) {
      if (cart.length >= 10) { sfx.boing(); return; }
      cart.push(k);
      sounds.plop();
      wiggle(cartEl, 'jump');
      drawList();
      await talkText(shopper.kind, ITEMS[k][1]);
      if (list.includes(k) && cart.filter(c => c === k).length === 1) {
        fx.sparkles(listEl.offsetLeft + 60, 300, 60, 6);
        if (list.every(l => cart.includes(l))) {
          sfx.ta_da();
          shopper.play('cheer', 1000);
          talk(shopper.kind, LINES.done);
        } else talk(shopper.kind, LINES.yes, { chatty: true });
      } else if (!list.includes(k)) talk(shopper.kind, LINES.extra, { chatty: true });
    }

    async function newShopper() {
      const kind = pick(FRIEND_KINDS.filter(k => k !== lastKind));
      lastKind = kind;
      list = [...KEYS].sort(() => Math.random() - 0.5).slice(0, 3);
      cart = [];
      scanned = 0;
      paid = 0;
      shopperBox.innerHTML = '';
      shopper = new Friend(kind, { outfit: pick(OUTFITS), width: 170, parent: shopperBox });
      cashierShopper.innerHTML = '';
      const twin = new Friend(kind, { outfit: shopper.outfit, width: 150, parent: cashierShopper });
      shopper.twin = twin;
      shopper.el.addEventListener('pointerdown', e => {
        e.stopPropagation();
        shopper.play('wave', 1000);
        sayList();
      });
      drawList();
      drawCheckout();
      shopperBox.animate([{ transform: 'translateX(-500px)' }, { transform: 'none' }], { duration: 800, easing: 'ease-out' });
      await wait(800);
      await talk(kind, LINES.hello);
      sayList();
    }
    async function sayList() {
      await talk(shopper.kind, LINES.need);
      for (const k of list) {
        wiggle(listEl.children[list.indexOf(k)], 'jump');
        await talkText(shopper.kind, ITEMS[k][1]);
      }
    }

    // ================= checkout ===========================================================
    const checkout = div('panel p-checkout', '<div class="wall"></div><div class="floor"></div><div class="belt"><i></i></div>');
    const scanner = div('scanner', '<div class="glass"></div>', checkout);
    const register = div('register', '<div class="screen"><b>0</b></div><div class="drawer"><span class="coins"></span></div>', checkout);
    const bag = div('bag', '<div class="inbag"></div>', checkout);
    const cashierShopper = div('cashiershopper', '', checkout);
    const beltItems = div('beltitems', '', checkout);
    const coinTray = div('cointray', '', checkout);
    const regNum = register.querySelector('.screen b');

    function drawCheckout() {
      const waiting = cart.slice(scanned);
      beltItems.innerHTML = '';
      waiting.forEach((k, i) => {
        const it = div('beltitem', ITEMS[k][0], beltItems);
        it.style.left = `${120 + i * 70}px`;
        it.addEventListener('pointerdown', e => { e.stopPropagation(); scan(); });
      });
      bag.querySelector('.inbag').innerHTML = cart.slice(0, scanned).slice(-6).map(k => `<span>${ITEMS[k][0]}</span>`).join('');
      regNum.textContent = String(scanned < cart.length || !cart.length ? scanned : cart.length - paid);
      register.querySelector('.coins').textContent = '🪙'.repeat(Math.min(paid, 10));
      coinTray.classList.toggle('on', cart.length > 0 && scanned === cart.length && paid < cart.length);
    }
    async function scan() {
      if (scanned >= cart.length || g.busy()) return;
      g.setBusy(true);
      const k = cart[scanned];
      const it = beltItems.firstChild;
      it?.animate([{ transform: 'none' }, { transform: 'translate(560px,-40px)' }], { duration: 350, fill: 'forwards' });
      await wait(350);
      sounds.beep();
      wiggle(scanner, 'flash');
      scanned++;
      drawCheckout();
      talkText(shopper.kind, COUNT[scanned - 1]);
      g.setBusy(false);
      if (scanned === cart.length) {
        await wait(900);
        regNum.textContent = String(cart.length);
        talk(shopper.kind, LINES.coins);
        wiggle(coinTray, 'hint');
      }
    }
    for (let i = 0; i < 10; i++) {
      const c = div('coin', '🪙', coinTray);
      c.addEventListener('pointerdown', e => { e.stopPropagation(); payCoin(c); });
    }
    async function payCoin(c) {
      if (!cart.length || scanned < cart.length || paid >= cart.length) { sfx.boing(); return; }
      paid++;
      sounds.coin();
      wiggle(c, 'jump');
      wiggle(register, 'jump');
      drawCheckout();
      regNum.textContent = String(cart.length - paid);
      talkText(shopper.kind, COUNT[paid - 1]);
      if (paid === cart.length) {
        await wait(800);
        sounds.kaching();
        fx.confetti(1000, 400, 40);
        shopper.twin.play('wave', 1400);
        shopper.twin.mood('happy', 1500);
        await talk(shopper.kind, LINES.bye);
        await wait(500);
        g.goTo(0);
        await wait(1300);
        newShopper();
      }
    }

    const shopTray = div('tray-row');
    const listBtn = div('tool listbtn', '<span>📝</span>', shopTray);
    listBtn.addEventListener('pointerdown', e => { e.stopPropagation(); sayList(); });
    const checkoutTray = div('tray-row');
    const scanBtn = div('tool scanbtn', '<span>📦</span>', checkoutTray);
    scanBtn.addEventListener('pointerdown', e => { e.stopPropagation(); scan(); });

    g.setStations([
      { id: 'shop', icon: '🛒', panel: shop, tray: shopTray, hint: () => shelves.children[3 + KEYS.indexOf(list.find(l => !cart.includes(l)) || list[0])] || listBtn },
      { id: 'checkout', icon: '💰', panel: checkout, tray: checkoutTray, enter: drawCheckout, hint: () => (scanned < cart.length ? beltItems.firstChild : coinTray.firstChild) },
    ]);
    void screen;
    newShopper();

    function leave() {
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__shop = { get list() { return list; }, get cart() { return cart; }, toCart, scan, payCoin: () => payCoin(coinTray.firstChild), get paid() { return paid; }, get scanned() { return scanned; }, get shopper() { return shopper?.kind; } };
  },
};
