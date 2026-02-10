import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "nike", "apple", "starbucks", "lululemon", "cerave",
  "airpods", "stanley cup", "crumbl cookies", "shein haul",
  "protein coffee", "skincare routine", "gym shark",
];

interface QuickScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectKeyword: (keyword: string) => void;
}

export function QuickScanDialog({ open, onOpenChange, onSelectKeyword }: QuickScanDialogProps) {
  const [customKeyword, setCustomKeyword] = useState("");

  const handleSubmit = () => {
    const trimmed = customKeyword.trim().toLowerCase();
    if (!trimmed) return;
    setCustomKeyword("");
    onSelectKeyword(trimmed);
  };

  const handleChipClick = (keyword: string) => {
    setCustomKeyword("");
    onSelectKeyword(keyword);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Quick Scan
          </DialogTitle>
          <DialogDescription>
            Type a keyword or pick a suggestion to start scanning TikTok.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Type a keyword to scan..."
            value={customKeyword}
            onChange={(e) => setCustomKeyword(e.target.value)}
            autoFocus
          />
          <Button type="submit" size="sm" disabled={!customKeyword.trim()}>
            <Search className="h-4 w-4 mr-1" />
            Scan
          </Button>
        </form>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Popular suggestions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((kw) => (
              <button
                key={kw}
                onClick={() => handleChipClick(kw)}
                className="px-3 py-1.5 text-xs rounded-full border border-border bg-muted/50 hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
