import { useEffect, useState, useCallback } from "react";
import type { DrivingControlsState } from "../types/driving";

export function useDrivingControls() {
  const [controls, setControls] = useState<DrivingControlsState>({
    throttle: false,
    brake: false,
    steerLeft: false,
    steerRight: false,
    handbrake: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in input
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;

      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          setControls((c) => ({ ...c, throttle: true }));
          break;
        case "KeyS":
        case "ArrowDown":
          setControls((c) => ({ ...c, brake: true }));
          break;
        case "KeyA":
        case "ArrowLeft":
          setControls((c) => ({ ...c, steerLeft: true }));
          break;
        case "KeyD":
        case "ArrowRight":
          setControls((c) => ({ ...c, steerRight: true }));
          break;
        case "Space":
          e.preventDefault();
          setControls((c) => ({ ...c, handbrake: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          setControls((c) => ({ ...c, throttle: false }));
          break;
        case "KeyS":
        case "ArrowDown":
          setControls((c) => ({ ...c, brake: false }));
          break;
        case "KeyA":
        case "ArrowLeft":
          setControls((c) => ({ ...c, steerLeft: false }));
          break;
        case "KeyD":
        case "ArrowRight":
          setControls((c) => ({ ...c, steerRight: false }));
          break;
        case "Space":
          setControls((c) => ({ ...c, handbrake: false }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const setVirtualControl = useCallback((key: keyof DrivingControlsState, value: boolean) => {
    setControls((c) => ({ ...c, [key]: value }));
  }, []);

  return { controls, setVirtualControl };
}
