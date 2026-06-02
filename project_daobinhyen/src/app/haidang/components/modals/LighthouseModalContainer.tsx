'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Map, FileText, BookOpen, Compass } from 'lucide-react';
import HaiDoTuongLaiTab from './HaiDoTuongLai/HaiDoTuongLaiTab';
import MauGiayNhoTab from './MauGiayNho/MauGiayNhoTab';
import NhatKyNeoDauTab from './NhatKyNeoDau/NhatKyNeoDauTab';
import LaBanTienDoTab from './LaBanTienDo/LaBanTienDoTab';
import { auth } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getGold } from '@/app/api/user/lighthouse/taskService';

export type ModalTab = 'hai-do' | 'mau-giay' | 'nhat-ky' | 'la-ban';

interface LighthouseModalContainerProps {
  isOpen: boolean;
  initialTab?: ModalTab;
  onClose: () => void;
}

export default function LighthouseModalContainer({ isOpen, initialTab = 'hai-do', onClose }: LighthouseModalContainerProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>(initialTab);
  const [gold, setGold] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else setUserId('test-user-id');
    });
    return () => unsubscribe();
  }, []);

  const fetchGold = async () => {
    if (!userId) return;
    const currentGold = await getGold(userId);
    setGold(currentGold);
  };

  useEffect(() => {
    if (userId) fetchGold();
  }, [userId]);

  useEffect(() => {
    const handleGoldUpdated = () => fetchGold();
    window.addEventListener('GOLD_UPDATED', handleGoldUpdated);
    return () => window.removeEventListener('GOLD_UPDATED', handleGoldUpdated);
  }, [userId]);

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.tab) {
        setActiveTab(customEvent.detail.tab);
      }
    };
    window.addEventListener('SWITCH_LIGHTHOUSE_TAB', handleSwitchTab);
    return () => window.removeEventListener('SWITCH_LIGHTHOUSE_TAB', handleSwitchTab);
  }, []);

  const tabs = [
    { id: 'hai-do', label: 'Hải đồ tương lai', icon: <Map size={18} /> },
    { id: 'mau-giay', label: 'Mẩu giấy nhỏ', icon: <FileText size={18} /> },
    { id: 'nhat-ky', label: 'Nhật ký neo đậu', icon: <BookOpen size={18} /> },
    { id: 'la-ban', label: 'La bàn tiến độ', icon: <Compass size={18} /> },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-6xl h-[85vh] bg-[#F5E6D3] rounded-2xl shadow-2xl overflow-hidden flex flex-col border-4 border-[#8B5A2B]/40"
          >
            {/* Góc phải (Đóng & Vàng) */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
              <div className="flex items-center gap-2 bg-[#5C3A21] px-4 py-1.5 rounded-full shadow-lg border-2 border-[#D2B48C]">
                <span className="text-lg">💰</span>
                <span className="text-amber-300 font-black tracking-wide">{gold.toLocaleString()}</span>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
              >
                <X size={24} className="text-[#5C3A21]" />
              </button>
            </div>

            {/* Thanh Tabs Navbar ở trên cùng */}
            <div className="flex items-center px-4 pt-4 bg-[#E8D4BB] border-b-2 border-[#D2B48C]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ModalTab)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all duration-300 ${
                    activeTab === tab.id 
                    ? 'bg-[#F5E6D3] text-[#5C3A21] shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border-t-2 border-l-2 border-r-2 border-[#D2B48C] translate-y-[2px]' 
                    : 'bg-transparent text-[#8B5A2B]/60 hover:text-[#5C3A21] hover:bg-white/10'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Vùng nội dung động thay đổi theo Tab */}
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 p-6 overflow-y-auto"
                >
                  {/* Nơi đây sẽ Render Component tương ứng tuỳ thuộc vào activeTab */}
                  {activeTab === 'hai-do' && <HaiDoTuongLaiTab />}
                  {activeTab === 'mau-giay' && <MauGiayNhoTab />}
                  {activeTab === 'nhat-ky' && <NhatKyNeoDauTab />}
                  {activeTab === 'la-ban' && <LaBanTienDoTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
