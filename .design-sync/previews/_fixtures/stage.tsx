// Preview framing: padding inside the dark DsRoot so small components don't sit on a hairline strip.
import type { ReactNode } from "react";

export const Stage = ({ children, className = "" }: { children: ReactNode; className?: string }) => <div className={`p-6 ${className}`}>{children}</div>;
