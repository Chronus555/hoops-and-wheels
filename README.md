# Hoops & Wheels

A cars-and-basketball learning game for a pre-K child, built as a web app that runs full screen on an iPad.

## Learning worlds and games

The home screen has four worlds, so the child can pick one area to focus on. Each world holds its own games.

### 🔢 Numbers

| Game | What the child does | Skills |
|---|---|---|
| **Race Track** | Rolls a die, then taps the road once per step while each number is read aloud. Races a friendly rival car to 10 (or 20). | Counting, 1-to-1 correspondence, number line, dice dots |
| **Parking Lot** | Hears "Park in spot 4!" and drags the car into the right spot (or taps it). | Recognizing numbers 0–20 |
| **Monster Munch** | Feeds a hungry monster exactly N treats, then taps 👍. Later picks the plate with more or less, and solves tiny "I eat 1, how many are left?" stories. | Counting out a set, comparing, adding and taking away within 6 |

### 🔤 Letters

| Game | What the child does | Skills |
|---|---|---|
| **Hoop Shot** | Swipes the ball up into the hoop with the right answer (or taps the hoop). | Letter names, beginning sounds, rhyming |
| **Letter Parking** | Parks cars at the letter he hears. | Capital and lowercase letters |
| **Trace It** | Drives a little car along a letter-shaped road with a finger, stroke by stroke. Level 3 writes his whole name. | Letter and number formation, stroke order |
| **Beat Drum** | Hears a word ("elephant"), drums once for each beat, taps 👍. | Syllables (1–4 beats) |
| **Robot Talk** | A robot says a word in pieces ("cup… cake") and he picks the picture. | Blending word parts (the step before blending sounds) |

### 🔺 Shapes

| Game | What the child does | Skills |
|---|---|---|
| **Build It!** | Builds a rocket, robot or car one shape at a time, then taps it to blast off (5-4-3-2-1 countdown), dance or drive away. | Naming shapes, shape attributes ("3 sides"), counting backwards |
| **Pattern Train** | The voice chants the riders ("dog, cat, dog, cat…") while each car hops, then he picks who rides next or who's missing. | AB, AAB, ABB, ABC and AABB patterns |
| **Clean-up Sort** | Drags each toy into the right box (or taps toy, then box): by color, by shape, or animals / food / things that go. | Sorting and classifying |
| **Big & Small** | Taps the biggest or smallest, then lines things up by size. | Comparing and ordering by size |

### 🧠 Memory

| Game | What the child does | Skills |
|---|---|---|
| **Animal Band** | The band plays a tune on four animal pads; he plays it back. Tunes grow when he gets them right and shrink after two slips. | Working memory, listening |
| **Listen & Tap** | Follows 1-, 2- or 3-step spoken directions ("Tap the dog, then the star"). | Following directions, auditory memory |

Every finished round earns a sticker for the **garage**, where the child can also paint their car.

Each game has 3 levels. It moves up after two strong rounds and down after two rough ones. It also picks the numbers and letters the child misses most.

## Grown-up corner

Press and hold the 🔒 on the home screen, then answer the multiplication question. In there you can:

- Change the name, session length (default 10 min), voice and voice speed
- See progress: minutes played per day, the level in each game, and which numbers and letters are known or need practice
- Set a game's level by hand
- See the off-screen "play together" challenges

When the session time is up, the current round finishes, then the garage "closes" for an hour. You can reopen it from the grown-up corner.

## Try it on the iPad right now (same Wi-Fi)

1. On the PC, in this folder, run:

   ```bash
   python -m http.server 5173
   ```

2. On the iPad, open Safari and go to `http://<this PC's Wi-Fi IP>:5173`. You can find the IP with `ipconfig`. If Windows asks about the firewall, allow private networks.
3. Tap **Share → Add to Home Screen**.

This works while the PC is on. Offline mode needs HTTPS hosting, covered in the next section.

## Put it online for good (free, works offline)

Host the folder on any HTTPS static host. Two options:

- **Netlify Drop:** drag this folder onto https://app.netlify.com/drop
- **GitHub Pages:** push the folder to a repository and turn on Pages

Then open the link on the iPad in Safari and tap **Add to Home Screen**. After the first load it works offline. Progress is saved on the iPad itself.

If you change files later, bump `VERSION` in `sw.js` so the iPad picks up the new version.

## iPad tips

- **Guided Access** (Settings → Accessibility → Guided Access): triple-click the side or Home button while playing to lock the iPad to the game.
- Turn off silent mode and turn the volume up. All instructions are spoken.
- Record your child's name in the grown-up corner ("Their name in your voice") so the game can cheer for them by name.

## The voice

Every line the game speaks is pre-recorded with [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M), a free, open-source natural-sounding voice (the `af_heart` voice). The clips live in `audio/voice/`, so the voice sounds the same on every device and works offline. A sentence plays as one clip when it was recorded whole; otherwise it's joined from phrase and word clips. Anything without a recording falls back to the device's built-in voice, which you can also choose in the grown-up corner.

**After changing or adding spoken text**, re-record (only new lines are recorded):

```bash
npm run voice:build
```

One-time setup for that command is described at the top of `tools/voice/build_voice.py`. On localhost, any sentence without a recording is logged to the browser console as `[voice] no recording:`, so add it to `tools/voice/collect.mjs` if it isn't picked up automatically.

## Sudsy Town (second app, in `carwash/`)

A town of open-ended play places (it started as Sudsy Garage). There are no rules, no scores and nothing to lose. The app opens on a street the child swipes along; each building is a place to play. More places are being added in batches.

Places so far:

| Place | What he can do |
|---|---|
| 🧽 **Car Wash & Garage** | Wash, fix, paint, sticker and fuel muddy cars (details below). |
| 🏀 **Basketball Court** | Flick a basketball, beach ball, tennis ball or watermelon at the hoop, and drag the hoop higher, lower or closer. The scoreboard counts baskets out loud up to 20. Change the player's jersey, and blow the whistle for a dance party. |
| 🚌 **Busy Town Roads** | Drive the bus with the pedals. Stop at red lights (tap a light to change it), pick up friends at bus stops, and take them where their bubble says (shop, park, home, ice cream). A puddle splashes mud, and the drive-through wash cleans it. Counts passengers. |
| 🚜 **Construction Site** | Touch anywhere and the digger's arm reaches there. Scoop dirt into the dump truck (it counts to 5, then drives off to empty). At the crane, stack big, small, long and tall blocks while the friends count them, then knock the tower down with the wrecking ball. |
| 🏁 **Racetrack** | Pick a kart, count down 3-2-1-Go, and hold GO for two laps. Boost pads and a pit stop give extra speed. Everyone gets a medal on the podium. |
| 🧁 **Bakery** | Drop ingredients in the bowl (a pickle and a sock are there for laughs) and stir. Bake it (3-2-1, ding!), then frost, sprinkle, add fruit and candles (counted). At the party, blow out the candles and hand out slices: "Yum!" or "Yuck!", and the odd burp. |
| 🩺 **Animal Doctor** | A friend comes in with a bumped knee, the sniffles, a fever or a tummy ache. Thermometer, stethoscope (heartbeat), x-ray (something silly inside), a tickly "shot", bandages, tissues, an ice pack and bubble medicine. The right one makes them better, then a lollipop. Tapping the patient names body parts. |
| ✂️ **Salon & Dress-up** | Grow hair with the spray, snip it short (even bald), comb it spiky or curly, and dye it any colour (named out loud). Then hats, glasses, a silly mustache, outfits and a photo, with a mirror showing the new look. |
| 🛒 **Grocery Store** | A shopper shows a picture list. Find the foods on the shelves (each one is named), scan them at the checkout (counted), then pay by counting coins into the register. |
| 🚒 **Fire Station** | Slide down the pole, ring the bell, put on a helmet. At the house, spray the cartoon flames until each goes out (counted), raise the ladder to bring the kitten down, and the family says thank you. |
 Muddy cars wait on the road outside; tap one to drive it in. Each car has an animal driver (hippo, frog, lion, pig, elephant or bear) who giggles, cheers and talks with the recorded voice.

**Car Wash & Garage stations:**

| Station | What he can do |
|---|---|
| 🧽 **Wash** | Scrub mud with the sponge, add soap bubbles, rinse with the hose, dry with the towel, or pull the lever for the automatic brushes. The mud bucket makes it muddy again. A sparkly-clean moment plays when it's all clean. |
| 🔧 **Fix-it** | Swap wheels from the rack (monster, basketball, donut, square, tiny...), pump the tyres until they pop, raise the lift, pick a horn (honk, quack, moo, trumpet), put a toy on the roof (siren, hoop, crown, propeller, rocket, ice cream). Tap the radio for music. |
| 🎨 **Paint** | Tap a paint bucket to repaint the whole car (the driver names the colour), or drag the spray can to draw. Tap the can to change its colour. |
| ⭐ **Stickers** | Shapes, numbers 0 to 9, racing stripes, flames, checkers and rainbows. The driver names each one. Drag stickers around or pull them off. |
| ⛽ **Fuel** | Put the nozzle in the car and the pump counts to 10 out loud. Take a photo, then press the green light to drive away. |

Finished cars park in the lot (up to 8) and can be brought back in any time. Tapping any tool also works: it sweeps over the car by itself.

It's at `https://chronus555.github.io/hoops-and-wheels/carwash/`. Add it to the Home Screen the same way as Hoops & Wheels. It's built for landscape.

**Grown-up corner:** press and hold the 🔒 on the town map, then answer the sum. It sets a daily play-time limit (off by default), gives 10 more minutes, or starts the town fresh. When the time runs out, the town goes to sleep.

**How it's built:** `carwash/js/core/` is the shared engine (stage, sound, voice, effects, draggable tools, scenes, saving, the animal friends). `carwash/js/town/` is the street. Each place lives in `carwash/js/places/<name>/` with an `index.js` and a `lines.js` (what the friends say there), and is listed in `town/places.js` and `town/buildings.js`.

**Before publishing a change**, run this. It records any new voice lines, refreshes `carwash/files.json` (the files saved for offline play), and bumps the version so iPads update:

```bash
npm run carwash:release
```

## Files

- `index.html`, `styles.css`, `manifest.webmanifest`, `sw.js`: the app shell and offline support
- `js/`: shared code (speech, sound effects, saved progress, router, drawings, word lists)
- `js/screens/`: one file per screen (start, home, world, the games, reward, garage, rest, grown-up corner)
- `audio/voice/`: the recorded voice clips and their index
- `tools/voice/`: scripts that collect every spoken line and record it
- `carwash/`: the Sudsy Town app (its own page, code, voice clips and icons)
- `tools/devserver.py`: local test server that turns off browser caching
- `icons/`: home-screen icons
