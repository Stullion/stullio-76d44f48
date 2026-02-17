import { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";

/**
 * Warning banner for iOS Safari users about data persistence.
 * Shows once per session, dismissible.
 */
export function DataWarningBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS (iPhone/iPad)
    const ua = navigator.userAgent.toLowerCase();
    const isiOS = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isiOS);
    
    // Check if already dismissed this session
    const wasDismissed = sessionStorage.getItem("data-warning-dismissed");
    if (wasDismissed) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("data-warning-dismissed", "true");
  };

  // Only show on iOS and if not dismissed
  if (!isIOS || dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 relative">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-amber-900">
          <p className="font-medium mb-1">iOS Storage Notice</p>
          <p className="text-amber-800">
            Safari may clear recordings if the app isn't used regularly. For permanent storage, we recommend using the app frequently or waiting for our native iOS version.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-amber-600 hover:text-amber-900"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
