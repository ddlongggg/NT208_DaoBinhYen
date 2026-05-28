"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/app/lib/firebase';

const auth = getAuth(app);

// 1. Định nghĩa lại kiểu dữ liệu của các ô đất
// Trong AuthContext.tsx
interface PlotData {
    id: number;
    status: 'empty' | 'menu' | 'growing' | 'mature' | 'reward' | 'dead';
    selectedTree: any | null;
    timeLeft: number;
    totalGrowTime?: number;
    endTime: number | null;

    // 🔥 Cập nhật dòng reward này để chứa thông tin Tinh Hoa (màu sắc, icon, id)
    reward: { type: string, name: string, color?: string, icon?: string, id?: string } | null;

    isThirsty?: boolean;
    waterCount?: number;
    deathTime?: number | null;
}

// 🔥 ĐỊNH NGHĨA SẴN 3 Ô ĐẤT TRỐNG MẶC ĐỊNH
const DEFAULT_PLOTS: PlotData[] = [
    { id: 1, status: 'empty', selectedTree: null, timeLeft: 0, totalGrowTime: 0, endTime: null, reward: null, isThirsty: false, waterCount: 0, deathTime: null },
    { id: 2, status: 'empty', selectedTree: null, timeLeft: 0, totalGrowTime: 0, endTime: null, reward: null, isThirsty: false, waterCount: 0, deathTime: null },
    { id: 3, status: 'empty', selectedTree: null, timeLeft: 0, totalGrowTime: 0, endTime: null, reward: null, isThirsty: false, waterCount: 0, deathTime: null },
];

// 2. Thêm các trường dữ liệu Game mở rộng vào interface Context
interface AuthContextType {
    user: User | null;
    userDataExtended: any | null;
    setUserDataExtended: React.Dispatch<React.SetStateAction<any | null>>;
    plots: PlotData[];
    setPlots: React.Dispatch<React.SetStateAction<PlotData[]>>;
    loading: boolean;
    refreshGameData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userDataExtended: null,
    setUserDataExtended: () => { },
    plots: [],
    setPlots: () => { },
    loading: true,
    refreshGameData: async () => { }
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userDataExtended, setUserDataExtended] = useState<any | null>(null);
    const [plots, setPlots] = useState<PlotData[]>([]);
    const [loading, setLoading] = useState(true);

    // 3. Hàm fetch dữ liệu song song từ API Backend
    // 3. Hàm fetch dữ liệu song song từ API Backend
    const refreshGameData = async () => {
        try {
            const [userRes, gardenRes] = await Promise.all([
                fetch('/api/user/getUserInFo', { cache: 'no-store' }),
                fetch('/api/garden/get', { cache: 'no-store' })
            ]);

            // Cập nhật thông tin User (Vàng, hạt giống...)
            if (userRes.ok) {
                const uData = await userRes.json();
                setUserDataExtended(uData);
            }

            // Cập nhật thông tin Khu Vườn
            if (gardenRes.ok) {
                const gardenResult = await gardenRes.json();

                if (gardenResult.success && gardenResult.data && gardenResult.data.plots && gardenResult.data.plots.length > 0) {
                    const savedPlots = gardenResult.data.plots;
                    const updatedPlots = DEFAULT_PLOTS.map(defaultPlot => {
                        const dbPlot = savedPlots.find((p: any) => p.id === defaultPlot.id);
                        if (dbPlot) {
                            return {
                                ...defaultPlot,
                                ...dbPlot,
                                status: dbPlot.status || 'empty',
                                timeLeft: dbPlot.timeLeft !== undefined ? dbPlot.timeLeft : defaultPlot.timeLeft,
                                endTime: dbPlot.endTime || null,
                                isThirsty: dbPlot.isThirsty || false,
                                waterCount: dbPlot.waterCount || 0,
                                deathTime: dbPlot.deathTime || null // 🔥 Thêm dòng này để nạp dữ liệu cái chết từ DB
                            };
                        }
                        return defaultPlot;
                    });

                    setPlots(updatedPlots);
                } else {
                    // Firebase trả về thành công nhưng mảng plots bị rỗng
                    setPlots(DEFAULT_PLOTS);
                }
            } else {
                // 🔥 NẾU API LỖI (Ví dụ: 404 Not Found do bạn đã xóa document trên Firebase)
                // Vẫn phải cấp 3 ô đất mặc định để người chơi có thể chơi lại từ đầu
                setPlots(DEFAULT_PLOTS);
            }
        } catch (error) {
            console.error("❌ Lỗi nạp dữ liệu Game tại AuthContext:", error);
            // 🔥 NẾU FETCH THẤT BẠI HOÀN TOÀN (Sập nguồn, mất mạng...)
            setPlots(DEFAULT_PLOTS);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // Đăng nhập thành công: Chạy hàm nạp dữ liệu
                await refreshGameData();
            } else {
                // Đăng xuất: Xóa sạch dữ liệu trong RAM
                setUserDataExtended(null);
                setPlots([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            userDataExtended,
            setUserDataExtended,
            plots,
            setPlots,
            loading,
            refreshGameData
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => useContext(AuthContext);