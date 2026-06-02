'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getTasks, deleteTask, TaskData, deleteMultipleTasks, updateTask, addGold } from '@/app/api/user/lighthouse/taskService';
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'completed' | 'missed'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{ message: string, gold: number } | null>(null);

  const deleteAudioRef = useRef<HTMLAudioElement | null>(null);
  const checkAudioRef = useRef<HTMLAudioElement | null>(null);
  const pageTurnAudioRef = useRef<HTMLAudioElement | null>(null);
  const rewardAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    deleteAudioRef.current = new Audio('/Lighthouse/SoundEffect/paper-crumple.mp3');
    if (deleteAudioRef.current) deleteAudioRef.current.volume = 0.4;

    checkAudioRef.current = new Audio('/Lighthouse/SoundEffect/pen-scratch-check.mp3');
    if (checkAudioRef.current) checkAudioRef.current.volume = 0.4;

    pageTurnAudioRef.current = new Audio('/Lighthouse/SoundEffect/page-turn.mp3');
    if (pageTurnAudioRef.current) pageTurnAudioRef.current.volume = 0.4;

    rewardAudioRef.current = new Audio('/Lighthouse/SoundEffect/coins-jingle.mp3');
    if (rewardAudioRef.current) rewardAudioRef.current.volume = 0.4;

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

  const [promptLinkedTask, setPromptLinkedTask] = useState<{ task: TaskData, gold: number } | null>(null);

  const filteredTasks = tasks.filter(t => filterStatus === 'all' || t.status === filterStatus);

  const handleCompleteTask = async (task: TaskData, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;

    // Check 3/4 time logic
    const start = task.startDate.toMillis();
    const end = task.endDate.toMillis();
    const duration = end - start;
    const requiredTime = start + (duration * 0.75);
    const now = Date.now();

    if (now < requiredTime) {
      return; // Khóa UI thay vì alert
    }

    checkAudioRef.current?.play();

    // 1. Cập nhật status
    await updateTask(task.id!, { status: 'completed' });

    // 2. Thưởng vàng theo ngày (1 ngày = 60, 2 ngày = 80, >=3 ngày = 100)
    const diffDays = Math.max(1, Math.ceil(duration / (1000 * 60 * 60 * 24)));
    const goldReward = diffDays === 1 ? 60 : diffDays === 2 ? 80 : 100;

    await addGold(userId, goldReward);

    loadTasks();

    // 3. Nhắc nhở task lớn
    if (task.longTaskId) {
      setPromptLinkedTask({ task, gold: goldReward });
    } else {
      setSuccessMessage({ message: "Hoàn thành xuất sắc!", gold: goldReward });
      rewardAudioRef.current?.play();
      // Update global gold UI via event
      window.dispatchEvent(new Event('GOLD_UPDATED'));
    }
  };

  const handleGoToCompass = () => {
    if (promptLinkedTask?.task.longTaskId) {
      localStorage.setItem('pending_compass_task_id', promptLinkedTask.task.longTaskId);
      window.dispatchEvent(new CustomEvent('SWITCH_LIGHTHOUSE_TAB', { detail: { tab: 'la-ban' } }));
    }
    setPromptLinkedTask(null);
    window.dispatchEvent(new Event('GOLD_UPDATED'));
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
        <div className="flex gap-4 items-center">
          <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            {(['all', 'in_progress', 'completed', 'missed'] as const).map(status => (
              <button
                key={status}
                onClick={() => { pageTurnAudioRef.current?.play(); setFilterStatus(status); }}
                className={`px-4 py-1.5 rounded-md text-sm font-bold capitalize transition ${filterStatus === status
                  ? 'bg-[#8B5A2B] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'
                  }`}
              >
                {status === 'all' ? 'Tất cả' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedTaskIds.size === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${selectedTaskIds.size > 0 ? 'bg-[#8B5A2B]/80 text-white hover:bg-[#5C3A21]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            <Trash2 size={18} />
            Hủy bỏ ({selectedTaskIds.size})
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
          <div className="col-span-2">Task Lớn (Link)</div>
          <div className="col-span-2 text-center">Độ khó</div>
          <div className="col-span-3 text-center">Hành động</div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loading ? (
            <p className="text-center p-8 text-gray-500">Đang tải dữ liệu...</p>
          ) : filteredTasks.length === 0 ? (
            <p className="text-center p-8 text-gray-500 font-medium">Không tìm thấy mẩu giấy nào.</p>
          ) : (
            filteredTasks.map(task => {
              const start = task.startDate.toMillis();
              const end = task.endDate.toMillis();
              const requiredTime = start + ((end - start) * 0.75);
              const isReady = Date.now() >= requiredTime;

              return (
                <div
                  key={task.id}
                  className={`grid grid-cols-12 gap-4 p-4 items-center bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer ${task.status === 'missed' ? 'opacity-70 grayscale-[30%]' : ''}`}
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
                      <h4 className={`font-bold line-clamp-1 ${task.status === 'missed' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{task.title}</h4>
                      <p className={`text-xs ${task.status === 'missed' ? 'text-red-400 font-bold' : 'text-gray-500'}`}>Hạn: {task.endDate.toDate().toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>

                  <div className="col-span-2">
                    {task.longTaskId ? (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold whitespace-nowrap">Đã Link Task Lớn</span>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Không có</span>
                    )}
                  </div>

                  <div className="col-span-2 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${task.difficulty === 'hard' ? 'bg-orange-100 text-orange-600' :
                      task.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                      }`}>
                      {task.difficulty === 'hard' ? 'Khó' : task.difficulty === 'medium' ? 'T.Bình' : 'Dễ'}
                    </span>
                  </div>

                  <div className="col-span-3 flex justify-center items-center gap-2">
                    {task.status === 'completed' ? (
                      <span className="text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1">
                        <CheckCircle size={16} /> Xong
                      </span>
                    ) : task.status === 'missed' ? (
                      <span className="text-red-500 bg-red-50 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1">
                        <AlertOctagon size={16} /> Bị trễ
                      </span>
                    ) : (
                      <div className="relative group/btn">
                        <button
                          onClick={(e) => isReady ? handleCompleteTask(task, e) : e.stopPropagation()}
                          disabled={!isReady}
                          className={`px-4 py-1.5 font-bold rounded-lg transition shadow-sm flex items-center gap-2 text-sm ${isReady
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : "bg-gray-300 text-gray-500 opacity-50 cursor-not-allowed"
                            }`}
                        >
                          <CheckCircle size={16} />
                          Hoàn thành
                        </button>
                        {!isReady && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-2 bg-black/80 text-white text-xs font-semibold rounded-md opacity-0 group-hover/btn:opacity-100 transition pointer-events-none z-10 shadow-lg">
                            Bạn phải đợi qua 3/4 thời gian<br />mới có thể hoàn thành mẩu giấy này.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-black/80"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isAddModalOpen && <AddTaskDialog onClose={() => setIsAddModalOpen(false)} onRefresh={loadTasks} type="short" userId={userId!} />}

      {/* Prompt Modal */}
      {promptLinkedTask && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#FFFBF5] p-6 rounded-2xl shadow-xl max-w-sm w-full text-center border-4 border-[#8B5A2B]/20">
            <h3 className="text-2xl font-bold text-[#5C3A21] mb-2 font-serif">Tuyệt vời!</h3>
            <div className="bg-amber-100 text-amber-700 font-bold px-4 py-2 rounded-lg inline-block mb-4">
              +{promptLinkedTask.gold} Tiền 💰
            </div>
            <p className="text-[#8B5A2B] mb-6 font-medium">Bạn vừa hoàn thành một bước đệm thuộc về hải trình lớn. Bạn có muốn mở La Bàn để ghi nhận tiến độ cho hải trình lớn ngay bây giờ không?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setPromptLinkedTask(null); window.dispatchEvent(new Event('GOLD_UPDATED')); }}
                className="px-4 py-2 font-bold text-[#8B5A2B] hover:bg-[#8B5A2B]/10 rounded-lg transition"
              >
                Để sau
              </button>
              <button
                onClick={handleGoToCompass}
                className="px-5 py-2 font-bold bg-[#8B5A2B] text-white rounded-lg hover:bg-[#5C3A21] shadow-md transition"
              >
                Giong buồm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Success Modal */}
      {successMessage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#FFFBF5] p-6 rounded-2xl shadow-xl max-w-sm w-full text-center border-4 border-[#8B5A2B]/20">
            <h3 className="text-2xl font-bold text-[#5C3A21] mb-2 font-serif">Xuất Sắc!</h3>
            <div className="bg-amber-100 text-amber-700 font-bold px-4 py-2 rounded-lg inline-block mb-4">
              +{successMessage.gold} Tiền 💰
            </div>
            <p className="text-[#8B5A2B] mb-6 font-medium">{successMessage.message}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="px-6 py-2 font-bold bg-[#8B5A2B] text-white rounded-lg hover:bg-[#5C3A21] shadow-md transition"
            >
              Tiếp tục
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#FFFBF5] p-6 rounded-2xl shadow-xl max-w-sm w-full text-center border-4 border-[#8B5A2B]/20">
            <h3 className="text-xl font-bold text-[#8B5A2B] mb-2 font-serif">Hủy bỏ Mẩu giấy?</h3>
            <p className="text-[#5C3A21] mb-6 font-medium">Bạn có chắc chắn muốn vĩnh viễn vứt bỏ {selectedTaskIds.size} mẩu giấy ngắn hạn này không?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 font-bold text-[#8B5A2B] hover:bg-[#8B5A2B]/10 rounded-lg transition"
              >
                Giữ lại
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 font-bold bg-[#8B5A2B]/80 text-white rounded-lg hover:bg-[#5C3A21] shadow-md transition flex items-center gap-2"
              >
                <Trash2 size={18} /> Vứt bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
