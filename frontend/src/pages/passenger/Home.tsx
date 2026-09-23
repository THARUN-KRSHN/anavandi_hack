import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PassengerDashboard } from './PassengerDashboard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ThreeScene } from '../../components/three/ThreeScene';
import { FileText, Search, ShieldCheck, Bus, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Role-based landing redirects for logged-in staff/passengers
  if (user?.role === 'user') {
    return <PassengerDashboard />;
  }
  if (user?.role === 'depot_head') {
    return <Navigate to="/depot" replace />;
  }
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-red-50/40 via-white to-white py-12 px-4 sm:px-6 lg:px-8 rounded-3xl border border-[#EAECF0] overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100/60 text-[#D92D20] text-xs font-semibold border border-red-200">
              <ShieldCheck className="w-4 h-4 text-[#D92D20]" />
              <span>{t('appTagline', 'Public Transport Grievance Redressal')}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#171717] tracking-tight leading-tight">
              Report bus issues in <span className="text-[#D92D20]">under 60 seconds</span>. Hold depots accountable.
            </h1>

            <p className="text-base text-[#475467] leading-relaxed max-w-xl">
              {t('appName', 'BUS സഹായി')} connects passenger complaints directly to vehicle duty rosters and authorized depot managers. Trace your issue from ticket to resolution.
            </p>

            {/* Privacy Callout */}
            <div className="flex items-center gap-2 text-xs text-[#667085] bg-white p-3 rounded-2xl border border-[#EAECF0] shadow-xs max-w-md">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Privacy Guaranteed:</strong> No personal name or exact location required to submit.
              </span>
            </div>

            {/* Dominant & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link to="/report" className="flex-1 sm:flex-none">
                <Button
                  variant="primary"
                  size="lg"
                  icon={<FileText className="w-5 h-5" />}
                  className="w-full sm:w-auto shadow-lg shadow-red-200 text-base"
                >
                  {t('reportComplaint', 'Report an Issue')}
                </Button>
              </Link>

              <Link to="/track" className="flex-1 sm:flex-none">
                <Button
                  variant="outline"
                  size="lg"
                  icon={<Search className="w-5 h-5" />}
                  className="w-full sm:w-auto"
                >
                  {t('trackComplaint', 'Track Complaint')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right 3D Low-Poly Bus Canvas Hero */}
          <div className="lg:col-span-5 h-[320px] sm:h-[380px] relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-50 to-red-50/30 border border-[#EAECF0]">
            <ThreeScene type="bus_hero" />
            <div className="absolute bottom-3 right-3 text-[10px] text-[#667085] bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-[#EAECF0]">
              Interactive 3D Layer (WebGL Ready)
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl font-extrabold text-[#171717] tracking-tight">
            How {t('appName', 'BUS സഹായി')} Works
          </h2>
          <p className="text-sm text-[#667085] mt-1">
            Transparent, traceable, and depot-driven public transport governance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex flex-col items-start gap-3 p-6">
            <div className="p-3 rounded-2xl bg-red-50 text-[#D92D20] font-bold">
              <Bus className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-[#171717]">1. Identify Vehicle</h3>
            <p className="text-sm text-[#667085]">
              Scan bus QR code, enter registration number (e.g. KL-15-A-4021), or pick route fallback.
            </p>
          </Card>

          <Card className="flex flex-col items-start gap-3 p-6">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-[#171717]">2. Automatic Roster Trace</h3>
            <p className="text-sm text-[#667085]">
              System matches bus + timestamp to active duty roster and authorized conductor PEN records.
            </p>
          </Card>

          <Card className="flex flex-col items-start gap-3 p-6">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-[#171717]">3. Depot Accountability</h3>
            <p className="text-sm text-[#667085]">
              Depot officers investigate, acknowledge, and resolve cases with public progress tracking.
            </p>
          </Card>
        </div>
      </section>

      {/* Quick Track Box */}
      <section className="max-w-4xl mx-auto px-4">
        <Card className="bg-[#F9FAFB] p-6 border-[#EAECF0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-base text-[#171717]">Already filed a grievance?</h4>
            <p className="text-xs text-[#667085]">
              Enter your reference number (e.g. GRV-10482) to view live status updates.
            </p>
          </div>
          <Link to="/track">
            <Button variant="secondary" icon={<ArrowRight className="w-4 h-4" />}>
              Track My Case
            </Button>
          </Link>
        </Card>
      </section>
    </div>
  );
};
