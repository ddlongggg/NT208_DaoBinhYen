'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  progress: number; // 0 to 100
}

export default function CompassWidget({ progress }: Props) {
  // progress 0% = 0 độ, 100% = 360 độ
  const rotationDegree = (progress / 100) * 360;

  return (
    <div className="relative w-[400px] h-[400px] mx-auto flex items-center justify-center">
      {/* Lớp 1: Mặt la bàn */}
      <div 
        className="absolute inset-0 bg-contain bg-center bg-no-repeat rounded-full shadow-[0_0_30px_rgba(139,90,43,0.3)]"
        style={{ backgroundImage: "url('/Lighthouse/MatLaBan.png')" }} 
      />
      {/* Vòng viền decor ngoài */}
      <div className="absolute inset-0 border-8 border-[#8B5A2B]/80 rounded-full shadow-inner pointer-events-none" />
      <div className="absolute inset-2 border-2 border-[#D2B48C]/50 rounded-full border-dashed pointer-events-none" />

      {/* Lớp 2: Kim la bàn */}
      <motion.div
        className="absolute inset-0 flex justify-center items-center pointer-events-none z-10"
        animate={{ rotate: rotationDegree }}
        transition={{ type: "spring", stiffness: 40, damping: 15, mass: 1.5 }}
      >
        <img 
          src="/Lighthouse/KimLaBan.png" 
          alt="Kim La Bàn" 
          className="w-[80%] h-[80%] object-contain drop-shadow-xl"
        />
      </motion.div>

      {/* Lớp 3: Chốt trục giữa */}
      <div className="absolute w-6 h-6 bg-[#5C3A21] rounded-full z-20 border-2 border-[#E8D4BB] shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center">
        <div className="w-2 h-2 bg-[#D2B48C] rounded-full" />
      </div>
      
      {/* Hướng đông tây nam bắc (nếu mặt la bàn chưa có chữ sẵn thì ta có thể đặt cứng) */}
      {/* Do haido.png có thể đã có họa tiết, ta đặt thêm các góc nhỏ nếu cần. Nhưng để cho đúng yêu cầu, ta sẽ tin tưởng haido.png hoặc tự thêm viền. */}
    </div>
  );
}
