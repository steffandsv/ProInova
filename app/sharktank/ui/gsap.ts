"use client";

// GSAP 3.13+ é 100% gratuito, inclusive os plugins que antes eram pagos
// (SplitText, ScrambleText, Inertia, DrawSVG). Registro único para a página toda.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, Draggable, InertiaPlugin, DrawSVGPlugin, Flip);
}

export { gsap, ScrollTrigger, SplitText, Draggable, Flip };
