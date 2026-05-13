# Mohamed Amine Wardane — Portfolio

A personal developer portfolio showcasing 3D visuals, an interactive floating terminal, skills visualizations, and featured projects. Built with Vite, vanilla JS, CSS, and Babylon.js for the 3D scene.

This repository contains a single-page portfolio with modern, minimalist styling and several interactive features:

- 3D text and background built with `Babylon.js` (`src/dynamicText3D.js`).
- Interactive floating terminal panel (`src/terminal.js`) with custom commands and a typeable prompt.
- Skills visualizer and animated skill bars (`src/skillsVisualization.js`).
- Minimalist responsive layout and transparency layers defined in `index.html` and CSS blocks.

---

## Demo

Open the site locally to preview the portfolio.

## Tech stack

- Vite (dev server & build)
- Vanilla JavaScript (ES modules) — `src/main.js`, `src/terminal.js`, `src/dynamicText3D.js`
- Babylon.js for 3D rendering
- Plain CSS (in `index.html`) with responsive rules

## Getting started (development)

Prerequisites:

- Node.js 18+ and npm installed

Clone then install:

```bash
git clone <your-repo-url>
cd myprroject
npm install
```

Run the dev server:

```bash
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview
```

The production-ready files will be in `dist/` after `npm run build`.

## Key files

- `index.html` — main markup, inline CSS, and the canvas container
- `src/main.js` — application entry: initiates 3D scene, text, and terminal
- `src/terminal.js` — floating launcher + terminal panel, commands, and styling injection
- `src/dynamicText3D.js` — 3D text and particle helpers (Babylon.js)
- `src/skillsVisualization.js` — animated skill bars (visualization)
- `public/` or `assets/` — static assets (images, icons)

## Customization

- Update the copy in `index.html` (hero, sections, contact info).
- Change the terminal commands or prompt behavior in `src/terminal.js`.
- Tweak 3D text, fonts, and materials in `src/dynamicText3D.js`.

## Deployment

You can deploy the built site to providers such as Vercel, Netlify, GitHub Pages, or any static host. Typical flow for Vercel:

1. Connect repository in Vercel.
2. Set build command: `npm run build`.
3. Set output directory: `dist`.

For GitHub Pages, use `gh-pages` to publish `dist/` or serve `index.html` from the root.

## Contributing

Small contributions welcome. If you want to propose changes:

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/x`)
3. Commit changes and push
4. Open a PR with a short description

## License

This project is released under the MIT License. See `LICENSE` (or add one) if you want to include a specific license.

## Contact

- Email: amine.wardane999@gmail.com
- GitHub: https://github.com/mowardan

---

If you want, I can also:
- Add a `LICENSE` file (MIT) and push it.
- Insert the screenshots into `README.md` with relative paths (I can place optimized images into `public/` or `assets/`).
- Add a short `package.json` example scripts section if your `package.json` is missing the dev/build scripts.

Tell me which of the above you want next and I will update the repo accordingly.