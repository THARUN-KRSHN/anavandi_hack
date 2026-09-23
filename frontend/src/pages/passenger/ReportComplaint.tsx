import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { BusSelector } from '../../components/bus/BusSelector';
import { createComplaint } from '../../services/complaintsService';
import type { ComplaintCategory } from '../../types/complaint';
import {
  FileText,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Upload,
  AlertCircle,
} from 'lucide-react';

export const ReportComplaint: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [category, setCategory] = useState<ComplaintCategory>('conductor_staff');
  const [busNumber, setBusNumber] = useState('KL-15-A-4021');
  const [busId, setBusId] = useState<number | undefined>();
  const [routeId, setRouteId] = useState<number | undefined>();
  const [routeFrom, setRouteFrom] = useState('Trivandrum Central');
  const [routeTo, setRouteTo] = useState('Kollam Junction');
  const [incidentTime, setIncidentTime] = useState('09:15 AM Today');
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<string[]>([]);
  const [error, setError] = useState('');

  const categoriesList: { id: ComplaintCategory; label: string; desc: string }[] = [
    { id: 'conductor_staff', label: 'Conductor / Staff Behaviour', desc: 'Rude behaviour, unissued change receipts, overcharging' },
    { id: 'cleanliness', label: 'Cleanliness & Hygiene', desc: 'Dusty seats, littered floor, clogged AC vents' },
    { id: 'driver', label: 'Driver & Overspeeding', desc: 'Reckless driving, skipping stops, signal violation' },
    { id: 'ticketing', label: 'UPI / Ticketing ETIM', desc: 'Failed UPI tickets, double debits, machine errors' },
    { id: 'overcrowding', label: 'Overcrowding & Safety', desc: 'Exceeding safe passenger count, door blocking' },
    { id: 'bus_condition', label: 'Bus Mechanical Condition', desc: 'Broken seats, window rattles, engine noise' },
    { id: 'safety', label: 'Women & Child Safety', desc: 'Harassment, improper seating allocation' },
    { id: 'route_timing', label: 'Route Delays & Skipping', desc: 'Bus cancelled, major departure delay' },
    { id: 'other', label: 'Other Grievance', desc: 'Any other issue requiring depot attention' },
  ];

  const handleSimulateUpload = () => {
    const sampleNames = ['ticket_receipt_photo.jpeg', 'bus_number_plate.png'];
    setEvidenceFiles([...evidenceFiles, sampleNames[evidenceFiles.length % 2]]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a short description of the incident.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const categoryObj = categoriesList.find((c) => c.id === category);
      const created = await createComplaint({
        category,
        categoryLabel: categoryObj?.label || 'General Grievance',
        description,
        busId,
        routeId,
        incidentTime,
        evidenceFiles,
      });

      // Navigate to success page with complaint object state
      navigate('/report/success', { state: { complaint: created } });
    } catch (err) {
      console.error(err);
      setError('Failed to submit grievance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Back Button */}
      <button
        onClick={() => (step > 1 ? setStep((step - 1) as 1 | 2 | 3 | 4) : navigate('/'))}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#667085] hover:text-[#171717] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{step > 1 ? `Back to Step ${step - 1}` : 'Cancel & Return Home'}</span>
      </button>

      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-bold text-[#667085] uppercase tracking-wider mb-2">
          <span>Complaint Wizard</span>
          <span>Step {step} of 4</span>
        </div>
        <div className="w-full h-2 bg-[#EAECF0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#D92D20] transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        {/* STEP 1: CATEGORY SELECTION */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#171717]">Select Issue Category</h2>
              <p className="text-xs text-[#667085] mt-1">
                Choose the category that best describes your grievance for accurate depot assignment.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoriesList.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    category === cat.id
                      ? 'border-[#D92D20] bg-red-50/40 ring-2 ring-[#D92D20]'
                      : 'border-[#EAECF0] hover:border-[#D0D5DD] bg-white'
                  }`}
                >
                  <span className="font-bold text-sm text-[#171717] block mb-1">
                    {cat.label}
                  </span>
                  <span className="text-xs text-[#667085]">{cat.desc}</span>
                </button>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <Button variant="primary" onClick={() => setStep(2)}>
                Next: Bus Identification ➔
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: BUS IDENTIFICATION */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#171717]">Identify Vehicle or Route</h2>
              <p className="text-xs text-[#667085] mt-1">
                Scan bus QR code sticker, enter vehicle number, or choose a route fallback.
              </p>
            </div>

            <BusSelector
              selectedBusNumber={busNumber}
              onBusSelect={(busNum, from, to, selectedBusId, selectedRouteId) => {
                setBusNumber(busNum);
                setBusId(selectedBusId);
                setRouteId(selectedRouteId);
                if (from) setRouteFrom(from);
                if (to) setRouteTo(to);
              }}
            />

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" onClick={() => setStep(3)}>
                Next: Trip Details ➔
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: TRIP CONTEXT & TIME */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#171717]">Trip Details & Time</h2>
              <p className="text-xs text-[#667085] mt-1">
                Helps the depot locate the correct duty roster and authorized crew.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Boarding Stop / Origin"
                placeholder="e.g. Trivandrum Central"
                value={routeFrom}
                onChange={(e) => setRouteFrom(e.target.value)}
                icon={<MapPin className="w-4 h-4 text-[#667085]" />}
              />

              <Input
                label="Destination Stop"
                placeholder="e.g. Kollam Junction"
                value={routeTo}
                onChange={(e) => setRouteTo(e.target.value)}
                icon={<MapPin className="w-4 h-4 text-[#667085]" />}
              />
            </div>

            <Input
              label="Approximate Incident Time"
              placeholder="e.g. 09:15 AM Today"
              value={incidentTime}
              onChange={(e) => setIncidentTime(e.target.value)}
              icon={<Clock className="w-4 h-4 text-[#667085]" />}
            />

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button variant="primary" onClick={() => setStep(4)}>
                Next: Description & Evidence ➔
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: DESCRIPTION & SUBMIT */}
        {step === 4 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#171717]">Description & Evidence</h2>
              <p className="text-xs text-[#667085] mt-1">
                Provide clear factual details. Photos or receipts strengthen depot investigation.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-[#D92D20] text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#171717]">
                Grievance Description *
              </label>
              <textarea
                rows={4}
                className="w-full bg-white border border-[#EAECF0] text-[#171717] placeholder-[#98A2B3] text-sm rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[#D92D20] focus:border-[#D92D20]"
                placeholder="Describe what happened clearly (e.g., Conductor refused change receipt, driver overspeeding)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Evidence File Upload Simulation */}
            <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-dashed border-[#EAECF0]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gray-100 text-[#667085]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#171717] block">
                      Attach Photo / Ticket Receipt (Optional)
                    </span>
                    <span className="text-[11px] text-[#667085]">
                      JPG, PNG, PDF up to 5MB.
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSimulateUpload}
                >
                  Simulate Upload
                </Button>
              </div>

              {evidenceFiles.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#EAECF0] space-y-1">
                  {evidenceFiles.map((file, idx) => (
                    <div key={idx} className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{file} attached</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Box */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-[#EAECF0] text-xs space-y-1 text-[#344054]">
              <div className="font-bold text-[#171717] mb-1">Submission Review:</div>
              <div>Category: <strong>{categoriesList.find((c) => c.id === category)?.label}</strong></div>
              <div>Vehicle ID: <strong>{busNumber || 'KL-15-A-4021'}</strong></div>
              <div>Route: <strong>{routeFrom} ➔ {routeTo}</strong></div>
            </div>

            <div className="pt-4 flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                icon={<FileText className="w-4 h-4" />}
              >
                Submit Grievance
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
