import React, { useState } from 'react';
import Modal from '../common/Modal';
import { api } from '../../utils/api';
import { API_ENDPOINTS } from '../../utils/endpoints';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, HeartHandshake, Hospital, User, Phone, Sparkles } from 'lucide-react';

export const RequestWizardModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    patient_name: '',
    patient_age: '',
    hospital_name: '',
    hospital_room: '',
    patient_address: '',
    blood_type: 'A',
    rhesus: '+',
    blood_component: 'PRC',
    bags_needed: 2,
    diagnosis: '',
    cp_name: '',
    cp_phone: '',
    cp_relation: 'Keluarga Pasien',
    emergency_note: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (!formData.patient_name || !formData.patient_age || !formData.hospital_name || !formData.diagnosis) {
      toast.error('Mohon lengkapi Nama Pasien, Usia, Rumah Sakit, dan Diagnosa Kebutuhan.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.blood_type || !formData.bags_needed || formData.bags_needed < 1) {
      toast.error('Mohon tentukan Golongan Darah dan Jumlah Kantong.');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.cp_name || !formData.cp_phone || !formData.cp_relation) {
      toast.error('Mohon isi Nama Kontak CP, Nomor WhatsApp, dan Hubungan dengan pasien.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setLoading(true);
    try {
      const res = await api.post(API_ENDPOINTS.BLOOD_REQUESTS.CREATE, formData);
      if (res.data?.success) {
        toast.success(res.data.message || 'Permintaan darah berhasil diajukan!');
        onSuccess(res.data.data);
        onClose();
        // Reset form
        setStep(1);
        setFormData({
          patient_name: '',
          patient_age: '',
          hospital_name: '',
          hospital_room: '',
          patient_address: '',
          blood_type: 'A',
          rhesus: '+',
          blood_component: 'PRC',
          bags_needed: 2,
          diagnosis: '',
          cp_name: '',
          cp_phone: '',
          cp_relation: 'Keluarga Pasien',
          emergency_note: '',
        });
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal mengajukan permintaan darah.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajukan Permintaan Darah Darurat"
      maxWidth="max-w-xl"
    >
      {/* 3-Step Wizard Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
          <span className={step >= 1 ? 'text-blood-600' : ''}>1. Data Pasien & RS</span>
          <span className={step >= 2 ? 'text-blood-600' : ''}>2. Golongan & Jumlah</span>
          <span className={step >= 3 ? 'text-blood-600' : ''}>3. Kontak CP & Darurat</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-blood-600 h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* STEP 1: Pasien & Rumah Sakit */}
        {step === 1 && (
          <div className="space-y-3.5 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nama Pasien <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="patient_name"
                value={formData.patient_name}
                onChange={handleChange}
                placeholder="Contoh: Ibu Hj. Siti Aminah"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Umur Pasien (Tahun) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="patient_age"
                  value={formData.patient_age}
                  onChange={handleChange}
                  placeholder="Contoh: 48"
                  min="1"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Ruang Rawat / Bed
                </label>
                <input
                  type="text"
                  name="hospital_room"
                  value={formData.hospital_room}
                  onChange={handleChange}
                  placeholder="Contoh: ICU Lt.2 Bed 04"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tempat Di Rawat (RS / Klinik) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="hospital_name"
                value={formData.hospital_name}
                onChange={handleChange}
                placeholder="Contoh: RSUD Balaraja Tangerang"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Diagnosa Medis / Keperluan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                placeholder="Contoh: Operasi Darurat Caesar / Anemia Akut / Thalassemia"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Alamat Rumah Pasien
              </label>
              <textarea
                name="patient_address"
                rows="2"
                value={formData.patient_address}
                onChange={handleChange}
                placeholder="Alamat domisili keluarga pasien..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Golongan Darah & Kebutuhan */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Golongan Darah Pasien <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {['A', 'B', 'AB', 'O'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, blood_type: type }))}
                    className={`py-3 rounded-xl font-black text-lg border transition-all ${
                      formData.blood_type === type
                        ? 'bg-blood-600 text-white border-blood-600 shadow-md shadow-blood-600/30 ring-2 ring-blood-400'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Rhesus <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['+', '-'].map((rh) => (
                    <button
                      key={rh}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, rhesus: rh }))}
                      className={`py-2.5 rounded-xl font-bold text-sm border transition-all ${
                        formData.rhesus === rh
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {rh === '+' ? 'Positif (+)' : 'Negatif (-)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Komponen Darah <span className="text-red-500">*</span>
                </label>
                <select
                  name="blood_component"
                  value={formData.blood_component}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
                >
                  <option value="PRC">PRC (Sel Darah Merah Pekat)</option>
                  <option value="WB">WB (Whole Blood / Darah Lengkap)</option>
                  <option value="TC">TC (Trombosit Konsentrat)</option>
                  <option value="FFP">FFP (Plasma Segar Beku)</option>
                  <option value="CRYO">Cryoprecipitate</option>
                  <option value="LAINNYA">Lainnya</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Jumlah Kantong Darah Dibutuhkan <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  name="bags_needed"
                  min="1"
                  max="50"
                  value={formData.bags_needed}
                  onChange={handleChange}
                  required
                  className="w-32 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none text-center"
                />
                <span className="text-sm font-semibold text-slate-600">Kantong (350cc/450cc)</span>
              </div>
            </div>

            <div className="p-3 bg-blood-50 border border-blood-100 rounded-xl flex items-center space-x-2 text-xs text-blood-800">
              <Sparkles className="w-4 h-4 text-blood-600 flex-shrink-0" />
              <span>Sistem akan otomatis mencocokkan pendonor <strong>{formData.blood_type}{formData.rhesus}</strong> yang berstatus Siap Donor di komunitas.</span>
            </div>
          </div>
        )}

        {/* STEP 3: Kontak CP & Catatan Darurat */}
        {step === 3 && (
          <div className="space-y-3.5 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nama Kontak Penanggung Jawab (CP) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cp_name"
                value={formData.cp_name}
                onChange={handleChange}
                placeholder="Contoh: Bpk. Hendra Sulaeman"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nomor WhatsApp CP <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="cp_phone"
                  value={formData.cp_phone}
                  onChange={handleChange}
                  placeholder="0812xxxxxxxx"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Hubungan dgn Pasien <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="cp_relation"
                  value={formData.cp_relation}
                  onChange={handleChange}
                  placeholder="Suami / Istri / Anak / Relawan"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Catatan Darurat Tambahan
              </label>
              <textarea
                name="emergency_note"
                rows="2"
                value={formData.emergency_note}
                onChange={handleChange}
                placeholder="Contoh: Pasien harus transfusi sebelum jam 20.00 malam ini untuk jadwal operasi..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none"
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span><strong>Aturan Komunitas:</strong> Dilarang keras melakukan jual beli darah. Donor darah di Redor OBABA 100% sukarela & gratis untuk kemanusiaan.</span>
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center space-x-1.5 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center space-x-1.5 py-2.5 px-5 rounded-xl bg-blood-600 hover:bg-blood-700 text-white text-xs font-bold shadow-md shadow-blood-600/20 transition-all"
            >
              <span>Lanjut Langkah {step + 1}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 py-2.5 px-6 rounded-xl bg-blood-600 hover:bg-blood-700 text-white text-xs font-extrabold shadow-lg shadow-blood-600/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <HeartHandshake className="w-4 h-4" />
                  <span>KIRIM PERMINTAAN & MATCHING</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default RequestWizardModal;
