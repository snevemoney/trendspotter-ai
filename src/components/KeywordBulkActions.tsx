import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { KEYWORD_LIBRARY, getKeywordLibraryStats, getAllKeywordsFromCategories } from "@/lib/keyword-library";
import { useBulkAddKeywords } from "@/hooks/useKeywords";
import { Library, ClipboardPaste, Loader2 } from "lucide-react";

export function SeedLibraryDialog() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const bulkAdd = useBulkAddKeywords();
  const stats = getKeywordLibraryStats();
  const allSelected = selected.size === stats.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(stats.map((s) => s.category)));
    }
  };

  const toggle = (cat: string) => {
    const next = new Set(selected);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setSelected(next);
  };

  const totalSelected = stats
    .filter((s) => selected.has(s.category))
    .reduce((sum, s) => sum + s.count, 0);

  const handleSeed = () => {
    const keywords = getAllKeywordsFromCategories(Array.from(selected));
    bulkAdd.mutate(keywords, { onSuccess: () => { setOpen(false); setSelected(new Set()); } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Library className="h-4 w-4 mr-1" /> Seed Library
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seed Keyword Library</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Button variant="ghost" size="sm" onClick={toggleAll}>
            {allSelected ? "Deselect All" : "Select All"}
          </Button>
          {stats.map((s) => (
            <label key={s.category} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={selected.has(s.category)} onCheckedChange={() => toggle(s.category)} />
              <span className="text-sm flex-1">{s.category}</span>
              <Badge variant="secondary" className="text-xs">{s.count}</Badge>
            </label>
          ))}
          <Button onClick={handleSeed} disabled={selected.size === 0 || bulkAdd.isPending} className="w-full">
            {bulkAdd.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Add {totalSelected} Keywords
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BulkPasteDialog() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const bulkAdd = useBulkAddKeywords();

  const keywords = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const handleImport = () => {
    bulkAdd.mutate(keywords, { onSuccess: () => { setOpen(false); setText(""); } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ClipboardPaste className="h-4 w-4 mr-1" /> Bulk Paste
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Import Keywords</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Paste keywords, one per line..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
        />
        <Button onClick={handleImport} disabled={keywords.length === 0 || bulkAdd.isPending} className="w-full">
          {bulkAdd.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Import {keywords.length} Keywords
        </Button>
      </DialogContent>
    </Dialog>
  );
}
