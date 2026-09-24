export default function SparkyLoadingMark() {
  return (
    <div className="sparky-loading-mark" aria-hidden="true">
      <svg className="sparky-loading-face" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="27" cy="30" r="17" fill="#171C29" />
        <circle cx="93" cy="30" r="17" fill="#171C29" />
        <circle cx="27" cy="30" r="8" fill="#FA826D" />
        <circle cx="93" cy="30" r="8" fill="#FA826D" />
        <path d="M51 23C55 19 57 13 57 8C61 13 62 17 61 21C65 19 68 16 70 13C70 20 67 24 64 27" fill="#FFF6EA" />
        <path d="M60 24C85 24 105 39 105 63C105 87 85 99 60 99C35 99 15 87 15 63C15 39 35 24 60 24Z" fill="#FFF6EA" />
        <ellipse cx="42" cy="61" rx="13" ry="17" transform="rotate(22 42 61)" fill="#252B39" />
        <ellipse cx="78" cy="61" rx="13" ry="17" transform="rotate(-22 78 61)" fill="#252B39" />
        <g className="sparky-loading-eyes">
          <ellipse cx="43" cy="62" rx="4" ry="5" fill="#FFF6EA" />
          <ellipse cx="77" cy="62" rx="4" ry="5" fill="#FFF6EA" />
        </g>
        <path d="M55 76C55 72 58 70 60 70C62 70 65 72 65 76C65 79 62 81 60 81C58 81 55 79 55 76Z" fill="#252B39" />
        <path d="M60 81V84M60 84C56 88 52 88 49 85M60 84C64 88 68 88 71 85" stroke="#252B39" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M24 82C30 93 44 99 60 100C76 99 90 93 96 82" stroke="#FA826D" strokeWidth="8" strokeLinecap="round" />
        <path className="sparky-loading-scarf" d="M75 97C86 105 96 104 106 99C102 108 97 113 90 115C84 110 78 105 75 97Z" fill="#FA826D" />
      </svg>
      <span className="sparky-loading-name">sparky</span>
      <span className="sparky-loading-subname">ENGLISH</span>
    </div>
  );
}
