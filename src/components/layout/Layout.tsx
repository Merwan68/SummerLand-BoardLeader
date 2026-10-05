import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { FirstTimeSetupModal } from '../setup/FirstTimeSetupModal';
import { useSchool } from '../../context/SchoolContext';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentTab,
  onSelectTab
}) => {
  const { hasCompletedSetup } = useSchool();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  // Trigger setup modal if never completed
  React.useEffect(() => {
    if (!hasCompletedSetup) {
      setSetupModalOpen(true);
    }
  }, [hasCompletedSetup]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-row text-slate-900">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        onOpenSetup={() => setSetupModalOpen(true)}
      />

      {/* Mobile Drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        onOpenSetup={() => setSetupModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenSetup={() => setSetupModalOpen(true)}
          onNavigateToSettings={() => onSelectTab('settings_account')}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Setup Wizard Modal */}
      <FirstTimeSetupModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
      />
    </div>
  );
};
