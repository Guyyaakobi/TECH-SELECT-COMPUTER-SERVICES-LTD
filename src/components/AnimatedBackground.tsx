import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

interface TopologyNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  type: 'core' | 'gateway' | 'terminal';
}

interface DataPacket {
  fromIndex: number;
  toIndex: number;
  progress: number;
  speed: number;
  colorType: 'blue' | 'cyan' | 'emerald';
}

interface TrackingPointer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  size: number;
  shape: 'diamond' | 'cross' | 'square' | 'circle';
  delayFactor: number;
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
}

export const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // High-DPI Canvas scaling
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const handleResize = () => {
      if (!canvas || !ctx) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      initTopologyNodes();
    };

    window.addEventListener('resize', handleResize);

    // Mouse & Interactive Tracking State
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      active: false,
      hoverInteractive: false,
      snapBounds: null as { left: number; top: number; width: number; height: number } | null,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;

      // Check if hovering an interactive clickable element
      const target = e.target as HTMLElement | null;
      const interactiveEl = target?.closest('button, a, input, [role="button"], .spotlight-card');
      if (interactiveEl) {
        const rect = interactiveEl.getBoundingClientRect();
        mouse.hoverInteractive = true;
        mouse.snapBounds = {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        };
      } else {
        mouse.hoverInteractive = false;
        mouse.snapBounds = null;
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.hoverInteractive = false;
      mouse.snapBounds = null;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // 1. Vector Tracking Pointers (The signature floating tracking dots)
    const POINTER_COUNT = 8;
    const trackingPointers: TrackingPointer[] = [];
    const shapes: Array<'diamond' | 'cross' | 'square' | 'circle'> = ['diamond', 'cross', 'square', 'circle'];

    for (let i = 0; i < POINTER_COUNT; i++) {
      trackingPointers.push({
        x: width / 2 + (Math.random() - 0.5) * 100,
        y: height / 2 + (Math.random() - 0.5) * 100,
        vx: 0,
        vy: 0,
        targetX: width / 2,
        targetY: height / 2,
        size: i === 0 ? 3.5 : i < 3 ? 3 : 2,
        shape: shapes[i % shapes.length],
        delayFactor: 0.04 + i * 0.015, // Staggered spring physics for natural trailing
        angle: (i / POINTER_COUNT) * Math.PI * 2,
        orbitRadius: 18 + (i % 4) * 14,
        orbitSpeed: 0.02 + (i % 3) * 0.01,
      });
    }

    // 2. Subtle Background Engineering Topology
    let topologyNodes: TopologyNode[] = [];
    const initTopologyNodes = () => {
      const count = Math.max(14, Math.min(28, Math.floor(width / 75)));
      topologyNodes = [];
      const types: Array<'core' | 'gateway' | 'terminal'> = ['core', 'gateway', 'terminal'];

      for (let i = 0; i < count; i++) {
        topologyNodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          size: Math.random() > 0.7 ? 3.5 : 2,
          type: types[i % types.length],
        });
      }
    };

    initTopologyNodes();

    // 3. Discrete Data Packets
    const packets: DataPacket[] = [];
    const packetInterval = setInterval(() => {
      if (topologyNodes.length < 2) return;
      const from = Math.floor(Math.random() * topologyNodes.length);
      let to = Math.floor(Math.random() * topologyNodes.length);
      if (from === to) to = (to + 1) % topologyNodes.length;

      const colors: Array<'blue' | 'cyan' | 'emerald'> = ['blue', 'cyan', 'emerald'];
      packets.push({
        fromIndex: from,
        toIndex: to,
        progress: 0,
        speed: 0.008 + Math.random() * 0.012,
        colorType: colors[Math.floor(Math.random() * colors.length)],
      });

      if (packets.length > 20) packets.shift();
    }, 600);

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.15;
      mouse.y += (mouse.targetY - mouse.y) * 0.15;

      // Draw Subtle Coordinate Crosshairs (+) in the background
      const crossSize = 48;
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(30, 41, 59, 0.04)';
      ctx.lineWidth = 1;
      for (let x = crossSize; x < width; x += crossSize * 3) {
        for (let y = crossSize; y < height; y += crossSize * 3) {
          ctx.beginPath();
          ctx.moveTo(x - 3, y);
          ctx.lineTo(x + 3, y);
          ctx.moveTo(x, y - 3);
          ctx.lineTo(x, y + 3);
          ctx.stroke();
        }
      }

      // Update & Render Topology Nodes
      for (let i = 0; i < topologyNodes.length; i++) {
        const node = topologyNodes[i];
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 10 || node.x > width - 10) node.vx *= -1;
        if (node.y < 10 || node.y > height - 10) node.vy *= -1;

        // Subtle gentle mouse repulsion
        if (mouse.active) {
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120 && dist > 1) {
            const force = (120 - dist) / 120;
            node.x -= (dx / dist) * force * 0.8;
            node.y -= (dy / dist) * force * 0.8;
          }
        }
      }

      // Draw Interconnect Lines between nearby topology nodes
      const maxConnDist = 130;
      for (let i = 0; i < topologyNodes.length; i++) {
        const n1 = topologyNodes[i];
        for (let j = i + 1; j < topologyNodes.length; j++) {
          const n2 = topologyNodes[j];
          const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);

          if (dist < maxConnDist) {
            const alpha = (1 - dist / maxConnDist) * (isDark ? 0.18 : 0.12);
            ctx.strokeStyle = isDark
              ? `rgba(59, 130, 246, ${alpha})`
              : `rgba(30, 41, 59, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      // Draw Moving Data Packets
      for (let i = packets.length - 1; i >= 0; i--) {
        const pkt = packets[i];
        pkt.progress += pkt.speed;
        if (pkt.progress >= 1) {
          packets.splice(i, 1);
          continue;
        }

        const nFrom = topologyNodes[pkt.fromIndex];
        const nTo = topologyNodes[pkt.toIndex];
        if (!nFrom || !nTo) continue;

        const curX = nFrom.x + (nTo.x - nFrom.x) * pkt.progress;
        const curY = nFrom.y + (nTo.y - nFrom.y) * pkt.progress;

        ctx.fillStyle = isDark
          ? pkt.colorType === 'cyan' ? 'rgba(56, 189, 248, 0.7)' : pkt.colorType === 'emerald' ? 'rgba(52, 211, 153, 0.7)' : 'rgba(96, 165, 250, 0.7)'
          : pkt.colorType === 'cyan' ? 'rgba(2, 132, 199, 0.6)' : pkt.colorType === 'emerald' ? 'rgba(5, 150, 105, 0.6)' : 'rgba(29, 78, 216, 0.6)';

        ctx.fillRect(curX - 1.5, curY - 1.5, 3, 3);
      }

      // Draw Topology Nodes
      for (let i = 0; i < topologyNodes.length; i++) {
        const node = topologyNodes[i];
        ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(30, 41, 59, 0.35)';
        ctx.strokeStyle = isDark ? 'rgba(59, 130, 246, 0.6)' : 'rgba(71, 85, 105, 0.5)';
        ctx.lineWidth = 1;

        if (node.type === 'core') {
          ctx.fillRect(node.x - 2, node.y - 2, 4, 4);
        } else {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      // 4. VECTOR TRACKING POINTERS (The Signature Chasing Pointers)
      if (mouse.active) {
        // If hovering an interactive button/widget: Snap soft technical corner framing
        if (mouse.hoverInteractive && mouse.snapBounds) {
          const b = mouse.snapBounds;
          const pad = 4;
          ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(37, 99, 235, 0.35)';
          ctx.lineWidth = 1;
          const cornerLen = 6;

          // Top-Left
          ctx.beginPath();
          ctx.moveTo(b.left - pad, b.top - pad + cornerLen);
          ctx.lineTo(b.left - pad, b.top - pad);
          ctx.lineTo(b.left - pad + cornerLen, b.top - pad);
          // Top-Right
          ctx.moveTo(b.left + b.width + pad - cornerLen, b.top - pad);
          ctx.lineTo(b.left + b.width + pad, b.top - pad);
          ctx.lineTo(b.left + b.width + pad, b.top - pad + cornerLen);
          // Bottom-Right
          ctx.moveTo(b.left + b.width + pad, b.top + b.height + pad - cornerLen);
          ctx.lineTo(b.left + b.width + pad, b.top + b.height + pad);
          ctx.lineTo(b.left + b.width + pad - cornerLen, b.top + b.height + pad);
          // Bottom-Left
          ctx.moveTo(b.left - pad + cornerLen, b.top + b.height + pad);
          ctx.lineTo(b.left - pad, b.top + b.height + pad);
          ctx.lineTo(b.left - pad, b.top + b.height + pad - cornerLen);
          ctx.stroke();
        }

        // Draw and update the floating tracking pointers
        for (let i = 0; i < trackingPointers.length; i++) {
          const ptr = trackingPointers[i];
          ptr.angle += ptr.orbitSpeed;

          let targetX = mouse.x;
          let targetY = mouse.y;

          if (mouse.hoverInteractive && mouse.snapBounds) {
            // Distribute pointers neatly around the button boundary when locked
            const b = mouse.snapBounds;
            const perimeterIndex = i / trackingPointers.length;
            if (perimeterIndex < 0.25) {
              targetX = b.left + (perimeterIndex / 0.25) * b.width;
              targetY = b.top - 6;
            } else if (perimeterIndex < 0.5) {
              targetX = b.left + b.width + 6;
              targetY = b.top + ((perimeterIndex - 0.25) / 0.25) * b.height;
            } else if (perimeterIndex < 0.75) {
              targetX = b.left + b.width - ((perimeterIndex - 0.5) / 0.25) * b.width;
              targetY = b.top + b.height + 6;
            } else {
              targetX = b.left - 6;
              targetY = b.top + b.height - ((perimeterIndex - 0.75) / 0.25) * b.height;
            }
          } else {
            // Elegant loose orbiting trailing chase around the mouse
            const orbitX = Math.cos(ptr.angle + i) * ptr.orbitRadius;
            const orbitY = Math.sin(ptr.angle + i) * (ptr.orbitRadius * 0.7);
            targetX = mouse.x + orbitX;
            targetY = mouse.y + orbitY;
          }

          // Physics interpolation (Smooth chasing spring)
          ptr.vx += (targetX - ptr.x) * ptr.delayFactor;
          ptr.vy += (targetY - ptr.y) * ptr.delayFactor;
          ptr.vx *= 0.78; // Damping
          ptr.vy *= 0.78;
          ptr.x += ptr.vx;
          ptr.y += ptr.vy;

          // Render Sharp Solid Vector Pointer (No blurry glow)
          const pointerColor = isDark
            ? i % 2 === 0 ? '#38bdf8' : '#60a5fa'
            : i % 2 === 0 ? '#1d4ed8' : '#0284c7';

          ctx.fillStyle = pointerColor;
          ctx.strokeStyle = isDark ? '#0f172a' : '#ffffff';
          ctx.lineWidth = 0.75;

          if (ptr.shape === 'diamond') {
            ctx.beginPath();
            ctx.moveTo(ptr.x, ptr.y - ptr.size * 1.3);
            ctx.lineTo(ptr.x + ptr.size * 1.3, ptr.y);
            ctx.lineTo(ptr.x, ptr.y + ptr.size * 1.3);
            ctx.lineTo(ptr.x - ptr.size * 1.3, ptr.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else if (ptr.shape === 'cross') {
            ctx.strokeStyle = pointerColor;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(ptr.x - ptr.size, ptr.y);
            ctx.lineTo(ptr.x + ptr.size, ptr.y);
            ctx.moveTo(ptr.x, ptr.y - ptr.size);
            ctx.lineTo(ptr.x, ptr.y + ptr.size);
            ctx.stroke();
          } else if (ptr.shape === 'square') {
            ctx.fillRect(ptr.x - ptr.size / 2, ptr.y - ptr.size / 2, ptr.size, ptr.size);
            ctx.strokeRect(ptr.x - ptr.size / 2, ptr.y - ptr.size / 2, ptr.size, ptr.size);
          } else {
            ctx.beginPath();
            ctx.arc(ptr.x, ptr.y, ptr.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          // Subtle fine connector line between the leading pointer and next pointer
          if (i > 0) {
            const prevPtr = trackingPointers[i - 1];
            const pDist = Math.hypot(ptr.x - prevPtr.x, ptr.y - prevPtr.y);
            if (pDist < 60) {
              ctx.strokeStyle = isDark
                ? `rgba(56, 189, 248, ${(1 - pDist / 60) * 0.25})`
                : `rgba(37, 99, 235, ${(1 - pDist / 60) * 0.2})`;
              ctx.lineWidth = 0.75;
              ctx.beginPath();
              ctx.moveTo(ptr.x, ptr.y);
              ctx.lineTo(prevPtr.x, prevPtr.y);
              ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      clearInterval(packetInterval);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
};
