import { flushSync } from "react-dom";

const REVEAL_DURATION_MS = 450;
const REVEAL_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

type Point = { x: number; y: number };

let activeTransition: ViewTransition | null = null;

export function revealTheme(applyTheme: () => void, origin: Point) {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (
    typeof document.startViewTransition !== "function" ||
    prefersReducedMotion
  ) {
    applyTheme();
    return;
  }

  const root = document.documentElement;
  const radius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  );

  root.classList.add("theme-reveal");
  const transition = document.startViewTransition(() => {
    flushSync(applyTheme);
  });
  activeTransition = transition;
  animateReveal(transition, origin, radius).catch(() => null);
}

async function animateReveal(
  transition: ViewTransition,
  origin: Point,
  radius: number,
) {
  const root = document.documentElement;
  try {
    await transition.ready;
    root.animate(
      {
        clipPath: [
          `circle(0px at ${origin.x}px ${origin.y}px)`,
          `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
        ],
      },
      {
        duration: REVEAL_DURATION_MS,
        easing: REVEAL_EASING,
        pseudoElement: "::view-transition-new(root)",
      },
    );
    await transition.finished;
  } finally {
    if (activeTransition === transition) {
      activeTransition = null;
      root.classList.remove("theme-reveal");
    }
  }
}
