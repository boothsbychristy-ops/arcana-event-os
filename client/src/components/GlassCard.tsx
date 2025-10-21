import { cn } from "@/lib/utils";

interface GlassCardProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function GlassCard({ className, children, onClick, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6",
        "hover:bg-white/10 transition-all duration-200",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}