"use client";

import React, { useRef, useId, useEffect, type CSSProperties } from "react";
import { animate, useMotionValue, type AnimationPlaybackControls } from "framer-motion";

interface AnimationConfig {
  scale: number;
  speed: number;
}

interface NoiseConfig {
  opacity: number;
  scale: number;
}

interface ShadowOverlayProps {
  sizing?: "fill" | "stretch";
  color?: string;
  animation?: AnimationConfig;
  noise?: NoiseConfig;
  style?: CSSProperties;
  className?: string;
}

function mapRange(value: number, fromLow: number, fromHigh: number, toLow: number, toHigh: number) {
  if (fromLow === fromHigh) return toLow;
  const pct = (value - fromLow) / (fromHigh - fromLow);
  return toLow + pct * (toHigh - toLow);
}

const useInstanceId = () => {
  const id = useId();
  return `shadowoverlay-${id.replace(/:/g, "")}`;
};

export function Component({
  sizing = "fill",
  color = "rgba(128, 128, 128, 1)",
  animation,
  noise,
  style,
  className,
}: ShadowOverlayProps) {
  const id = useInstanceId();
  const animationEnabled = !!(animation && animation.scale > 0);
  const feColorMatrixRef = useRef<SVGFEColorMatrixElement | null>(null);
  const hueRotate = useMotionValue(0);
  const animRef = useRef<AnimationPlaybackControls | null>(null);

  const displacementScale = animation ? mapRange(animation.scale, 1, 100, 20, 100) : 0;
  const animationDuration = animation ? mapRange(animation.speed, 1, 100, 1000, 50) : 1;

  useEffect(() => {
    if (!animationEnabled) return;
    animRef.current?.stop();
    hueRotate.set(0);
    animRef.current = animate(hueRotate, 360, {
      duration: animationDuration / 25,
      repeat: Infinity,
      ease: "linear",
      onUpdate: (v: number) => {
        feColorMatrixRef.current?.setAttribute("values", String(v));
      },
    });
    return () => animRef.current?.stop();
  }, [animationEnabled, animationDuration, hueRotate]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        height: "100%",
        backgroundColor: "rgb(10, 10, 14)",
        ...style,
      }}
    >
      {/* SVG filter defs */}
      <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
        <defs>
          <filter id={`${id}-filter`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="3" result="turb" />
            {animationEnabled && (
              <feColorMatrix ref={feColorMatrixRef} in="turb" type="hueRotate" values="0" result="rot" />
            )}
            <feDisplacementMap
              in="SourceGraphic"
              in2={animationEnabled ? "rot" : "turb"}
              scale={displacementScale}
            />
          </filter>
          <radialGradient id={`${id}-grad`} cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor={color} stopOpacity="0.9" />
              <stop offset="55%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* shadow layer */}
      <div
        style={{
          position: "absolute",
          inset: "-10%",
          filter: `url(#${id}-filter)`,
          opacity: 0.9,
        }}
      >
        <svg width="100%" height="100%" preserveAspectRatio={sizing === "stretch" ? "none" : "xMidYMid slice"}>
          <rect width="100%" height="100%" fill={`url(#${id}-grad)`} />
          <circle cx="30%" cy="40%" r="28%" fill={color} opacity="0.35" />
          <circle cx="72%" cy="65%" r="22%" fill={color} opacity="0.28" />
          <circle cx="55%" cy="20%" r="18%" fill={color} opacity="0.22" />
        </svg>
      </div>

      {noise && noise.opacity > 0 && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: noise.opacity,
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            backgroundSize: `${Math.max(noise.scale * 60, 60)}px`,
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

export { Component as EtherealShadow };
