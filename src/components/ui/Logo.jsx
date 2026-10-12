import spotxLogo from "../../assets/spotx-logo.png";
import { useId } from "react";

const HEIGHTS = { sm: 26, md: 36, lg: 56 };

export default function Logo({ size = "md", dark = false, className = "" }) {
  const filterId = `spotx-logo-${useId().replace(/:/g, "")}`;
  const img = (
    <img
      src={spotxLogo}
      alt="SpotX"
      style={{ height: HEIGHTS[size], width: "auto", filter: `url(#${filterId})` }}
    />
  );

  return (
    <span className={`inline-flex items-center ${className}`}>
      <svg width="0" height="0" aria-hidden="true" className="absolute"><defs><filter id={filterId} colorInterpolationFilters="sRGB">
        {/* Key out the white image background without changing the brand colours. */}
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1 -1 -1 3 0" result="transparentLogo" />
        <feComponentTransfer in="transparentLogo" result="cleanLogo"><feFuncA type="linear" slope="1.05" intercept="-0.05" /></feComponentTransfer>
        {dark && <>
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -2 -2 -2 1 0" result="lightWordmark" />
          <feMerge><feMergeNode in="cleanLogo" /><feMergeNode in="lightWordmark" /></feMerge>
        </>}
      </filter></defs></svg>
      {img}
    </span>
  );
}
