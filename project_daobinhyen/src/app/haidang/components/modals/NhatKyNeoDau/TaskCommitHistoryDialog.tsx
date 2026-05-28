'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, History, TrendingUp } from 'lucide-react';
import { TaskData, getCommitsByTask, CommitData } from '@/app/api/user/lighthouse/taskService';

interface Props {
  task: TaskData;
  onClose: () => void;
}

export default function TaskCommitHistoryDialog({ task, onClose }: Props) {
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (task.id) {
      getCommitsByTask(task.id)
        .then(res => setCommits(res))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [task.id]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#FFFBF5] rounded-xl shadow-2xl border-4 border-[#8B5A2B]/30 flex flex-col max-h-[85vh] overflow-hidden relative"
      >
        {/* Nền giấy da cổ điển cho modal */}
        <div className="absolute inset-0 bg-[#E8D4BB]/10 pointer-events-none" />

        <div className="relative flex justify-between items-start px-6 py-5 bg-[#5C3A21] text-[#FFFBF5] border-b-[3px] border-[#8B5A2B]">
          <div>
            <h2 className="text-2xl font-bold mb-1">{task.title}</h2>
            <div className="flex gap-4 text-xs text-[#D2B48C]">
              <span>Bắt đầu: {task.startDate.toDate().toLocaleDateString('vi-VN')}</span>
              <span>•</span>
              <span>Hạn chót: {task.endDate.toDate().toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg shrink-0">
            <X size={24} />
          </button>
        </div>

        <div className="relative flex-1 overflow-y-auto p-6 space-y-6">

          {/* Section: Mô tả */}
          {task.description && (
            <div className="bg-white/50 p-4 rounded-xl border border-[#D2B48C] shadow-sm">
              <h3 className="font-bold text-[#8B5A2B] mb-2 text-lg">Mục tiêu cốt lõi:</h3>
              <p className="text-[#5C3A21] whitespace-pre-wrap leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Section: Lịch sử Giong Buồm (Timeline) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <History className="text-[#8B5A2B]" size={20} />
              <h3 className="font-bold text-[#8B5A2B] text-lg">Lịch sử giong buồm (Commits)</h3>
            </div>

            <div className="bg-white/50 p-5 rounded-xl border border-[#D2B48C] shadow-sm min-h-[200px]">
              {loading ? (
                <p className="text-center text-[#8B5A2B]/60 italic py-8">Đang tìm các trang nhật ký cũ...</p>
              ) : commits.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#8B5A2B]/60 italic font-medium">Chưa có tiến trình nào được ghi lại.</p>
                  <p className="text-[#8B5A2B]/40 text-sm mt-1">Hãy sử dụng "La Bàn Tiến Độ" để neo lại kết quả nỗ lực của bạn.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-[#D2B48C] ml-3 pl-6 space-y-6">
                  {commits.map((commit, index) => (
                    <div key={commit.id || index} className="relative">
                      {/* Node tròn trên timeline */}
                      <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#8B5A2B] border-[3px] border-[#FFFBF5]" />

                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-[#5C3A21] text-lg">{commit.title}</h4>
                        <span className="text-xs font-semibold text-[#8B5A2B]/70 whitespace-nowrap bg-[#E8D4BB]/50 px-2 py-1 rounded">
                          {commit.createdAt.toDate().toLocaleString('vi-VN')}
                        </span>
                      </div>

                      {commit.description && (
                        <p className="text-sm text-[#5C3A21]/80 mb-3 bg-[#E8D4BB]/30 p-2 rounded-md">
                          {commit.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full inline-flex border border-emerald-200">
                        <TrendingUp size={14} />
                        Tăng từ {commit.oldProgress}% lên {commit.newProgress}% (+{commit.newProgress - commit.oldProgress}%)
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}

