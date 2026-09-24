import React, { useState } from 'react';
import { runDemoAiSimulation } from '../../services/api';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  AlertTriangle,
  X,
  Copy,
  Terminal,
  Activity,
  Cpu,
  RefreshCw,
} from 'lucide-react';

export const AILabDemoConsole: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'intelligence' | 'security' | 'resilience'>('intelligence');
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [simulationOutput, setSimulationOutput] = useState<any | null>(null);

  const handleRunSimulation = async (scenario: string) => {
    setLoadingScenario(scenario);
    setSimulationOutput(null);
    try {
      const data = await runDemoAiSimulation(scenario);
      setSimulationOutput(data);
    } catch (err: any) {
      setSimulationOutput({ error: err.message || 'Simulation execution error' });
    } finally {
      setLoadingScenario(null);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white font-extrabold text-xs rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-2 border border-white/30 backdrop-blur-md"
        title="Open BUS സഹായി AI & Security Lab"
      >
        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
        <span>BUS സഹായി AI LAB</span>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/20 uppercase tracking-widest">
          DEMO
        </span>
      </button>

      {/* Lab Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#111827] text-white max-w-4xl w-full rounded-[32px] p-6 shadow-2xl border border-gray-800 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight text-white">BUS സഹായി AI LAB & Security Simulator</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      OpenRouter + Rule Fallback Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Interactive Hackathon Edge-Case & Architecture Resilience Demonstrator
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-gray-900/90 rounded-2xl border border-gray-800 text-xs font-bold">
              <button
                onClick={() => setActiveTab('intelligence')}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'intelligence'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" /> 1. Complaint Intelligence
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'security'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> 2. Security & Auth
              </button>
              <button
                onClick={() => setActiveTab('resilience')}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'resilience'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Zap className="w-4 h-4" /> 3. AI Failure & Resilience
              </button>
            </div>

            {/* Tab 1: Complaint Intelligence */}
            {activeTab === 'intelligence' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-400 font-medium">
                  Demonstrates LLM-assisted grievance classification, duplicate signaling, and anomaly flags.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleRunSimulation('duplicate_complaint')}
                    disabled={!!loadingScenario}
                    className="p-4 bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-2xl text-left space-y-1.5 transition-all group hover:bg-gray-800/80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300">
                        Simulate Duplicate Complaint
                      </span>
                      <Copy className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-[11px] text-gray-400">
                      AI compares 2 complaints (same bus/route/time) and alerts Depot Head with similarity score.
                    </p>
                  </button>

                  <button
                    onClick={() => handleRunSimulation('category_mismatch')}
                    disabled={!!loadingScenario}
                    className="p-4 bg-gray-900 border border-gray-800 hover:border-purple-500/50 rounded-2xl text-left space-y-1.5 transition-all group hover:bg-gray-800/80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-400 group-hover:text-purple-300">
                        Simulate Category Mismatch
                      </span>
                      <AlertTriangle className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-[11px] text-gray-400">
                      User picks 'Cleanliness' but text describes 'Overcrowding'. AI flags advisory warning.
                    </p>
                  </button>

                  <button
                    onClick={() => handleRunSimulation('suspicious_activity')}
                    disabled={!!loadingScenario}
                    className="p-4 bg-gray-900 border border-gray-800 hover:border-amber-500/50 rounded-2xl text-left space-y-1.5 transition-all group hover:bg-gray-800/80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300">
                        Simulate Submission Spike
                      </span>
                      <Activity className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-[11px] text-gray-400">
                      30 rapid complaints submitted within 10 mins. AI flags pattern for Admin review.
                    </p>
                  </button>

                  <button
                    onClick={() => handleRunSimulation('trend_detection')}
                    disabled={!!loadingScenario}
                    className="p-4 bg-gray-900 border border-gray-800 hover:border-emerald-500/50 rounded-2xl text-left space-y-1.5 transition-all group hover:bg-gray-800/80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                        Generate Executive Trend
                      </span>
                      <Sparkles className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-[11px] text-gray-400">
                      State HQ multi-depot trend advisory ("Emerging overcrowding trend on Aluva route group").
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Security & Auth */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-400 font-medium">
                  Proves core authorization (JWT, Supabase, Token Expiry) is 100% deterministic and NOT controlled by AI.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleRunSimulation('failed_logins')}
                    disabled={!!loadingScenario}
                    className="p-4 bg-gray-900 border border-gray-800 hover:border-red-500/50 rounded-2xl text-left space-y-1.5 transition-all group hover:bg-gray-800/80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-400 group-hover:text-red-300">
                        Multiple Failed Logins
                      </span>
                      <ShieldCheck className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-[11px] text-gray-400">
                      12 failed password attempts. Account locked by deterministic rate limiter, AI provides audit insight.
                    </p>
                  </button>

                  <button
                    onClick={() => handleRunSimulation('expired_token')}
                    disabled={!!loadingScenario}
                    className="p-4 bg-gray-900 border border-gray-800 hover:border-orange-500/50 rounded-2xl text-left space-y-1.5 transition-all group hover:bg-gray-800/80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-400 group-hover:text-orange-300">
                        Expired Conductor Link
                      </span>
                      <Zap className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Conductor link after 24h/used. Single-use backend token rejects invalid access (HTTP 400).
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: AI Resilience & Fallback */}
            {activeTab === 'resilience' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-400 font-medium">
                  Demonstrates architecture resilience: Even when OpenRouter API times out or fails, the core system continues with 100% success.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleRunSimulation('openrouter_failure')}
                    disabled={!!loadingScenario}
                    className="p-4 bg-gray-900 border border-amber-500/40 hover:border-amber-400 rounded-2xl text-left space-y-1.5 transition-all group hover:bg-gray-800/80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300">
                        Simulate OpenRouter Timeout / Failure
                      </span>
                      <Zap className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-[11px] text-gray-300">
                      Simulates OpenRouter outage. Proves complaint submission, depot routing & reference generation succeed 100%.
                    </p>
                  </button>

                  <button
                    onClick={() => handleRunSimulation('malformed_ai_response')}
                    disabled={!!loadingScenario}
                    className="p-4 bg-gray-900 border border-blue-500/40 hover:border-blue-400 rounded-2xl text-left space-y-1.5 transition-all group hover:bg-gray-800/80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300">
                        Simulate Malformed Model Output
                      </span>
                      <Terminal className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-[11px] text-gray-300">
                      LLM returns invalid JSON. System catches schema failure & switches to Level 2 Rule Fallback automatically.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Simulation Loading */}
            {loadingScenario && (
              <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800 flex items-center justify-center gap-3 text-xs text-blue-400 font-bold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running simulation scenario: {loadingScenario}...</span>
              </div>
            )}

            {/* Simulation Output Output Box */}
            {simulationOutput && (
              <div className="space-y-2 pt-2 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 flex items-center gap-2 font-mono">
                    <Terminal className="w-4 h-4 text-green-400" /> Simulation Execution Output:
                  </span>
                  <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                    STATUS 200 OK
                  </span>
                </div>

                <div className="bg-black/90 p-4 rounded-2xl border border-gray-800 font-mono text-xs text-green-400 overflow-x-auto max-h-60 leading-relaxed">
                  <pre>{JSON.stringify(simulationOutput, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
