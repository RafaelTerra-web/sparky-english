import type { ReactNode } from "react";

type NavIconProps = { size?: number; className?: string };

function IconFrame({ size = 20, className, children }: NavIconProps & { children: ReactNode }) {
  return <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >{children}</svg>;
}

export function TodayIcon(props: NavIconProps) {
  return <IconFrame {...props}>
    <path d="M3.5 11 12 4l8.5 7v8.25a1.25 1.25 0 0 1-1.25 1.25H4.75a1.25 1.25 0 0 1-1.25-1.25Z" />
    <path d="M8.4 20.5v-5.6h7.2v5.6" />
    <path d="m9.4 10.9 1.7 1.7 3.6-3.7" />
  </IconFrame>;
}

export function CourseIcon(props: NavIconProps) {
  return <IconFrame {...props}>
    <path d="M12 5.2c-2.5-1.5-5.3-1.8-8.5-1.1v14.5c3.2-.7 6-.4 8.5 1.1 2.5-1.5 5.3-1.8 8.5-1.1V4.1c-3.2-.7-6-.4-8.5 1.1Z" />
    <path d="M12 5.2v14.5M6.5 8.2c1.1-.1 2.1 0 3.1.3M6.5 11.2c1.1-.1 2.1 0 3.1.3" />
    <path d="M15.1 8.5c1-.3 2-.4 3.1-.3" />
  </IconFrame>;
}

export function ReviewIcon(props: NavIconProps) {
  return <IconFrame {...props}>
    <path d="M5.2 9a7.3 7.3 0 0 1 12.3-3L19 7.5M18.8 15a7.3 7.3 0 0 1-12.3 3L5 16.5" />
    <path d="M19 3.8v3.7h-3.7M5 20.2v-3.7h3.7" />
    <path d="m9.5 12 1.7 1.7 3.4-3.5" />
  </IconFrame>;
}

export function ExamsIcon(props: NavIconProps) {
  return <IconFrame {...props}>
    <rect x="4.5" y="4.5" width="15" height="16" rx="2" />
    <path d="M9 4.5v-1h6v1M8 10.2h8M8 13.7h5M8 17.2h4" />
    <path d="m15 16.8 1.2 1.1 1.8-2" />
  </IconFrame>;
}

export function MusicIcon(props: NavIconProps) {
  return <IconFrame {...props}>
    <path d="M10 17V5.5l9-2V15" />
    <path d="M10 8.4 19 6.5" />
    <ellipse cx="7.4" cy="17.7" rx="2.6" ry="1.8" transform="rotate(-20 7.4 17.7)" />
    <ellipse cx="16.4" cy="15.7" rx="2.6" ry="1.8" transform="rotate(-20 16.4 15.7)" />
  </IconFrame>;
}

export function ShopIcon(props: NavIconProps) {
  return <IconFrame {...props}>
    <path d="M5 8.7h14l1 11.3H4L5 8.7Z" />
    <path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2" />
    <path d="m12 12.1.7 1.5 1.7.2-1.2 1.2.3 1.7-1.5-.8-1.5.8.3-1.7-1.2-1.2 1.7-.2Z" />
  </IconFrame>;
}

export function ProfileIcon(props: NavIconProps) {
  return <IconFrame {...props}>
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5.5 19.7v-1.4a5.4 5.4 0 0 1 5.4-5.4h2.2a5.4 5.4 0 0 1 5.4 5.4v1.4H5.5Z" />
  </IconFrame>;
}
