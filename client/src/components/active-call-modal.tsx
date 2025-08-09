import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect } from "react";
import { CallService } from "@/lib/call-service";

interface ActiveCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callData: {
    callId: string;
    callerName: string;
    callerInitials: string;
    callerId: string;
    isConnected: boolean;
  } | null;
  onEndCall: (duration: string) => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  isMuted: boolean;
  isDeafened: boolean;
}

export function ActiveCallModal({ isOpen, onClose, callData, onEndCall, onToggleMute, onToggleDeafen, isMuted, isDeafened }: ActiveCallModalProps) {
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isOpen && callData?.isConnected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isOpen, callData?.isConnected]);

  const handleEndCall = () => {
    const duration = CallService.formatDuration(callDuration);
    onEndCall(duration);
    setCallDuration(0);
    onClose();
  };

  const getGradientClass = (initials: string) => {
    const gradients = [
      'bg-gradient-to-br from-purple-500 to-pink-500',
      'bg-gradient-to-br from-orange-500 to-red-500',
      'bg-gradient-to-br from-blue-500 to-purple-500',
      'bg-gradient-to-br from-green-500 to-blue-500',
      'bg-gradient-to-br from-pink-500 to-orange-500'
    ];
    const index = initials.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  if (!callData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md p-0 bg-white rounded-3xl border-none"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="text-center p-8 pb-6">
          {/* Caller Avatar */}
          <div className={`w-24 h-24 ${getGradientClass(callData.callerInitials)} rounded-full mx-auto mb-4 flex items-center justify-center`}>
            <span className="text-white text-2xl font-bold">
              {callData.callerInitials}
            </span>
          </div>
          
          {/* Caller Info */}
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {callData.callerName}
          </h3>
          <p className="text-gray-500 text-sm mb-2">
            {callData.callerId}
          </p>
          
          {/* Call Status */}
          <div className="text-primary text-sm font-medium">
            {callData.isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>

        {/* Call Duration (shown when connected) */}
        {callData.isConnected && (
          <div className="text-center pb-4">
            <div className="text-2xl font-mono font-semibold text-gray-900">
              {CallService.formatDuration(callDuration)}
            </div>
          </div>
        )}

        {/* Call Controls */}
        <div className="flex items-center justify-center space-x-6 p-8 pt-4">
          {/* Mute Button */}
          <Button
            variant="outline"
            size="icon"
            className={`w-14 h-14 rounded-full border-2 ${
              isMuted 
                ? 'bg-destructive hover:bg-destructive/90 text-white border-destructive' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
            }`}
            onClick={onToggleMute}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          
          {/* End Call Button */}
          <Button
            variant="destructive"
            size="icon"
            className="w-16 h-16 rounded-full"
            onClick={handleEndCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
          
          {/* Deafen Button */}
          <Button
            variant="outline"
            size="icon"
            className={`w-14 h-14 rounded-full border-2 ${
              isDeafened 
                ? 'bg-destructive hover:bg-destructive/90 text-white border-destructive' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
            }`}
            onClick={onToggleDeafen}
          >
            {isDeafened ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
