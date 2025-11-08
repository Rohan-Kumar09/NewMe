"use client";

import { useEffect, CSSProperties } from "react";

type Props = {
  firstSrc: string;
  secondSrc: string;
  className?: string;
  style?: CSSProperties;
  /** number (px) or CSS string (e.g. '50%', '100px') */
  width?: number | string;
  /** number (px) or CSS string (e.g. '50%', '100px') */
  height?: number | string;
  /** shorthand to set both width and height */
  size?: number | string;
  /** object-fit behaviour for images */
  fit?: "contain" | "cover" | "fill" | "scale-down";
  /** when true (default) the container will be responsive and use max-width instead of a hard pixel width */
  responsive?: boolean;
};

// avoid JSX intrinsic checks for the custom web component by using a runtime tag alias
const ImgComparison: any = "img-comparison-slider";

export default function ImageComp({
  firstSrc,
  secondSrc,
  className,
  style,
  width,
  height,
  size,
  fit = "contain",
  responsive = true,
  }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.querySelector('script[data-img-comparison]')) return;
    const s = document.createElement("script");
    s.src = "https://unpkg.com/img-comparison-slider@7/dist/index.js";
    s.defer = true;
    s.setAttribute("data-img-comparison", "1");
    document.body.appendChild(s);
  }, []);

  const toCss = (v?: number | string) => (v === undefined ? undefined : typeof v === "number" ? `${v}px` : v);

  const computedWidth = toCss(size ?? width);
  const computedHeight = toCss(size ? size : height);

  // container style: by default fill available space (backwards compatible).
  // If width/size is provided, and responsive is true, use width:100% + maxWidth so parent can control scaling.
  const containerStyle: CSSProperties = { ...(style || {}) };

  if (computedWidth) {
    if (responsive) {
      containerStyle.width = "100%";
      containerStyle.maxWidth = computedWidth;
    } else {
      containerStyle.width = computedWidth;
    }
  } else {
    containerStyle.width = "100%";
  }

  if (computedHeight) {
    // explicit height when given (keeps aspect / cropping depending on fit)
    containerStyle.height = computedHeight;
  } else if (size) {
    containerStyle.height = computedHeight;
  } else {
    // keep full available height by default
    containerStyle.height = "100%";
  }

  const imgStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: fit,
  };

  return (
    <div className={className} style={containerStyle}>
      <ImgComparison style={{ width: "100%", height: "100%" }}>
        <img slot="first" src={firstSrc} alt="Before" style={imgStyle} />
        <img slot="second" src={secondSrc} alt="After" style={imgStyle} />
      </ImgComparison>
    </div>
  );
}
