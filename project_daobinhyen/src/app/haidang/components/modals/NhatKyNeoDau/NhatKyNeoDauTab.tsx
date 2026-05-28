'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'completed' | 'missed'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const pageTurnAudioRef = useRef<HTMLAudioElement | null>(null);
  const deleteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    pageTurnAudioRef.current = new Audio('/Lighthouse/SoundEffect/page-turn.mp3');
    if (pageTurnAudioRef.current) pageTurnAudioRef.current.volume = 0.4;
    
    deleteAudioRef.current = new Audio('/Lighthouse/SoundEffect/hit-table.mp3');
    if (deleteAudioRef.current) deleteAudioRef.current.volume = 0.4;

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
      const data = await getTasks(userId, 'long');
      const now = new Date();
      const processedTasks = data.map(t => {
        if (t.status === 'in_progress') {
          const end = t.endDate.toDate();
          end.setHours(23, 59, 59, 999);
          if (end < now) {
            return { ...t, status: 'missed' as const };
          }
        }
        return t;
      });
      setTasks(processedTasks);
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

  const handleDeleteSelected = () => {
    if (selectedTaskIds.size === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    deleteAudioRef.current?.play();
    await deleteMultipleTasks(Array.from(selectedTaskIds));
    setSelectedTaskIds(new Set());
    setShowDeleteConfirm(false);
    loadTasks();
  };

  const stats = {
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    missed: tasks.filter(t => t.status === 'missed').length
  };

  const filteredTasks = tasks.filter(t => filterStatus === 'all' || t.status === filterStatus);

  const DynamicIcon = ({ name, size = 20 }: { name: string, size?: number }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (LucideIcons as any)[name] || LucideIcons.Compass;
    return <IconComponent size={size} />;
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* 3 Thông số trạng thái (Vintage Style) */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#FFFBF5] p-4 rounded-xl border border-[#D2B48C] shadow-sm flex items-center gap-3">
          <div className="p-3 bg-[#E8D4BB]/50 text-[#8B5A2B] rounded-lg"><LucideIcons.Clock size={24} /></div>
          <div>
            <p className="text-sm text-[#8B5A2B] font-medium">Đang neo đậu</p>
            <p className="text-2xl font-bold text-[#5C3A21]">{stats.inProgress}</p>
          </div>
        </div>
        <div className="bg-[#FFFBF5] p-4 rounded-xl border border-[#D2B48C] shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-100/50 text-emerald-700 rounded-lg"><LucideIcons.CheckCircle size={24} /></div>
          <div>
            <p className="text-sm text-emerald-700 font-medium">Đã cập bến</p>
            <p className="text-2xl font-bold text-[#5C3A21]">{stats.completed}</p>
          </div>
        </div>
        <div className="bg-[#FFFBF5] p-4 rounded-xl border border-[#D2B48C] shadow-sm flex items-center gap-3">
          <div className="p-3 bg-red-100/50 text-red-700 rounded-lg"><LucideIcons.AlertOctagon size={24} /></div>
          <div>
            <p className="text-sm text-red-700 font-medium">Trễ hẹn</p>
            <p className="text-2xl font-bold text-[#5C3A21]">{stats.missed}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center bg-black/5 p-3 rounded-lg border border-[#D2B48C]/30">
        <div className="flex gap-4 items-center">
          <div className="flex bg-[#FFFBF5] rounded-lg p-1 shadow-sm border border-[#D2B48C]">
            {(['all', 'in_progress', 'completed', 'missed'] as const).map(status => (
              <button
                key={status}
                onClick={() => { pageTurnAudioRef.current?.play(); setFilterStatus(status); }}
                className={`px-4 py-1.5 rounded-md text-sm font-bold capitalize transition ${
                  filterStatus === status 
                    ? 'bg-[#8B5A2B] text-white shadow-sm' 
                    : 'text-[#8B5A2B] hover:bg-[#E8D4BB]/30'
                }`}
              >
                {status === 'all' ? 'Tất cả' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
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
        </div>
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
        ) : filteredTasks.length === 0 ? (
          <p className="text-center p-8 text-[#8B5A2B]/60 italic text-lg text-center">Trang giấy chưa có nét mực nào.<br/>Hãy đặt bút vạch ra hải trình đầu tiên!</p>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id}
              onClick={() => { pageTurnAudioRef.current?.play(); setViewingTask(task); }}
              className={`bg-[#FFFBF5] border-2 border-[#D2B48C] p-4 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer flex flex-col gap-3 relative overflow-hidden group ${task.status === 'missed' ? 'opacity-70 grayscale-[30%]' : ''}`}
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
                    <h3 className={`font-bold text-xl flex items-center gap-2 ${task.status === 'missed' ? 'text-gray-500 line-through' : 'text-[#5C3A21]'}`}>
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
                      <span className={task.status === 'missed' ? 'text-red-600 font-bold' : 'text-[#8B5A2B]'}>Hạn: {task.endDate.toDate().toLocaleDateString('vi-VN')}</span>
                      
                      {task.status === 'completed' && (
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <LucideIcons.CheckCircle size={14} /> Hoàn thành
                        </span>
                      )}
                      {task.status === 'missed' && (
                        <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <LucideIcons.AlertOctagon size={14} /> Bị trễ
                        </span>
                      )}
                      
                      <span className="italic text-[#8B5A2B]/70">(Bấm để xem chi tiết)</span>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#FFFBF5] p-6 rounded-2xl shadow-xl max-w-md w-full text-center border-4 border-[#8B5A2B]/20">
            <h3 className="text-2xl font-bold text-red-800 mb-2 font-serif">Cảnh báo hủy bỏ!</h3>
            <p className="text-[#8B5A2B] mb-6 font-medium">Bạn có chắc chắn muốn vĩnh viễn hủy bỏ {selectedTaskIds.size} hải trình lớn này? Việc này sẽ đồng thời xóa toàn bộ các <b>Mẩu giấy nhỏ</b> (Task ngắn hạn) đang được liên kết với chúng!</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 font-bold text-[#8B5A2B] hover:bg-[#8B5A2B]/10 rounded-lg transition"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 font-bold bg-red-800 text-white rounded-lg hover:bg-red-900 shadow-md transition flex items-center gap-2"
              >
                <Trash2 size={18} /> Đồng ý Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

