'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import DongHoTapTrungTab from './DongHoTapTrungTab';

interface DongHoModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DongHoModalContainer({ isOpen, onClose }: DongHoModalContainerProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-5xl h-[82vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border-2 border-[#D2B48C]/40"
          >
            {/* Nút đóng */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors border border-white/10"
            >
              <X size={20} className="text-[#E8D4BB]" />
            </button>

            {/* Nội dung đồng hồ tập trung chiếm toàn bộ modal */}
            <div className="flex-1 overflow-hidden">
              <DongHoTapTrungTab />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
