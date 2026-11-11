# Circuit

A plain HTML, CSS and JavaScript workout picker and timer. Bodyweight only.

## Open in VS Code

1. Unzip the download.
2. In VS Code, choose **File → Open Folder** and select `circuit`.
3. Open `index.html` in your browser. You can also use VS Code's Live Server extension.

No installation or build command is needed.

## GitHub Pages

1. Create a GitHub repository.
2. Upload the **contents** of the `circuit` folder so `index.html` is at the repository root.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, your `main` branch, and **/ (root)**. Save.
5. Open the Pages link GitHub gives you.

All asset links are relative, so project repositories work too. No login or API keys are required by the app.

## Use

- Pick 3 or 4 exercises, or shuffle a new selection.
- Use **Change** to choose a specific move, the arrow button to swap, or **×** to remove it. Use **Add exercise** to fill an empty slot.
- Use **Exercises** to add and remove moves from the available bank. Choose each move's main focus. **Restore default exercises** puts back missing starter moves and keeps your custom moves.
- Every workout needs 3 or 4 selected moves. The picker uses a different primary focus for each move. Supporting muscles can still overlap.
- Select rounds and press **Start**. There is a 5-second preparation countdown.
- Three-move round: 30s exercise → 30s exercise → 30s exercise → 30s rest.
- Four-move round: 30s exercise → 30s exercise → 30s rest → 30s exercise → 30s exercise → 30s rest.
- A round includes its final 30-second rest. Three rounds take 6 minutes or 9 minutes, plus the initial 5-second countdown.
- The timer has pause, resume, skip, stop, and sound controls. Three short beeps mark the last 3 seconds. A higher tone starts exercise; a lower tone starts rest.

Keep the page in the foreground while training. The app asks the browser to keep the screen awake during the session. This works on supported browsers over HTTPS (including GitHub Pages); if unavailable, the timer shows a message to change your phone's Auto-Lock setting. Phone sound settings can affect whether cues are audible.

Exercises and settings are stored in the browser on the current device. They do not sync between phones. Private browsing, clearing website data, or switching between the local file and GitHub Pages can give you a fresh bank.

## Files

- `index.html` — layout
- `style.css` — all styling
- `core.js` — starter exercise bank, generator and timing sequences
- `app.js` — controls, local saving, sound and screen wake
- `tests/core.test.cjs` — optional checks; run `node --test tests/core.test.cjs` if Node.js is installed

The app uses no external fonts, libraries, trackers or network requests.
