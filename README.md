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


## Future improvements
 Core Educational Features Missing:

  1. Kernel Weight Visualization: No actual display of kernel weights or values - just shows the receptive field outline
  2. Step-by-step Convolution Animation: Shows which cells are involved but doesn't demonstrate the actual multiply-accumulate
  operation
  3. Numerical Examples: Missing actual convolution calculations with sample input values
  4. Multiple Output Channels: Only shows single-channel convolution

  Visual Enhancements Missing:

  5. Dilation Gap Visualization: While mathematically correct, doesn't visually show the "gaps" between kernel elements when
  dilation > 1
  6. Stride "Jump" Animation: Could better show how the kernel jumps across positions
  7. ~~Padding Value Display: Shows padding regions but doesn't indicate they're typically filled with zeros~~ ✅
  8. ~~Kernel Center/Anchor Point: No indication of which cell is the kernel's center~~ ✅

  Interactive Features Missing:

  9. Preset Configurations: No quick buttons for common setups (same padding, valid padding, etc.)
  10. Parameter Constraints: Some combinations could be invalid but aren't prevented
  11. Formula Breakdown: Shows final formulas but not intermediate steps
  12. Export/Share: No way to save configurations or generate links

  Educational Context Missing:

  13. Common Use Cases: No examples of when to use different parameter combinations
  14. Performance Implications: No discussion of computational complexity
  15. Real CNN Layer Examples: Missing connections to actual neural network layers

  The current version excellently demonstrates the spatial relationships and output size calculations, but lacks the numerical
  computation aspects and deeper educational context that would make it a complete learning tool.
