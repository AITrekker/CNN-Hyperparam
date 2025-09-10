import React, { useMemo, useState, useEffect } from "react";

// CNN Hyperparameter Playground
// - Adjust kernel, stride, padding, dilation, and input size
// - See output size formula & live grid visualization
// - Click any output cell to highlight its receptive field on the (padded) input
// - Optional: animate scan to show stride / overlap

export default function CnnHyperparamPlayground() {
  // Core params
  const [inW, setInW] = useState(12);
  const [inH, setInH] = useState(12);
  const [kernel, setKernel] = useState(3);
  const [stride, setStride] = useState(1);
  const [padding, setPadding] = useState(1);
  const [dilation, setDilation] = useState(1);

  const [animate, setAnimate] = useState(false);
  const [animSpeed, setAnimSpeed] = useState(350); // ms
  const [jumpAnimation, setJumpAnimation] = useState(true);
  const [selectedOut, setSelectedOut] = useState<{x:number,y:number}|null>({x:0,y:0});
  const [animationPhase, setAnimationPhase] = useState<'kernel'|'transition'>('kernel');
  const [prevSelectedOut, setPrevSelectedOut] = useState<{x:number,y:number}|null>(null);
  const [showNumbers, setShowNumbers] = useState(false);
  const [showPadding, setShowPadding] = useState(true);
  const [kernelType, setKernelType] = useState("edge_detect");
  const [showValues, setShowValues] = useState(false);

  // Derived
  const effKernel = useMemo(() => (kernel - 1) * dilation + 1, [kernel, dilation]);

  const outW = useMemo(() => Math.floor((inW + 2 * padding - effKernel) / stride + 1), [inW, padding, effKernel, stride]);
  const outH = useMemo(() => Math.floor((inH + 2 * padding - effKernel) / stride + 1), [inH, padding, effKernel, stride]);

  // Clamp selected output when params change
  useEffect(() => {
    if (!selectedOut) return;
    if (selectedOut.x >= outW || selectedOut.y >= outH) {
      setSelectedOut(outW>0 && outH>0 ? {x: Math.min(selectedOut.x, Math.max(0,outW-1)), y: Math.min(selectedOut.y, Math.max(0,outH-1))} : null);
    }
  }, [outW, outH]);

  // Animation loop: scan across output positions with stride awareness
  useEffect(() => {
    if (!animate || outW<=0 || outH<=0) return;
    let ix = 0;
    let phase = 'kernel';
    const total = outW * outH;
    setSelectedOut({x:0,y:0});
    setAnimationPhase('kernel');
    
    const id = setInterval(() => {
      // Simple smooth animation through all output positions
      const y = Math.floor(ix / outW);
      const x = ix % outW;
      setSelectedOut({x, y});
      ix = (ix + 1) % total;
    }, Math.max(60, animSpeed));
    
    return () => clearInterval(id);
  }, [animate, outW, outH, animSpeed, jumpAnimation, stride]);

  // Build (padded) input grid indices to render borders distinctly
  const padW = inW + 2*padding;
  const padH = inH + 2*padding;

  // Given output cell (ox, oy), compute receptive field on padded input
  function rfBounds(ox:number, oy:number) {
    const startX = ox * stride;
    const startY = oy * stride;
    const endX = startX + effKernel - 1;
    const endY = startY + effKernel - 1;
    return {startX, startY, endX, endY};
  }

  const selRF = useMemo(() => {
    if (!selectedOut) return null;
    return rfBounds(selectedOut.x, selectedOut.y);
  }, [selectedOut, effKernel, stride]);

  function inIsInRF(ix:number, iy:number) {
    if (!selRF) return false;
    return ix >= selRF.startX && ix <= selRF.endX && iy >= selRF.startY && iy <= selRF.endY;
  }

  function isKernelCenter(ix:number, iy:number) {
    if (!selRF) return false;
    const centerX = Math.floor((selRF.startX + selRF.endX) / 2);
    const centerY = Math.floor((selRF.startY + selRF.endY) / 2);
    return ix === centerX && iy === centerY;
  }

  function isInDilatedKernel(ix:number, iy:number) {
    if (!selRF) return false;
    // Check if position is part of the actual dilated kernel pattern
    const relX = ix - selRF.startX;
    const relY = iy - selRF.startY;
    
    // Must be within the effective kernel bounds
    if (relX < 0 || relX >= effKernel || relY < 0 || relY >= effKernel) return false;
    
    // For dilation > 1, only certain positions are active
    return relX % dilation === 0 && relY % dilation === 0;
  }

  function isValidKernelPosition(ix:number, iy:number) {
    // Check if this padded input position would be a valid kernel center
    // Must be on stride grid starting from padding offset
    if (ix < padding || ix >= padding + inW || iy < padding || iy >= padding + inH) return false;
    const relativeX = ix - padding;
    const relativeY = iy - padding;
    return relativeX % stride === 0 && relativeY % stride === 0;
  }

  // Utility: nice label
  function L({label, children}:{label:string, children:React.ReactNode}){
    return (
      <label className="flex items-center gap-3 w-full">
        <span className="w-28 text-sm text-slate-500">{label}</span>
        <div className="flex-1">{children}</div>
      </label>
    );
  }

  const disabledOut = outW<=0 || outH<=0;

  // Preset configurations
  const presets = [
    { name: "Same Padding", desc: "Maintains input size", kernel: 3, stride: 1, padding: 1, dilation: 1 },
    { name: "Valid Padding", desc: "No padding", kernel: 3, stride: 1, padding: 0, dilation: 1 },
    { name: "Downsample 2x", desc: "Halves spatial size", kernel: 3, stride: 2, padding: 1, dilation: 1 },
    { name: "Large Kernel", desc: "5x5 convolution", kernel: 5, stride: 1, padding: 2, dilation: 1 },
    { name: "Dilated Conv", desc: "Expands receptive field", kernel: 3, stride: 1, padding: 2, dilation: 2 },
  ];

  function applyPreset(preset: typeof presets[0]) {
    setKernel(preset.kernel);
    setStride(preset.stride);
    setPadding(preset.padding);
    setDilation(preset.dilation);
  }

  // Parameter validation
  function validateParams() {
    const issues = [];
    if (effKernel > inW + 2 * padding) {
      issues.push(`Effective kernel (${effKernel}) larger than padded input width (${inW + 2 * padding})`);
    }
    if (effKernel > inH + 2 * padding) {
      issues.push(`Effective kernel (${effKernel}) larger than padded input height (${inH + 2 * padding})`);
    }
    if (outW <= 0 || outH <= 0) {
      issues.push("Invalid parameters produce no output");
    }
    return issues;
  }

  const validationIssues = validateParams();

  // Sample kernels and input data
  const kernelTypes = {
    edge_detect: { name: "Edge Detection", weights: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]] },
    blur: { name: "Blur", weights: [[1/9, 1/9, 1/9], [1/9, 1/9, 1/9], [1/9, 1/9, 1/9]] },
    sharpen: { name: "Sharpen", weights: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]] },
    identity: { name: "Identity", weights: [[0, 0, 0], [0, 1, 0], [0, 0, 0]] },
    emboss: { name: "Emboss", weights: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]] }
  };

  // Generate sample input data (simple pattern)
  function generateInputData() {
    const data: number[][] = [];
    for (let y = 0; y < inH; y++) {
      const row: number[] = [];
      for (let x = 0; x < inW; x++) {
        // Create a simple pattern: high values in center, lower at edges
        const centerX = inW / 2;
        const centerY = inH / 2;
        const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
        const value = Math.max(0, Math.min(255, Math.round(255 * (1 - distFromCenter / maxDist))));
        row.push(value);
      }
      data.push(row);
    }
    return data;
  }

  const inputData = useMemo(() => generateInputData(), [inW, inH]);
  const currentKernel = kernelTypes[kernelType as keyof typeof kernelTypes];

  // Convolution computation
  function computeConvolution() {
    const output: number[][] = [];
    const kernelWeights = currentKernel.weights;
    
    for (let oy = 0; oy < outH; oy++) {
      const row: number[] = [];
      for (let ox = 0; ox < outW; ox++) {
        let sum = 0;
        const rf = rfBounds(ox, oy);
        
        for (let ky = 0; ky < kernel; ky++) {
          for (let kx = 0; kx < kernel; kx++) {
            const inputY = rf.startY + ky * dilation;
            const inputX = rf.startX + kx * dilation;
            
            let inputValue = 0;
            // Handle padding (0) and valid input
            if (inputY >= padding && inputY < padding + inH && inputX >= padding && inputX < padding + inW) {
              inputValue = inputData[inputY - padding][inputX - padding];
            }
            
            if (ky < kernelWeights.length && kx < kernelWeights[0].length) {
              sum += inputValue * kernelWeights[ky][kx];
            }
          }
        }
        row.push(Math.round(sum));
      }
      output.push(row);
    }
    return output;
  }

  const outputData = useMemo(() => computeConvolution(), [currentKernel, inputData, outW, outH, kernel, dilation, padding, stride]);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">CNN Hyperparameter Playground</h1>
      <p className="text-slate-600 mb-6">Interactively explore how <strong>kernel size</strong>, <strong>stride</strong>, <strong>padding</strong>, and <strong>dilation</strong> affect output size and the <em>receptive field</em>. Click an output cell to see which input cells it reads.</p>

      {/* Controls */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl border border-slate-200 p-4 shadow-sm bg-white">
          <h2 className="text-lg font-medium mb-3">Parameters</h2>
          <div className="space-y-3">
            <L label="Input W">
              <input type="range" min={4} max={24} value={inW} onChange={e=>setInW(parseInt(e.target.value))} className="w-full"/>
              <div className="text-xs text-right text-slate-500">{inW}</div>
            </L>
            <L label="Input H">
              <input type="range" min={4} max={24} value={inH} onChange={e=>setInH(parseInt(e.target.value))} className="w-full"/>
              <div className="text-xs text-right text-slate-500">{inH}</div>
            </L>
            <hr className="my-2"/>
            <L label="Kernel">
              <input type="range" min={1} max={11} step={2} value={kernel} onChange={e=>setKernel(parseInt(e.target.value))} className="w-full"/>
              <div className="text-xs text-right text-slate-500">{kernel} × {kernel}</div>
            </L>
            <L label="Stride">
              <input type="range" min={1} max={6} step={1} value={stride} onChange={e=>setStride(parseInt(e.target.value))} className="w-full"/>
              <div className="text-xs text-right text-slate-500">{stride}</div>
            </L>
            <L label="Padding">
              <input type="range" min={0} max={6} step={1} value={padding} onChange={e=>setPadding(parseInt(e.target.value))} className="w-full"/>
              <div className="text-xs text-right text-slate-500">{padding}</div>
            </L>
            <L label="Dilation">
              <input type="range" min={1} max={4} step={1} value={dilation} onChange={e=>setDilation(parseInt(e.target.value))} className="w-full"/>
              <div className="text-xs text-right text-slate-500">{dilation}</div>
            </L>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showNumbers} onChange={e=>setShowNumbers(e.target.checked)} /> Show numbers</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showPadding} onChange={e=>setShowPadding(e.target.checked)} /> Show padding</label>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showValues} onChange={e=>setShowValues(e.target.checked)} /> Show values</label>
                <select 
                  value={kernelType} 
                  onChange={e=>setKernelType(e.target.value)}
                  className="text-xs px-2 py-1 border border-slate-200 rounded bg-white"
                  disabled={!showValues}
                >
                  {Object.entries(kernelTypes).map(([key, kernel]) => (
                    <option key={key} value={key}>{kernel.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {validationIssues.length > 0 && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <strong>Parameter Issues:</strong>
                <ul className="mt-1 space-y-1">
                  {validationIssues.map((issue, i) => <li key={i}>• {issue}</li>)}
                </ul>
              </div>
            )}

            <div className="pt-3">
              <h3 className="text-sm font-medium mb-2">Quick Presets</h3>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => applyPreset(preset)}
                    className="px-2 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors"
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-slate-500">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4 shadow-sm bg-white">
          <h2 className="text-lg font-medium mb-3">Formulas & Output</h2>
          <div className="text-sm space-y-2">
            <div>
              <div className="font-mono bg-slate-50 rounded p-2"> effective_kernel = (kernel - 1) · dilation + 1 = <strong>{effKernel}</strong></div>
            </div>
            <div>
              <div className="font-mono bg-slate-50 rounded p-2"> outW = ⌊(inW + 2·padding − effective_kernel) / stride⌋ + 1 = <strong>{outW}</strong></div>
            </div>
            <div>
              <div className="font-mono bg-slate-50 rounded p-2"> outH = ⌊(inH + 2·padding − effective_kernel) / stride⌋ + 1 = <strong>{outH}</strong></div>
            </div>
            <div className="text-slate-600">{outW>0&&outH>0? `Output shape: ${outH} × ${outW}` : "(Parameters currently yield no valid output; try reducing kernel / padding or increasing input.)"}</div>

            <div className="space-y-2 pt-3">
              <div className="flex items-center gap-3">
                <button className={`px-3 py-1.5 rounded-xl text-sm shadow ${animate?"bg-rose-200 text-rose-800":"bg-emerald-100 text-emerald-700"}`} onClick={()=>setAnimate(a=>!a)} disabled={disabledOut}>
                  {animate ? "Stop animation" : "Animate scan"}
                </button>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  Speed
                  <input type="range" min={60} max={800} step={20} value={860-animSpeed} onChange={e=>setAnimSpeed(860-parseInt(e.target.value))}/>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input type="checkbox" checked={jumpAnimation} onChange={e=>setJumpAnimation(e.target.checked)} />
                  Show stride grid {stride > 1 ? `(highlights valid kernel positions)` : "(no effect with stride 1)"}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grids */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Padded Input Grid */}
        <div className="rounded-2xl border border-slate-200 p-4 shadow-sm bg-white">
          <h3 className="text-base font-medium mb-2">Padded Input ({padH} × {padW}) {showPadding?"(padding highlighted)":""}</h3>
          <div className="flex justify-center">
            <div className="inline-grid" style={{gridTemplateColumns: `repeat(${padW}, 1.5rem)`}}>
              {Array.from({length: padH}).map((_, iy) => (
                Array.from({length: padW}).map((_, ix) => {
                  const isPad = (ix < padding) || (ix >= padding + inW) || (iy < padding) || (iy >= padding + inH);
                  const inRF = inIsInRF(ix, iy);
                  const isCenter = isKernelCenter(ix, iy);
                  const isValidPos = !isPad && isValidKernelPosition(ix, iy);
                  const showStrideGrid = stride > 1 && jumpAnimation && !inRF;
                  const isDilatedKernel = isInDilatedKernel(ix, iy);
                  const isSkippedInKernel = inRF && !isDilatedKernel && dilation > 1;
                  
                  return (
                    <div key={`i-${ix}-${iy}`} className={`grid-cell w-6 h-6 md:w-6 md:h-6 flex items-center justify-center text-[10px] md:text-[10px] border ${inRF?"border-emerald-600":"border-slate-200"} ${isCenter?"bg-emerald-600 text-white":""}${inRF && !isCenter && isDilatedKernel?"bg-emerald-200":""}${isSkippedInKernel?"bg-emerald-50":""}${inRF && !isCenter && !isDilatedKernel && !isSkippedInKernel?"bg-emerald-100":""}${!inRF && !isPad && isValidPos && showStrideGrid?"bg-blue-50 border-blue-300":""}${!inRF && !isPad && !isValidPos?"bg-white":""}${isPad && showPadding && !inRF?"bg-slate-100":""}`}
                         title={`(${iy},${ix}) ${isPad?"[pad=0]":""} ${inRF?"[in RF]":""} ${isCenter?"[kernel center]":""} ${isDilatedKernel && !isCenter?"[active kernel]":""} ${isSkippedInKernel?"[skipped by dilation]":""} ${isValidPos?"[stride position]":""}`}>
                      {showNumbers ? `${iy},${ix}` : 
                       showValues && !isPad ? Math.round(inputData[iy - padding]?.[ix - padding] || 0) :
                       (isCenter ? "⊗" : (isSkippedInKernel ? "·" : (isPad && showPadding && !inRF ? "0" : (isValidPos && showStrideGrid && !inRF ? "•" : ""))))}
                    </div>
                  );
                })
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Dark green (⊗) = kernel center, 
            {dilation > 1 ? "Medium green = active kernel positions, Light green/dots (·) = skipped by dilation, " : "Light green = receptive field, "}
            {stride > 1 && jumpAnimation ? "Blue dots = valid stride positions, " : ""}
            Gray = padding (zeros).
          </p>
        </div>

        {/* Output Grid */}
        <div className="rounded-2xl border border-slate-200 p-4 shadow-sm bg-white">
          <h3 className="text-base font-medium mb-2">Output ({outH} × {outW})</h3>
          <div className="flex justify-center">
            {outW>0 && outH>0 ? (
              <div className="inline-grid" style={{gridTemplateColumns: `repeat(${outW}, 1.5rem)`}}>
                {Array.from({length: outH}).map((_, oy) => (
                  Array.from({length: outW}).map((_, ox) => {
                    const selected = selectedOut && selectedOut.x===ox && selectedOut.y===oy;
                    return (
                      <button key={`o-${ox}-${oy}`} onClick={()=>setSelectedOut({x:ox,y:oy})}
                        className={`grid-cell w-6 h-6 md:w-6 md:h-6 text-[10px] md:text-[10px] flex items-center justify-center border ${selected?"bg-emerald-600 text-white border-emerald-700":"bg-white border-slate-200 hover:bg-emerald-50"} ${jumpAnimation && stride > 1 && animationPhase === 'transition' && selected ? 'grid-cell-fading' : ''}`}
                        title={`Output (${oy},${ox}) - click to view receptive field${showValues ? ` - Value: ${outputData[oy]?.[ox] || 0}` : ""}`}>
                        {showNumbers ? `${oy},${ox}` : (showValues ? (outputData[oy]?.[ox] || 0) : "")}
                      </button>
                    );
                  })
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No valid output for current parameters.</div>
            )}
          </div>

          {selectedOut && (
            <div className="mt-3 text-xs text-slate-600">
              <span className="font-mono">Selected output:</span> ({selectedOut.y}, {selectedOut.x}) →
              <span className="font-mono"> RF bounds on padded input:</span> [y: {selRF?.startY}..{selRF?.endY}], [x: {selRF?.startX}..{selRF?.endX}]
              {showValues && (
                <div className="mt-2">
                  <span className="font-mono">Kernel: {currentKernel.name}</span>
                  <div className="mt-1 inline-grid grid-cols-3 gap-0.5">
                    {currentKernel.weights.flat().map((weight, i) => (
                      <div key={i} className="w-6 h-6 bg-slate-100 border border-slate-300 flex items-center justify-center text-[9px] font-mono">
                        {weight.toFixed(1)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 text-xs bg-slate-50 rounded p-3 leading-relaxed">
            <p className="mb-1"><strong>Intuition:</strong> Stride moves the kernel by larger steps, shrinking the output; Padding virtually expands the input so edge cells are seen; Dilation spaces kernel taps, expanding the effective kernel without adding parameters.</p>
            <ul className="list-disc ml-5 space-y-1">
              <li><strong>Overlap</strong> occurs when stride &lt; kernel (you can see the green window overlap as you click adjacent outputs).</li>
              <li><strong>Same</strong>-ish spatial size is typically achieved with appropriate padding: padding ≈ ⌊(effKernel−1)/2⌋ when stride=1.</li>
              <li>Increase <strong>dilation</strong> to grow receptive fields without increasing params, often used in segmentation.</li>
            </ul>
          </div>
        </div>
      </div>

      <footer className="text-[11px] text-slate-500 mt-6">Tip: Toggle “Show numbers” to see exact indices; try kernel 5, stride 2, padding 2 to see downsampling with preserved center alignment.</footer>
    </div>
  );
}