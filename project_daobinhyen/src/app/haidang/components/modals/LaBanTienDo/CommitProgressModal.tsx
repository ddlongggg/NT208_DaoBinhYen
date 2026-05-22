'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { TaskData } from '@/app/api/user/lighthouse/taskService';

interface Props {
  task: TaskData;
  newProgress: number;
  onConfirm: (title: string, description: string) => Promise<void>;
  onClose: () => void;
  playClickSound: () => void;
}

export default function CommitProgressModal({ task, newProgress, onConfirm, onClose, playClickSound }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    playClickSound();
    setIsSubmitting(true);
    try {
      await onConfirm(title, description);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-[#FFFBF5] rounded-2xl shadow-2xl border-4 border-[#8B5A2B]/20 overflow-hidden"
      >
        <div className="flex justify-between items-center px-6 py-4 bg-[#5C3A21] text-[#FFFBF5]">
          <h2 className="text-xl font-bold">Ghi nhận tiến độ hải trình</h2>
          <button onClick={() => { playClickSound(); onClose(); }} className="p-1 hover:bg-white/20 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex justify-between items-center bg-[#E8D4BB]/50 p-4 rounded-xl border border-[#D2B48C]">
            <div>
              <p className="text-sm font-bold text-[#8B5A2B]">Tiến độ trước đây</p>
              <p className="text-xl font-black text-[#5C3A21]">{task.progress || 0}%</p>
            </div>
            <div className="text-[#8B5A2B] font-bold text-2xl">→</div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-700">Tiến độ mới</p>
              <p className="text-xl font-black text-emerald-700">{newProgress}%</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#8B5A2B] mb-1">Tên cột mốc (Commit Title)</label>
            <input 
              type="text" 
              required
              placeholder="VD: Hoàn thành dàn ý báo cáo" 
              className="w-full p-3 rounded-lg border border-[#D2B48C] bg-white text-[#5C3A21] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#8B5A2B]"
              value={title} onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#8B5A2B] mb-1">Nhật ký chi tiết (Ghi chú)</label>
            <textarea 
              rows={3}
              placeholder="Ghi chú lại những gì bạn đã làm được..." 
              className="w-full p-3 rounded-lg border border-[#D2B48C] bg-white text-[#5C3A21] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#8B5A2B]"
              value={description} onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#D2B48C]/50">
            <button 
              type="button" 
              onClick={() => { playClickSound(); onClose(); }}
              className="px-5 py-2 rounded-lg font-bold text-[#8B5A2B] hover:bg-[#8B5A2B]/10 transition"
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || !title}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold bg-[#8B5A2B] text-white hover:bg-[#5C3A21] shadow-md transition disabled:opacity-50"
            >
              <Check size={18} />
              {isSubmitting ? 'Đang neo...' : 'Xác nhận mốc'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
