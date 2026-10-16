"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// The query string keeps this a separate cache entry from the page's own <img>, which loads without
// CORS: reusing that cached response would taint the canvas and block the pixel read.
const avatarUrl = (avatar: string) => `https://sleepercdn.com/avatars/thumbs/${avatar}?cors`;
const cache = new Map<string, Promise<string | null>>();

/**
 * The most common vivid color in an image. Pixels are bucketed into a coarse RGB grid and weighted
 * by saturation, so a flat white or black backdrop does not outvote the avatar's actual subject.
 * A grayscale image falls back to its plain most-common bucket.
 */
function dominantColor(src: string): Promise<string | null> {
  const known = cache.get(src);
  if (known) return known;
  const pending = new Promise<string | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onerror = () => resolve(null);
    image.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return resolve(null);
        context.drawImage(image, 0, 0, size, size);
        const { data } = context.getImageData(0, 0, size, size);
        const vivid = new Map<number, { weight: number; r: number; g: number; b: number }>();
        const plain = new Map<number, { weight: number; r: number; g: number; b: number }>();
        for (let index = 0; index < data.length; index += 4) {
          const [r, g, b, a] = [data[index], data[index + 1], data[index + 2], data[index + 3]];
          if (a < 128) continue;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
          const add = (buckets: typeof vivid, weight: number) => {
            const bucket = buckets.get(key) ?? { weight: 0, r: 0, g: 0, b: 0 };
            bucket.weight += weight;
            bucket.r += r * weight;
            bucket.g += g * weight;
            bucket.b += b * weight;
            buckets.set(key, bucket);
          };
          add(plain, 1);
          if (saturation > 0.25 && max > 40 && max < 250) add(vivid, saturation);
        }
        const pick = (buckets: typeof vivid) => [...buckets.values()].sort((a, b) => b.weight - a.weight)[0];
        const best = pick(vivid) ?? pick(plain);
        resolve(best ? `rgb(${Math.round(best.r / best.weight)} ${Math.round(best.g / best.weight)} ${Math.round(best.b / best.weight)})` : null);
      } catch {
        resolve(null);
      }
    };
    image.src = src;
  });
  cache.set(src, pending);
  return pending;
}

function useAvatarColor(avatar: string | null) {
  const [color, setColor] = useState<string | null>(null);
  useEffect(() => {
    if (!avatar) return;
    let active = true;
    dominantColor(avatarUrl(avatar)).then((value) => active && setColor(value));
    return () => { active = false; };
  }, [avatar]);
  return avatar ? color : null;
}

const wash = (color: string | null, corner: string) =>
  color ? `radial-gradient(75% 160% at ${corner}, color-mix(in oklch, ${color} var(--wash-strength), transparent), transparent 70%)` : "none";

/**
 * A background layer tinting each side of a matchup header with its team's avatar color: home from
 * the left edge, away from the right. Position it inside a `relative` container.
 */
export function TeamWash({ home, away, className }: { home: string | null; away: string | null; className?: string }) {
  const homeColor = useAvatarColor(home);
  const awayColor = useAvatarColor(away);
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 transition-[background-image] duration-500 [--wash-strength:22%] dark:[--wash-strength:30%]", className)}
      style={{ backgroundImage: `${wash(homeColor, "0% 50%")}, ${wash(awayColor, "100% 50%")}` }}
    />
  );
}
