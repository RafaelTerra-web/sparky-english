"use client";
import { useLayoutEffect } from "react";

let locks = 0;
let restore: (() => void) | undefined;
/** Lock the page without moving it; nested dialogs share the same lock. */
export function useScrollLock(active = true) {
  useLayoutEffect(() => {
    if (!active) return;
    if (locks++ === 0) {
      const root = document.documentElement;
      const body = document.body;
      const x = window.scrollX, y = window.scrollY;
      const rootOverflow = root.style.overflow;
      const bodyStyle = { overflow: body.style.overflow, position: body.style.position, top: body.style.top,
        left: body.style.left, width: body.style.width, paddingRight: body.style.paddingRight };
      const gutter = window.innerWidth - root.clientWidth;
      root.style.overflow = "hidden";
      root.dataset.scrollLocked = "true";
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = -y + "px";
      body.style.left = -x + "px";
      body.style.width = "100%";
      if (gutter > 0) body.style.paddingRight = (parseFloat(getComputedStyle(body).paddingRight) + gutter) + "px";
      restore = () => {
        root.style.overflow = rootOverflow;
        delete root.dataset.scrollLocked;
        Object.assign(body.style, bodyStyle);
        window.scrollTo({ left: x, top: y, behavior: "instant" });
      };
    }
    return () => {
      if (--locks === 0) { restore?.(); restore = undefined; }
    };
  }, [active]);
}
