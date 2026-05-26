'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getTasks, TaskData } from '@/app/api/user/lighthouse/taskService';
import { auth } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Anchor, Pickaxe, Map as MapIcon, Flag, TrendingUp, Calendar, FileText, CheckCircle, AlertOctagon } from 'lucide-react';

export default function HaiDoTuongLaiTab() {
  const [longTasks, setLongTasks] = useState<TaskData[]>([]);
  const [shortTasks, setShortTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const dateAudioRef = useRef<HTMLAudioElement | null>(null);
  const seagullAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    dateAudioRef.current = new Audio('/Lighthouse/SoundEffect/telescope-slide.mp3');
    if (dateAudioRef.current) dateAudioRef.current.volume = 0.4;

    seagullAudioRef.current = new Audio('/Lighthouse/SoundEffect/wave-crash.mp3');
    if (seagullAudioRef.current) seagullAudioRef.current.volume = 0.2;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else setUserId('test-user-id');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const [longData, shortData] = await Promise.all([
          getTasks(userId, 'long'),
          getTasks(userId, 'short')
        ]);

        const now = new Date();
        const processedShort = shortData.map(t => {
          if (t.status === 'in_progress') {
            const end = t.endDate.toDate();
            end.setHours(23, 59, 59, 999);
            if (end < now) {
              return { ...t, status: 'missed' as const };
            }
          }
          return t;
        });

        // Xử lý long tasks: 100% → completed, quá hạn → missed
        const processedLong = longData.map(t => {
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

        setLongTasks(processedLong);
        setShortTasks(processedShort);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (userId) loadData();
  }, [userId]);

  // Statistics calculations
  const totalShortCompleted = shortTasks.filter(t => t.status === 'completed').length;
  const totalShortInProgress = shortTasks.filter(t => t.status === 'in_progress').length;
  const totalShortMissed = shortTasks.filter(t => t.status === 'missed').length;

  const pieData = [
    { name: 'Xong', value: totalShortCompleted, color: '#10B981' },
    { name: 'Đang chạy', value: totalShortInProgress, color: '#3B82F6' },
    { name: 'Trễ hạn', value: totalShortMissed, color: '#EF4444' },
  ].filter(d => d.value > 0);

  const barData = longTasks.map(t => ({
    name: t.title.length > 10 ? t.title.substring(0, 10) + '...' : t.title,
    progress: t.progress || 0
  }));

  const allTasks = [...longTasks, ...shortTasks].sort((a, b) => a.endDate.toDate().getTime() - b.endDate.toDate().getTime());

  // Deadline tasks calculation
  const targetDateStart = new Date(selectedDate);
  targetDateStart.setHours(0, 0, 0, 0);
  const targetDateEnd = new Date(selectedDate);
  targetDateEnd.setHours(23, 59, 59, 999);

  const deadlineTasks = allTasks.filter(t => {
    const d = t.endDate.toDate();
    return d >= targetDateStart && d <= targetDateEnd;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-full text-[#8B5A2B] font-bold text-xl animate-pulse">Đang trải phẳng hải đồ...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#FFFBF5] rounded-xl overflow-hidden border border-[#D2B48C]">

      {/* Nửa trên: Visual Map (Quần đảo tiến độ) */}
      <div className="h-[45%] relative bg-[#a8d5e2] overflow-x-auto overflow-y-hidden shadow-inner border-b-4 border-[#8B5A2B]">
        {/* Background Waves */}
        <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMTBRNSAxNSAxMCAxMFQyMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=')] bg-repeat" />

        <div className="absolute top-4 left-4 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl font-bold text-[#5C3A21] flex items-center gap-2 shadow-sm border border-white">
          <MapIcon size={20} className="text-[#8B5A2B]" />
          Quần Đảo Hải Trình
        </div>

        <div className="h-full flex items-end px-10 pb-16 gap-16 w-max relative z-10 pt-16">
          {allTasks.length === 0 ? (
            <div className="text-[#5C3A21] font-bold text-xl self-center mx-auto opacity-70">Biển khơi tĩnh lặng. Chưa có hải trình nào...</div>
          ) : (
            allTasks.map((task, idx) => {
              let prog = task.progress || 0;
              let islandType = 'Hòn Đảo Mới Nổi';
              let IslandIcon = Pickaxe;
              let iconColor = 'text-gray-500';
              let scale = 0.8;

              if (task.type === 'short') {
                islandType = 'Mẩu Giấy Nhỏ';
                IslandIcon = FileText;
                if (task.status === 'completed') {
                  prog = 100;
                  iconColor = 'text-green-500';
                  scale = 1;
                } else if (task.status === 'missed') {
                  prog = 0;
                  iconColor = 'text-red-500';
                  scale = 0.8;
                } else {
                  prog = 50;
                  iconColor = 'text-blue-500';
                  scale = 0.9;
                }
              } else {
                if (task.status === 'missed') {
                  islandType = 'Hải Trình Thất Bại';
                  IslandIcon = AlertOctagon;
                  iconColor = 'text-red-500';
                  scale = 0.8;
                } else if (prog >= 100 || task.status === 'completed') {
                  islandType = 'Đảo Phồn Vinh';
                  IslandIcon = Flag;
                  iconColor = 'text-yellow-500';
                  scale = 1.2;
                } else if (prog >= 50) {
                  islandType = 'Đảo Đang Xây';
                  IslandIcon = Anchor;
                  iconColor = 'text-[#8B5A2B]';
                  scale = 1;
                }
              }

              return (
                <motion.div
                  key={task.id}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  onMouseEnter={() => {
                    if (seagullAudioRef.current) {
                      seagullAudioRef.current.currentTime = 0;
                      seagullAudioRef.current.play().catch(() => { });
                    }
                  }}
                  className="relative flex flex-col items-center group cursor-pointer"
                >
                  {/* Cột khói / Hiệu ứng (nếu 100%) */}
                  {prog >= 100 && (
                    <div className="absolute -top-10 w-2 h-10 bg-gradient-to-t from-yellow-300 to-transparent blur-sm animate-pulse" />
                  )}

                  {/* Icon nổi trên đảo */}
                  <div className={`mb-2 bg-white p-2 rounded-full shadow-lg border-2 border-white transform transition-transform group-hover:-translate-y-2 group-hover:scale-110 duration-300 z-10 ${iconColor}`}>
                    <IslandIcon size={24} />
                  </div>

                  {/* Đế Đảo (Base) */}
                  {task.type === 'short' ? (
                    <div
                      className="w-24 h-12 bg-gradient-to-b from-[#E8D4BB] to-[#D2B48C] rounded-full shadow-[0_8px_15px_rgba(0,0,0,0.2)] relative flex items-center justify-center border-b-4 border-[#8B5A2B]/40"
                      style={{ transform: `scale(${scale})` }}
                    >
                      <div className="absolute -inset-1 bg-white/30 rounded-full blur-sm" />
                      <span className="text-[#5C3A21] font-black text-xs z-10 drop-shadow-sm">{prog}%</span>
                    </div>
                  ) : (
                    <div
                      className="w-32 h-16 bg-gradient-to-b from-[#8B5A2B] to-[#5C3A21] rounded-[50%] shadow-[0_10px_20px_rgba(0,0,0,0.3)] relative flex items-center justify-center border-b-4 border-[#3A2211]"
                      style={{ transform: `scale(${scale})` }}
                    >
                      <div className="absolute -inset-2 bg-[#E8D4BB]/20 rounded-[50%] blur-md" />
                      <span className="text-white font-bold text-sm z-10 drop-shadow-md">{prog}%</span>
                    </div>
                  )}

                  {/* Bảng tên đảo */}
                  <div className="absolute top-full mt-4 bg-[#FFFBF5] border-2 border-[#D2B48C] px-3 py-1 rounded-md text-xs font-bold text-[#5C3A21] whitespace-nowrap shadow-md text-center">
                    <p className="line-clamp-1 max-w-[120px]">{task.title}</p>
                    <p className="text-[10px] text-[#8B5A2B] font-medium">{islandType}</p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Nửa dưới: Thống kê (Statistics) */}
      <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-[#FFFBF5] to-[#E8D4BB]/30">
        <h3 className="text-xl font-bold text-[#5C3A21] mb-6 flex items-center gap-2">
          <TrendingUp size={24} className="text-[#8B5A2B]" />
          Cuộn Giấy Chỉ Số
        </h3>

        <div className="grid grid-cols-2 gap-8 h-64 mb-8">
          {/* Biểu đồ tròn: Short Tasks */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#D2B48C] p-4 flex flex-col items-center justify-center relative">
            <h4 className="text-sm font-bold text-[#8B5A2B] absolute top-4 left-4">Tỷ lệ Mẩu giấy nhỏ</h4>
            {pieData.length === 0 ? (
              <p className="text-gray-400 italic text-sm">Chưa có dữ liệu</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '10px', borderColor: '#D2B48C', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            <div className="flex flex-wrap justify-center gap-4 text-xs font-bold mt-4 text-[#5C3A21]">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#10B981]"></span> Xong</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#3B82F6]"></span> Đang chạy</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#EF4444]"></span> Trễ</div>
            </div>
          </div>

          {/* Biểu đồ cột: Long Tasks */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#D2B48C] p-4 flex flex-col relative">
            <h4 className="text-sm font-bold text-[#8B5A2B] absolute top-4 left-4 z-10">Tốc độ Hải Trình Lớn</h4>
            {barData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center"><p className="text-gray-400 italic text-sm">Chưa có dữ liệu</p></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" className="mt-8">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8D4BB" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8B5A2B', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#8B5A2B' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <RechartsTooltip
                    cursor={{ fill: '#E8D4BB', opacity: 0.4 }}
                    contentStyle={{ borderRadius: '10px', borderColor: '#D2B48C', fontWeight: 'bold', color: '#5C3A21' }}
                  />
                  <Bar dataKey="progress" fill="#8B5A2B" radius={[4, 4, 0, 0]} barSize={30}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.progress === 100 ? '#F59E0B' : '#8B5A2B'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="flex justify-center gap-4 text-xs font-bold mt-2 text-[#5C3A21]">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#8B5A2B]"></span> Đang chạy</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span> Hoàn tất</div>
            </div>
          </div>
        </div>

        {/* Khối nhiệm vụ hết hạn trong ngày */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#D2B48C] p-5">
          <div className="flex items-center justify-between mb-4 border-b border-[#E8D4BB] pb-3">
            <h4 className="text-lg font-bold text-[#5C3A21] flex items-center gap-2">
              <Calendar size={20} className="text-[#8B5A2B]" />
              Sổ tay hạn chót
            </h4>
            <div className="flex items-center gap-2 text-sm font-bold text-[#8B5A2B]">
              <label>Ngày:</label>
              <input
                type="date"
                value={selectedDate}
                onClick={() => {
                  if (dateAudioRef.current) {
                    dateAudioRef.current.currentTime = 0;
                    dateAudioRef.current.play().catch(() => { });
                    setTimeout(() => dateAudioRef.current?.pause(), 1000);
                  }
                }}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#FFFBF5] border border-[#D2B48C] rounded-lg px-2 py-1 outline-none text-[#5C3A21] cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {deadlineTasks.length === 0 ? (
              <p className="text-gray-400 italic text-sm col-span-full">Không có nhiệm vụ nào phải nộp trong ngày này.</p>
            ) : (
              deadlineTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-[#FFFBF5] rounded-xl border border-[#E8D4BB] shadow-sm hover:border-[#8B5A2B] transition">
                  {task.status === 'completed' ? (
                    <CheckCircle className="text-green-500 shrink-0" size={20} />
                  ) : task.status === 'missed' ? (
                    <AlertOctagon className="text-red-500 shrink-0" size={20} />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-blue-400 bg-blue-50 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#5C3A21] text-sm truncate">{task.title}</p>
                    <p className="text-[10px] font-bold text-[#8B5A2B] mt-0.5">
                      {task.startDate.toDate().toLocaleDateString('vi-VN')} - {task.endDate.toDate().toLocaleDateString('vi-VN')} | <span className="uppercase">{task.type === 'short' ? 'Mẩu giấy nhỏ' : 'Hải trình lớn'}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
