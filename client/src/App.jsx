import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ChangeRequestsPage from './pages/ChangeRequestsPage';
import ImpactDetailsPage from './pages/ImpactDetailsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import CreateChangeRequestModal from './components/CreateChangeRequestModal';

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCRId, setSelectedCRId] = useState(null);

  // Create CR Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [presetProductId, setPresetProductId] = useState('');
  const [presetPartId, setPresetPartId] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading PLM Session...</p>
        </div>
      </div>
    );
  }

  // 1. Mandatory Protection: Redirect unauthenticated users immediately to AuthPage (Login/Signup)
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Handler to open Create CR modal with specific product/part preset
  const handleOpenCreateCRWithPart = (productId, partId) => {
    setPresetProductId(productId || '');
    setPresetPartId(partId || '');
    setIsCreateModalOpen(true);
  };

  // Handler when CR is created successfully
  const handleCRCreated = (crId) => {
    setSelectedCRId(crId);
    setActiveTab('cr-details');
  };

  const handleSelectCR = (crId) => {
    setSelectedCRId(crId);
    setActiveTab('cr-details');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      
      {/* Navigation Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'cr-details') setSelectedCRId(null);
        }}
        onOpenCreateCR={() => handleOpenCreateCRWithPart('', '')}
      />

      {/* Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'dashboard' && (
          <DashboardPage 
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenCreateCR={() => handleOpenCreateCRWithPart('', '')}
            onSelectCR={handleSelectCR}
          />
        )}

        {activeTab === 'products' && (
          <ProductsPage 
            onOpenCreateCRWithPart={handleOpenCreateCRWithPart}
          />
        )}

        {activeTab === 'change-requests' && (
          <ChangeRequestsPage 
            onSelectCR={handleSelectCR}
            onOpenCreateCR={() => handleOpenCreateCRWithPart('', '')}
          />
        )}

        {activeTab === 'cr-details' && selectedCRId && (
          <ImpactDetailsPage 
            changeRequestId={selectedCRId}
            onBack={() => setActiveTab('change-requests')}
          />
        )}

        {activeTab === 'audit-logs' && (
          <AuditLogsPage />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500 bg-[#060912]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>Design Change Impact Predictor — Product Lifecycle Management (PLM)</div>
          <div className="font-mono text-[11px] text-slate-600">Enterprise AI Engine • Graph Traversal • Active</div>
        </div>
      </footer>

      {/* Global Create Change Request Modal */}
      <CreateChangeRequestModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCRCreated}
        initialProductId={presetProductId}
        initialPartId={presetPartId}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
