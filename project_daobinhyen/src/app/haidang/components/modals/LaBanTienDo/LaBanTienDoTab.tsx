'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTasks, TaskData, getCommitsByTask, CommitData, addCommit, updateTask, addGold } from '@/app/api/user/lighthouse/taskService';
import { auth } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ArrowLeft, Compass, CheckCircle, TrendingUp } from 'lucide-react';
import CompassWidget from './CompassWidget';
import CommitProgressModal from './CommitProgressModal';

export default function LaBanTienDoTab() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(false);

  // Compass state
  const [currentSliderValue, setCurrentSliderValue] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goldRewardNotification, setGoldRewardNotification] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'completed' | 'missed'>('all');

  const filteredTasks = tasks.filter(t => filterStatus === 'all' || t.status === filterStatus);

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  // Audio refs
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const dragAudioRef = useRef<HTMLAudioElement | null>(null);
  const commitAudioRef = useRef<HTMLAudioElement | null>(null);
  const rewardAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Khởi tạo audio
    clickAudioRef.current = new Audio('/Lighthouse/SoundEffect/map-unroll.mp3');
    if (clickAudioRef.current) clickAudioRef.current.volume = 0.4;

    dragAudioRef.current = new Audio('/Lighthouse/SoundEffect/ticking.mp3');
    if (dragAudioRef.current) dragAudioRef.current.volume = 0.4;

    commitAudioRef.current = new Audio('/Lighthouse/SoundEffect/stamp-thump.mp3');
    if (commitAudioRef.current) commitAudioRef.current.volume = 0.4;

    rewardAudioRef.current = new Audio('/Lighthouse/SoundEffect/coins-jingle.mp3');
    if (rewardAudioRef.current) rewardAudioRef.current.volume = 0.4;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else setUserId('test-user-id');
    });
    return () => unsubscribe();
  }, []);

  const playClickSound = () => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play().catch(() => { });
    }
  };

  const playDragSound = () => {
    if (dragAudioRef.current && dragAudioRef.current.paused) {
      dragAudioRef.current.play().catch(() => { });
    }
  };

  const stopDragSound = () => {
    if (dragAudioRef.current) {
      dragAudioRef.current.pause();
      dragAudioRef.current.currentTime = 0;
    }
  };

  const loadTasks = async () => {
    if (!userId) return;
    setLoadingTasks(true);
    try {
      const data = await getTasks(userId, 'long');
      // Tự động xử lý trạng thái
      const now = new Date();
      const processedTasks = data.map(t => {
        if (t.status === 'in_progress') {
          if ((t.progress || 0) >= 100) {
            return { ...t, status: 'completed' as const };
          }
          const end = t.endDate.toDate();
          end.setHours(23, 59, 59, 999);
          if (end < now) {
            return { ...t, status: 'missed' as const };
          }
        }
        return t;
      });

      // Sắp xếp: task bị trễ hạn nằm dưới cùng
      processedTasks.sort((a, b) => {
        if (a.status === 'missed' && b.status !== 'missed') return 1;
        if (a.status !== 'missed' && b.status === 'missed') return -1;
        return 0;
      });

      setTasks(processedTasks);

      // Kiểm tra xem có task nào đang chờ xử lý từ tab khác không
      const pendingTaskId = localStorage.getItem('pending_compass_task_id');
      if (pendingTaskId) {
        const taskToSelect = processedTasks.find(t => t.id === pendingTaskId);
        if (taskToSelect) {
          setSelectedTask(taskToSelect);
          setCurrentSliderValue(taskToSelect.progress || 0);

          // Lấy commits của task đó
          setLoadingCommits(true);
          getCommitsByTask(taskToSelect.id!)
            .then(history => setCommits(history))
            .catch(console.error)
            .finally(() => setLoadingCommits(false));

          // Mở luôn modal - ĐÃ BỎ để ép người dùng tự kéo tiến độ
          // setIsModalOpen(true);
        }
        localStorage.removeItem('pending_compass_task_id');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (userId) loadTasks();
  }, [userId]);

  const handleSelectTask = async (task: TaskData) => {
    playClickSound();
    setSelectedTask(task);
    setCurrentSliderValue(task.progress || 0);
    setLoadingCommits(true);
    try {
      const history = await getCommitsByTask(task.id!);
      setCommits(history);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCommits(false);
    }
  };

  const handleBackToList = () => {
    playClickSound();
    setSelectedTask(null);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    const minValue = selectedTask?.progress || 0;
    // Chỉ cho tiến về phía trước, không cho kéo về sau
    if (newValue < minValue) return;
    setCurrentSliderValue(newValue);
    playDragSound();
  };

  const handleConfirmCommit = async (title: string, description: string) => {
    if (!selectedTask || !selectedTask.id || !userId) return;

    // Lưu history vào DB
    await addCommit({
      taskId: selectedTask.id,
      userId,
      title,
      description,
      oldProgress: selectedTask.progress || 0,
      newProgress: currentSliderValue
    });

    // Update the task progress
    await updateTask(selectedTask.id, {
      progress: currentSliderValue,
      status: currentSliderValue === 100 ? 'completed' : 'in_progress'
    });

    commitAudioRef.current?.play();

    // Cập nhật lại UI local
    const updatedTask = {
      ...selectedTask,
      progress: currentSliderValue,
      status: currentSliderValue === 100 ? 'completed' : 'in_progress' as any
    };

    // Nếu đạt 100%, thưởng vàng (Theo thời hạn)
    if (currentSliderValue === 100 && selectedTask.progress !== 100) {
      const start = selectedTask.startDate.toMillis();
      const end = selectedTask.endDate.toMillis();
      const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      const goldReward = Math.floor(200 + diffDays * 1.5);

      await addGold(userId, goldReward);
      rewardAudioRef.current?.play();
      setTimeout(() => {
        setGoldRewardNotification(goldReward);
      }, 500);
    }
    setSelectedTask(updatedTask);

    // Refresh danh sách mảng task gốc
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));

    // Lấy lại danh sách commits
    const newCommits = await getCommitsByTask(updatedTask.id!);
    setCommits(newCommits);

    setIsModalOpen(false);
  };

  return (
    <div className="flex h-full rounded-2xl overflow-hidden shadow-lg border border-[#D2B48C]">

      {/* ---------------- PART 2: CỘT BÊN TRÁI (LEFT 65%) ---------------- */}
      <div className="w-[65%] bg-gradient-to-br from-[#F5E6D3] to-[#E8D4BB] relative flex flex-col items-center justify-center border-r-2 border-[#D2B48C]/50">
        <AnimatePresence mode="wait">
          {!selectedTask ? (
            // Trạng thái: Chưa chọn task
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="text-center p-10 bg-white/40 backdrop-blur-sm rounded-3xl border-2 border-dashed border-[#8B5A2B]/40 max-w-md shadow-sm"
            >
              <Compass size={64} className="text-[#8B5A2B]/30 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-[#5C3A21] mb-2">La bàn đang bất động</h3>
              <p className="text-[#8B5A2B] italic">Vui lòng chọn một hải trình (bên phải) để kích hoạt kim chỉ nam và neo lại tiến trình của bạn.</p>
            </motion.div>
          ) : (
            // Trạng thái: Đã chọn task
            <motion.div
              key="active-state"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col relative"
            >
              {/* Nửa trên: Control Slider */}
              <div className="px-8 py-5 flex flex-col items-center bg-[#5C3A21] text-white shadow-xl z-10 rounded-b-[40px] shrink-0">
                <div className="flex justify-between items-center w-full max-w-lg mb-3">
                  <h2 className="text-xl font-bold text-center flex-1">{selectedTask.title}</h2>
                </div>

                {/* Custom Slider */}
                <div className="w-full max-w-lg mb-4 relative px-4">
                  <input
                    type="range"
                    min={selectedTask?.progress || 0}
                    max="100"
                    value={currentSliderValue}
                    onChange={handleSliderChange}
                    onMouseUp={stopDragSound}
                    onTouchEnd={stopDragSound}
                    disabled={selectedTask?.status === 'completed' || selectedTask?.status === 'missed'}
                    className="w-full h-2 bg-[#E8D4BB]/20 rounded-full appearance-none outline-none cursor-grab active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                      [&::-webkit-slider-thumb]:bg-[#D2B48C] [&::-webkit-slider-thumb]:rounded-full 
                      [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-[#FFFBF5] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                  />
                  {/* Trục hoành thông số */}
                  <div className="flex justify-between text-[10px] font-bold text-[#E8D4BB]/50 mt-1 px-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Progress Text & Update Button */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-[#E8D4BB]/70 font-semibold mb-[-2px]">Tiến độ dự định</p>
                    <p className="text-3xl font-black">{currentSliderValue}%</p>
                  </div>

                  {currentSliderValue !== (selectedTask.progress || 0) && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      onClick={() => {
                        playClickSound();
                        if (currentSliderValue === 100 && selectedTask) {
                          const start = selectedTask.startDate.toMillis();
                          const end = selectedTask.endDate.toMillis();
                          const requiredTime = start + (end - start) * 0.5;
                          if (Date.now() < requiredTime) {
                            setWarningMessage("Bạn chưa vượt qua 50% thời gian của hải trình này, không thể commit 100%!");
                            setShowWarningModal(true);
                            setCurrentSliderValue(selectedTask.progress || 0);
                            return;
                          }
                        }
                        setIsModalOpen(true);
                      }}
                      className="px-5 py-2 bg-[#D2B48C] text-[#5C3A21] font-bold rounded-full shadow-[0_4px_15px_rgba(210,180,140,0.4)] hover:bg-[#E8D4BB] hover:scale-105 transition flex items-center gap-2 text-sm"
                    >
                      <CheckCircle size={18} />
                      Ghi nhận Tiến độ
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Nửa dưới: La bàn trực quan */}
              <div className="flex-1 flex items-center justify-center relative bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiM1YzNhMjEiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] overflow-hidden py-4">
                <CompassWidget progress={currentSliderValue} />
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* ---------------- PART 1: CỘT BÊN PHẢI (RIGHT 35%) ---------------- */}
      <div className="w-[35%] bg-[#FFFBF5] flex flex-col relative overflow-hidden">

        {/* State 1: Danh sách Task (Chưa chọn) */}
        <AnimatePresence>
          {!selectedTask && (
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "tween" }}
              className="absolute inset-0 flex flex-col p-4"
            >
              <div className="mb-4 pb-3 border-b-2 border-[#D2B48C]/50 flex flex-col gap-3 text-[#5C3A21]">
                <div className="flex items-center gap-2">
                  <Compass size={24} />
                  <h3 className="text-xl font-bold">Chọn Hải Trình</h3>
                </div>
                {/* Filters */}
                <div className="flex bg-[#FFFBF5] rounded-lg p-1 shadow-sm border-2 border-[#D2B48C] self-start">
                  {(['all', 'in_progress', 'completed', 'missed'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition ${filterStatus === status
                        ? 'bg-[#8B5A2B] text-white shadow-sm'
                        : 'text-[#8B5A2B] hover:bg-[#E8D4BB]/50'
                        }`}
                    >
                      {status === 'all' ? 'Tất cả' : status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {loadingTasks ? (
                  <p className="text-center text-[#8B5A2B]/60 italic mt-10">Đang dò tìm hải trình...</p>
                ) : filteredTasks.length === 0 ? (
                  <p className="text-center text-[#8B5A2B]/60 mt-10">Không tìm thấy hải trình nào.</p>
                ) : (
                  filteredTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => {
                        if (task.status !== 'completed' && task.status !== 'missed') {
                          handleSelectTask(task);
                        }
                      }}
                      className={`border-2 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-[#8B5A2B] cursor-pointer transition flex items-center justify-between group ${task.status === 'completed' ? 'bg-[#e6efdd] border-[#4B5E4B]' :
                        task.status === 'missed' ? 'bg-[#f0e4e4] border-[#7a3e3e] opacity-80' :
                          'bg-white border-[#E8D4BB]'
                        }`}
                    >
                      <div className="w-[70%]">
                        <h4 className={`font-bold line-clamp-2 group-hover:text-[#8B5A2B] ${task.status === 'missed' ? 'text-[#7a3e3e] line-through' :
                          task.status === 'completed' ? 'text-[#4B5E4B]' :
                            'text-[#5C3A21]'
                          }`}>{task.title}</h4>
                        <p className="text-xs text-[#8B5A2B] mt-1">Độ khó: {task.difficulty === 'hard' ? 'Khó' : task.difficulty === 'medium' ? 'T.Bình' : 'Dễ'}</p>
                        {task.status === 'completed' && (
                          <span className="text-xs text-white bg-[#4B5E4B] px-2 py-0.5 rounded w-fit font-bold flex items-center gap-1 mt-1">
                            <CheckCircle size={12} /> Hoàn thành
                          </span>
                        )}
                        {task.status === 'missed' && (
                          <span className="text-xs text-white bg-[#7a3e3e] px-2 py-0.5 rounded w-fit font-bold mt-1 block">
                            ⚠ Trễ hạn
                          </span>
                        )}
                      </div>
                      <div className={`w-[50px] h-[50px] rounded-full border-4 flex items-center justify-center font-black text-sm ${task.status === 'completed' ? 'border-[#4B5E4B] text-[#4B5E4B] bg-[#e6efdd]' :
                        task.status === 'missed' ? 'border-[#7a3e3e] text-[#7a3e3e] bg-[#f0e4e4]' :
                          'border-[#D2B48C] text-[#5C3A21] bg-[#F5E6D3]'
                        }`}>
                        {task.progress || 0}%
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* State 2: Lịch sử Commit (Đã chọn) */}
        <AnimatePresence>
          {selectedTask && (
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "tween" }}
              className="absolute inset-0 flex flex-col bg-[#FFFBF5] z-10 shadow-[-10px_0_20px_rgba(0,0,0,0.05)]"
            >
              <div className="bg-[#5C3A21] text-[#FFFBF5] p-4 flex items-center gap-3 shadow-md z-20">
                <button
                  onClick={handleBackToList}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                  <p className="text-xs text-[#D2B48C] uppercase tracking-wider font-bold">Hải trình đang chọn</p>
                  <h3 className="font-bold text-lg leading-tight line-clamp-1">{selectedTask.title}</h3>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 bg-[#E8D4BB]/20 relative">
                <div className="flex items-center gap-2 mb-6 border-b border-[#D2B48C] pb-2 text-[#8B5A2B]">
                  <TrendingUp size={18} />
                  <h4 className="font-bold">Lịch sử giong buồm</h4>
                </div>

                {loadingCommits ? (
                  <p className="text-center text-[#8B5A2B]/60 italic mt-10">Đang tải lịch sử...</p>
                ) : commits.length === 0 ? (
                  <div className="text-center bg-white/50 border border-[#D2B48C]/50 p-6 rounded-xl">
                    <p className="text-[#8B5A2B] font-medium mb-2">Chưa giong buồm lần nào!</p>
                    <p className="text-sm text-[#8B5A2B]/60">Hãy kéo la bàn và ghi nhận tiến độ đầu tiên của bạn.</p>
                  </div>
                ) : (
                  <div className="relative border-l-[3px] border-[#8B5A2B]/30 ml-4 pl-6 space-y-6">
                    {commits.map((commit, idx) => (
                      <div key={commit.id || idx} className="relative">
                        {/* Timeline dot */}
                        <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#FFFBF5] border-[4px] border-[#8B5A2B] shadow-sm" />

                        <div className="bg-white border border-[#D2B48C] p-3 rounded-lg shadow-sm">
                          <div className="flex justify-between items-start mb-1">
                            <h5 className="font-bold text-[#5C3A21] text-sm">{commit.title}</h5>
                            <span className="text-[10px] text-[#8B5A2B] bg-[#E8D4BB] px-1.5 py-0.5 rounded-sm font-bold">
                              {commit.createdAt.toDate().toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          {commit.description && (
                            <p className="text-xs text-[#5C3A21]/80 mb-2 italic bg-black/5 p-2 rounded">"{commit.description}"</p>
                          )}
                          <div className="text-xs font-bold text-emerald-700">
                            Tiến độ: {commit.oldProgress}% ➔ {commit.newProgress}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isModalOpen && selectedTask && (
        <CommitProgressModal
          task={selectedTask}
          newProgress={currentSliderValue}
          onConfirm={handleConfirmCommit}
          onClose={() => setIsModalOpen(false)}
          playClickSound={playClickSound}
        />
      )}

      {/* Thông báo thưởng Vàng */}
      {goldRewardNotification !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#FFFBF5] p-6 rounded-2xl shadow-xl max-w-sm w-full text-center border-4 border-[#8B5A2B]/20">
            <h3 className="text-2xl font-bold text-[#5C3A21] mb-2">Vĩ đại quá Thuyền trưởng!</h3>
            <div className="bg-amber-100 text-amber-700 font-bold px-6 py-3 rounded-lg inline-block mb-4 text-xl">
              +{goldRewardNotification} Vàng 💰
            </div>
            <p className="text-[#8B5A2B] mb-6 font-medium">Bạn vừa hoàn thành xuất sắc một hải trình lớn. Hãy tiếp tục giong buồm chinh phục những chân trời mới nhé!</p>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setGoldRewardNotification(null);
                  window.dispatchEvent(new Event('GOLD_UPDATED'));
                }}
                className="px-8 py-2.5 font-bold bg-[#8B5A2B] text-white rounded-lg hover:bg-[#5C3A21] shadow-md transition"
              >
                Tuyệt vời
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#FFFBF5] p-6 rounded-2xl shadow-xl max-w-sm w-full text-center border-4 border-[#8B5A2B]/20">
            <h3 className="text-xl font-bold text-[#8B5A2B] mb-2">Cảnh báo</h3>
            <p className="text-[#5C3A21] mb-6">{warningMessage}</p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="px-6 py-2 font-bold bg-[#8B5A2B] text-white rounded-lg hover:bg-[#5C3A21] shadow-md transition"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
