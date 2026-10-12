import spotxLogo from "../../assets/spotx-logo.png";

const HEIGHTS = { sm: 26, md: 36, lg: 56 };

export default function Logo({ size = "md", dark = false, className = "" }) {
  const img = (
    <img
      src={spotxLogo}
      alt="SpotX"
      style={{ height: HEIGHTS[size], width: "auto" }}
    />
  );

  return (
    <span className={`inline-flex items-center ${dark ? "bg-white rounded-lg px-2 py-1" : ""} ${className}`}>
      {img}
    </span>
  );
}
