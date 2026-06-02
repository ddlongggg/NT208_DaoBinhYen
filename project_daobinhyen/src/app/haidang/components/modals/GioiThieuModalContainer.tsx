'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  BookOpen, 
  Map, 
  FileText, 
  Compass, 
  Hourglass, 
  Radio, 
  ArrowLeft, 
  ArrowRight, 
  ChevronRight, 
  Anchor, 
  Sparkles,
  Info
} from 'lucide-react';

interface GioiThieuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PageId = 1 | 2 | 3 | 4;

export default function GioiThieuModalContainer({ isOpen, onClose }: GioiThieuModalProps) {
  const [currentPage, setCurrentPage] = useState<PageId>(1);

  if (!isOpen) return null;

  const totalPages = 4;

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => (prev + 1) as PageId);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => (prev - 1) as PageId);
    }
  };

  // Trang trí phong cách cổ điển
  const BookDecoration = () => (
    <div className="absolute inset-0 pointer-events-none border-2 border-[#8B5A2B]/20 m-2 rounded-xl">
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#8B5A2B]/40"></div>
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#8B5A2B]/40"></div>
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#8B5A2B]/40"></div>
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#8B5A2B]/40"></div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="vietnamese-font relative w-full max-w-5xl h-[85vh] md:h-[80vh] bg-[#3E2723] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col border-8 border-[#5C3A21] p-1 md:p-3"
      >
        {/* Nút Đóng */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-[#5C3A21]/80 hover:bg-[#8B5A2B] rounded-full transition-all duration-300 shadow-md border border-[#D2B48C]/40 group"
        >
          <X size={20} className="text-[#F5E6D3] group-hover:scale-110 transition-transform" />
        </button>

        {/* Khung Gáy Sách Ở Giữa (Chỉ hiển thị trên màn hình máy tính lớn) */}
        <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-1.5 bg-gradient-to-r from-[#2D1A12] via-[#5C3A21] to-[#2D1A12] shadow-inner z-30 transform -translate-x-1/2 rounded-full opacity-60"></div>

        {/* PHẦN THÂN CUỐN SÁCH */}
        <div className="flex-1 flex flex-col md:flex-row bg-[#F5E6D3] rounded-2xl overflow-hidden relative shadow-inner">
          <BookDecoration />

          {/* ================= TRANG TRÁI: CỐ ĐỊNH (MỤC LỤC / LỜI MỞ ĐẦU) ================= */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col border-b md:border-b-0 md:border-r border-[#8B5A2B]/20 relative z-10 select-none">
            {/* Tiêu đề chính sách cổ */}
            <div className="text-center mb-6">
              <span className="text-xs uppercase tracking-widest text-[#8B5A2B] font-bold flex items-center justify-center gap-1.5">
                <Sparkles size={12} className="text-amber-600" /> Sổ Tay Hải Trình <Sparkles size={12} className="text-amber-600" />
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-[#5C3A21] mt-1 font-sans tracking-wide border-b-2 border-[#8B5A2B]/30 pb-3 inline-block">
                CẨM NANG HẢI ĐĂNG
              </h2>
            </div>

            {/* Lời tựa lãng mạn */}
            <div className="flex-1 flex flex-col justify-center bg-[#E8D4BB]/30 p-4 md:p-5 rounded-2xl border border-[#8B5A2B]/10 shadow-inner mb-6">
              <p className="text-[#5C3A21] text-sm md:text-base leading-relaxed italic text-justify font-sans font-medium">
                "Chào mừng bạn đến với ngọn Hải đăng – thánh đường của sự tập trung và chốn neo đậu bình yên của những kẻ lữ hành tri thức. Giữa đại dương bài tập và công việc bao la, nơi đây là ngọn hải đăng soi đường giúp bạn vượt qua những cơn bão xao nhãng. Hãy mở từng trang sổ để thấu hiểu cách vận hành của các công cụ kỳ diệu nơi đây..."
              </p>
              <div className="mt-4 text-right">
                <span className="text-xs font-bold text-[#8B5A2B] tracking-wider uppercase">— Người Gác Ngọn Tháp</span>
              </div>
            </div>

            {/* Danh mục (Mục lục liên kết nhanh) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#8B5A2B] mb-3">Mục Lục Cẩm Nang</h3>
              <div className="space-y-2">
                {[
                  { id: 2, label: "Tầng 1: Hải đồ tương lai & Mẩu giấy nhỏ" },
                  { id: 3, label: "Tầng 1: Nhật ký neo đậu & La bàn tiến độ" },
                  { id: 4, label: "Tầng 2: Đồng hồ tập trung & Radio chữa lành" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id as PageId)}
                    className={`w-full flex items-center justify-between text-left p-2.5 rounded-xl transition-all duration-300 text-xs md:text-sm font-semibold border ${
                      currentPage === item.id 
                        ? 'bg-[#5C3A21] text-[#F5E6D3] border-[#5C3A21] shadow-md' 
                        : 'bg-white/40 text-[#5C3A21] border-transparent hover:bg-white/70 hover:border-[#8B5A2B]/20'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ChevronRight size={14} className={currentPage === item.id ? "text-amber-300 animate-pulse" : "text-[#8B5A2B]"} />
                      {item.label}
                    </span>
                    <span className="text-[10px] font-mono opacity-80">Tr.0{item.id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ================= TRANG PHẢI: THAY ĐỔI ĐỘNG (CHI TIẾT MODULES) ================= */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between relative z-10 min-h-0 bg-[#F5E6D3]">
            {/* Nội dung thay đổi mượt mà theo trang */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {currentPage === 1 && (
                    <div className="space-y-4 py-4 md:py-8 text-center flex flex-col items-center justify-center h-full">
                      <div className="w-16 h-16 rounded-full bg-[#E8D4BB] flex items-center justify-center border border-[#8B5A2B]/30 shadow-lg text-[#5C3A21] mb-4">
                        <BookOpen size={32} className="animate-pulse" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-[#5C3A21] font-sans">Khám Phá Hải Trình</h3>
                      <p className="text-sm text-[#8B5A2B] leading-relaxed max-w-sm">
                        Hãy nhấp vào các mục lục ở trang bên trái hoặc bấm nút lật trang phía dưới để tìm hiểu chi tiết các công cụ thần kỳ trong Hải đăng.
                      </p>
                      <button
                        onClick={nextPage}
                        className="mt-4 flex items-center gap-2 bg-[#5C3A21] hover:bg-[#4A2E1A] text-white px-5 py-2 rounded-full font-bold shadow-md transition-colors text-sm"
                      >
                        Bắt đầu lật sách <ArrowRight size={16} />
                      </button>
                    </div>
                  )}

                  {currentPage === 2 && (
                    <div className="space-y-5">
                      <div className="border-b border-[#8B5A2B]/20 pb-3">
                        <span className="text-[10px] font-bold text-amber-700 tracking-widest uppercase">Trang 02 • Tầng 1</span>
                        <h3 className="text-lg md:text-xl font-black text-[#5C3A21] font-sans mt-1">BẢN ĐỒ HÀNH TRÌNH (PHẦN A)</h3>
                      </div>

                      {/* Hải đồ tương lai */}
                      <div className="bg-[#E8D4BB]/30 p-4 rounded-2xl border border-[#8B5A2B]/10 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-xl bg-amber-700/10 flex items-center justify-center text-amber-800 border border-amber-700/20">
                            <Map size={20} />
                          </div>
                          <h4 className="font-extrabold text-[#5C3A21] text-sm md:text-base">Hải đồ tương lai (Daily Tasks)</h4>
                        </div>
                        <p className="text-xs md:text-sm text-[#5C3A21]/95 leading-relaxed pl-12 text-justify">
                          Là tấm bản đồ tổng quan quy hoạch toàn bộ tiến độ học tập hàng ngày. Nơi thống kê tất cả các nhiệm vụ kèm theo hạn chót (deadline) rõ ràng, giúp bạn dễ dàng theo dõi và sắp xếp thời gian hợp lý mà không lo quên sót.
                        </p>
                      </div>

                      {/* Mẩu giấy nhỏ */}
                      <div className="bg-[#E8D4BB]/30 p-4 rounded-2xl border border-[#8B5A2B]/10 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-xl bg-blue-700/10 flex items-center justify-center text-blue-800 border border-blue-700/20">
                            <FileText size={20} />
                          </div>
                          <h4 className="font-extrabold text-[#5C3A21] text-sm md:text-base">Mẩu giấy nhỏ (Quick Notes)</h4>
                        </div>
                        <p className="text-xs md:text-sm text-[#5C3A21]/95 leading-relaxed pl-12 text-justify">
                          Bảng ghi chú nhanh dành riêng cho các đầu việc phát sinh, nhỏ nhặt hoặc tức thì xuất hiện trong ngày. Hãy viết ngay ra mẩu giấy này để giải phóng gánh nặng suy nghĩ cho não bộ, giúp tâm trí hoàn toàn thảnh thơi tập trung.
                        </p>
                      </div>
                    </div>
                  )}

                  {currentPage === 3 && (
                    <div className="space-y-5">
                      <div className="border-b border-[#8B5A2B]/20 pb-3">
                        <span className="text-[10px] font-bold text-amber-700 tracking-widest uppercase">Trang 03 • Tầng 1</span>
                        <h3 className="text-lg md:text-xl font-black text-[#5C3A21] font-sans mt-1">BẢN ĐỒ HÀNH TRÌNH (PHẦN B)</h3>
                      </div>

                      {/* Nhật ký neo đậu */}
                      <div className="bg-[#E8D4BB]/30 p-4 rounded-2xl border border-[#8B5A2B]/10 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-xl bg-emerald-700/10 flex items-center justify-center text-emerald-800 border border-emerald-700/20">
                            <Anchor size={20} />
                          </div>
                          <h4 className="font-extrabold text-[#5C3A21] text-sm md:text-base">Nhật ký neo đậu (Big Goals)</h4>
                        </div>
                        <p className="text-xs md:text-sm text-[#5C3A21]/95 leading-relaxed pl-12 text-justify">
                          Sổ tay quản lý các dự án dài hạn, các môn học lớn hay mục tiêu vĩ đại cần nhiều tuần, nhiều tháng để chinh phục. Nơi neo giữ vững chắc ước mơ của bạn trước sóng gió của sự chán nản.
                        </p>
                      </div>

                      {/* La bàn tiến độ */}
                      <div className="bg-[#E8D4BB]/30 p-4 rounded-2xl border border-[#8B5A2B]/10 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-xl bg-purple-700/10 flex items-center justify-center text-purple-800 border border-purple-700/20">
                            <Compass size={20} />
                          </div>
                          <h4 className="font-extrabold text-[#5C3A21] text-sm md:text-base">La bàn tiến độ (Commit Progress)</h4>
                        </div>
                        <p className="text-xs md:text-sm text-[#5C3A21]/95 leading-relaxed pl-12 text-justify">
                          Kim chỉ nam định hướng cho hành trình dài. Khi bạn hoàn thành và commit tiến độ cho từng chặng của mục tiêu lớn trong Nhật ký, chiếc la bàn này sẽ tự động cập nhật và ghi nhận nỗ lực kiên trì của bạn, giữ cho ngọn lửa động lực luôn bùng cháy.
                        </p>
                      </div>
                    </div>
                  )}

                  {currentPage === 4 && (
                    <div className="space-y-5">
                      <div className="border-b border-[#8B5A2B]/20 pb-3">
                        <span className="text-[10px] font-bold text-amber-700 tracking-widest uppercase">Trang 04 • Tầng 2</span>
                        <h3 className="text-lg md:text-xl font-black text-[#5C3A21] font-sans mt-1">KHÔNG GIAN TẬP TRUNG TUYỆT ĐỐI</h3>
                      </div>

                      {/* Đồng hồ tập trung */}
                      <div className="bg-[#E8D4BB]/30 p-4 rounded-2xl border border-[#8B5A2B]/10 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-xl bg-orange-700/10 flex items-center justify-center text-orange-800 border border-orange-700/20">
                            <Hourglass size={20} />
                          </div>
                          <h4 className="font-extrabold text-[#5C3A21] text-sm md:text-base">Đồng hồ tập trung (Pomodoro)</h4>
                        </div>
                        <p className="text-xs md:text-sm text-[#5C3A21]/95 leading-relaxed pl-12 text-justify">
                          Tọa lạc tại đỉnh tháp vọng tầng 2, chiếc đồng hồ cát thần kỳ sẽ đếm ngược thời gian giúp bạn thiết lập kỷ luật Pomodoro sâu sắc. Điều đặc biệt: **Cứ mỗi phút tập trung hoàn thành, bạn sẽ nhận được 1 đồng tiền 💰** dùng để xây dựng hòn đảo mơ ước của mình!
                        </p>
                      </div>

                      {/* Tần số chữa lành */}
                      <div className="bg-[#E8D4BB]/30 p-4 rounded-2xl border border-[#8B5A2B]/10 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-xl bg-rose-700/10 flex items-center justify-center text-rose-800 border border-rose-700/20">
                            <Radio size={20} />
                          </div>
                          <h4 className="font-extrabold text-[#5C3A21] text-sm md:text-base">Tần số chữa lành (Healing Radio)</h4>
                        </div>
                        <p className="text-xs md:text-sm text-[#5C3A21]/95 leading-relaxed pl-12 text-justify">
                          Máy phát nhạc bằng gỗ cổ điển tại Tầng 2. Nơi cung cấp các bản nhạc lo-fi êm dịu, tần số sóng não tập trung cùng bộ mixer âm thanh môi trường phong phú (mưa rơi, tiếng chim hót, lửa trại bập bùng) để lọc đi mọi tiếng ồn bên ngoài, mang lại sự bình yên tuyệt đối.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* THANH ĐIỀU HƯỚNG LẬT TRANG (BOTTOM BAR) */}
            <div className="flex items-center justify-between border-t border-[#8B5A2B]/20 pt-4 mt-4 bg-[#F5E6D3] z-10 select-none">
              {/* Trang hiển thị số */}
              <div className="text-xs font-mono font-bold text-[#8B5A2B]">
                Trang {currentPage} / {totalPages}
              </div>

              {/* Nút lật trang trước / sau */}
              <div className="flex items-center gap-3">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 border-[#8B5A2B] text-[#8B5A2B] hover:bg-[#8B5A2B] hover:text-[#F5E6D3] transition-all duration-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#8B5A2B] shadow-sm`}
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 border-[#8B5A2B] text-[#8B5A2B] hover:bg-[#8B5A2B] hover:text-[#F5E6D3] transition-all duration-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#8B5A2B] shadow-sm`}
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Thanh scrollbar & Font hệ thống chuẩn tiếng Việt custom style */}
        <style dangerouslySetInnerHTML={{ __html: `
          .vietnamese-font {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(92, 58, 33, 0.05);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #8B5A2B;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #5C3A21;
          }
        `}} />
      </motion.div>
    </div>
  );
}
