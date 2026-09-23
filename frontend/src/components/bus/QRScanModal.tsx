import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { QrCode, Camera, CheckCircle } from 'lucide-react';
import { fetchBuses } from '../../services/busesService';
import type { Bus } from '../../types/bus';

interface QRScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBus: (busNumber: string) => void;
}

export const QRScanModal: React.FC<QRScanModalProps> = ({ isOpen, onClose, onSelectBus }) => {
  const [scanning, setScanning] = useState(false);
  const [buses, setBuses] = useState<Bus[]>([]);
  useEffect(() => { if (isOpen) fetchBuses().then(setBuses).catch(() => undefined); }, [isOpen]);

  const handleSimulateScan = (busNum: string) => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      onSelectBus(busNum);
      onClose();
    }, 800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scan Bus QR Code"
      description="Point your device camera at the QR sticker near the entrance or conductor seat."
    >
      <div className="flex flex-col items-center justify-center p-6 bg-[#F9FAFB] rounded-2xl border border-dashed border-[#D0D5DD] mb-5">
        <div className="relative w-48 h-48 bg-gray-900 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/20 to-transparent animate-pulse" />
          <div className="w-36 h-36 border-2 border-dashed border-red-500 rounded-xl flex items-center justify-center">
            {scanning ? (
              <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" />
            ) : (
              <Camera className="w-10 h-10 text-gray-400" />
            )}
          </div>
        </div>
        <p className="text-xs text-[#667085] mt-3 text-center">
          Position QR code inside the frame to auto-detect vehicle ID.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-[#667085] uppercase tracking-wider">
          <span>Select a bus from the live fleet dataset:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {buses.slice(0, 4).map((bus) => (
            <button
              key={bus.busNumber}
              onClick={() => handleSimulateScan(bus.busNumber)}
              className="flex items-center justify-between p-3 rounded-xl border border-[#EAECF0] bg-white hover:border-[#D92D20] hover:bg-red-50/30 transition-all text-left group"
            >
              <div>
                <span className="font-mono text-xs font-bold text-[#171717] block group-hover:text-[#D92D20]">
                  {bus.busNumber}
                </span>
                <span className="text-xs text-[#667085]">{bus.type}</span>
              </div>
              <QrCode className="w-5 h-5 text-[#667085] group-hover:text-[#D92D20]" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};
