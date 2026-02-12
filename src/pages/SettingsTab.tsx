import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { getSettings, saveSettings } from "@/lib/storage";
import { Volume2 } from "lucide-react";

export function SettingsTab() {
  const [volume, setVolume] = useState(80);

  useEffect(() => {
    setVolume(getSettings().pageTurnVolume);
  }, []);

  const handleChange = (value: number[]) => {
    const v = value[0];
    setVolume(v);
    saveSettings({ pageTurnVolume: v });
  };

  return (
    <div className="flex flex-col h-full px-6 pt-8 pb-6">
      <h1 className="text-2xl font-bold text-foreground mb-8">Settings</h1>

      <div className="bg-card rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Volume2 className="w-5 h-5 text-primary" />
          <Label className="text-base font-semibold text-foreground">
            Page Turn Volume Limit
          </Label>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Controls the maximum volume of page turn sounds relative to the narration.
        </p>
        <Slider
          value={[volume]}
          onValueChange={handleChange}
          min={0}
          max={100}
          step={5}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Off</span>
          <span className="font-semibold text-foreground">{volume}%</span>
          <span>Max</span>
        </div>
      </div>
    </div>
  );
}
