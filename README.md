# CNN Hyperparameter Playground

An interactive React + Vite app to **visualize convolutional hyperparameters** (kernel size, stride, padding, dilation) and their effect on output size and receptive fields.

---

## 🚀 Quickstart

```bash
# 1) Create folder & init (or just clone after you push)
# git clone https://github.com/YOUR_USERNAME/cnn-hyperparam-playground.git
# cd cnn-hyperparam-playground

# 2) Ensure Node 18+ (recommended 20+)
node -v

# 3) Install deps
npm install

# 4) Run locally
npm run dev
# open http://localhost:5173
```

---

## 📂 Project Structure

```
cnn-hyperparam-playground/
├── index.html
├── package.json
├── postcss.config.js
├── README.md
├── src/
│   ├── App.tsx
│   ├── CnnHyperparamPlayground.tsx
│   ├── index.css
│   └── main.tsx
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## Deploy
- **Vercel**: Import repo → Framework = Vite → Deploy
- **Netlify**: New site → Build: `npm run build` → Publish dir: `dist/`

## License
MIT

## 📝 Notes
- If Tailwind classes don’t apply, ensure `tailwind.config.ts` `content` globs match your file paths.
- Feel free to rename the app/component; filenames are minimal by design.
- To export a GIF for your README, use a screen recorder (e.g., ShareX, OBS) while toggling parameters.
