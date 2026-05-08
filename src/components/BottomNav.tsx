import React from 'react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: { id: string; label: string; icon: React.ReactNode }[];
}

export default function BottomNav({ activeTab, setActiveTab, tabs }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 px-2 pb-safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
              activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === tab.id ? 'bg-blue-50' : ''}`}>
              {React.cloneElement(tab.icon as React.ReactElement, {
                className: `w-5 h-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'}`,
              })}
            </div>
            <span className="text-[10px] font-medium leading-none">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
