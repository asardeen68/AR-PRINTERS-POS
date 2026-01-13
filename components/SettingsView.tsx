import React, { useState, useRef } from 'react';
import { Save, Store, Upload, Image as ImageIcon } from 'lucide-react';
import { ShopProfile } from '../types';
import { db } from '../services/db';

interface SettingsViewProps {
  initialProfile: ShopProfile;
  onSave: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialProfile, onSave }) => {
  const [profile, setProfile] = useState<ShopProfile>(initialProfile);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof ShopProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // Limit to 500KB
        alert("Image file is too large. Please select an image under 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await db.saveShopProfile(profile);
        onSave();
        alert("Shop Profile Updated Successfully!");
    } catch (error) {
        console.error("Error saving profile", error);
        alert("Failed to save profile.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-cyan-600 p-3 rounded-lg text-white shadow-md">
            <Store size={24} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Shop Settings</h2>
            <p className="text-slate-500">Manage your business profile and invoice details</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Logo Section */}
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Business Logo</h3>
                <div className="flex items-start gap-8">
                    <div className="w-40 h-40 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden relative group">
                        {profile.logo ? (
                            <img src={profile.logo} alt="Shop Logo" className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-slate-400 text-center p-4">
                                <ImageIcon size={32} className="mx-auto mb-2" />
                                <span className="text-xs">No Logo</span>
                            </div>
                        )}
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-medium text-sm"
                        >
                            Change Logo
                        </button>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-slate-600 mb-4">
                            Upload your shop logo. This will appear on your dashboard, invoices, and reports.
                            <br/><span className="text-xs text-slate-400">Max size: 500KB. Recommended formats: PNG, JPG.</span>
                        </p>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleLogoUpload} 
                            accept="image/*" 
                            className="hidden" 
                        />
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors"
                        >
                            <Upload size={16} /> Upload New Logo
                        </button>
                    </div>
                </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Basic Information</h3>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name</label>
                    <input 
                        required
                        type="text" 
                        value={profile.name}
                        onChange={e => handleChange('name', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                        placeholder="e.g. AR Printers"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                    <input 
                        type="text" 
                        value={profile.phone}
                        onChange={e => handleChange('phone', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                        placeholder="e.g. 077 123 4567"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input 
                        type="email" 
                        value={profile.email}
                        onChange={e => handleChange('email', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                        placeholder="e.g. contact@arprinters.com"
                    />
                </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Website (Optional)</label>
                    <input 
                        type="text" 
                        value={profile.website || ''}
                        onChange={e => handleChange('website', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                        placeholder="e.g. www.arprinters.com"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <textarea 
                        rows={3}
                        value={profile.address}
                        onChange={e => handleChange('address', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all resize-none"
                        placeholder="Shop physical address..."
                    />
                </div>

                 <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Footer Note</label>
                    <input 
                        type="text" 
                        value={profile.footerNote}
                        onChange={e => handleChange('footerNote', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                        placeholder="e.g. Thank you for your business!"
                    />
                    <p className="text-xs text-slate-500 mt-1">This text will appear at the bottom of every invoice.</p>
                </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex justify-end">
                <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-cyan-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-cyan-700 disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center gap-2"
                >
                    <Save size={18} /> {loading ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};