"use client";
import { useState, useEffect, useRef } from "react";

interface SettingsButtonProps {
  /** CSS class override cho vị trí nút (mặc định: fixed top-5 right-5 z-[9999]) */
  className?: string;
}

export default function SettingsButton({ className }: SettingsButtonProps) {
  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState(70);
  const [muted, setMuted] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Tải cài đặt từ localStorage khi mount
  useEffect(() => {
    const savedVolume = localStorage.getItem("app_volume");
    const savedMuted = localStorage.getItem("app_muted");
    if (savedVolume !== null) setVolume(Number(savedVolume));
    if (savedMuted !== null) setMuted(savedMuted === "true");
  }, []);

  // ===== CORE: Áp dụng volume lên TẤT CẢ <audio> trong trang =====
  useEffect(() => {
    const vol = muted ? 0 : volume / 100;

    // 1. Áp dụng ngay lên tất cả audio đang có trong DOM
    const applyToAll = () => {
      document.querySelectorAll<HTMLAudioElement>("audio").forEach(el => {
        el.volume = vol;
      });
    };
    applyToAll();

    // 2. MutationObserver: tự động áp dụng cho bất kỳ <audio> mới nào được thêm vào DOM
    const observer = new MutationObserver(mutations => {
      // Đọc volume mới nhất từ localStorage (tránh closure stale)
      const latestMuted = localStorage.getItem("app_muted") === "true";
      const latestVol = latestMuted ? 0 : Number(localStorage.getItem("app_volume") ?? "70") / 100;

      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLAudioElement) {
            node.volume = latestVol;
          } else if (node instanceof Element) {
            node.querySelectorAll<HTMLAudioElement>("audio").forEach(el => {
              el.volume = latestVol;
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [volume, muted]);

  // Đóng panel khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmLogout(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const effectiveVolume = muted ? 0 : volume;

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (val === 0) setMuted(true);
    else setMuted(false);
    localStorage.setItem("app_volume", String(val));
    localStorage.setItem("app_muted", String(val === 0));
    // Phát sóng sự kiện để các component khác (audio) lắng nghe
    window.dispatchEvent(new CustomEvent("app-volume-change", { detail: { volume: val / 100, muted: val === 0 } }));
  };

  const handleToggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    localStorage.setItem("app_muted", String(newMuted));
    window.dispatchEvent(new CustomEvent("app-volume-change", { detail: { volume: newMuted ? 0 : volume / 100, muted: newMuted } }));
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch { /* ignore */ } finally {
      window.location.href = "/login";
    }
  };

  return (
    <div
      ref={panelRef}
      className={className ?? "fixed top-5 right-5 z-[9999]"}
    >
      {/* ====== NÚT BÁNH RĂNG ====== */}
      <button
        id="settings-gear-btn"
        onClick={() => { setOpen(prev => !prev); setConfirmLogout(false); }}
        title="Cài đặt"
        aria-label="Mở cài đặt"
        className={`
          relative w-12 h-12 rounded-2xl flex items-center justify-center
          bg-black/40 backdrop-blur-md border
          shadow-xl transition-all duration-300
          ${open
            ? "border-[#d2c4a7] shadow-[0_0_20px_rgba(210,196,167,0.4)] rotate-45"
            : "border-white/20 hover:border-[#d2c4a7] hover:shadow-[0_0_12px_rgba(255,255,255,0.2)]"
          }
        `}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20" height="20"
          viewBox="0 0 24 24" fill="none"
          stroke={open ? "#d2c4a7" : "white"}
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="transition-all duration-300"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* ====== PANEL CÀI ĐẶT ====== */}
      {open && (
        <div
          className="absolute top-14 right-0 w-64 rounded-2xl overflow-hidden shadow-2xl border border-white/15"
          style={{
            background: "rgba(26, 22, 18, 0.92)",
            backdropFilter: "blur(20px)",
            animation: "settingsDrop 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-[#d2c4a7] font-black text-xs tracking-[0.2em] uppercase">⚙️ Cài Đặt</span>
            <button
              onClick={() => { setOpen(false); setConfirmLogout(false); }}
              className="text-white/30 hover:text-white/70 transition text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* ─── Âm lượng ─── */}
          <div className="px-4 py-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">🔊 Âm lượng</span>
              <span
                className="text-[#d2c4a7] font-black text-xs px-2 py-0.5 rounded-lg border border-[#d2c4a7]/30"
                style={{ background: "rgba(210,196,167,0.08)" }}
              >
                {muted ? "TẮT" : `${effectiveVolume}%`}
              </span>
            </div>

            {/* Slider row */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleMute}
                className="text-white/50 hover:text-white transition shrink-0"
                title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
              >
                {muted || volume === 0 ? (
                  /* VolumeX */
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                ) : (
                  /* Volume2 */
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                )}
              </button>

              <div className="flex-1">
                <input
                  id="app-volume-slider"
                  type="range"
                  min={0}
                  max={100}
                  value={effectiveVolume}
                  onChange={e => handleVolumeChange(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #d2c4a7 ${effectiveVolume}%, rgba(255,255,255,0.12) ${effectiveVolume}%)`,
                  }}
                />
              </div>
            </div>

            {/* Quick presets */}
            <div className="flex gap-1.5 mt-3">
              {[0, 25, 50, 75, 100].map(v => (
                <button
                  key={v}
                  onClick={() => handleVolumeChange(v)}
                  className={`
                    flex-1 py-1 rounded-lg text-[10px] font-bold transition border
                    ${effectiveVolume === v
                      ? "border-[#d2c4a7]/60 text-[#d2c4a7]"
                      : "border-white/10 text-white/30 hover:text-white/60 hover:border-white/20"
                    }
                  `}
                  style={{ background: effectiveVolume === v ? "rgba(210,196,167,0.12)" : "rgba(255,255,255,0.03)" }}
                >
                  {v === 0 ? "🔇" : `${v}`}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Đăng xuất ─── */}
          <div className="px-3 py-3">
            {!confirmLogout ? (
              <button
                id="settings-logout-btn"
                onClick={() => setConfirmLogout(true)}
                className="
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  text-red-400 hover:text-red-300
                  transition-all font-semibold text-sm border border-transparent
                  hover:border-red-500/20 hover:bg-red-500/8
                "
              >
                {/* LogOut icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Đăng xuất
              </button>
            ) : (
              <div className="rounded-xl p-3 border border-red-500/30" style={{ background: "rgba(239,68,68,0.08)" }}>
                <p className="text-red-300 text-[11px] font-bold text-center mb-3">Bạn chắc muốn rời đảo không? 🏝️</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmLogout(false)}
                    className="flex-1 py-1.5 rounded-lg text-white/60 text-xs font-bold transition hover:bg-white/10"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    Ở lại
                  </button>
                  <button
                    id="settings-confirm-logout-btn"
                    onClick={handleLogout}
                    className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-bold transition"
                  >
                    Rời đảo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== ANIMATION + SLIDER STYLES ====== */}
      <style>{`
        @keyframes settingsDrop {
          from { opacity: 0; transform: scale(0.85) translateY(-10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        #app-volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #d2c4a7;
          cursor: pointer;
          border: 2px solid #1a1612;
          box-shadow: 0 0 6px rgba(210,196,167,0.5);
          transition: transform 0.15s;
        }
        #app-volume-slider::-webkit-slider-thumb:hover { transform: scale(1.25); }
        #app-volume-slider::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #d2c4a7;
          cursor: pointer;
          border: 2px solid #1a1612;
        }
      `}</style>
    </div>
  );
}
