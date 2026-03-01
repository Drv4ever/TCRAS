import { Send, ShieldX } from 'lucide-react';
import { Button } from './ui/button';

export function SendButton({
  riskScore,
  threshold,
  isTransferring,
  isDisabled,
  onClick,
}) {
  const isBlocked = riskScore > threshold;

  return (
    <Button
      className="w-full"
      size="lg"
      disabled={isDisabled || isBlocked || isTransferring}
      onClick={onClick}
      variant={isBlocked ? 'destructive' : 'default'}
    >
      {isBlocked ? (
        <>
          <ShieldX className="h-4 w-4 mr-2" />
          Transfer Blocked: Risk {riskScore}% &gt; Threshold {threshold}%
        </>
      ) : isTransferring ? (
        <>
          <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Transferring...
        </>
      ) : (
        <>
          <Send className="h-4 w-4 mr-2" />
          Initiate Secure Transfer
        </>
      )}
    </Button>
  );
}
