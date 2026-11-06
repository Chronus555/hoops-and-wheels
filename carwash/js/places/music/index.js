// Music Stage: a drum kit, a rainbow xylophone, a horn and a microphone, with a
// band of friends who dance along.
//  - ⭐ / 🐑 start "follow the lights": the next bar of Twinkle Twinkle or Mary Had
//    a Little Lamb glows, and tapping it plays the song note by note.
//  - 🥁 starts a beat the band dances to.
//  - 🎤 records the child for 3 seconds and plays it back with a funny echo.

import { div, pick, wait, useStyle } from '../../core/stage.js';
import { tone, noise, audioContext, voiceOutput } from '../../core/sound.js';
import { talk } from '../../core/voice.js';
import { makeScene, wiggle } from '../../core/scene.js';
import { Friend, FRIEND_KINDS, OUTFITS } from '../../core/friends.js';
import { LINES } from './lines.js';

const NOTES = [523, 587, 659, 698, 784, 880, 988, 1047];
const BAR_COLORS = ['#ef476f', '#f8961e', '#ffd166', '#06d6a0', '#4cc9f0', '#4895ef', '#9b5de5', '#ff8fc7'];
// Traditional (public domain) tunes, as xylophone bars 0-7 (C D E F G A B C).
const SONGS = {
  star: [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0],
  lamb: [2, 1, 0, 1, 2, 2, 2, 1, 1, 1, 2, 4, 4],
};
const drums = {
  kick: () => { tone(120, 0.3, { to: 45, vol: 0.6 }); },
  snare: () => { noise(0.18, { freq: 1800, q: 0.6, vol: 0.5 }); tone(220, 0.1, { vol: 0.15 }); },
  tom: () => tone(180, 0.3, { to: 110, vol: 0.45 }),
  cymbal: () => noise(0.8, { freq: 7000, q: 0.5, vol: 0.35 }),
  hat: () => noise(0.05, { freq: 8000, q: 1, vol: 0.18 }),
};
const xylo = f => { tone(f, 0.6, { type: 'triangle', vol: 0.3 }); tone(f * 4, 0.1, { vol: 0.04 }); };
const horn = f => { tone(f / 2, 0.35, { type: 'square', vol: 0.07 }); tone(f / 2, 0.35, { type: 'sawtooth', vol: 0.04 }); };

export default {
  id: 'music',
  open(ctx) {
    useStyle('js/places/music/style.css');
    document.body.dataset.screen = 'music';
    const g = makeScene({ cls: 'music', onHome: leave });
    const { fx } = g;
    const panel = div('panel p-music', `<div class="backdrop"></div><div class="curtain cl"></div><div class="curtain cr"></div>
      <div class="spots"><i></i><i></i><i></i></div><div class="disco"></div><div class="stagefloor"></div>`);
    const kinds = [...FRIEND_KINDS].sort(() => Math.random() - 0.5).slice(0, 3);
    const band = kinds.map((k, i) => {
      const f = new Friend(k, { outfit: pick(OUTFITS), width: 130, parent: panel });
      f.el.classList.add('player', `pl${i}`);
      f.el.addEventListener('pointerdown', e => {
        e.stopPropagation();
        f.play('cheer', 900);
        talk(k, LINES.tickle, { chatty: true });
      });
      return f;
    });
    const [drummer, xyloPlayer, singer] = band;

    // ---- drum kit -------------------------------------------------------------------
    const kit = div('kit', `<div class="drum cymbal" data-d="cymbal"></div><div class="drum tom" data-d="tom"></div>
      <div class="drum snare" data-d="snare"></div><div class="drum kick" data-d="kick"><b>★</b></div>`, panel);
    kit.querySelectorAll('.drum').forEach(d => d.addEventListener('pointerdown', e => {
      e.stopPropagation();
      drums[d.dataset.d]();
      wiggle(d, 'hit');
      drummer.play('hop', 400);
      lights();
    }));

    // ---- xylophone ------------------------------------------------------------------
    const xyl = div('xylo', '', panel);
    const bars = NOTES.map((f, i) => {
      const b = div('bar', '', xyl);
      b.style.background = BAR_COLORS[i];
      b.style.height = `${190 - i * 12}px`;
      b.addEventListener('pointerdown', e => {
        e.stopPropagation();
        hitBar(i);
      });
      return b;
    });
    let song = null;
    let pos = 0;
    function hitBar(i) {
      xylo(NOTES[i]);
      wiggle(bars[i], 'hit');
      xyloPlayer.play('hop', 400);
      fx.sparkles(560 + i * 50, 600, 20, 2);
      if (song && SONGS[song][pos] === i) {
        pos++;
        if (pos >= SONGS[song].length) finishSong();
        else glow();
      }
    }
    function glow() {
      bars.forEach((b, i) => b.classList.toggle('glow', song && SONGS[song][pos] === i));
    }
    async function finishSong() {
      song = null;
      glow();
      await wait(500);
      drums.cymbal();
      fx.confetti(700, 350, 70);
      band.forEach((f, i) => setTimeout(() => { f.play('cheer', 1200); f.mood('happy', 1500); }, i * 120));
      talk(singer.kind, LINES.song);
    }
    function startSong(name) {
      song = name;
      pos = 0;
      glow();
      talk(xyloPlayer.kind, LINES.follow);
    }

    // ---- horn and microphone -------------------------------------------------------
    const hornEl = div('horn', '🎺', panel);
    let hornNote = 0;
    hornEl.addEventListener('pointerdown', e => {
      e.stopPropagation();
      horn(NOTES[[0, 2, 4, 7, 4, 2][hornNote++ % 6]]);
      wiggle(hornEl, 'hit');
      singer.play('hop', 400);
    });
    const mic = div('mic', '<div class="head"></div><div class="stick"></div><div class="rec"></div>', panel);
    let recording = false;
    async function sing() {
      if (recording) return;
      const ac = audioContext();
      if (!ac || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return lala();
      recording = true;
      mic.classList.add('on');
      await talk(singer.kind, LINES.sing);
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        mic.classList.remove('on');
        recording = false;
        return lala();
      }
      const chunks = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = e => chunks.push(e.data);
      const done = new Promise(r => { rec.onstop = r; });
      rec.start();
      await wait(3000);
      rec.stop();
      await done;
      stream.getTracks().forEach(t => t.stop());
      mic.classList.remove('on');
      try {
        const buf = await new Blob(chunks).arrayBuffer();
        const audio = await new Promise((res, rej) => ac.decodeAudioData(buf, res, rej));
        await talk(singer.kind, LINES.listen);
        // Played back a little higher, with an echo, like a big stage.
        const src = ac.createBufferSource();
        src.buffer = audio;
        src.playbackRate.value = 1.25;
        const delay = ac.createDelay(1);
        delay.delayTime.value = 0.28;
        const fb = ac.createGain();
        fb.gain.value = 0.38;
        src.connect(voiceOutput());
        src.connect(delay);
        delay.connect(fb).connect(delay);
        delay.connect(voiceOutput());
        src.start();
        band.forEach(f => f.play('dance', 3200));
        setTimeout(() => { try { delay.disconnect(); } catch { /* done */ } }, (audio.duration / 1.25) * 1000 + 2000);
      } catch { lala(); }
      recording = false;
    }
    function lala() {
      singer.play('dance', 2000);
      talk(singer.kind, LINES.lala);
    }
    mic.addEventListener('pointerdown', e => { e.stopPropagation(); sing(); });

    // ---- the beat --------------------------------------------------------------------
    let beat = null;
    function toggleBeat() {
      if (beat) {
        clearInterval(beat);
        beat = null;
        band.forEach(f => f.el.classList.remove('dance'));
        panel.classList.remove('party');
        return;
      }
      let step = 0;
      beat = setInterval(() => {
        if (!g.screen.isConnected) return clearInterval(beat);
        if (step % 4 === 0) drums.kick();
        if (step % 4 === 2) drums.snare();
        drums.hat();
        if (step % 8 === 0) lights();
        step++;
      }, 300);
      band.forEach(f => f.el.classList.add('dance'));
      panel.classList.add('party');
      talk(drummer.kind, LINES.dance);
    }
    let hue = 0;
    function lights() {
      hue = (hue + 60) % 360;
      panel.style.setProperty('--spot', `hsl(${hue},90%,65%)`);
    }

    const tray = div('tray-row');
    const btn = (icon, fn, cls = '') => {
      const b = div(`tool roundbtn ${cls}`, `<span>${icon}</span>`, tray);
      b.addEventListener('pointerdown', e => { e.stopPropagation(); wiggle(b, 'press'); fn(); });
      return b;
    };
    const starBtn = btn('⭐', () => startSong('star'));
    btn('🐑', () => startSong('lamb'));
    btn('🥁', toggleBeat);
    btn('🎤', sing);
    btn('🪩', () => { lights(); panel.classList.toggle('disco-on'); fx.sparkles(700, 200, 200, 20); });

    g.setStations([{ id: 'music', icon: '🎵', panel, tray, hint: () => (song ? bars[SONGS[song][pos]] : starBtn) }]);
    setTimeout(() => talk(singer.kind, LINES.hello), 400);

    function leave() {
      if (beat) clearInterval(beat);
      g.close();
      ctx.exit();
    }
    if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__music = { startSong, hitBar, get pos() { return pos; }, get song() { return song; }, toggleBeat };
  },
};
