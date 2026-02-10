import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useKeywords, useAddKeyword, useDeleteKeyword, useToggleKeyword } from "@/hooks/useKeywords";
import { SeedLibraryDialog, BulkPasteDialog } from "@/components/KeywordBulkActions";
import { useState } from "react";
import {
  Settings as SettingsIcon,
  Key,
  Bell,
  Search,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";

export default function Settings() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: keywords, isLoading: keywordsLoading } = useKeywords();
  const addKeyword = useAddKeyword();
  const deleteKeyword = useDeleteKeyword();
  const toggleKeyword = useToggleKeyword();
  const [newKeyword, setNewKeyword] = useState("");

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    addKeyword.mutate(newKeyword);
    setNewKeyword("");
  };

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your scan preferences and keywords
          </p>
        </div>

        {/* Keywords */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Key className="h-4 w-4" /> Keywords
                {keywords && keywords.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{keywords.length.toLocaleString()} keywords</Badge>
                )}
              </CardTitle>
              <div className="flex gap-2">
                <SeedLibraryDialog />
                <BulkPasteDialog />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                className="flex-1"
              />
              <Button onClick={handleAddKeyword} disabled={addKeyword.isPending}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>

            {keywordsLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : (
              <div className="space-y-2">
                {keywords?.map((kw) => (
                  <div
                    key={kw.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={kw.active}
                        onCheckedChange={(active) =>
                          toggleKeyword.mutate({ id: kw.id, active })
                        }
                      />
                      <span className={`text-sm ${kw.active ? "" : "text-muted-foreground line-through"}`}>
                        {kw.keyword}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => deleteKeyword.mutate(kw.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scan Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="h-4 w-4" /> Scan Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Scan Mode</Label>
              <Select
                value={profile?.scan_mode || "recent"}
                onValueChange={(v: "recent" | "popular") =>
                  updateProfile.mutate({ scan_mode: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Uploaded this week</SelectItem>
                  <SelectItem value="popular">Popular videos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">
                Scan Frequency: {profile?.scan_frequency_minutes || 5} min
              </Label>
              <Slider
                value={[profile?.scan_frequency_minutes || 5]}
                min={1}
                max={30}
                step={1}
                onValueChange={([v]) =>
                  updateProfile.mutate({ scan_frequency_minutes: v })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">
                Cycles per keyword: {profile?.cycles_per_keyword || 12} (= {((profile?.cycles_per_keyword || 12) * (profile?.scan_frequency_minutes || 5))} min per keyword)
              </Label>
              <Slider
                value={[profile?.cycles_per_keyword || 12]}
                min={1}
                max={30}
                step={1}
                onValueChange={([v]) =>
                  updateProfile.mutate({ cycles_per_keyword: v })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Min Likes</Label>
                <Input
                  type="number"
                  value={profile?.min_likes || 0}
                  onChange={(e) =>
                    updateProfile.mutate({ min_likes: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Min Comments</Label>
                <Input
                  type="number"
                  value={profile?.min_comments || 0}
                  onChange={(e) =>
                    updateProfile.mutate({ min_comments: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">High-confidence trend alerts</Label>
              <Switch
                checked={profile?.notify_high_confidence ?? true}
                onCheckedChange={(v) =>
                  updateProfile.mutate({ notify_high_confidence: v })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">
                Min confidence score for alerts: {profile?.min_confidence_score || 50}
              </Label>
              <Slider
                value={[profile?.min_confidence_score || 50]}
                min={0}
                max={100}
                step={5}
                onValueChange={([v]) =>
                  updateProfile.mutate({ min_confidence_score: v })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Timezone */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" /> General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-xs">Timezone</Label>
              <Select
                value={profile?.timezone || "UTC"}
                onValueChange={(v) => updateProfile.mutate({ timezone: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
