export default function SparkyLoadingMark() {
  return (
    <div className="sparky-loading-mark" aria-hidden="true">
      <svg className="sparky-loading-face" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle className="sparky-mark-ear" cx="27" cy="30" r="17" />
        <circle className="sparky-mark-ear" cx="93" cy="30" r="17" />
        <circle className="sparky-mark-ear-inner" cx="27" cy="30" r="8" />
        <circle className="sparky-mark-ear-inner" cx="93" cy="30" r="8" />
        <path className="sparky-mark-face" d="M51 23C55 19 57 13 57 8C61 13 62 17 61 21C65 19 68 16 70 13C70 20 67 24 64 27" />
        <path className="sparky-mark-face sparky-mark-head" d="M60 24C85 24 105 39 105 63C105 87 85 99 60 99C35 99 15 87 15 63C15 39 35 24 60 24Z" />
        <ellipse className="sparky-mark-patch" cx="42" cy="61" rx="13" ry="17" transform="rotate(22 42 61)" />
        <ellipse className="sparky-mark-patch" cx="78" cy="61" rx="13" ry="17" transform="rotate(-22 78 61)" />
        <g className="sparky-loading-eyes">
          <ellipse className="sparky-mark-sclera" cx="43" cy="62" rx="3.8" ry="4.8" />
          <ellipse className="sparky-mark-sclera" cx="77" cy="62" rx="3.8" ry="4.8" />
          <ellipse className="sparky-mark-pupil" cx="43" cy="62.5" rx="2.6" ry="3.5" />
          <ellipse className="sparky-mark-pupil" cx="77" cy="62.5" rx="2.6" ry="3.5" />
        </g>
        <path className="sparky-mark-pupil" d="M55 76C55 72 58 70 60 70C62 70 65 72 65 76C65 79 62 81 60 81C58 81 55 79 55 76Z" />
        <path className="sparky-mark-mouth" d="M60 81V84M60 84C56 88 52 88 49 85M60 84C64 88 68 88 71 85" strokeWidth="2.2" strokeLinecap="round" />
        <path className="sparky-mark-scarf-line" d="M24 82C30 93 44 99 60 100C76 99 90 93 96 82" strokeWidth="8" strokeLinecap="round" />
        <path className="sparky-loading-scarf sparky-mark-scarf" d="M75 97C86 105 96 104 106 99C102 108 97 113 90 115C84 110 78 105 75 97Z" />
      </svg>
      <span className="sparky-loading-name">sparky</span>
      <span className="sparky-loading-subname">ENGLISH</span>
    </div>
  );
}
