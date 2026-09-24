export default function SparkyLoadingMark() {
  return (
    <div className="sparky-loading-mark" aria-hidden="true">
      <svg className="sparky-loading-face sparky-loading-face--sparky" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      <svg className="sparky-loading-face sparky-loading-face--pinky" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path className="pinky-mark-ear" d="M44 59C31 46 20 35 9 38C1 40 2 52 9 62C19 74 33 70 44 59Z" />
        <path className="pinky-mark-ear-inner" d="M39 58C27 48 18 42 10 44C6 45 9 53 14 58C23 67 32 65 39 58Z" />
        <g className="pinky-loading-ear-right">
          <path className="pinky-mark-ear" d="M76 59C89 46 100 35 111 38C119 40 118 52 111 62C101 74 87 70 76 59Z" />
          <path className="pinky-mark-ear-inner" d="M81 58C93 48 102 42 110 44C114 45 111 53 106 58C97 67 88 65 81 58Z" />
        </g>
        <path className="pinky-mark-fur" d="M52 47C54 39 58 35 63 32C64 38 63 42 61 45C68 39 73 39 78 40C76 45 70 49 64 50" />
        <path className="pinky-mark-fur" d="M60 44C82 44 97 58 97 78C97 97 82 107 60 107C38 107 23 97 23 78C23 58 38 44 60 44Z" />
        <path className="pinky-mark-muzzle" d="M28 83C31 75 40 72 48 76C55 80 65 80 72 76C80 72 89 75 92 83C95 96 79 105 60 105C41 105 25 96 28 83Z" />
        <ellipse className="pinky-mark-blush" cx="34" cy="82" rx="5" ry="4" />
        <ellipse className="pinky-mark-blush" cx="86" cy="82" rx="5" ry="4" />
        <path className="pinky-mark-mouth" d="M35 62C38 59 41 59 44 60M76 60C79 59 82 59 85 62" strokeWidth="2" strokeLinecap="round" />
        <g className="sparky-loading-eyes pinky-loading-eyes">
          <ellipse className="pinky-mark-eye" cx="44" cy="72" rx="5.5" ry="7.5" />
          <ellipse className="pinky-mark-eye" cx="76" cy="72" rx="5.5" ry="7.5" />
          <circle className="pinky-mark-eye-light" cx="45.5" cy="69" r="1.2" />
          <circle className="pinky-mark-eye-light" cx="77.5" cy="69" r="1.2" />
        </g>
        <ellipse className="pinky-mark-nose" cx="60" cy="84" rx="4.5" ry="3.5" />
        <path className="pinky-mark-mouth" d="M42 88C46 96 53 99 60 99C67 99 74 96 78 88" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      <span className="sparky-loading-name sparky-loading-name--sparky">sparky</span>
      <span className="sparky-loading-name sparky-loading-name--pinky">pinky</span>
      <span className="sparky-loading-subname">ENGLISH</span>
    </div>
  );
}
