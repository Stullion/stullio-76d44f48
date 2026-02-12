import { TabId } from "@/types/book";
import { Mic, BookOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomTabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "record", label: "Record", icon: Mic },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "settings", label: "Settings", icon: Settings },
];

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav className="flex-shrink-0 bg-card border-t border-border px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 min-w-[72px]",
                active
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-6 h-6", active && "stroke-[2.5]")} />
              <span className={cn("text-xs font-semibold", active && "font-bold")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
