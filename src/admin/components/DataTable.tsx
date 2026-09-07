import { ReactNode } from "react";
export function DataTable({children,empty}:{children:ReactNode;empty?:ReactNode}){return <div className="overflow-x-auto rounded-3xl border border-glass-border bg-glass-fallback backdrop-blur-xl">{children||empty}</div>}
