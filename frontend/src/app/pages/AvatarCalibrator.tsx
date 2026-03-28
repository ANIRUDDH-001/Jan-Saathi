import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * AvatarCalibrator — Interactive tool to position eyes & mouth on the Ved avatar image.
 *
 * Drag the colored circles to align them over the character's actual eyes and mouth.
 * When you're happy, click "Copy F values" to get the coordinates object
 * that you can paste directly into VedAvatar.tsx.
 *
 * Route: /calibrate
 */

const AVATAR_IMAGE_SRC = '/assets/ved_avatar_cutout.png';

// The fixed canvas dimensions used in VedAvatar's SVG viewBox
const CANVAS_W = 380;
const CANVAS_H = 422;

// Display size for calibration (3× the avatar in VedEntry)
const DISPLAY_SIZE = 600;

interface DragPoint {
  x: number;
  y: number;
  label: string;
  color: string;
}

function useDrag(
  initialX: number,
  initialY: number,
  svgRef: React.RefObject<SVGSVGElement | null>,
) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const dragging = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || !svgRef.current) return;
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const svgPt = pt.matrixTransform(ctm.inverse());
      setPos({ x: Math.round(svgPt.x * 10) / 10, y: Math.round(svgPt.y * 10) / 10 });
    },
    [svgRef],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return { pos, setPos, onPointerDown, onPointerMove, onPointerUp };
}

export function AvatarCalibrator() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Current F values as starting points
  const leftEye = useDrag(162, 115, svgRef);
  const rightEye = useDrag(214, 113, svgRef);
  const mouth = useDrag(190, 155, svgRef);

  // Patch sizes (adjustable)
  const [eyePatchRx, setEyePatchRx] = useState(9.6);
  const [eyePatchRy, setEyePatchRy] = useState(5.8);
  const [mouthPatchRx, setMouthPatchRx] = useState(13);
  const [mouthPatchRy, setMouthPatchRy] = useState(7);
  const [eyeRx, setEyeRx] = useState(6.6);
  const [eyeRy, setEyeRy] = useState(4.8);
  const [pupilRx, setPupilRx] = useState(2.8);
  const [pupilRy, setPupilRy] = useState(3.0);
  const [blinkHalfWidth, setBlinkHalfWidth] = useState(5);

  // Toggle overlays
  const [showPatches, setShowPatches] = useState(true);
  const [showEyes, setShowEyes] = useState(true);
  const [showMouth, setShowMouth] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [copied, setCopied] = useState(false);

  // Zoom
  const [displaySize, setDisplaySize] = useState(DISPLAY_SIZE);

  const fValues = `const F = {
  width: ${CANVAS_W},
  height: ${CANVAS_H},
  lex: ${leftEye.pos.x},
  ley: ${leftEye.pos.y},
  rex: ${rightEye.pos.x},
  rey: ${rightEye.pos.y},
  mx: ${mouth.pos.x},
  my: ${mouth.pos.y},
  eyePatchRx: ${eyePatchRx},
  eyePatchRy: ${eyePatchRy},
  mouthPatchRx: ${mouthPatchRx},
  mouthPatchRy: ${mouthPatchRy},
  eyeRx: ${eyeRx},
  eyeRy: ${eyeRy},
  pupilRx: ${pupilRx},
  pupilRy: ${pupilRy},
  blinkHalfWidth: ${blinkHalfWidth},
  lipStroke: '#7B3A23',
  mouthFill: '#6F2B19',
  skinEye: '#d79b78',
  skinMouth: '#d08f6a',
};`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fValues);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#111',
        color: '#eee',
        fontFamily: 'monospace',
        display: 'flex',
        gap: 32,
        padding: 24,
      }}
    >
      {/* LEFT: SVG Canvas */}
      <div style={{ flex: '0 0 auto' }}>
        <h2 style={{ marginBottom: 12, fontSize: 20, color: '#FF9933' }}>
          🎯 Ved Avatar Calibrator
        </h2>
        <p style={{ fontSize: 13, color: '#aaa', marginBottom: 16, maxWidth: 500 }}>
          <strong>Drag</strong> the colored circles to position them over Ved's actual eyes and
          mouth. The skin-colored patches will cover the original features, and the SVG eyes/mouth
          will be drawn on top.
        </p>

        <div
          style={{
            border: '2px solid #333',
            borderRadius: 12,
            overflow: 'hidden',
            display: 'inline-block',
            position: 'relative',
            background: '#fff',
          }}
        >
          <svg
            ref={svgRef}
            width={displaySize}
            height={displaySize * (CANVAS_H / CANVAS_W)}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            style={{ display: 'block', cursor: 'crosshair' }}
          >
            {/* Background image */}
            <image
              href={AVATAR_IMAGE_SRC}
              x="0"
              y="0"
              width={CANVAS_W}
              height={CANVAS_H}
              preserveAspectRatio="xMidYMid slice"
            />

            {/* Skin patches to cover original features */}
            {showPatches && (
              <>
                <ellipse
                  cx={leftEye.pos.x}
                  cy={leftEye.pos.y}
                  rx={eyePatchRx}
                  ry={eyePatchRy}
                  fill="#d79b78"
                />
                <ellipse
                  cx={rightEye.pos.x}
                  cy={rightEye.pos.y}
                  rx={eyePatchRx}
                  ry={eyePatchRy}
                  fill="#d79b78"
                />
                <ellipse
                  cx={mouth.pos.x}
                  cy={mouth.pos.y}
                  rx={mouthPatchRx}
                  ry={mouthPatchRy}
                  fill="#d08f6a"
                />
              </>
            )}

            {/* SVG Eyes */}
            {showEyes && (
              <>
                {/* Left eye */}
                <ellipse
                  cx={leftEye.pos.x}
                  cy={leftEye.pos.y}
                  rx={eyeRx}
                  ry={eyeRy}
                  fill="white"
                />
                <ellipse
                  cx={leftEye.pos.x + 0.6}
                  cy={leftEye.pos.y + 0.5}
                  rx={pupilRx}
                  ry={pupilRy}
                  fill="#2f2218"
                />
                <circle
                  cx={leftEye.pos.x + 1.3}
                  cy={leftEye.pos.y - 1.1}
                  r={0.72}
                  fill="white"
                  opacity={0.95}
                />
                <path
                  d={`M ${leftEye.pos.x - 5.8} ${leftEye.pos.y - 0.9} Q ${leftEye.pos.x} ${leftEye.pos.y - 5.3} ${leftEye.pos.x + 5.8} ${leftEye.pos.y - 0.9}`}
                  stroke="#4d372a"
                  strokeWidth="1"
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.66}
                />
                {/* Right eye */}
                <ellipse
                  cx={rightEye.pos.x}
                  cy={rightEye.pos.y}
                  rx={eyeRx}
                  ry={eyeRy}
                  fill="white"
                />
                <ellipse
                  cx={rightEye.pos.x + 0.7}
                  cy={rightEye.pos.y + 0.5}
                  rx={pupilRx}
                  ry={pupilRy}
                  fill="#2f2218"
                />
                <circle
                  cx={rightEye.pos.x + 1.5}
                  cy={rightEye.pos.y - 1.1}
                  r={0.72}
                  fill="white"
                  opacity={0.95}
                />
                <path
                  d={`M ${rightEye.pos.x - 5.6} ${rightEye.pos.y - 0.9} Q ${rightEye.pos.x} ${rightEye.pos.y - 5.3} ${rightEye.pos.x + 5.6} ${rightEye.pos.y - 0.9}`}
                  stroke="#4d372a"
                  strokeWidth="1"
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.66}
                />
              </>
            )}

            {/* Mouth */}
            {showMouth && (
              <>
                <path
                  d={`M ${mouth.pos.x - 8.4} ${mouth.pos.y - 0.2} Q ${mouth.pos.x} ${mouth.pos.y + 2.8} ${mouth.pos.x + 8.4} ${mouth.pos.y - 0.2}`}
                  stroke="#7B3A23"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  opacity={0.92}
                />
                <ellipse
                  cx={mouth.pos.x}
                  cy={mouth.pos.y + 1.25}
                  rx={5.6}
                  ry={3.6}
                  fill="#6F2B19"
                />
                <path
                  d={`M ${mouth.pos.x - 8.1} ${mouth.pos.y + 1.9} Q ${mouth.pos.x} ${mouth.pos.y + 6.2} ${mouth.pos.x + 8.1} ${mouth.pos.y + 1.9}`}
                  stroke="#7B3A23"
                  strokeWidth="1.35"
                  fill="none"
                  strokeLinecap="round"
                  opacity={0.82}
                />
              </>
            )}

            {/* Guide dots — draggable handles */}
            {showGuides && (
              <>
                {/* Left eye handle */}
                <circle
                  cx={leftEye.pos.x}
                  cy={leftEye.pos.y}
                  r={8}
                  fill="rgba(0, 150, 255, 0.3)"
                  stroke="#0096ff"
                  strokeWidth={1.5}
                  style={{ cursor: 'grab' }}
                  onPointerDown={leftEye.onPointerDown}
                  onPointerMove={leftEye.onPointerMove}
                  onPointerUp={leftEye.onPointerUp}
                />
                <text
                  x={leftEye.pos.x}
                  y={leftEye.pos.y - 12}
                  textAnchor="middle"
                  fontSize={6}
                  fill="#0096ff"
                  fontWeight="bold"
                >
                  L-EYE
                </text>

                {/* Right eye handle */}
                <circle
                  cx={rightEye.pos.x}
                  cy={rightEye.pos.y}
                  r={8}
                  fill="rgba(0, 200, 100, 0.3)"
                  stroke="#00c864"
                  strokeWidth={1.5}
                  style={{ cursor: 'grab' }}
                  onPointerDown={rightEye.onPointerDown}
                  onPointerMove={rightEye.onPointerMove}
                  onPointerUp={rightEye.onPointerUp}
                />
                <text
                  x={rightEye.pos.x}
                  y={rightEye.pos.y - 12}
                  textAnchor="middle"
                  fontSize={6}
                  fill="#00c864"
                  fontWeight="bold"
                >
                  R-EYE
                </text>

                {/* Mouth handle */}
                <circle
                  cx={mouth.pos.x}
                  cy={mouth.pos.y}
                  r={10}
                  fill="rgba(255, 80, 80, 0.3)"
                  stroke="#ff5050"
                  strokeWidth={1.5}
                  style={{ cursor: 'grab' }}
                  onPointerDown={mouth.onPointerDown}
                  onPointerMove={mouth.onPointerMove}
                  onPointerUp={mouth.onPointerUp}
                />
                <text
                  x={mouth.pos.x}
                  y={mouth.pos.y - 14}
                  textAnchor="middle"
                  fontSize={6}
                  fill="#ff5050"
                  fontWeight="bold"
                >
                  MOUTH
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Zoom controls */}
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#888' }}>Zoom:</span>
          {[400, 500, 600, 700, 800].map((s) => (
            <button
              key={s}
              onClick={() => setDisplaySize(s)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: displaySize === s ? '2px solid #FF9933' : '1px solid #444',
                background: displaySize === s ? '#FF993320' : '#222',
                color: displaySize === s ? '#FF9933' : '#aaa',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {s}px
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Controls Panel */}
      <div style={{ flex: 1, minWidth: 300, maxWidth: 420 }}>
        <h3 style={{ color: '#FF9933', marginBottom: 8 }}>📍 Current Positions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          <div
            style={{
              background: '#1a2a3a',
              border: '1px solid #0096ff44',
              borderRadius: 8,
              padding: 10,
            }}
          >
            <div style={{ fontSize: 11, color: '#0096ff', marginBottom: 4 }}>Left Eye</div>
            <div style={{ fontSize: 14 }}>
              x: <strong>{leftEye.pos.x}</strong>
            </div>
            <div style={{ fontSize: 14 }}>
              y: <strong>{leftEye.pos.y}</strong>
            </div>
          </div>
          <div
            style={{
              background: '#1a3a2a',
              border: '1px solid #00c86444',
              borderRadius: 8,
              padding: 10,
            }}
          >
            <div style={{ fontSize: 11, color: '#00c864', marginBottom: 4 }}>Right Eye</div>
            <div style={{ fontSize: 14 }}>
              x: <strong>{rightEye.pos.x}</strong>
            </div>
            <div style={{ fontSize: 14 }}>
              y: <strong>{rightEye.pos.y}</strong>
            </div>
          </div>
          <div
            style={{
              background: '#3a1a1a',
              border: '1px solid #ff505044',
              borderRadius: 8,
              padding: 10,
            }}
          >
            <div style={{ fontSize: 11, color: '#ff5050', marginBottom: 4 }}>Mouth</div>
            <div style={{ fontSize: 14 }}>
              x: <strong>{mouth.pos.x}</strong>
            </div>
            <div style={{ fontSize: 14 }}>
              y: <strong>{mouth.pos.y}</strong>
            </div>
          </div>
        </div>

        {/* Fine-tune with arrow keys info */}
        <div
          style={{
            background: '#1a1a2a',
            borderRadius: 8,
            padding: 10,
            marginBottom: 16,
            border: '1px solid #333',
          }}
        >
          <div style={{ fontSize: 12, color: '#FF9933', marginBottom: 6 }}>⌨️ Fine-tune (select field, use +/- buttons)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: 'L-Eye X', value: leftEye.pos.x, set: (v: number) => leftEye.setPos({ ...leftEye.pos, x: v }) },
              { label: 'L-Eye Y', value: leftEye.pos.y, set: (v: number) => leftEye.setPos({ ...leftEye.pos, y: v }) },
              { label: 'R-Eye X', value: rightEye.pos.x, set: (v: number) => rightEye.setPos({ ...rightEye.pos, x: v }) },
              { label: 'R-Eye Y', value: rightEye.pos.y, set: (v: number) => rightEye.setPos({ ...rightEye.pos, y: v }) },
              { label: 'Mouth X', value: mouth.pos.x, set: (v: number) => mouth.setPos({ ...mouth.pos, x: v }) },
              { label: 'Mouth Y', value: mouth.pos.y, set: (v: number) => mouth.setPos({ ...mouth.pos, y: v }) },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: '#888', width: 60 }}>{item.label}</span>
                <button
                  onClick={() => item.set(Math.round((item.value - 1) * 10) / 10)}
                  style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid #555', background: '#222', color: '#eee', cursor: 'pointer', fontSize: 14 }}
                >
                  −
                </button>
                <input
                  type="number"
                  value={item.value}
                  onChange={(e) => item.set(parseFloat(e.target.value) || 0)}
                  style={{
                    width: 60,
                    textAlign: 'center',
                    background: '#222',
                    border: '1px solid #444',
                    borderRadius: 4,
                    color: '#eee',
                    padding: '2px 4px',
                    fontSize: 13,
                  }}
                />
                <button
                  onClick={() => item.set(Math.round((item.value + 1) * 10) / 10)}
                  style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid #555', background: '#222', color: '#eee', cursor: 'pointer', fontSize: 14 }}
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Patch sizes */}
        <h3 style={{ color: '#FF9933', marginBottom: 8, marginTop: 16 }}>🔧 Patch / Feature Sizes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
          {[
            { label: 'Eye Patch Rx', value: eyePatchRx, set: setEyePatchRx },
            { label: 'Eye Patch Ry', value: eyePatchRy, set: setEyePatchRy },
            { label: 'Mouth Patch Rx', value: mouthPatchRx, set: setMouthPatchRx },
            { label: 'Mouth Patch Ry', value: mouthPatchRy, set: setMouthPatchRy },
            { label: 'Eye Rx', value: eyeRx, set: setEyeRx },
            { label: 'Eye Ry', value: eyeRy, set: setEyeRy },
            { label: 'Pupil Rx', value: pupilRx, set: setPupilRx },
            { label: 'Pupil Ry', value: pupilRy, set: setPupilRy },
            { label: 'Blink Half W', value: blinkHalfWidth, set: setBlinkHalfWidth },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: '#888', width: 90 }}>{item.label}</span>
              <button
                onClick={() => item.set(Math.round((item.value - 0.5) * 10) / 10)}
                style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid #555', background: '#222', color: '#eee', cursor: 'pointer', fontSize: 14 }}
              >
                −
              </button>
              <input
                type="number"
                step="0.1"
                value={item.value}
                onChange={(e) => item.set(parseFloat(e.target.value) || 0)}
                style={{
                  width: 50,
                  textAlign: 'center',
                  background: '#222',
                  border: '1px solid #444',
                  borderRadius: 4,
                  color: '#eee',
                  padding: '2px 4px',
                  fontSize: 13,
                }}
              />
              <button
                onClick={() => item.set(Math.round((item.value + 0.5) * 10) / 10)}
                style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid #555', background: '#222', color: '#eee', cursor: 'pointer', fontSize: 14 }}
              >
                +
              </button>
            </div>
          ))}
        </div>

        {/* Toggles */}
        <h3 style={{ color: '#FF9933', marginBottom: 8 }}>👁️ Visibility</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { label: 'Patches', value: showPatches, set: setShowPatches },
            { label: 'Eyes', value: showEyes, set: setShowEyes },
            { label: 'Mouth', value: showMouth, set: setShowMouth },
            { label: 'Guides', value: showGuides, set: setShowGuides },
          ].map((toggle) => (
            <button
              key={toggle.label}
              onClick={() => toggle.set(!toggle.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: toggle.value ? '2px solid #FF9933' : '1px solid #555',
                background: toggle.value ? '#FF993320' : '#222',
                color: toggle.value ? '#FF9933' : '#888',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {toggle.value ? '✓ ' : '✗ '}
              {toggle.label}
            </button>
          ))}
        </div>

        {/* Output */}
        <h3 style={{ color: '#FF9933', marginBottom: 8 }}>📋 Output — Copy to VedAvatar.tsx</h3>
        <pre
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            lineHeight: 1.5,
            overflowX: 'auto',
            maxHeight: 300,
          }}
        >
          {fValues}
        </pre>
        <button
          onClick={handleCopy}
          style={{
            marginTop: 8,
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: copied ? '#138808' : '#FF9933',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {copied ? '✓ Copied!' : '📋 Copy F values'}
        </button>
      </div>
    </div>
  );
}
