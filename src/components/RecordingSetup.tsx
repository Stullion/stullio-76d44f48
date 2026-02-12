import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera } from "lucide-react";
import { PAGE_TURN_SOUNDS } from "@/types/book";

interface RecordingSetupProps {
  onStart: (bookName: string, coverPhoto: string | null, pageTurnSound: string) => void;
}

export function RecordingSetup({ onStart }: RecordingSetupProps) {
  const [bookName, setBookName] = useState("");
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [pageTurnSound, setPageTurnSound] = useState<string>(PAGE_TURN_SOUNDS[0].id);

  const handleCoverPhoto = () => {
    // In production, this would use Capacitor Camera plugin
    // For now, use file input as fallback
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setCoverPhoto(reader.result as string);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-full px-6 pt-8 pb-6">
      <h1 className="text-2xl font-bold text-foreground mb-8">New Recording</h1>

      <div className="flex-1 space-y-6">
        {/* Book Name */}
        <div className="bg-card rounded-2xl p-5 shadow-sm">
          <Label htmlFor="bookName" className="text-sm font-semibold text-muted-foreground mb-2 block">
            Book Name
          </Label>
          <Input
            id="bookName"
            placeholder="Enter the book title..."
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            className="rounded-xl border-border bg-background h-12 text-base"
          />
        </div>

        {/* Cover Photo */}
        <div className="bg-card rounded-2xl p-5 shadow-sm">
          <Label className="text-sm font-semibold text-muted-foreground mb-3 block">
            Cover Photo
          </Label>
          <button
            onClick={handleCoverPhoto}
            className="w-full h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            {coverPhoto ? (
              <img
                src={coverPhoto}
                alt="Cover preview"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <>
                <Camera className="w-8 h-8" />
                <span className="text-sm font-medium">Take a photo</span>
              </>
            )}
          </button>
        </div>

        {/* Page Turn Sound */}
        <div className="bg-card rounded-2xl p-5 shadow-sm">
          <Label className="text-sm font-semibold text-muted-foreground mb-2 block">
            Page Turn Sound
          </Label>
          <Select value={pageTurnSound} onValueChange={setPageTurnSound}>
            <SelectTrigger className="rounded-xl h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_TURN_SOUNDS.map((sound) => (
                <SelectItem key={sound.id} value={sound.id}>
                  {sound.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Start Button */}
      <Button
        onClick={() => onStart(bookName, coverPhoto, pageTurnSound)}
        disabled={!bookName.trim()}
        className="w-full h-14 rounded-2xl text-lg font-bold shadow-md mt-6"
        size="lg"
      >
        Start Reading
      </Button>
    </div>
  );
}
