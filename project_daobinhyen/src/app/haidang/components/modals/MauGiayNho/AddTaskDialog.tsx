'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar as CalendarIcon, Save } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { addTask, getTasks, TaskData, TaskDifficulty, TaskType } from '@/app/api/user/lighthouse/taskService';
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

  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dateAudioRef = useRef<HTMLAudioElement | null>(null);
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const saveAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    dateAudioRef.current = new Audio('/Lighthouse/SoundEffect/telescope-slide.mp3');
    if (dateAudioRef.current) dateAudioRef.current.volume = 0.4;
    
    clickAudioRef.current = new Audio('/Lighthouse/SoundEffect/hit-table.mp3');
    if (clickAudioRef.current) clickAudioRef.current.volume = 0.4;
    
    saveAudioRef.current = new Audio('/Lighthouse/SoundEffect/stamp.mp3');
    if (saveAudioRef.current) saveAudioRef.current.volume = 0.4;

    // Tải danh sách Task Lớn (nếu mở ở tab Mẩu giấy nhỏ)
    if (type === 'short') {
      getTasks(userId, 'long').then(res => setAvailableLongTasks(res)).catch(console.error);
    }
  }, [type, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    // VALIDATION SỐ NGÀY
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (type === 'short') {
      if (diffDays < 1 || diffDays > 3) {
        setErrorMsg('Hải trình ngắn hạn chỉ được kéo dài từ 1 đến 3 ngày!');
        return;
      }
    } else if (type === 'long') {
      if (diffDays < 7 || diffDays > 730) {
        setErrorMsg('Hải trình dài hạn (Nhật Ký Neo Đậu) phải có thời hạn từ 1 tuần (7 ngày) đến 2 năm (730 ngày)!');
        return;
      }
    }

    setErrorMsg(null);

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
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        longTaskId: longTaskId ? longTaskId : null,
      });
      saveAudioRef.current?.play();
      onRefresh();
      onClose();
    } catch (error) {
      console.error(error);
      setErrorMsg("Lỗi khi thêm task!");
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
            {/* Icon Picker (Custom Select để render Icon + chữ) */}
            <div className="relative">
              <label className="block text-sm font-bold text-[#8B5A2B] mb-1">Chọn Logo / Biểu tượng</label>
              
              <div 
                className="w-full p-3 rounded-lg border border-[#D2B48C] bg-white text-[#5C3A21] flex justify-between items-center cursor-pointer hover:border-[#8B5A2B] transition shadow-sm"
                onClick={() => { clickAudioRef.current?.play(); setIsIconDropdownOpen(!isIconDropdownOpen); }}
              >
                <div className="flex items-center gap-3">
                  {React.createElement((LucideIcons as any)[icon] || LucideIcons.FileText, { size: 18, className: "text-[#8B5A2B]" })}
                  <span className="font-semibold">{AVAILABLE_ICONS.find(i => i.name === icon)?.label}</span>
                </div>
                <LucideIcons.ChevronDown size={18} className={`text-gray-400 transition-transform ${isIconDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isIconDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsIconDropdownOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#D2B48C] rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                    {AVAILABLE_ICONS.map(ic => {
                      const IconComp = (LucideIcons as any)[ic.name] || LucideIcons.FileText;
                      const isSelected = icon === ic.name;
                      return (
                        <div 
                          key={ic.name}
                          className={`px-4 py-3 hover:bg-[#E8D4BB]/60 cursor-pointer flex items-center justify-between text-[#5C3A21] transition ${
                            isSelected ? 'bg-[#FFFBF5] font-bold border-l-4 border-[#8B5A2B]' : 'border-l-4 border-transparent'
                          }`}
                          onClick={() => { clickAudioRef.current?.play(); setIcon(ic.name); setIsIconDropdownOpen(false); }}
                        >
                          <span>{ic.label}</span>
                          <IconComp size={20} className={isSelected ? 'text-[#8B5A2B]' : 'text-gray-400'} />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
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
                  onClick={() => {
                    if (dateAudioRef.current) {
                      dateAudioRef.current.currentTime = 0;
                      dateAudioRef.current.play();
                      setTimeout(() => dateAudioRef.current?.pause(), 1000);
                    }
                  }}
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
                  onClick={() => {
                    if (dateAudioRef.current) {
                      dateAudioRef.current.currentTime = 0;
                      dateAudioRef.current.play();
                      setTimeout(() => dateAudioRef.current?.pause(), 1000);
                    }
                  }}
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
          {errorMsg && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded text-sm font-medium flex items-center gap-2 shadow-sm">
              <LucideIcons.AlertOctagon size={18} className="text-red-500" />
              {errorMsg}
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
