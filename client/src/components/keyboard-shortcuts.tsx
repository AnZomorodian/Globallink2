
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Keyboard, Command } from "lucide-react";

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  const shortcuts = [
    { category: "Navigation", items: [
      { key: "Ctrl + /", description: "Show keyboard shortcuts", mac: "⌘ + /" },
      { key: "Ctrl + I", description: "Open inbox", mac: "⌘ + I" },
      { key: "Ctrl + S", description: "Open settings", mac: "⌘ + S" },
      { key: "Escape", description: "Close current modal", mac: "Escape" },
    ]},
    { category: "Calls", items: [
      { key: "Ctrl + Enter", description: "Make voice call", mac: "⌘ + Enter" },
      { key: "Ctrl + Shift + Enter", description: "Make video call", mac: "⌘ + Shift + Enter" },
      { key: "Space", description: "Accept incoming call", mac: "Space" },
      { key: "Escape", description: "Decline/End call", mac: "Escape" },
      { key: "M", description: "Toggle mute (during call)", mac: "M" },
    ]},
    { category: "Messaging", items: [
      { key: "Ctrl + M", description: "New message", mac: "⌘ + M" },
      { key: "Ctrl + Enter", description: "Send message", mac: "⌘ + Enter" },
      { key: "↑/↓", description: "Navigate message history", mac: "↑/↓" },
    ]},
    { category: "Interface", items: [
      { key: "Ctrl + R", description: "Refresh call history", mac: "⌘ + R" },
      { key: "Ctrl + C", description: "Copy Voice ID", mac: "⌘ + C" },
      { key: "F11", description: "Toggle fullscreen", mac: "F11" },
    ]}
  ];

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Keyboard className="mr-2 h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {shortcuts.map((category, index) => (
            <div key={index}>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{category.category}</h3>
              <div className="space-y-2">
                {category.items.map((shortcut, shortcutIndex) => (
                  <div key={shortcutIndex} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{shortcut.description}</span>
                    <Badge variant="outline" className="font-mono">
                      {isMac && shortcut.mac ? shortcut.mac : shortcut.key}
                    </Badge>
                  </div>
                ))}
              </div>
              {index < shortcuts.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
