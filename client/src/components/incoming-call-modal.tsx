import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";

interface IncomingCallModalProps {
  isOpen: boolean;
  callData: {
    callId: string;
    callerName: string;
    callerInitials: string;
    callerId: string;
  } | null;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallModal({ isOpen, callData, onAccept, onDecline }: IncomingCallModalProps) {
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
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent className="sm:max-w-md p-0 bg-white rounded-3xl border-none">
        <div className="text-center p-8 pb-6">
          {/* Caller Avatar with Animation */}
          <div className="relative w-32 h-32 mx-auto mb-4">
            <div className={`w-32 h-32 ${getGradientClass(callData.callerInitials)} rounded-full flex items-center justify-center relative z-10`}>
              <span className="text-white text-3xl font-bold">
                {callData.callerInitials}
              </span>
            </div>
            {/* Pulsing ring animations */}
            <div className="absolute inset-0 border-4 border-white rounded-full animate-pulse-ring opacity-50"></div>
            <div className="absolute inset-0 border-4 border-white rounded-full animate-ping-slow opacity-25"></div>
          </div>
          
          {/* Caller Info */}
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {callData.callerName}
          </h3>
          <p className="text-gray-500 text-sm mb-2">
            {callData.callerId}
          </p>
          
          {/* Incoming Call Status */}
          <div className="text-primary text-sm font-medium">
            Incoming voice call...
          </div>
        </div>

        {/* Call Answer Controls */}
        <div className="flex items-center justify-center space-x-12 p-8 pt-4">
          {/* Decline Button */}
          <Button
            variant="destructive"
            size="icon"
            className="w-16 h-16 rounded-full"
            onClick={onDecline}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
          
          {/* Accept Button */}
          <Button
            className="w-16 h-16 rounded-full bg-success hover:bg-success/90"
            onClick={onAccept}
          >
            <Phone className="h-6 w-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
