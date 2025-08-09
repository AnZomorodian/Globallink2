import { Github, MessageCircle } from "lucide-react";
import { FaTelegram } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="mt-auto py-4 px-6 bg-transparent">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-600">
        {/* Left side */}
        <div className="font-medium">
          V1.1
        </div>
        
        {/* Middle */}
        <div className="font-medium text-gray-800">
          DeepInk Team
        </div>
        
        {/* Right side */}
        <div className="flex items-center space-x-3">
          <a 
            href="https://discord.gg/avKdJXGR" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-primary transition-colors"
            title="Discord"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
          <a 
            href="https://t.me/DeepInkTeam" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-primary transition-colors"
            title="Telegram"
          >
            <FaTelegram className="h-5 w-5" />
          </a>
          <a 
            href="https://github.com/AnZomorodian" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-primary transition-colors"
            title="GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}