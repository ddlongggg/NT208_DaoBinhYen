'use client';

import React, { useState, useEffect } from 'react';
import { getTasks, deleteTask, TaskData, deleteMultipleTasks } from '@/services/firebase/taskService';
import { auth } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Trash2, Plus, Clock, CheckCircle, AlertOctagon, MoreVertical } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import AddTaskDialog from './AddTaskDialog';

export default function MauGiayNhoTab() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        // Fallback for test
        setUserId('test-user-id');
      }
    });
    return () => unsubscribe();
  }, []);

  const loadTasks = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getTasks(userId, 'short');
      // Tự động kiểm tra missed task
      const now = new Date();
      const processedTasks = data.map(t => {
        if (t.status === 'in_progress' && t.endDate.toDate() < now) {
          return { ...t, status: 'missed' as const };
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

  const stats = {
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    missed: tasks.filter(t => t.status === 'missed').length
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedTaskIds(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedTaskIds.size === 0) return;
    if (confirm(`Bạn muốn xoá vĩnh viễn ${selectedTaskIds.size} task ngắn hạn này?`)) {
      await deleteMultipleTasks(Array.from(selectedTaskIds));
      setSelectedTaskIds(new Set());
      loadTasks();
    }
  };

  const DynamicIcon = ({ name, size = 18 }: { name: string, size?: number }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (LucideIcons as any)[name] || LucideIcons.FileText;
    return <IconComponent size={size} />;
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* 3 Thông số trạng thái */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/60 p-4 rounded-xl border border-blue-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Clock size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Đang thực hiện</p>
            <p className="text-2xl font-bold text-gray-800">{stats.inProgress}</p>
          </div>
        </div>
        <div className="bg-white/60 p-4 rounded-xl border border-green-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Đã hoàn thành</p>
            <p className="text-2xl font-bold text-gray-800">{stats.completed}</p>
          </div>
        </div>
        <div className="bg-white/60 p-4 rounded-xl border border-red-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg"><AlertOctagon size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Bị Miss</p>
            <p className="text-2xl font-bold text-gray-800">{stats.missed}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center bg-black/5 p-3 rounded-lg">
        <div className="flex gap-2">
          <button 
            onClick={handleDeleteSelected}
            disabled={selectedTaskIds.size === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              selectedTaskIds.size > 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Trash2 size={18} />
            Xóa ({selectedTaskIds.size})
          </button>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2 bg-[#8B5A2B] text-white rounded-lg font-medium hover:bg-[#5C3A21] transition shadow-md"
        >
          <Plus size={18} />
          Đặt Task Mới
        </button>
      </div>

      {/* Danh sách Task */}
      <div className="flex-1 bg-white/50 backdrop-blur-sm rounded-xl border border-[#D2B48C] overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#D2B48C] font-semibold text-[#8B5A2B] bg-[#E8D4BB]">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4">Tên Task</div>
          <div className="col-span-3">Task Lớn (Link)</div>
          <div className="col-span-2 text-center">Độ khó</div>
          <div className="col-span-2 text-center">Trạng thái</div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loading ? (
            <p className="text-center p-8 text-gray-500">Đang tải dữ liệu...</p>
          ) : tasks.length === 0 ? (
            <p className="text-center p-8 text-gray-500 font-medium">Chưa có mẩu giấy nhiệm vụ nào. Hãy tạo một task mới!</p>
          ) : (
            tasks.map(task => (
              <div 
                key={task.id}
                className="grid grid-cols-12 gap-4 p-4 items-center bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <div /* Checkbox stop propagation */
                  className="col-span-1 flex justify-center" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded text-[#8B5A2B] focus:ring-[#8B5A2B]"
                    checked={selectedTaskIds.has(task.id!)}
                    onChange={() => toggleSelect(task.id!)}
                  />
                </div>
                
                {/* Tên Task & Icon */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 text-[#8B5A2B]">
                    <DynamicIcon name={task.icon || 'FileText'} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 line-clamp-1">{task.title}</h4>
                    <p className="text-xs text-gray-500">Hạn: {task.endDate.toDate().toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>

                <div className="col-span-3">
                  {task.longTaskId ? (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold whitespace-nowrap">Đã Link Task Lớn</span>
                  ) : (
                    <span className="text-gray-400 text-sm italic">Không có</span>
                  )}
                </div>

                <div className="col-span-2 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    task.difficulty === 'hard' ? 'bg-orange-100 text-orange-600' :
                    task.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {task.difficulty === 'hard' ? 'Khó' : task.difficulty === 'medium' ? 'T.Bình' : 'Dễ'}
                  </span>
                </div>

                <div className="col-span-2 flex justify-center">
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1 ${
                    task.status === 'completed' ? 'text-green-600 bg-green-50' : 
                    task.status === 'missed' ? 'text-red-500 bg-red-50' : 'text-blue-500 bg-blue-50'
                  }`}>
                    {task.status === 'completed' ? 'Xong' : task.status === 'missed' ? 'Trễ' : 'Đang chạy'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isAddModalOpen && <AddTaskDialog onClose={() => setIsAddModalOpen(false)} onRefresh={loadTasks} type="short" userId={userId!} />}
    </div>
  );
}
