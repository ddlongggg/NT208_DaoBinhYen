'use client';

import React, { useState, useEffect } from 'react';
import { getTasks, deleteTask, TaskData, deleteMultipleTasks } from '@/app/api/user/lighthouse/taskService';
import { auth } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Trash2, Plus, Anchor, Compass } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import AddTaskDialog from '../MauGiayNho/AddTaskDialog';
import TaskCommitHistoryDialog from './TaskCommitHistoryDialog';

export default function NhatKyNeoDauTab() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<TaskData | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId('test-user-id');
      }
    });
    return () => unsubscribe();
  }, []);

  const loadTasks = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Gọi fetch task Loại Long
      const data = await getTasks(userId, 'long');
      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadTasks();
  }, [userId]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedTaskIds(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedTaskIds.size === 0) return;
    if (confirm(`Hủy bỏ hải trình? Bạn sẽ gạch xoá vĩnh viễn ${selectedTaskIds.size} mục tiêu dài hạn này?`)) {
      await deleteMultipleTasks(Array.from(selectedTaskIds));
      setSelectedTaskIds(new Set());
      loadTasks();
    }
  };

  const DynamicIcon = ({ name, size = 20 }: { name: string, size?: number }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (LucideIcons as any)[name] || LucideIcons.Compass;
    return <IconComponent size={size} />;
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Banner Cổ Điển */}
      <div className="bg-[#5C3A21] text-[#F5E6D3] p-6 rounded-xl border-2 border-[#8B5A2B] shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#E8D4BB]/20 rounded-full">
            <Anchor size={36} className="text-[#E8D4BB]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-widest text-[#FFFBF5]">NHẬT KÝ NEO ĐẬU</h2>
            <p className="text-[#D2B48C] font-medium italic">Ghi chép những hải trình dài lâu của đời người...</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-[#D2B48C]">Tổng hải trình đang đi</p>
          <p className="text-4xl font-bold text-[#FFFBF5]">{tasks.filter(t => t.status !== 'completed').length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center px-2">
        <button 
          onClick={handleDeleteSelected}
          disabled={selectedTaskIds.size === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition shadow-sm ${
            selectedTaskIds.size > 0 ? 'bg-red-900/80 text-red-100 hover:bg-red-900' : 'bg-black/5 text-[#8B5A2B]/40 cursor-not-allowed'
          }`}
        >
          <Trash2 size={18} />
          Huỷ bỏ ({selectedTaskIds.size})
        </button>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2 bg-[#8B5A2B] text-[#FFFBF5] rounded-lg font-bold hover:bg-[#5C3A21] transition shadow-md border border-[#5C3A21]"
        >
          <Plus size={18} />
          Ghi chép mới
        </button>
      </div>

      {/* Danh sách Task (Giao diện Giấy Da) */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {loading ? (
          <p className="text-center p-8 text-[#8B5A2B]/60 italic text-lg">Đang lật mở những trang nhật ký...</p>
        ) : tasks.length === 0 ? (
          <p className="text-center p-8 text-[#8B5A2B]/60 italic text-lg text-center">Trang giấy chưa có nét mực nào.<br/>Hãy đặt bút vạch ra hải trình đầu tiên!</p>
        ) : (
          tasks.map(task => (
            <div 
              key={task.id}
              onClick={() => setViewingTask(task)}
              className="bg-[#FFFBF5] border-2 border-[#D2B48C] p-4 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer flex flex-col gap-3 relative overflow-hidden group"
            >
              {/* Vệt trang trí biên giấy */}
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#8B5A2B]/10 group-hover:bg-[#8B5A2B]/30 transition-colors" />

              <div className="flex items-start justify-between pl-4">
                <div className="flex gap-4">
                  <div /* Checkbox stop propagation */
                    className="flex items-center pt-1" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded text-[#8B5A2B] focus:ring-[#8B5A2B]"
                      checked={selectedTaskIds.has(task.id!)}
                      onChange={() => toggleSelect(task.id!)}
                    />
                  </div>
                  
                  {/* Tên & Header */}
                  <div>
                    <h3 className="font-bold text-xl text-[#5C3A21] flex items-center gap-2">
                       <DynamicIcon name={task.icon} />
                       {task.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-semibold mt-1">
                      <span className={`px-2 py-0.5 rounded text-white font-bold ${
                        task.difficulty === 'hard' ? 'bg-red-800' :
                        task.difficulty === 'medium' ? 'bg-amber-600' : 'bg-emerald-600'
                      }`}>
                        Độ khó: {task.difficulty === 'hard' ? 'Khó' : task.difficulty === 'medium' ? 'Trung bình' : 'Dễ'}
                      </span>
                      <span className="text-[#8B5A2B]">Hạn: {task.endDate.toDate().toLocaleDateString('vi-VN')}</span>
                      <span className="italic text-[#8B5A2B]/70">(Bấm để xem lịch sử giong buồm)</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold text-[#8B5A2B] mb-1">Tiến độ</p>
                  <p className="text-2xl font-black text-[#5C3A21]">{task.progress || 0}%</p>
                </div>
              </div>

              {/* Progress Bar kiểu Vintage */}
              <div className="w-full h-3 bg-[#E8D4BB] rounded-full overflow-hidden border border-[#D2B48C]/50 ml-4 w-[calc(100%-1rem)] relative">
                <div 
                  className="h-full bg-gradient-to-r from-[#8B5A2B] to-[#5C3A21] transition-all duration-1000 ease-out"
                  style={{ width: `${task.progress || 0}%` }}
                />
                {/* Vintage overlay stripes trên thanh progress */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50" />
              </div>
            </div>
          ))
        )}
      </div>

      {isAddModalOpen && <AddTaskDialog onClose={() => setIsAddModalOpen(false)} onRefresh={loadTasks} type="long" userId={userId!} />} 
      {viewingTask && <TaskCommitHistoryDialog task={viewingTask} onClose={() => setViewingTask(null)} />}
    </div>
  );
}

