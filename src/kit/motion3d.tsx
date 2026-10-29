// Micro-interactions for 3D icons, in the spirit of little robot heads that
// float, blink and react: an idle life loop plus hover and press responses.
//
// Time comes from a shared, deterministic clock: real time in the live editor,
// a fixed `t` for stills, and frame / fps for Remotion loop exports. Keep every
// periodic motion's period a divisor of LOOP_SECONDS so exported loops are seamless.
import { createContext, useContext, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

export const LOOP_SECONDS = 4;
const TAU = Math.PI * 2;

export interface MotionState {
  /** Seconds on the shared clock. */
  t: number;
  /** 0..1, eased: pointer is over the icon. */
  hover: number;
  /** Pointer position over the canvas, -1..1 (y up). */
  px: number;
  py: number;
  /** Seconds since the last click (Infinity if never). Drives squash & stretch. */
  pressAge: number;
  /** false = hold still (like a robot's motion toggle). */
  enabled: boolean;
}

export const defaultMotion = (): MotionState => ({ t: 0, hover: 0, px: 0, py: 0, pressAge: Infinity, enabled: true });

const MotionContext = createContext<{ current: MotionState }>({ current: defaultMotion() });
export const MotionProvider = MotionContext.Provider;

/** Mutable motion state; read it inside useFrame (never trigger React renders per frame). */
export const useMotion = () => useContext(MotionContext);

/** Run `fn` every frame with the motion state, only while motion is enabled. */
export function useLoop(fn: (m: MotionState) => void) {
  const m = useMotion();
  useFrame(() => {
    if (m.current.enabled) fn(m.current);
  });
}

/** Sine wave with a period that divides LOOP_SECONDS (cycles per loop >= 1). */
export const wave = (t: number, cyclesPerLoop = 1, phase = 0) => Math.sin((t / LOOP_SECONDS) * cyclesPerLoop * TAU + phase * TAU);

/** 0..1 sawtooth repeating `cyclesPerLoop` times per loop. */
export const cycle = (t: number, cyclesPerLoop = 1, phase = 0) => ((((t / LOOP_SECONDS) * cyclesPerLoop + phase) % 1) + 1) % 1;

/**
 * A blink: 1 for a short moment once per loop at `at` (0..1 of the loop), eased
 * in and out. Use for eye blinks, light flickers and glints.
 */
export function blink(t: number, at = 0.85, width = 0.035) {
  const u = cycle(t);
  const d = Math.abs(u - at);
  return d > width ? 0 : 0.5 + 0.5 * Math.cos((d / width) * Math.PI);
}

/** Electric double flicker (on, dip, on), once per loop at `at`. */
export const flicker = (t: number, at = 0.6) => Math.max(blink(t, at, 0.02), blink(t, at + 0.05, 0.025) * 0.8);

/** Damped bounce after a click: positive = squash. 0 when idle. */
export const pressBounce = (age: number) => (Number.isFinite(age) ? Math.exp(-age * 6) * Math.sin(age * 22) : 0);

/**
 * Wrap a 3D icon to give it life: float bob, gentle sway, tilt toward the
 * pointer on hover, squash & stretch on click. `seed` offsets the phase so
 * several icons on one page never move in lockstep.
 */
export function IconMotion({ children, float = 0.07, sway = 0.08, seed = 0 }: { children: ReactNode; float?: number; sway?: number; seed?: number }) {
  const ref = useRef<Group>(null);
  const m = useMotion();
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const { t, hover, px, py, pressAge, enabled } = m.current;
    if (!enabled) {
      g.position.set(0, 0, 0);
      g.rotation.set(0, 0, 0);
      g.scale.set(1, 1, 1);
      return;
    }
    const ph = (seed % 100) / 100;
    g.position.y = wave(t, 1, ph) * float * (1 + hover * 0.6);
    g.rotation.y = wave(t, 1, ph + 0.25) * sway + px * 0.45 * hover;
    g.rotation.x = -py * 0.3 * hover + wave(t, 2, ph) * sway * 0.25;
    g.rotation.z = wave(t, 1, ph + 0.5) * sway * 0.2;
    const sq = pressBounce(pressAge) * 0.14;
    const hoverPop = 1 + hover * 0.04;
    g.scale.set(hoverPop * (1 + sq), hoverPop * (1 - sq), hoverPop * (1 + sq));
  });
  return <group ref={ref}>{children}</group>;
}
