export function Atlas() {
  return (
    <svg className="atlas-lines" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g className="atlas-contour" fill="none" strokeWidth="0.7">
        <path d="M-40 150 C 120 118, 210 196, 340 168 S 520 96, 610 168" />
        <path d="M-30 188 C 130 154, 230 228, 370 198 S 560 132, 670 198" />
        <path d="M20 228 C 150 198, 240 262, 390 232" />
        <path d="M70 268 C 180 246, 250 292, 360 270" />
        <path d="M980 540 C 1120 486, 1260 558, 1490 492" />
        <path d="M940 586 C 1100 528, 1280 612, 1500 548" />
        <path d="M1010 632 C 1160 586, 1320 676, 1500 620" />
        <path d="M1080 678 C 1220 640, 1340 724, 1490 684" />
        <path d="M40 760 C 220 688, 340 812, 520 736 S 760 640, 900 748" />
        <path d="M20 804 C 210 742, 360 848, 540 778" />
        <path d="M1180 96 C 1280 64, 1360 120, 1480 78" />
        <path d="M1220 132 C 1320 104, 1390 156, 1490 124" />
      </g>
      <g className="atlas-tick" fill="none" strokeWidth="0.6">
        <path d="M118 108 v16 M118 108 h14" />
        <path d="M1296 148 v12 M1296 148 h12" />
        <path d="M168 742 h14 M168 742 v-12" />
        <path d="M860 210 v10 M860 210 h10" />
        <path d="M1040 470 l8 8 M1048 470 l-8 8" />
      </g>
      <g className="atlas-label" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="11" letterSpacing="0.16em">
        <text x="138" y="104">27.4</text>
        <text x="1314" y="144">81.0</text>
        <text x="184" y="738">06.2</text>
      </g>
    </svg>
  );
}
