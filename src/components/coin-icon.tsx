"use client";
import { useId } from "react";

/** Faceted emerald: the existing currency keeps its value and name. */
export function CoinIcon({ size = 24, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return <svg className={className} width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={id + "gem"} x1="9" y1="5" x2="29" y2="36" gradientUnits="userSpaceOnUse"><stop stopColor="#c8ffe7"/><stop offset=".36" stopColor="#59e5b3"/><stop offset="1" stopColor="#076957"/></linearGradient>
      <linearGradient id={id + "face"} x1="12" y1="8" x2="28" y2="30" gradientUnits="userSpaceOnUse"><stop stopColor="#ecfff6"/><stop offset=".5" stopColor="#89f0c5"/><stop offset="1" stopColor="#21aa8d"/></linearGradient>
    </defs>
    <path d="m14 4 12 1 8 10-5 17-12 5L6 27 5 13Z" fill={"url(#" + id + "gem)"} stroke="#1e8a72" strokeWidth="1.1" strokeLinejoin="round"/>
    <path d="m14 4 3 8 10 2-1-9Z" fill="#d6ffe9"/>
    <path d="m5 13 12-1-3-8Z" fill="#9bf5cb"/>
    <path d="m27 14 7 1-8-10Z" fill="#48c99e"/>
    <path d="m17 12 10 2-1 13-11 3-4-12Z" fill={"url(#" + id + "face)"}/>
    <path d="m5 13 6 5 4 12-9-3Z" fill="#32bc96"/>
    <path d="m27 14-1 13 3 5 5-17Z" fill="#11836d"/>
    <path d="m15 30 2 7 12-5-3-5Z" fill="#0f7b65"/>
    <path d="m6 27 9 3 2 7Z" fill="#59d8af"/>
    <path d="m14 4 3 8 10 2-1 13-11 3-4-12 6-6m-6 6-6-5m21 14 3 5m-14-2 2 7m10-23 7 1" stroke="#d2ffe5" strokeOpacity=".5" strokeWidth=".65"/>
    <path d="m31 2 1.2 3.1L35.5 6l-3.3 1-1.2 3-1-3-3-1 3-.9Z" fill="#f3fff5"/>
    <path d="m11 11 .6 2.2 2.4.8-2.4.7-.6 2.3-.7-2.3L8 14l2.3-.8Z" fill="white"/>
    <path d="m36 27 .5 1.6 1.7.5-1.7.5-.5 1.7-.5-1.7-1.7-.5 1.7-.5Z" fill="#b7f6dc"/>
  </svg>;
}
