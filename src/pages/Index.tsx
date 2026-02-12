import { useState, useCallback } from "react";
import { TabId } from "@/types/book";
import { BottomTabBar } from "@/components/BottomTabBar";
import { RecordTab } from "@/pages/RecordTab";
import { LibraryTab } from "@/pages/LibraryTab";
import { SettingsTab } from "@/pages/SettingsTab";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>("record");
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0);

  const handleRecordingComplete = useCallback(() => {
    setLibraryRefreshKey((k) => k + 1);
    setActiveTab("library");
  }, []);

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-background">
      <div className="flex-1 overflow-hidden">
        {activeTab === "record" && (
          <RecordTab onRecordingComplete={handleRecordingComplete} />
        )}
        {activeTab === "library" && (
          <LibraryTab refreshKey={libraryRefreshKey} />
        )}
        {activeTab === "settings" && <SettingsTab />}
      </div>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
