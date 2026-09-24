import React, { useState, useEffect } from 'react';
import { fetchSmsOutbox, type SmsOutboxLog } from '../../services/smsService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { MessageSquare, Send, ExternalLink, Smartphone } from 'lucide-react';

export const SmsOutboxLogPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const depotId = user?.depotId || 'DEP-EKM';

  const [logs, setLogs] = useState<SmsOutboxLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const list = await fetchSmsOutbox(depotId);
      setLogs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();

    const handleSync = () => {
      loadLogs();
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('anavandi_realtime_sync', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('anavandi_realtime_sync', handleSync);
    };
  }, [depotId]);

  return (
    <div className="space-y-6 pb-16">
      <div className="pb-4 border-b border-[#EAECF0]">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#667085] block">
          {t('outbox.audit_tag')}
        </span>
        <h1 className="text-2xl font-black text-[#171717] tracking-tight">
          {t('outbox.title')}
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">
          {t('outbox.subtitle')}
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-[#667085]">
          {t('outbox.loading')}
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center text-[#667085] bg-white rounded-[24px] border border-[#EAECF0]">
          <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-[#171717]">{t('outbox.no_dispatched')}</p>
          <p className="text-xs text-[#667085] mt-1">
            {t('outbox.no_dispatched_sub')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-white rounded-[24px] border border-[#EAECF0] shadow-xs overflow-hidden flex flex-col"
            >
              {/* Header bar */}
              <div className="p-4 bg-gray-50 border-b border-[#EAECF0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#D92D20]" />
                  <span className="text-xs font-black text-[#171717]">{log.complaintRef}</span>
                </div>
                <span className="text-[10px] text-[#667085] font-semibold">
                  {new Date(log.sentAt).toLocaleString()}
                </span>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 flex-1">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-[#667085] uppercase block">{t('outbox.recipient_conductor')}</span>
                    <span className="font-bold text-[#171717]">{log.conductorName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#667085] uppercase block">{t('outbox.bus_plate')}</span>
                    <span className="font-bold text-[#171717]">{log.busNumber}</span>
                  </div>
                </div>

                {/* Dispatch Status */}
                {log.deliveryStatus && (
                  <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] font-bold text-blue-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    {log.deliveryStatus}
                  </div>
                )}

                {/* Simulated Message Bubble */}
                <div className="bg-gray-100 p-4 rounded-2xl border border-gray-200 space-y-2 relative">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#667085] uppercase">
                    <Smartphone className="w-3.5 h-3.5 text-[#D92D20]" /> {t('outbox.dispatched_content')}
                  </div>
                  <p className="text-xs font-mono text-[#171717] leading-relaxed break-all">
                    {log.messageContent}
                  </p>
                </div>

                {/* Direct conductor link button */}
                <a
                  href={log.updateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 bg-red-50 text-[#D92D20] rounded-xl text-xs font-bold hover:bg-red-100 flex items-center justify-center gap-1.5 transition-all"
                >
                  {t('outbox.open_mobile_link')} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
