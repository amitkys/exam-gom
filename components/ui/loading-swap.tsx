import { IconLoader2 } from "@tabler/icons-react";
import type { ReactNode } from "react";

export function LoadingSwap({ isLoading, children }: { isLoading: boolean; children: ReactNode }) {
  return (
    <span className="inline-grid items-center justify-items-center">
      <span className={`col-start-1 row-start-1 ${isLoading ? "invisible" : ""}`}>{children}</span>
      {isLoading && <IconLoader2 aria-hidden="true" className="col-start-1 row-start-1 size-4 animate-spin motion-reduce:animate-none" />}
      {isLoading && <span className="sr-only">Please wait</span>}
    </span>
  );
}
