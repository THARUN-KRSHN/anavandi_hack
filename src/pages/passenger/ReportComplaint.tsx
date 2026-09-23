import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { complaintSchema, COMPLAINT_CATEGORIES, type ComplaintFormData } from '../../utils/validation';
import { createComplaint } from '../../services/complaintsService';
import { MiniLocationMap } from '../../components/map/MiniLocationMap';
import {
  FileText,
  CheckCircle2,
  ArrowLeft,
  Upload,
  X,
  Navigation,
} from 'lucide-react';

export const ReportComplaint: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Geolocation & Map State (Default Ernakulam location)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 9.9816,
    lng: 76.2999,
  });
  const [geoConsent, setGeoConsent] = useState<'pending' | 'granted' | 'denied'>('pending');

  // Photo Upload State (Base64 or Data URLs)
  const [photos, setPhotos] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      category: 'Cleanliness',
      routeFrom: '',
      routeTo: '',
      busNumber: '',
      incidentTime: '',
      description: '',
      evidenceFiles: [],
    },
  });

  const selectedCategory = watch('category');
  const busNumberInput = watch('busNumber');
  const routeFromInput = watch('routeFrom');
  const routeToInput = watch('routeTo');

  // Request Geolocation Consent on Step 2
  const requestGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          setValue('complainantLat', coords.lat);
          setValue('complainantLng', coords.lng);
          setGeoConsent('granted');
        },
        (err) => {
          console.warn('Geolocation denied or failed:', err);
          setGeoConsent('denied');
        }
      );
    } else {
      setGeoConsent('denied');
    }
  };

  useEffect(() => {
    if (step === 2 && geoConsent === 'pending') {
      requestGeolocation();
    }
  }, [step, geoConsent]);

  // Compute estimated bus position offset based on plate string length & route
  const estimatedBusCoords = {
    lat: userCoords.lat + 0.015,
    lng: userCoords.lng + 0.018,
  };

  // Image Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 3) {
      alert('Maximum 3 images allowed.');
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotos((prev) => [...prev, reader.result as string].slice(0, 3));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ComplaintFormData) => {
    setIsSubmitting(true);
    try {
      const created = await createComplaint({
        category: data.category as unknown as any,
        categoryLabel: data.category === 'Other' ? 'Undisclosed Issue Type' : data.category,
        description: data.description,
        busNumber: data.busNumber,
        routeFrom: data.routeFrom,
        routeTo: data.routeTo,
        incidentTime: data.incidentTime,
        evidenceFiles: photos,
      });

      navigate('/report/success', { state: { complaint: created } });
    } catch (err) {
      console.error(err);
      alert('Failed to register complaint. Please check fields and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-28">
      {/* Back Button */}
      <button
        onClick={() => (step > 1 ? setStep((step - 1) as 1 | 2 | 3) : navigate('/'))}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#667085] hover:text-[#171717] mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{step > 1 ? `Back to Step ${step - 1}` : 'Cancel & Return Home'}</span>
      </button>

      {/* Progress Bar Header */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#667085] uppercase tracking-wider">
          <span>Register Grievance</span>
          <span>Step {step} of 3</span>
        </div>
        <div className="w-full h-2 bg-[#EAECF0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#D92D20] transition-all duration-300 rounded-full"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-[32px] border border-[#EAECF0] shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          
          {/* STEP 1: CATEGORY SELECTION */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#667085] block">
                  STEP 1 OF 3
                </span>
                <h2 className="text-2xl font-black text-[#171717]">Select Problem Category</h2>
                <p className="text-xs text-[#667085] mt-1">
                  Choose the issue type. Select &quot;Other&quot; if your issue type is undisclosed.
                </p>
              </div>

              {errors.category && (
                <div className="p-3 bg-red-50 text-[#D92D20] text-xs font-semibold rounded-2xl">
                  {errors.category.message}
                </div>
              )}

              {/* 9 Strict Pill Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setValue('category', cat)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedCategory === cat
                        ? 'border-[#D92D20] bg-red-50/50 ring-2 ring-[#D92D20] shadow-sm'
                        : 'border-[#EAECF0] hover:border-[#D0D5DD] bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#171717]">{cat}</span>
                      {selectedCategory === cat && (
                        <CheckCircle2 className="w-4 h-4 text-[#D92D20]" />
                      )}
                    </div>
                    <span className="text-[11px] text-[#667085] mt-1 block">
                      {cat === 'Other' ? 'Undisclosed complaint type' : `File report for ${cat}`}
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-[#171717] hover:bg-black text-white font-bold text-xs rounded-full shadow-lg transition-all"
                >
                  Next: Route & Location ➔
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ROUTE, BUS PLATE & GEOLOCATION MAP */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#667085] block">
                  STEP 2 OF 3
                </span>
                <h2 className="text-2xl font-black text-[#171717]">Trip Route & Vehicle ID</h2>
                <p className="text-xs text-[#667085] mt-1">
                  Enter bus registration plate and location for live estimated bus position computation.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#171717]">Route From *</label>
                    <input
                      {...register('routeFrom')}
                      placeholder="e.g. Ernakulam Kaloor"
                      className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl px-4 py-2.5 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
                    />
                    {errors.routeFrom && <span className="text-[11px] text-red-500">{errors.routeFrom.message}</span>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#171717]">Route To *</label>
                    <input
                      {...register('routeTo')}
                      placeholder="e.g. Thrissur Kokkala"
                      className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl px-4 py-2.5 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
                    />
                    {errors.routeTo && <span className="text-[11px] text-red-500">{errors.routeTo.message}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#171717]">Bus Plate Number *</label>
                    <input
                      {...register('busNumber')}
                      placeholder="e.g. KL-07-AB-1234"
                      className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl px-4 py-2.5 text-xs font-mono font-bold uppercase text-[#D92D20] focus:outline-none focus:ring-2 focus:ring-[#D92D20]"
                    />
                    {errors.busNumber && <span className="text-[11px] text-red-500 font-medium">{errors.busNumber.message}</span>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#171717]">Approximate Time *</label>
                    <input
                      {...register('incidentTime')}
                      placeholder="e.g. 09:30 AM Today"
                      className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl px-4 py-2.5 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
                    />
                    {errors.incidentTime && <span className="text-[11px] text-red-500">{errors.incidentTime.message}</span>}
                  </div>
                </div>
              </div>

              {/* Geolocation Prompt Banner */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <Navigation className="w-4 h-4 text-emerald-600" />
                    <span>Location Consent:</span>
                  </div>
                  <span className="font-semibold text-[11px] uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {geoConsent === 'granted' ? 'GPS Active' : 'Manual Pin Active'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  {geoConsent === 'granted'
                    ? 'Using your device GPS coordinates to show your location marker on the map.'
                    : 'GPS access denied or pending. You can drag the green pin manually on the map below.'}
                </p>
                {geoConsent !== 'granted' && (
                  <button
                    type="button"
                    onClick={requestGeolocation}
                    className="text-xs font-bold text-emerald-800 underline hover:text-black"
                  >
                    Grant GPS Location Permission
                  </button>
                )}
              </div>

              {/* Mini Leaflet Map with Complainant & Estimated Bus Markers */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#171717] block">
                  Location Mini Map (Complainant Pin & Estimated Bus Position)
                </label>
                <MiniLocationMap
                  userLat={userCoords.lat}
                  userLng={userCoords.lng}
                  busLat={estimatedBusCoords.lat}
                  busLng={estimatedBusCoords.lng}
                  busNumber={busNumberInput}
                  onManualPinChange={(lat, lng) => {
                    setUserCoords({ lat, lng });
                    setValue('complainantLat', lat);
                    setValue('complainantLng', lng);
                  }}
                />
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#171717] font-bold text-xs rounded-full transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-[#171717] hover:bg-black text-white font-bold text-xs rounded-full shadow-lg transition-all"
                >
                  Next: Photos & Statement ➔
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PHOTOS & STATEMENT */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#667085] block">
                  STEP 3 OF 3
                </span>
                <h2 className="text-2xl font-black text-[#171717]">Statement & Photos</h2>
                <p className="text-xs text-[#667085] mt-1">
                  Describe the incident clearly. Attach up to 3 optional photo previews.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#171717]">Complaint Statement *</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Provide clear details of what happened on the trip..."
                  className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl p-4 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#D92D20]"
                />
                {errors.description && <span className="text-[11px] text-red-500 font-medium">{errors.description.message}</span>}
              </div>

              {/* Photo Upload & Thumbnail Previews */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#171717] block">
                  Attach Photo Evidence (Optional, max 3)
                </label>

                <div className="flex flex-wrap gap-3">
                  {photos.map((src, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-[#EAECF0] shadow-xs group">
                      <img src={src} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {photos.length < 3 && (
                    <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#EAECF0] hover:border-[#D92D20] bg-[#F9FAFB] flex flex-col items-center justify-center cursor-pointer transition-colors text-center p-2">
                      <Upload className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-[10px] font-bold text-[#667085]">Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Form Summary Card */}
              <div className="p-4 bg-[#F9FAFB] rounded-2xl border border-[#EAECF0] text-xs space-y-1 text-[#344054]">
                <span className="font-bold text-[#171717] block mb-1">Complaint Summary:</span>
                <div>Category: <strong className="text-[#D92D20]">{selectedCategory}</strong></div>
                <div>Bus Registration: <strong className="font-mono">{busNumberInput}</strong></div>
                <div>Route: <strong>{routeFromInput} ➔ {routeToInput}</strong></div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#171717] font-bold text-xs rounded-full transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-[#D92D20] hover:bg-[#B42318] text-white font-bold text-xs rounded-full shadow-lg transition-all flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>{isSubmitting ? 'Registering Grievance...' : 'Submit Complaint'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
