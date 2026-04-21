'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar as CalendarIcon, Save } from 'lucide-react';
import { addTask, getTasks, TaskData, TaskDifficulty, TaskType } from '@/services/firebase/taskService';
import { Timestamp } from 'firebase/firestore';

interface AddTaskDialogProps {
  onClose: () => void;
  onRefresh: () => void;
  type: TaskType;
  userId: string;
}

const AVAILABLE_ICONS = [
  { name: 'FileText', label: 'Tài liệu' },
  { name: 'Book', label: 'Sách vở' },
  { name: 'Sword', label: 'Khó khăn' },
  { name: 'Anchor', label: 'Gắn kết' },
  { name: 'Briefcase', label: 'Công việc' },
  { name: 'Coffee', label: 'Nghỉ ngơi' },
  { name: 'Target', label: 'Mục tiêu' },
  { name: 'Star', label: 'Đặc biệt' },
];

export default function AddTaskDialog({ onClose, onRefresh, type, userId }: AddTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('FileText');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('medium');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  
  const [longTaskId, setLongTaskId] = useState<string>('');
  const [availableLongTasks, setAvailableLongTasks] = useState<TaskData[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Tải danh sách Task Lớn (nếu mở ở tab Mẩu giấy nhỏ)
    if (type === 'short') {
      getTasks(userId, 'long').then(res => setAvailableLongTasks(res)).catch(console.error);
    }
  }, [type, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    setIsSubmitting(true);
    try {
      await addTask({
        userId,
        title,
        description,
        icon,
        type,
        difficulty,
        status: 'in_progress',
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
        longTaskId: longTaskId ? longTaskId : null,
      });
      onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Lỗi khi thêm task!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#FFFBF5] rounded-2xl shadow-2xl border-4 border-[#8B5A2B]/20 overflow-hidden flex flex-col"
      >
        <div className="flex justify-between items-center px-6 py-4 bg-[#8B5A2B] text-white">
          <h2 className="text-xl font-bold">
            {type === 'short' ? 'Viết Mẩu Giấy Nhỏ Mới' : 'Tạo Nhật Ký Neo Đậu Mới'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Tên Task */}
          <div>
            <label className="block text-sm font-bold text-[#8B5A2B] mb-1">Tên Task</label>
            <input 
              type="text" 
              required
              placeholder="VD: Làm xong bài tập Toán" 
              className="w-full p-3 rounded-lg border border-[#D2B48C] bg-white text-[#5C3A21] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#8B5A2B]"
              value={title} onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-bold text-[#8B5A2B] mb-1">Mô tả (Tuỳ chọn)</label>
            <textarea 
              rows={3}
              placeholder="Trình bày sơ lược mục tiêu của task..." 
              className="w-full p-3 rounded-lg border border-[#D2B48C] bg-white text-[#5C3A21] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#8B5A2B]"
              value={description} onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-bold text-[#8B5A2B] mb-1">Chọn Logo / Biểu tượng</label>
              <select 
                className="w-full p-3 rounded-lg border border-[#D2B48C] bg-white text-[#5C3A21] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#8B5A2B] cursor-pointer"
                value={icon} onChange={(e) => setIcon(e.target.value)}
              >
                {AVAILABLE_ICONS.map(ic => (
                  <option key={ic.name} value={ic.name}>{ic.label}</option>
                ))}
              </select>
            </div>

            {/* Độ khó */}
            <div>
              <label className="block text-sm font-bold text-[#8B5A2B] mb-1">Độ khó</label>
              <select 
                className="w-full p-3 rounded-lg border border-[#D2B48C] bg-white text-[#5C3A21] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#8B5A2B] cursor-pointer"
                value={difficulty} onChange={(e) => setDifficulty(e.target.value as TaskDifficulty)}
              >
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-bold text-[#8B5A2B] mb-1">Ngày bắt đầu</label>
              <div className="relative">
                <input 
                  type="date" 
                  required
                  className="w-full p-3 pl-10 rounded-lg border border-[#D2B48C] bg-white text-[#5C3A21] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#8B5A2B] cursor-pointer"
                  value={startDate} onChange={(e) => setStartDate(e.target.value)}
                />
                <CalendarIcon className="absolute left-3 top-3.5 text-[#8B5A2B]" size={18} />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-bold text-[#8B5A2B] mb-1">Ngày kết thúc</label>
              <div className="relative">
                <input 
                  type="date" 
                  required
                  className="w-full p-3 pl-10 rounded-lg border border-[#D2B48C] bg-white text-[#5C3A21] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#8B5A2B] cursor-pointer"
                  value={endDate} onChange={(e) => setEndDate(e.target.value)}
                />
                <CalendarIcon className="absolute left-3 top-3.5 text-[#8B5A2B]" size={18} />
              </div>
            </div>
          </div>

          {/* Liên kết Task Lớn (Chỉ hiển thị nếu là task ngắn) */}
          {type === 'short' && (
            <div>
              <label className="block text-sm font-bold text-[#8B5A2B] mb-1">Liên kết Task Lớn (Link Long-term Task)</label>
              <select 
                className="w-full p-3 rounded-lg border border-[#D2B48C] bg-white text-[#5C3A21] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#8B5A2B] cursor-pointer"
                value={longTaskId} onChange={(e) => setLongTaskId(e.target.value)}
              >
                <option value="">-- Không liên kết --</option>
                {availableLongTasks.map(longTask => (
                  <option key={longTask.id} value={longTask.id}>{longTask.title}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1 italic">* Liên kết mẩu giấy này với mục tiêu dài hạn trong Nhật Ký Neo Đậu.</p>
            </div>
          )}
        </form>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button 
            type="button" onClick={onClose}
            className="px-6 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition"
          >
            Huỷ bỏ
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold bg-[#8B5A2B] text-white hover:bg-[#5C3A21] shadow-md transition disabled:opacity-50"
          >
            <Save size={18} />
            {isSubmitting ? 'Đang tạo...' : 'Lưu Task'}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
