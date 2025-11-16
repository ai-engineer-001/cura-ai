"use client"

import { useState, useEffect } from "react"
import { useChatStore } from "@/store/chatStore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { getAudioInputDevices } from "@/lib/audio"
import { getVideoInputDevices } from "@/lib/video"
import { Moon, Sun, Mic, Video, Subtitles, LogOut } from "lucide-react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const {
    darkMode,
    showSubtitles,
    selectedAudioDevice,
    selectedVideoDevice,
    toggleDarkMode,
    setShowSubtitles,
    setSelectedAudioDevice,
    setSelectedVideoDevice,
  } = useChatStore()

  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])

  useEffect(() => {
    if (open) {
      // Load available devices
      getAudioInputDevices().then(setAudioDevices)
      getVideoInputDevices().then(setVideoDevices)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Customize your Cura AI experience</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 flex-1">
          {/* Appearance */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Appearance
            </h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex flex-col gap-1">
                <span>Dark Mode</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Toggle between light and dark themes
                </span>
              </Label>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </div>

          <Separator />

          {/* Audio Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Audio Settings
            </h3>
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="audio-device">Microphone Device</Label>
                <Select
                  value={selectedAudioDevice || "default"}
                  onValueChange={setSelectedAudioDevice}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Microphone</SelectItem>
                    {audioDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Video Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Video className="w-4 h-4" />
              Video Settings
            </h3>
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="video-device">Camera Device</Label>
                <Select
                  value={selectedVideoDevice || "default"}
                  onValueChange={setSelectedVideoDevice}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Camera</SelectItem>
                    {videoDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Realtime Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Subtitles className="w-4 h-4" />
              Realtime Mode
            </h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="subtitles" className="flex flex-col gap-1">
                <span>Show Live Subtitles</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Display ASR transcription in realtime mode
                </span>
              </Label>
              <Switch
                checked={showSubtitles}
                onCheckedChange={setShowSubtitles}
              />
            </div>
          </div>
        </div>
        {/* Logout Button at the bottom */}
        <div className="pt-4 border-t border-border flex justify-center">
          <button
            className="flex items-center gap-2 px-6 py-2 rounded bg-destructive text-destructive-foreground font-semibold shadow hover:bg-red-700 hover:text-white transition"
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
