import { cn } from "@/lib/cn";

type BrandMarkProps = {
  className?: string;
  inverted?: boolean;
};

export function BrandMark({ className, inverted = false }: BrandMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[11px]",
          inverted
            ? "bg-blue-spruce-50 text-blue-spruce-950"
            : "bg-blue-spruce-800 text-blue-spruce-50",
        )}
      >
        <span className="absolute left-[9px] top-[8px] h-[18px] w-[6px] rounded-[2px] bg-current" />
        <span className="absolute left-[19px] top-[14px] h-[12px] w-[6px] rounded-[2px] bg-current opacity-55" />
        <span className="absolute bottom-[6px] right-[6px] h-2 w-2 rounded-full bg-shamrock-400" />
      </span>
      <span
        translate="no"
        className="text-[1.05rem] font-semibold tracking-[-0.035em]"
      >
        InstaSafe
      </span>
    </span>
  );
}
