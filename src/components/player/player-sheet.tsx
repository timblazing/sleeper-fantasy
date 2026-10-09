"use client";

import { ResponsiveDetailSheet } from "@/components/responsive-detail-sheet";
import type { ComponentProps } from "react";

export function PlayerSheet(props: ComponentProps<typeof ResponsiveDetailSheet>) {
  return <ResponsiveDetailSheet {...props} />;
}
