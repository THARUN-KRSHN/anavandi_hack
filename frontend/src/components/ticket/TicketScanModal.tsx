import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Ticket,
  FileText,
  Bus,
  Clock,
  MapPin,
  X,
  CreditCard,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { scanTicketApi, type ScannedTicketData } from '../../services/api';

import { useLanguage } from '../../context/LanguageContext';

interface TicketScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: ScannedTicketData) => void;
}

const DEMO_PRESETS = [
  {
    title: 'Fast Passenger: Aluva ➔ Trivandrum',
    tag: 'Thermal Ticket',
    bus: 'KL-15-A-4021',
    from: 'Aluva',
    to: 'Thiruvananthapuram',
    time: '14:30',
    fare: 240,
    text: `KSRTC FAST PASSENGER
TICKET NO: T-89412
FROM: ALUVA TO: THIRUVANANTHAPURAM
BUS NO: KL-15-A-4021
DEP: 14:30
FARE: Rs. 240.00
HAPPY JOURNEY`,
  },
  {
    title: 'Super Fast: Ernakulam ➔ Kozhikode',
    tag: 'Online Booking SMS',
    bus: 'KL-07-CD-3312',
    from: 'Ernakulam',
    to: 'Kozhikode',
    time: '08:15 AM',
    fare: 310,
    text: `KSRTC Booking Confirmed. PNR: KR902184. Bus No: KL-07-CD-3312 (SUPER FAST). From: ERNAKULAM to KOZHIKODE. Dep: 08:15 AM. Fare: Rs. 310. Safe Journey!`,
  },
  {
    title: 'Ordinary: Kottayam ➔ Aluva',
    tag: 'Town Shuttle',
    bus: 'KL-15-9821',
    from: 'Kottayam',
    to: 'Aluva',
    time: '16:45',
    fare: 65,
    text: `KSRTC ORDINARY SHUTTLE
TKT: 44102
KOTTAYAM -> ALUVA
BUS: KL-15-9821
TIME: 16:45
FARE: Rs. 65.00`,
  },
  {
    title: 'Swift Minnal: Palakkad ➔ Trivandrum',
    tag: 'Express Minnal',
    bus: 'KL-01-BK-5522',
    from: 'Palakkad',
    to: 'Thiruvananthapuram',
    time: '21:00',
    fare: 480,
    text: `KSRTC SWIFT MINNAL
PNR: MNL-77491
FROM: PALAKKAD TO: THIRUVANANTHAPURAM
BUS: KL-01-BK-5522
DEP: 21:00
FARE: Rs. 480.00`,
  },
];

// Client-side fallback extractor for 100% offline resilience
function clientFallbackExtract(text: string): ScannedTicketData {
  const upper = text.toUpperCase();

  // Bus regex
  let busNumber: string | null = null;
  const busMatch = upper.match(/\b(KL[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{1,4})\b/);
  if (busMatch) {
    busNumber = busMatch[1].replace(/\s+/g, '-');
  }

  // Stations
  const KNOWN = [
    'ALUVA', 'ERNAKULAM', 'THIRUVANANTHAPURAM', 'TRIVANDRUM', 'KOZHIKODE',
    'THRISSUR', 'KOTTAYAM', 'PALAKKAD', 'KANNUR', 'KOLLAM', 'MALAPPURAM',
    'KASARAGOD', 'PATHANAMTHITTA', 'CHERTHALA', 'VYTTILA', 'ANKAMALI',
    'ANGAMALY', 'CHALAKUDY', 'PERUMBAVOOR', 'NEDUMBASSERY', 'GURUVAYUR',
    'SULTHAN BATHERY', 'MUNNAR', 'KOTHAMANGALAM', 'MUVATTUPUZHA', 'PALA',
    'CHANGANASSERY', 'KAYAMKULAM', 'ADOOR', 'ATTINGAL', 'ALAPPUZHA'
  ];

  let routeFrom: string | null = null;
  let routeTo: string | null = null;

  const fromToMatch = upper.match(/(?:FROM|START)[:\s]+([A-Z\s]+?)(?:TO|DEST|->|➔)[:\s]+([A-Z\s]+?)(?:\s+(?:BUS|FARE|TIME|DEP|\n|$))/);
  if (fromToMatch) {
    for (const k of KNOWN) {
      if (fromToMatch[1].includes(k) && !routeFrom) routeFrom = k.charAt(0) + k.slice(1).toLowerCase();
      if (fromToMatch[2].includes(k) && !routeTo) routeTo = k.charAt(0) + k.slice(1).toLowerCase();
    }
  }

  if (!routeFrom || !routeTo) {
    const found: string[] = [];
    for (const k of KNOWN) {
      if (upper.includes(k)) {
        found.push(k.charAt(0) + k.slice(1).toLowerCase());
      }
    }
    if (found.length >= 2) {
      routeFrom = found[0];
      routeTo = found[1];
    } else if (found.length === 1) {
      routeFrom = found[0];
    }
  }

  if (routeFrom === 'Trivandrum') routeFrom = 'Thiruvananthapuram';
  if (routeTo === 'Trivandrum') routeTo = 'Thiruvananthapuram';

  // Time
  const timeMatch = text.match(/\b([01]?[0-9]|2[0-3]):([0-5][0-9])(?:\s*(?:AM|PM|am|pm))?\b/);
  const incidentTime = timeMatch ? timeMatch[0] : null;

  // Ticket No
  const tktMatch = upper.match(/(?:TKT|TICKET|PNR|NO)[.:\s#]*([A-Z0-9\-_]{4,15})\b/);
  const ticketNumber = tktMatch ? tktMatch[1] : null;

  // Fare
  const fareMatch = upper.match(/(?:RS\.?|INR|₹|FARE)[:\s]*([0-9]+(?:\.[0-9]{1,2})?)/);
  const fare = fareMatch ? parseFloat(fareMatch[1]) : null;

  return {
    bus_number: busNumber,
    route_from: routeFrom,
    route_to: routeTo,
    incident_time: incidentTime,
    ticket_number: ticketNumber,
    fare,
    confidence: busNumber && routeFrom && routeTo ? 0.95 : 0.75,
    raw_matched_text: text,
    provider: 'CLIENT_FALLBACK',
  };
}

export const TicketScanModal: React.FC<TicketScanModalProps> = ({ isOpen, onClose, onApply }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'sms' | 'demo'>('demo');
  const [pastedText, setPastedText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [scannedResult, setScannedResult] = useState<ScannedTicketData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setSelectedImage(null);
    setPastedText('');
    setScannedResult(null);
    setErrorMsg(null);
    setIsProcessing(false);
    setProgressStatus('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Run full extraction pipeline
  const processTicketText = async (text: string, image?: string, mimeType?: string) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setProgressStatus(t('ticket.ocr_processing') || 'Analyzing journey data with Gemini AI...');

    try {
      // 1. Send to Backend Gemini AI + Fallback endpoint
      const result = await scanTicketApi(text, image, mimeType);
      setScannedResult(result);
    } catch (err) {
      console.warn('Backend ticket scan error, executing client fallback:', err);
      const fallback = clientFallbackExtract(text);
      setScannedResult(fallback);
    } finally {
      setIsProcessing(false);
      setProgressStatus('');
    }
  };

  // Image Processing with Gemini Multimodal Vision + OCR Fallback
  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setScannedResult(null);
    setIsProcessing(true);
    setProgressStatus('Reading ticket image...');

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setSelectedImage(dataUrl);
      const mimeType = file.type || 'image/jpeg';

      // First attempt: Direct Google Gemini Multimodal Vision
      try {
        setProgressStatus('Processing ticket with Google Gemini Vision AI...');
        const visionResult = await scanTicketApi('', dataUrl, mimeType);
        if (
          visionResult &&
          (visionResult.bus_number || visionResult.route_from || visionResult.route_to) &&
          (visionResult.confidence || 0) >= 0.7
        ) {
          setScannedResult(visionResult);
          setIsProcessing(false);
          setProgressStatus('');
          return;
        }
      } catch (visionErr) {
        console.warn('Direct vision failed, falling back to OCR + Text AI:', visionErr);
      }

      // Second attempt: Tesseract Wasm OCR + Gemini Text Analysis
      try {
        setProgressStatus('Extracting text with OCR...');
        const ocrResult = await Tesseract.recognize(dataUrl, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text' && m.progress) {
              setProgressStatus(`Recognizing ticket text (${Math.round(m.progress * 100)}%)...`);
            }
          },
        });

        const rawText = ocrResult?.data?.text || '';
        if (!rawText.trim()) {
          setErrorMsg('No readable text detected on image. Try pasting SMS or choosing a demo preset.');
          setIsProcessing(false);
          return;
        }

        await processTicketText(rawText, dataUrl, mimeType);
      } catch (ocrErr) {
        console.error('OCR failure:', ocrErr);
        setErrorMsg('Could not process image OCR. Please paste ticket SMS text or select a demo preset.');
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };


  const handleApply = () => {
    if (scannedResult) {
      onApply(scannedResult);
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-[#EAECF0] shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-red-600 to-[#D92D20] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {t('ticket.modal_title') || 'Scan KSRTC Bus Ticket'}
              </h2>
              <p className="text-xs text-red-100 font-medium">
                Auto-recognize bus plate, route origin & destination
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-full transition-all text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#EAECF0] bg-[#F9FAFB] p-2 gap-2 text-xs font-bold text-[#667085]">
          <button
            type="button"
            onClick={() => { setActiveTab('demo'); setScannedResult(null); }}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'demo'
                ? 'bg-white text-[#D92D20] shadow-sm font-black border border-[#EAECF0]'
                : 'hover:bg-gray-200/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#D92D20]" />
            <span>{t('ticket.tab_demo') || 'Demo Presets'}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('upload'); setScannedResult(null); }}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-[#D92D20] shadow-sm font-black border border-[#EAECF0]'
                : 'hover:bg-gray-200/60'
            }`}
          >
            <Camera className="w-4 h-4 text-[#D92D20]" />
            <span>{t('ticket.tab_upload') || 'Photo / Camera'}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('sms'); setScannedResult(null); }}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'sms'
                ? 'bg-white text-[#D92D20] shadow-sm font-black border border-[#EAECF0]'
                : 'hover:bg-gray-200/60'
            }`}
          >
            <FileText className="w-4 h-4 text-[#D92D20]" />
            <span>{t('ticket.tab_sms') || 'SMS / Text'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* TAB 1: DEMO PRESETS */}
          {activeTab === 'demo' && !scannedResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#667085] uppercase tracking-wider">
                <span>1-Click Test KSRTC Tickets:</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  Instant Simulation
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {DEMO_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => processTicketText(p.text)}
                    disabled={isProcessing}
                    className="p-3.5 rounded-2xl border border-[#EAECF0] hover:border-[#D92D20] bg-white hover:bg-red-50/30 text-left transition-all flex items-center justify-between group shadow-sm disabled:opacity-50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-[#D92D20] bg-red-50 px-2 py-0.5 rounded-md">
                          {p.bus}
                        </span>
                        <span className="text-[10px] font-bold text-[#667085] bg-gray-100 px-2 py-0.5 rounded-md">
                          {p.tag}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-[#171717] group-hover:text-[#D92D20]">
                        {p.from} <span className="text-[#667085]">➔</span> {p.to}
                      </div>
                      <div className="text-[11px] text-[#667085] flex items-center gap-3">
                        <span>🕒 {p.time}</span>
                        <span>💳 ₹{p.fare}</span>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-[#D92D20] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Scan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD / CAMERA */}
          {activeTab === 'upload' && !scannedResult && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageFile}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer flex flex-col items-center justify-center p-8 bg-[#F9FAFB] rounded-3xl border-2 border-dashed border-[#D0D5DD] hover:border-[#D92D20] hover:bg-red-50/20 transition-all text-center group"
              >
                {selectedImage ? (
                  <div className="relative w-48 h-32 rounded-xl overflow-hidden border border-[#EAECF0] mb-3 shadow-md">
                    <img src={selectedImage} alt="Ticket preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-[#EAECF0] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Camera className="w-7 h-7 text-[#D92D20]" />
                  </div>
                )}

                <h3 className="text-sm font-bold text-[#171717]">
                  {t('ticket.upload_prompt') || 'Click to snap photo or upload bus ticket'}
                </h3>
                <p className="text-xs text-[#667085] mt-1 max-w-xs">
                  Supports printed thermal KSRTC tickets, mobile screen photos, and conductor receipts.
                </p>
                <div className="mt-4 px-4 py-2 bg-white rounded-xl border border-[#EAECF0] text-xs font-bold text-[#171717] group-hover:border-[#D92D20] shadow-sm flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-[#D92D20]" />
                  <span>Browse Device / Open Camera</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SMS / TEXT */}
          {activeTab === 'sms' && !scannedResult && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#171717] block">
                Paste KSRTC Booking SMS or Ticket Text:
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={5}
                placeholder={t('ticket.paste_placeholder') || 'Paste your KSRTC SMS ticket or e-booking text here...'}
                className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl p-4 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#D92D20] font-sans"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => processTicketText(pastedText)}
                  disabled={!pastedText.trim() || isProcessing}
                  className="px-6 py-2.5 bg-[#D92D20] hover:bg-red-700 text-white font-bold text-xs rounded-full shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('ticket.extract_btn') || 'Extract Journey Details'}</span>
                </button>
              </div>
            </div>
          )}

          {/* PROCESSING STATE */}
          {isProcessing && (
            <div className="p-6 bg-red-50/60 rounded-3xl border border-red-100 flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
              <RefreshCw className="w-8 h-8 text-[#D92D20] animate-spin" />
              <div>
                <p className="text-xs font-black text-[#D92D20]">{progressStatus}</p>
                <p className="text-[11px] text-[#667085] mt-1">
                  Using Wasm OCR + KSRTC Transport Knowledge Base
                </p>
              </div>
            </div>
          )}

          {/* ERROR NOTICE */}
          {errorMsg && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Notice</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* EXTRACTED RESULT CARD */}
          {scannedResult && !isProcessing && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-sm text-[#171717]">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{t('ticket.extracted_title') || 'Recognized Journey Parameters'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{Math.round((scannedResult.confidence || 0.9) * 100)}% Verified</span>
                  </span>
                  <span className="text-[10px] font-bold bg-gray-100 text-[#667085] px-2 py-1 rounded-full uppercase">
                    {scannedResult.provider || 'AI Matched'}
                  </span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="bg-[#F9FAFB] rounded-2xl border border-[#EAECF0] p-4 grid grid-cols-2 gap-3 text-xs">
                
                {/* Route From */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#D92D20]" />
                    {t('ticket.from_depot') || 'Boarding (From)'}
                  </span>
                  <input
                    value={scannedResult.route_from || ''}
                    onChange={(e) => setScannedResult({ ...scannedResult, route_from: e.target.value })}
                    className="w-full font-bold text-[#171717] bg-white border border-[#EAECF0] rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-[#D92D20]"
                    placeholder="e.g. Aluva"
                  />
                </div>

                {/* Route To */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    {t('ticket.to_depot') || 'Alighting (To)'}
                  </span>
                  <input
                    value={scannedResult.route_to || ''}
                    onChange={(e) => setScannedResult({ ...scannedResult, route_to: e.target.value })}
                    className="w-full font-bold text-[#171717] bg-white border border-[#EAECF0] rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-[#D92D20]"
                    placeholder="e.g. Thiruvananthapuram"
                  />
                </div>

                {/* Bus Number */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block flex items-center gap-1">
                    <Bus className="w-3 h-3 text-[#D92D20]" />
                    {t('ticket.bus_number') || 'Bus Registration'}
                  </span>
                  <input
                    value={scannedResult.bus_number || ''}
                    onChange={(e) => setScannedResult({ ...scannedResult, bus_number: e.target.value })}
                    className="w-full font-mono font-black text-[#D92D20] bg-white border border-[#EAECF0] rounded-xl px-3 py-1.5 uppercase focus:ring-1 focus:ring-[#D92D20]"
                    placeholder="e.g. KL-15-A-4021"
                  />
                </div>

                {/* Time */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-600" />
                    {t('ticket.departure_time') || 'Departure Time'}
                  </span>
                  <input
                    value={scannedResult.incident_time || ''}
                    onChange={(e) => setScannedResult({ ...scannedResult, incident_time: e.target.value })}
                    className="w-full font-bold text-[#171717] bg-white border border-[#EAECF0] rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-[#D92D20]"
                    placeholder="e.g. 14:30"
                  />
                </div>

                {/* Optional Ticket & Fare Row */}
                {(scannedResult.ticket_number || scannedResult.fare !== null) && (
                  <div className="col-span-2 pt-2 border-t border-[#EAECF0] flex items-center justify-between text-[11px] text-[#667085]">
                    {scannedResult.ticket_number && (
                      <span className="flex items-center gap-1 font-mono">
                        <Ticket className="w-3 h-3 text-gray-400" />
                        <span>Ticket #: <strong>{scannedResult.ticket_number}</strong></span>
                      </span>
                    )}
                    {scannedResult.fare !== null && scannedResult.fare !== undefined && (
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-emerald-600" />
                        <span>Fare: <strong className="text-emerald-700">₹{scannedResult.fare}</strong></span>
                      </span>
                    )}
                    {scannedResult.service_type && (
                      <span className="bg-red-50 text-[#D92D20] px-2 py-0.5 rounded font-bold text-[10px]">
                        {scannedResult.service_type}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScannedResult(null)}
                  className="px-4 py-2.5 rounded-full border border-[#EAECF0] hover:bg-gray-100 text-xs font-bold text-[#667085] transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t('ticket.rescan') || 'Rescan'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 py-3 px-6 bg-[#D92D20] hover:bg-red-700 text-white font-black text-xs rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                >
                  <CheckCircle2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                  <span>{t('ticket.apply_btn') || 'Apply to Grievance Form'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#F9FAFB] border-t border-[#EAECF0] flex items-center justify-between text-[11px] text-[#667085]">
          <span>Protected by BUS സഹായി OCR & AI Verification</span>
          <button
            type="button"
            onClick={handleClose}
            className="font-bold hover:text-[#171717] underline text-xs"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
