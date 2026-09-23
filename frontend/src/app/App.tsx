import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RoleSwitcherBar } from '../components/layout/RoleSwitcherBar';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { Footer } from '../components/layout/Footer';
import { AppRouter } from './router';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from './AuthContext';

export const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isDepot = location.pathname.startsWith('/depot');
  const isAdmin = location.pathname.startsWith('/admin');
  const role: 'depot' | 'admin' | 'passenger' = isDepot ? 'depot' : isAdmin ? 'admin' : 'passenger';

  // Demo Modal State
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const demoStepsList = [
    { title: 'Step 1: Open Passenger Portal', desc: 'Landing home page with low-poly 3D bus hero & 60s CTA.' },
    { title: 'Step 2: Submit Passenger Grievance', desc: 'Create complaint for bus KL-15-A-4021 regarding Conductor Staff.' },
    { title: 'Step 3: Reference GRV-10482 Generated', desc: 'Displays reference number & assigned Trivandrum Central Depot.' },
    { title: 'Step 4: Switch to Depot Operations Role', desc: 'Open case queue and locate newly submitted grievance.' },
    { title: 'Step 5: Trace Roster Lineage', desc: 'Display complaint -> Bus -> Route -> Duty -> Conductor PEN.' },
    { title: 'Step 6: Acknowledge & Resolve Case', desc: 'Transition status to Investigating -> Resolved.' },
    { title: 'Step 7: Switch to System Admin Role', desc: 'View updated metrics, trends, and recurring issue alerts.' },
  ];

  const handleNextDemoStep = async () => {
    const next = demoStep + 1;
    setDemoStep(next);

    if (next === 1) {
      navigate('/');
    } else if (next === 2) {
      navigate('/report');
    } else if (next === 3) {
      navigate('/report');
    } else if (next === 4) {
      navigate('/depot/complaints');
    } else if (next === 5) {
      navigate('/depot/complaints/cmp-10482');
    } else if (next === 6) {
      navigate('/depot/complaints/cmp-10482');
    } else if (next === 7) {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#171717] flex flex-col font-sans selection:bg-[#D92D20] selection:text-white">
      {/* Top Demo Role Switcher */}
      <RoleSwitcherBar onStartDemoFlow={user ? () => { setDemoStep(1); navigate('/'); setDemoModalOpen(true); } : undefined} />

      {/* Main Navigation Bar */}
      <Navbar />

      {/* Body Content Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {(isDepot || isAdmin) && <Sidebar role={role as 'depot' | 'admin'} />}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <AppRouter />
        </main>
      </div>

      {/* Public Footer */}
      <Footer />

      {/* Guided Demo Modal */}
      <Modal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title="Guided End-to-End Demo Workflow"
        description="Follows the exact 14-step presentation sequence from Section 18 of the specification."
      >
        <div className="space-y-4 my-2">
          <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#EAECF0] space-y-1">
            <span className="text-xs font-bold text-[#D92D20] uppercase tracking-wider block">
              Current Step {demoStep} of 7
            </span>
            <h4 className="font-bold text-base text-[#171717]">
              {demoStepsList[demoStep - 1]?.title}
            </h4>
            <p className="text-xs text-[#667085]">
              {demoStepsList[demoStep - 1]?.desc}
            </p>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button variant="outline" size="sm" onClick={() => setDemoModalOpen(false)}>
              Close Demo
            </Button>
            {demoStep < 7 ? (
              <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />} onClick={handleNextDemoStep}>
                Proceed to Step {demoStep + 1}
              </Button>
            ) : (
              <Button variant="success" size="sm" icon={<CheckCircle2 className="w-4 h-4" />} onClick={() => setDemoModalOpen(false)}>
                Demo Complete!
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
