import { useEffect, useRef } from "react";

/* ────────────────────────────────────────────────────────
   HyperspeedLines — thin curved light streaks emanating
   from a central vanishing point, inspired by React Bits.
   Uses Canvas 2D, zero extra dependencies.
   Pramanik brand colors: teal, cyan, emerald.
──────────────────────────────────────────────────────── */

const COLORS = [
  "#2dd4bf", // teal
  "#22d3ee", // cyan
  "#34d399", // emerald
  "#67e8f9", // light cyan
  "#5eead4", // teal lighter
  "#a5f3fc", // pale cyan
];

const LINE_COUNT = 80;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

class SpeedLine {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.reset();
  }

  reset() {
    // Vanishing point — slightly below center
    this.ox = this.w * 0.5;
    this.oy = this.h * 0.55;

    // Random angle from vanishing point
    this.angle = randomBetween(0, Math.PI * 2);

    // Starting radius (small, near center)
    this.r = randomBetween(5, 60);

    // How fast it shoots outward
    this.speed = randomBetween(3, 10);

    // Max length before reset
    this.maxR = Math.hypot(this.w, this.h) * 0.65;

    // Thickness: thin hairlines
    this.width = randomBetween(0.4, 1.4);

    // Color
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];

    // Tail length (how long the line segment is)
    this.tail = randomBetween(40, 160);

    // Slight curve angle drift
    this.drift = randomBetween(-0.004, 0.004);

    // Opacity
    this.alpha = randomBetween(0.25, 0.75);
  }

  update() {
    this.r += this.speed;
    this.angle += this.drift;
    if (this.r > this.maxR) this.reset();
  }

  draw(ctx) {
    const rHead = this.r;
    const rTail = Math.max(0, this.r - this.tail);

    const x1 = this.ox + Math.cos(this.angle) * rTail;
    const y1 = this.oy + Math.sin(this.angle) * rTail;
    const x2 = this.ox + Math.cos(this.angle) * rHead;
    const y2 = this.oy + Math.sin(this.angle) * rHead;

    // Fade from transparent at tail → color at head
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, `rgba(${hexToRgb(this.color)}, 0)`);
    grad.addColorStop(0.6, `rgba(${hexToRgb(this.color)}, ${this.alpha * 0.4})`);
    grad.addColorStop(1, `rgba(${hexToRgb(this.color)}, ${this.alpha})`);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = grad;
    ctx.lineWidth = this.width;
    ctx.lineCap = "round";
    ctx.stroke();

    // Glow pass — wider, very transparent
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `rgba(${hexToRgb(this.color)}, ${this.alpha * 0.12})`;
    ctx.lineWidth = this.width * 4;
    ctx.stroke();
  }
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export default function WavyBackground() {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const linesRef  = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      // Re-initialise lines so vanishing point stays centred
      linesRef.current = Array.from({ length: LINE_COUNT }, () => {
        const l = new SpeedLine(canvas.width, canvas.height);
        // Stagger start positions so they don't all begin at zero
        l.r = randomBetween(0, l.maxR * 0.8);
        return l;
      });
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      // Subtle fade trail — dark semi-transparent rect instead of full clear
      ctx.fillStyle = "rgba(14, 16, 25, 0.18)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      linesRef.current.forEach(line => {
        line.update();
        line.draw(ctx);
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width:  "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.7,
      }}
    />
  );
}
