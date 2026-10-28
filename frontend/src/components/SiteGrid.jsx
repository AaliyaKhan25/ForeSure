import { useEffect, useRef } from "react";

const GRID_SIZE = 30;
const INFLUENCE_RADIUS = 210;

export default function SiteGrid() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, targetStrength: 0 };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frameId = 0;

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    }

    function pointAt(column, row) {
      const x = column * GRID_SIZE;
      const y = row * GRID_SIZE;
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const distance = Math.hypot(dx, dy) || 1;
      const influence =
        Math.exp(-(distance ** 2) / (2 * INFLUENCE_RADIUS ** 2)) * pointer.strength;
      const displacement = influence * 8;
      return {
        x: x + (dx / distance) * displacement,
        y: y + (dy / distance) * displacement,
      };
    }

    function draw() {
      context.clearRect(0, 0, width, height);
      context.beginPath();
      context.strokeStyle = "rgba(166, 128, 57, 0.16)";
      context.lineWidth = 0.8;

      const columns = Math.ceil(width / GRID_SIZE);
      const rows = Math.ceil(height / GRID_SIZE);

      for (let row = 0; row <= rows; row += 1) {
        for (let column = 0; column <= columns; column += 1) {
          const point = pointAt(column, row);
          if (column === 0) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        }
      }

      for (let column = 0; column <= columns; column += 1) {
        for (let row = 0; row <= rows; row += 1) {
          const point = pointAt(column, row);
          if (row === 0) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        }
      }

      context.stroke();
    }

    function animate() {
      pointer.x += (pointer.targetX - pointer.x) * 0.18;
      pointer.y += (pointer.targetY - pointer.y) * 0.18;
      pointer.strength += (pointer.targetStrength - pointer.strength) * 0.16;
      draw();

      const settled =
        Math.abs(pointer.targetX - pointer.x) < 0.5 &&
        Math.abs(pointer.targetY - pointer.y) < 0.5 &&
        Math.abs(pointer.targetStrength - pointer.strength) < 0.01;

      if (settled) {
        pointer.x = pointer.targetX;
        pointer.y = pointer.targetY;
        pointer.strength = pointer.targetStrength;
        draw();
        frameId = 0;
        return;
      }

      frameId = window.requestAnimationFrame(animate);
    }

    function requestDraw() {
      if (!frameId) frameId = window.requestAnimationFrame(animate);
    }

    function onPointerMove(event) {
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      pointer.targetStrength = 1;
      requestDraw();
    }

    function onPointerLeave() {
      pointer.targetStrength = 0;
      requestDraw();
    }

    resize();
    window.addEventListener("resize", resize);
    if (!reducedMotion.matches) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave, { passive: true });
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="site-grid" aria-hidden="true" />;
}
