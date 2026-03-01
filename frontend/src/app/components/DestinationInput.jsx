import { Wifi, Network } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

export function DestinationInput({
  value,
  onChange,
  onDetectNearby,
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Network className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Target IP Address
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enter destination node address
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <Input
          type="text"
          placeholder="192.168.1.100"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        <Button
          variant="outline"
          onClick={onDetectNearby}
          className="gap-2"
        >
          <Wifi className="h-4 w-4" />
          Detect Nearby
        </Button>
      </div>
    </div>
  );
}
