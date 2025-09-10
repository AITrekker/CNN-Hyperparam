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
  const [selectedOut, setSelectedOut] = useState<{x:number,y:number}|null>({x:0,y:0});
  const [showNumbers, setShowNumbers] = useState(false);
  const [showPadding, setShowPadding] = useState(true);

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

  // Animation loop: scan across output positions
  useEffect(() => {
    if (!animate || outW<=0 || outH<=0) return;
    let ix = 0;
    const total = outW * outH;
    setSelectedOut({x:0,y:0});
    const id = setInterval(() => {
      const y = Math.floor(ix / outW);
      const x = ix % outW;
      setSelectedOut({x, y});
      ix = (ix + 1) % total;
    }, Math.max(60, animSpeed));
    return () => clearInterval(id);
  }, [animate, outW, outH, animSpeed]);

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
            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showNumbers} onChange={e=>setShowNumbers(e.target.checked)} /> Show numbers</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showPadding} onChange={e=>setShowPadding(e.target.checked)} /> Show padding</label>
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

            <div className="flex items-center gap-3 pt-3">
              <button className={`px-3 py-1.5 rounded-xl text-sm shadow ${animate?"bg-emerald-600 text-white":"bg-slate-100"}`} onClick={()=>setAnimate(a=>!a)} disabled={disabledOut}>
                {animate ? "Stop animation" : "Animate scan"}
              </button>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                Speed
                <input type="range" min={60} max={800} step={20} value={860-animSpeed} onChange={e=>setAnimSpeed(860-parseInt(e.target.value))}/>
              </label>
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
                  return (
                    <div key={`i-${ix}-${iy}`} className={`w-6 h-6 md:w-6 md:h-6 flex items-center justify-center text-[10px] md:text-[10px] border ${inRF?"border-emerald-600":"border-slate-200"} ${isCenter?"bg-emerald-600 text-white":""}${inRF && !isCenter?"bg-emerald-100":""}${!inRF && !isPad?"bg-white":""}${isPad && showPadding && !inRF?"bg-slate-100":""}`}
                         title={`(${iy},${ix}) ${isPad?"[pad=0]":""} ${inRF?"[in RF]":""} ${isCenter?"[kernel center]":""}`}>
                      {showNumbers ? `${iy},${ix}` : (isCenter ? "⊗" : (isPad && showPadding && !inRF ? "0" : ""))}
                    </div>
                  );
                })
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Light green = receptive field, Dark green (⊗) = kernel center, Gray = padding (zeros).</p>
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
                        className={`w-6 h-6 md:w-6 md:h-6 text-[10px] md:text-[10px] flex items-center justify-center border ${selected?"bg-emerald-600 text-white border-emerald-700":"bg-white border-slate-200 hover:bg-emerald-50"}`}
                        title={`Output (${oy},${ox}) - click to view receptive field`}>
                        {showNumbers? `${oy},${ox}`: ""}
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