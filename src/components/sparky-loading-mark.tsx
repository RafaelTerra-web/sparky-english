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
        <path className="sparky-mark-brow" d="M31 42C34 38 38 37 42 39M78 39C82 37 86 38 89 42" strokeWidth="2" strokeLinecap="round" />
        <g className="sparky-loading-eyes">
          <ellipse className="sparky-mark-sclera" cx="43" cy="62" rx="6.2" ry="7.8" />
          <ellipse className="sparky-mark-sclera" cx="77" cy="62" rx="6.2" ry="7.8" />
          <ellipse className="sparky-mark-pupil" cx="45" cy="62" rx="3.7" ry="5.1" />
          <ellipse className="sparky-mark-pupil" cx="79" cy="62" rx="3.7" ry="5.1" />
          <circle className="sparky-mark-eye-light" cx="46" cy="59.5" r="1.2" />
          <circle className="sparky-mark-eye-light" cx="80" cy="59.5" r="1.2" />
        </g>
        <path className="sparky-mark-pupil" d="M55 76C55 72 58 70 60 70C62 70 65 72 65 76C65 79 62 81 60 81C58 81 55 79 55 76Z" />
        <path className="sparky-mark-mouth" d="M60 81V84M60 84C56 88 52 88 49 85M60 84C64 88 68 88 71 85" strokeWidth="2.2" strokeLinecap="round" />
        <path className="sparky-mark-scarf-line" d="M24 82C30 93 44 99 60 100C76 99 90 93 96 82" strokeWidth="8" strokeLinecap="round" />
        <path className="sparky-loading-scarf sparky-mark-scarf" d="M75 97C86 105 96 104 106 99C102 108 97 113 90 115C84 110 78 105 75 97Z" />
      </svg>
      <svg className="sparky-loading-face sparky-loading-face--pinky" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g className="pinky-loading-ear-left">
          <path className="pinky-mark-ear" d="M47 55C36 44 23 13 10 14C1 15 1 39 8 55C15 70 33 69 47 55Z" />
          <path className="pinky-mark-ear-inner" d="M39 52C31 42 20 22 12 23C8 24 9 40 14 51C20 61 29 62 39 52Z" />
        </g>
        <g className="pinky-loading-ear-right">
          <path className="pinky-mark-ear" d="M73 55C84 44 97 13 110 14C119 15 119 39 112 55C105 70 87 69 73 55Z" />
          <path className="pinky-mark-ear-inner" d="M81 52C89 42 100 22 108 23C112 24 111 40 106 51C100 61 91 62 81 52Z" />
        </g>
        <path className="pinky-mark-fur" d="M52 48C50 39 54 34 61 31C60 37 59 41 58 43C64 37 69 36 73 37C72 42 67 46 62 48Z" />
        <path className="pinky-mark-fur" d="M60 44C83 44 101 59 101 80C101 101 83 113 60 113C37 113 19 101 19 80C19 59 37 44 60 44Z" />
        <path className="pinky-mark-muzzle" d="M25 88C27 78 36 74 45 78C53 82 67 82 75 78C84 74 93 78 95 88C92 101 77 109 60 109C43 109 28 101 25 88Z" />
        <ellipse className="pinky-mark-blush" cx="32" cy="84" rx="5" ry="3.8" />
        <ellipse className="pinky-mark-blush" cx="88" cy="84" rx="5" ry="3.8" />
        <path className="pinky-mark-brow" d="M34 62C39 58 43 59 47 62M73 62C77 59 81 58 86 62" strokeWidth="2" strokeLinecap="round" />
        <g className="sparky-loading-eyes pinky-loading-eyes">
          <ellipse className="pinky-mark-sclera" cx="44" cy="76" rx="9.5" ry="12" />
          <ellipse className="pinky-mark-sclera" cx="76" cy="76" rx="9.5" ry="12" />
          <ellipse className="pinky-mark-eye" cx="46" cy="77" rx="5.5" ry="8.5" />
          <ellipse className="pinky-mark-eye" cx="78" cy="77" rx="5.5" ry="8.5" />
          <circle className="pinky-mark-eye-light" cx="47" cy="73" r="2" />
          <circle className="pinky-mark-eye-light" cx="79" cy="73" r="2" />
          <path className="pinky-mark-lash" d="m36 67-3-3m49 3 3-3" strokeWidth="2" strokeLinecap="round" />
        </g>
        <ellipse className="pinky-mark-nose" cx="60" cy="88" rx="5" ry="3.4" />
        <path className="pinky-mark-smile" d="M60 92c-4 4-9 4-12 1m12-1c4 4 9 4 12 1" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="sparky-loading-name sparky-loading-name--sparky">sparky</span>
      <span className="sparky-loading-name sparky-loading-name--pinky">pinky</span>
      <span className="sparky-loading-subname">ENGLISH</span>
      <span className="sparky-loading-track"><span /></span>
    </div>
  );
}
