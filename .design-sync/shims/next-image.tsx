// Static stand-in for next/image in design previews: a plain <img>, Next-only props dropped.
import * as React from "react";

type ImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | { src: string };
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
  placeholder?: string;
  blurDataURL?: string;
};

export default function Image({ src, fill, priority: _p, quality: _q, unoptimized: _u, placeholder: _ph, blurDataURL: _b, style, ...rest }: ImageProps) {
  const url = typeof src === "string" ? src : src.src;
  const fillStyle: React.CSSProperties = fill ? { position: "absolute", inset: 0, width: "100%", height: "100%" } : {};
  return <img src={url} style={{ ...fillStyle, ...style }} {...rest} />;
}
