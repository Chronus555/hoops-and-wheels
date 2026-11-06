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
- The voice comes from the device's built-in text-to-speech, and the app picks the most natural one it finds. For a much less robotic voice on iPad, go to Settings → Accessibility → Spoken Content → Voices → English and download a **Premium** voice (Ava, Zoe or Evan) or an **Enhanced** one. The app uses it automatically, or you can choose it in the grown-up corner. On a Windows PC, Microsoft Edge has natural voices; Chrome only has the older robotic ones.

## Files

- `index.html`, `styles.css`, `manifest.webmanifest`, `sw.js`: the app shell and offline support
- `js/`: shared code (speech, sound effects, saved progress, router, drawings, word lists)
- `js/screens/`: one file per screen (start, home, the three games, reward, garage, rest, grown-up corner)
- `icons/`: home-screen icons
