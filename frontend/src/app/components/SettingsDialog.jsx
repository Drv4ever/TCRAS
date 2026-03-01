import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';

export function SettingsDialog({
  open,
  onOpenChange,
  config,
  onConfigChange,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Configuration</DialogTitle>
          <DialogDescription>
            Adjust TCRAS Transfer settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="threshold">Risk Threshold (%)</Label>
            <Input
              id="threshold"
              type="number"
              min="0"
              max="100"
              value={config.threshold}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  threshold: parseInt(e.target.value) || 75,
                })
              }
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Transfers above this risk level will be blocked
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="port">Server Port</Label>
            <Input
              id="port"
              type="number"
              value={config.serverPort}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  serverPort: parseInt(e.target.value) || 5000,
                })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-detect">Auto-detect Nearby Nodes</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically discover devices on the network
              </p>
            </div>
            <Switch
              id="auto-detect"
              checked={config.autoDetect}
              onCheckedChange={(checked) =>
                onConfigChange({ ...config, autoDetect: checked })
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
