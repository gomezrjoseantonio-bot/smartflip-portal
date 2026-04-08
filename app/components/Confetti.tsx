"use client";
import { useCallback } from "react";
import confetti from "canvas-confetti";

export function useConfetti() {
  const trigger = useCallback(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4ECDC4', '#2ECC71', '#ffffff', '#0f172a'],
    });
  }, []);
  return trigger;
}

export default function Confetti() {
  return null;
}
