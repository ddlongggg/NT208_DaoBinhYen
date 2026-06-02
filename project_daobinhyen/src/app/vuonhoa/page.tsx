"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/app/context/AuthContext';
import './KhuVuonChuaLanh.css';
import { Quicksand } from 'next/font/google';
const quicksand = Quicksand({
    subsets: ['vietnamese'],
    weight: ['400', '500', '600', '700'], // Các độ đậm nhạt
    display: 'swap',
});

interface TreeOption {
    id: string;
    name: string;
    description: string;
    seedCost: number;
    growTimeSeconds: number;
    iconPath: string;
    saplingPath: string;
    maturePath: string;
    rarity: 'Thường' | 'Hiếm' | 'Sử Thi' | 'Huyền Thoại';
}

interface PlotData {
    id: number;
    status: 'empty' | 'menu' | 'growing' | 'mature' | 'reward' | 'dead';
    selectedTree: any | null; // (Ở page.tsx là TreeOption | null)
    timeLeft: number;
    totalGrowTime?: number;
    endTime: number | null;
    // 🔥 Cập nhật kiểu dữ liệu của reward để lưu màu sắc và icon tinh hoa
    reward: { type: string, name: string, color: string, icon: string, id: string } | null;
    isThirsty?: boolean;
    waterCount?: number;
    deathTime?: number | null;
}

const TREE_OPTIONS: TreeOption[] = [
    {
        id: 'tree_apple',
        name: 'Mộc Táo An Nhiên',
        description: 'Những quả táo đỏ căng mọng mang lại vị ngọt ngào, xua tan đi những mệt mỏi của một ngày dài.',
        seedCost: 5,
        growTimeSeconds: 60,
        iconPath: '/vuonhoa/Applesmall.png',
        saplingPath: '/vuonhoa/Applesmall.png',
        maturePath: '/vuonhoa/AppleBig.png',
        rarity: 'Thường' // 🔥 Gắn độ hiếm
    },
    {
        id: 'tree_willow',
        name: 'Lục Liễu Trầm Tư',
        description: 'Tán lá rủ hiền hòa trong gió, là nơi tuyệt vời nhất để dừng chân và lắng nghe tiếng lòng mình.',
        seedCost: 10,
        growTimeSeconds: 900,
        iconPath: '/vuonhoa/caylieusmall.png',
        saplingPath: '/vuonhoa/caylieusmall.png',
        maturePath: '/vuonhoa/CaylieuBig.png',
        rarity: 'Thường' // 🔥 Gắn độ hiếm
    },
    {
        id: 'tree_sunflower',
        name: 'Hướng Dương Ban Mai',
        description: 'Luôn vươn mình về phía ánh sáng. Lời nhắc nhở ngày mai mặt trời vẫn sẽ mọc.',
        seedCost: 15,
        growTimeSeconds: 1800,
        iconPath: '/vuonhoa/sunflowersmall.png',
        saplingPath: '/vuonhoa/sunflowersmall.png',
        maturePath: '/vuonhoa/sunflowerbig.png',
        rarity: 'Hiếm' // 🔥 Gắn độ hiếm
    },
    {
        id: 'tree_bamboo',
        name: 'Thanh Trúc Tự Tại',
        description: 'Dù bão giông vẫn kiên cường đứng thẳng nhưng lại vô cùng mềm mỏng, tự tại giữa đất trời.',
        seedCost: 20,
        growTimeSeconds: 3600,
        iconPath: '/vuonhoa/BambooSmall.png',
        saplingPath: '/vuonhoa/BambooSmall.png',
        maturePath: '/vuonhoa/BambooBig.png',
        rarity: 'Hiếm' // 🔥 Gắn độ hiếm
    },
    {
        id: 'tree_cherry',
        name: 'Mộng Đào Nguyên',
        description: 'Sắc hồng rực rỡ tựa áng mây, lưu giữ lại những ký ức rực rỡ và tươi đẹp nhất.',
        seedCost: 35,
        growTimeSeconds: 7200,
        iconPath: '/vuonhoa/CherrySmall.png',
        saplingPath: '/vuonhoa/CherrySmall.png',
        maturePath: '/vuonhoa/Cherrybig.png',
        rarity: 'Sử Thi' // 🔥 Gắn độ hiếm
    },
    {
        id: 'tree_mushroom',
        name: 'Đại Nấm Mộng Mơ',
        description: 'Nơi trú ẩn cổ tích, che chở bạn khỏi những cơn mưa rào mệt mỏi trong lòng.',
        seedCost: 50,
        growTimeSeconds: 14400,
        iconPath: '/vuonhoa/CayNam.png',
        saplingPath: '/vuonhoa/CayNam.png',
        maturePath: '/vuonhoa/CayNamLon.png',
        rarity: 'Sử Thi' // 🔥 Gắn độ hiếm
    },
    {
        id: 'tree_ancient',
        name: 'Đại Mộc An Trú',
        description: 'Mang dáng vẻ nguyên sơ và vững chãi nhất. Mang lại cảm giác bình yên như được trở về nhà.',
        seedCost: 80,
        growTimeSeconds: 28800,
        iconPath: '/vuonhoa/CayCoThuNho.png',
        saplingPath: '/vuonhoa/CayCoThuNho.png',
        maturePath: '/vuonhoa/CayCoThuLon.png',
        rarity: 'Huyền Thoại' // 🔥 Gắn độ hiếm
    }
];

const TEST_MODE = false;

export default function Page() {
    const [seedCount, setSeedCount] = useState<number>(0);
    const [moneyCount, setMoneyCount] = useState<number>(0);
    const [wateringPlotId, setWateringPlotId] = useState<number | null>(null);
    const [harvestingPlotId, setHarvestingPlotId] = useState<number | null>(null);
    const [clearingPlotId, setClearingPlotId] = useState<number | null>(null);
    const [essences, setEssences] = useState({ lam: 0, tim: 0, vang: 0, cam: 0 });
    const [showEssenceMenu, setShowEssenceMenu] = useState(false);

    //State để bật/tắt Bảng Hướng Dẫn
    const [showGuide, setShowGuide] = useState(true);
    const [alertPopup, setAlertPopup] = useState<{ isOpen: boolean; message: string; title?: string } | null>(null);

    const showAlert = (message: string, title: string = "Thông báo") => {
        setAlertPopup({ isOpen: true, message, title });
    };

    // Tách biệt rõ ràng: 'firebaseUser' (đăng nhập) và 'gameUserData' (dữ liệu hạt giống)
    const { user: firebaseUser, userDataExtended: gameUserData, setUserDataExtended, plots, setPlots, refreshGameData } = useAuthContext();

    // Lắng nghe dữ liệu từ Context truyền xuống để cập nhật số lượng hạt giống hiển thị
    useEffect(() => {
        if (firebaseUser) {
            refreshGameData(); // Hàm này gọi cả /api/user/getUserInfo và /api/garden/get ngầm
        }
    }, [firebaseUser]);

    // 3. ĐỒNG BỘ SỐ HẠT GIỐNG TỪ CONTEXT VÀO STATE CỦA TRANG ĐỂ HIỂN THỊ
    useEffect(() => {
        if (gameUserData) {
            const dataObj = gameUserData.data || gameUserData;
            setSeedCount(dataObj.seeds || 0);
            setMoneyCount(dataObj.money || 0);

            // 🔥 ĐỒNG BỘ TINH HOA TỪ FIREBASE VÀO TÚI ĐỒ TRÊN WEB
            setEssences({
                lam: dataObj.essence_lam || 0,
                tim: dataObj.essence_tim || 0,
                vang: dataObj.essence_vang || 0,
                cam: dataObj.essence_cam || 0,
            });
        }
    }, [gameUserData]);

    // --- ĐỒNG BỘ DỮ LIỆU LÊN FIREBASE QUA BACK-END ---
    const syncGardenToBackend = async (newPlots: PlotData[]) => {
        // Lấy userId an toàn từ tài khoản đăng nhập hoặc dữ liệu game mở rộng
        const userId = gameUserData?.userId || firebaseUser?.uid;
        if (!userId) return;

        try {
            await fetch('/api/garden/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, plots: newPlots })
            });
        } catch (error) {
            console.error("Lỗi đồng bộ dữ liệu lên Back-end:", error);
        }
    };
    // 👉 THÊM HÀM MỚI NÀY VÀO ĐÂY: Hàm để đồng bộ số hạt giống mới lên Firebase
    const syncSeedsToBackend = async (newSeedAmount: number) => {
        const userId = gameUserData?.userId || firebaseUser?.uid;
        if (!userId) return;

        try {
            await fetch('/api/user/updateSeeds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, seeds: newSeedAmount })
            });
        } catch (error) {
            console.error("Lỗi trừ hạt giống trên Server:", error);
        }
    };
    const syncMoneyToBackend = async (newMoneyAmount: number) => {
        const userId = gameUserData?.userId || firebaseUser?.uid;
        if (!userId) return;

        try {
            await fetch('/api/user/updateMoney', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, money: newMoneyAmount })
            });
        } catch (error) {
            console.error("Lỗi trừ vàng trên Server:", error);
        }
    };
    const syncEssenceToBackend = async (essenceId: string, newAmount: number) => {
        const userId = gameUserData?.userId || firebaseUser?.uid;
        if (!userId) return;

        try {
            await fetch('/api/user/updateEssence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, essenceId, amount: newAmount })
            });
        } catch (error) {
            console.error("Lỗi đồng bộ tinh hoa:", error);
        }
    };
    // Hàm cập nhật State UI đồng thời kích hoạt đồng bộ lên Back-end
    const updatePlot = (id: number, newData: Partial<PlotData>) => {
        setPlots((prevPlots) => {
            // Lấy dữ liệu mới nhất tại thời điểm hiện tại thay vì dữ liệu cũ
            const newPlots = prevPlots.map(plot => (plot.id === id ? { ...plot, ...newData } : plot));

            // Lưu lên Backend
            syncGardenToBackend(newPlots);
            return newPlots;
        });
    };

    // --- CÁC LOGIC GAME ---
    const handlePlotClick = (plotId: number, currentStatus: string) => {
        if (currentStatus === 'empty') {
            // Thay vì dùng updatePlot chỉ cập nhật 1 ô, ta dùng setPlots để quét và cập nhật toàn bộ vườn
            setPlots((prevPlots) => {
                const newPlots = prevPlots.map((plot): PlotData => {
                    // Mở sổ cho ô được click
                    if (plot.id === plotId) {
                        return { ...plot, status: 'menu' };
                    }
                    // Nếu phát hiện có ô khác đang mở sổ -> Ép nó gập sổ lại thành đất trống
                    if (plot.status === 'menu') {
                        return { ...plot, status: 'empty' };
                    }
                    // Các ô đang trồng cây, đang khát... thì giữ nguyên không đụng tới
                    return plot;
                });

                // Lưu trạng thái mới lên Backend
                syncGardenToBackend(newPlots);
                return newPlots;
            });
        } else if (currentStatus === 'mature') {
            handleHarvest(plotId);
        }
    };

    const handlePlantTree = (tree: TreeOption, plotId: number) => {
        if (!firebaseUser) {
            showAlert("Bạn cần đăng nhập để có thể gieo mầm nhé!", "Yêu cầu đăng nhập");
            return;
        }

        if (seedCount < tree.seedCost) {
            showAlert(`Không đủ hạt giống! Bạn cần thêm ${tree.seedCost - seedCount} hạt giống.`, "Không đủ hạt giống");
            return;
        }

        const remainingSeeds = seedCount - tree.seedCost;
        setSeedCount(remainingSeeds);
        syncSeedsToBackend(remainingSeeds);
        // Ép Profile Bar trừ hạt giống ngay lập tức
        if (setUserDataExtended) {
            setUserDataExtended((prev: any) => {
                const prevData = prev?.data || prev || {};
                return { ...prev, data: { ...prevData, seeds: remainingSeeds } };
            });
        }
        const growSeconds = TEST_MODE ? 30 : tree.growTimeSeconds;
        // 🔥 Tính thời gian chết = Tổng thời gian sống x 3 (Quy ra mili-giây)
        const timeToDie = growSeconds * 3 * 1000;

        updatePlot(plotId, {
            status: 'growing',
            selectedTree: tree,
            timeLeft: growSeconds,
            totalGrowTime: growSeconds,
            endTime: null,
            isThirsty: true,
            waterCount: 0,
            deathTime: Date.now() + timeToDie // 🔥 Ấn định giờ chết
        });
    };

    // 🔥 HÀM MỚI: XỬ LÝ DỌN DẸP CÂY CHẾT (Có kìm thời gian chờ animation)
    const handleClearDeadTree = (plotId: number) => {
        if (clearingPlotId !== null) return;
        setClearingPlotId(plotId); // Kích hoạt animation bổ cuốc

        // Chờ 800ms (cho cuốc bổ xong 2 nhát) rồi mới reset ô đất
        setTimeout(() => {
            updatePlot(plotId, {
                status: 'empty',
                selectedTree: null,
                deathTime: null,
                isThirsty: false,
                waterCount: 0
            });
            setClearingPlotId(null); // Tắt animation
        }, 800);
    };
    const WATER_COST = 5; // Giá tiền tưới 1 lần

    const handleWaterPlot = (e: React.MouseEvent, plotId: number) => {
        e.stopPropagation();

        const plot = plots.find(p => p.id === plotId);

        // Kích hoạt khi cây khát và đang không có animation tưới khác chạy
        if (plot && plot.isThirsty && wateringPlotId === null) {

            // 1. KIỂM TRA TIỀN TRƯỚC KHI CHO TƯỚI NƯỚC
            if (moneyCount < WATER_COST) {
                showAlert(`Ối! Bạn không đủ Tiền để tưới nước. Cần ít nhất ${WATER_COST} 💰.`, "Thiếu Tiền");
                return; // Dừng lại luôn, không chạy animation
            }

            // 2. Tiền đủ -> Kích hoạt hiệu ứng bình tưới bay ra
            setWateringPlotId(plotId);

            // 3. Chờ 1 giây cho animation đổ nước chạy xong thì mới xử lý data
            setTimeout(() => {
                // 🔥 BẮT ĐẦU TRỪ TIỀN VÀ GỌI API 🔥
                const newMoney = moneyCount - WATER_COST;
                setMoneyCount(newMoney); // Trừ tiền trên giao diện ngay lập tức
                syncMoneyToBackend(newMoney); // Gọi file route.ts để trừ tiền trên Firebase
                // Ép Profile Bar trừ tiền vàng ngay lập tức
                if (setUserDataExtended) {
                    setUserDataExtended((prev: any) => {
                        const prevData = prev?.data || prev || {};
                        return { ...prev, data: { ...prevData, money: newMoney } };
                    });
                }
                // Cập nhật lại thời gian sống của cây
                const newEndTime = Date.now() + (plot.timeLeft * 1000);
                updatePlot(plotId, {
                    isThirsty: false,
                    waterCount: (plot.waterCount || 0) + 1,
                    endTime: newEndTime,
                    deathTime: null, // 🔥 Tưới rồi thì xóa án tử đi
                });

                // Tắt hiệu ứng bình tưới
                setWateringPlotId(null);
            }, 1000);
        }

    };

    const handleHarvest = (plotId: number) => {
        if (harvestingPlotId !== null) return;
        setHarvestingPlotId(plotId);

        const plot = plots.find(p => p.id === plotId);
        // Lấy độ hiếm của cây đang chặt
        const rarity = plot?.selectedTree?.rarity || 'Thường';

        setTimeout(() => {
            // 🔥 THUẬT TOÁN RANDOM TINH HOA
            const rand = Math.random() * 100; // Quay số từ 0 đến 100
            let rewardData = { type: 'essence', name: '', color: '', icon: '', id: '' };

            if (rarity === 'Thường') {
                if (rand < 70) rewardData = { type: 'essence', name: 'Tinh Hoa Lam', color: '#60a5fa', icon: '/vuonhoa/tinhhoa/tinhhoalam.png', id: 'lam' };
                else if (rand < 95) rewardData = { type: 'essence', name: 'Tinh Hoa Tím', color: '#c084fc', icon: '/vuonhoa/tinhhoa/tinhhoatim.png', id: 'tim' };
                else rewardData = { type: 'essence', name: 'Tinh Hoa Vàng', color: '#facc15', icon: '/vuonhoa/tinhhoa/tinhhoavang.png', id: 'vang' };
            }
            else if (rarity === 'Hiếm') {
                if (rand < 30) rewardData = { type: 'essence', name: 'Tinh Hoa Lam', color: '#60a5fa', icon: '/vuonhoa/tinhhoa/tinhhoalam.png', id: 'lam' };
                else if (rand < 75) rewardData = { type: 'essence', name: 'Tinh Hoa Tím', color: '#c084fc', icon: '/vuonhoa/tinhhoa/tinhhoatim.png', id: 'tim' };
                else if (rand < 97) rewardData = { type: 'essence', name: 'Tinh Hoa Vàng', color: '#facc15', icon: '/vuonhoa/tinhhoa/tinhhoavang.png', id: 'vang' };
                else rewardData = { type: 'essence', name: 'Tinh Hoa Cam', color: '#fb923c', icon: '/vuonhoa/tinhhoa/tinhhoacam.png', id: 'cam' };
            }
            else if (rarity === 'Sử Thi') {
                if (rand < 10) rewardData = { type: 'essence', name: 'Tinh Hoa Lam', color: '#60a5fa', icon: '/vuonhoa/tinhhoa/tinhhoalam.png', id: 'lam' };
                else if (rand < 40) rewardData = { type: 'essence', name: 'Tinh Hoa Tím', color: '#c084fc', icon: '/vuonhoa/tinhhoa/tinhhoatim.png', id: 'tim' };
                else if (rand < 85) rewardData = { type: 'essence', name: 'Tinh Hoa Vàng', color: '#facc15', icon: '/vuonhoa/tinhhoa/tinhhoavang.png', id: 'vang' };
                else rewardData = { type: 'essence', name: 'Tinh Hoa Cam', color: '#fb923c', icon: '/vuonhoa/tinhhoa/tinhhoacam.png', id: 'cam' };
            }
            else { // Cây Huyền Thoại
                if (rand < 20) rewardData = { type: 'essence', name: 'Tinh Hoa Tím', color: '#c084fc', icon: '/vuonhoa/tinhhoa/tinhhoatim.png', id: 'tim' };
                else if (rand < 65) rewardData = { type: 'essence', name: 'Tinh Hoa Vàng', color: '#facc15', icon: '/vuonhoa/tinhhoa/tinhhoavang.png', id: 'vang' };
                else rewardData = { type: 'essence', name: 'Tinh Hoa Cam', color: '#fb923c', icon: '/vuonhoa/tinhhoa/tinhhoacam.png', id: 'cam' };
            }

            updatePlot(plotId, {
                status: 'reward',
                reward: rewardData
            });

            setHarvestingPlotId(null);
        }, 800);
    };

    const handleCloseReward = (plotId: number) => {
        const plot = plots.find(p => p.id === plotId);

        // 🔥 KIỂM TRA XEM CÓ PHẢI ĐANG NHẬN TINH HOA KHÔNG ĐỂ LƯU VÀO KHO
        if (plot && plot.reward && plot.reward.type === 'essence') {
            const eId = plot.reward.id as keyof typeof essences; // 'lam', 'tim', 'vang', 'cam'
            const newAmount = essences[eId] + 1;

            // 1. Cập nhật giao diện menu túi đồ bên dưới
            setEssences(prev => ({ ...prev, [eId]: newAmount }));

            // 🔥 2. ÉP PROFILE BAR TRÊN GÓC TRÁI CẬP NHẬT NGAY LẬP TỨC
            if (setUserDataExtended) {
                setUserDataExtended((prev: any) => {
                    const prevData = prev?.data || prev || {};
                    return {
                        ...prev,
                        data: {
                            ...prevData,
                            [`essence_${eId}`]: newAmount
                        }
                    };
                });
            }

            // 3. Gọi API lưu ngầm lên Firebase
            syncEssenceToBackend(eId, newAmount);
        }

        updatePlot(plotId, {
            status: 'empty',
            selectedTree: null,
            reward: null,
            endTime: null
        });
    };

    // 1. TÁCH LOGIC TÍNH TOÁN RA THÀNH 1 HÀM ĐỘC LẬP (ĐỂ TÁI SỬ DỤNG)
    const processPlotTime = (plot: PlotData): PlotData => {
        if (plot.status === 'growing') {
            // NẾU CÂY ĐANG KHÁT -> Kiểm tra xem đã đến giờ chết chưa?
            if (plot.isThirsty) {
                if (plot.deathTime && Date.now() >= plot.deathTime) {
                    return { ...plot, status: 'dead', isThirsty: false, endTime: null, deathTime: null, timeLeft: 0 };
                }
                return plot;
            }

            if (plot.endTime) {
                const now = Date.now();
                const remaining = Math.floor((plot.endTime - now) / 1000);
                const total = plot.totalGrowTime || (plot.selectedTree ? plot.selectedTree.growTimeSeconds : 0);

                const threshold1 = Math.floor(total * (2 / 3));
                const threshold2 = Math.floor(total * (1 / 3));
                const currentWaterCount = plot.waterCount || 0;

                let targetThreshold = 0;
                if (currentWaterCount === 1) targetThreshold = threshold1;
                else if (currentWaterCount === 2) targetThreshold = threshold2;

                if (remaining <= targetThreshold) {
                    if (targetThreshold === 0) {
                        return { ...plot, timeLeft: 0, status: 'mature', isThirsty: false, endTime: null, deathTime: null };
                    } else {
                        const exactThirstyTime = plot.endTime - (targetThreshold * 1000);
                        const timeToDie = total * 3 * 1000;
                        const exactDeathTime = exactThirstyTime + timeToDie;

                        if (now >= exactDeathTime) {
                            return { ...plot, status: 'dead', isThirsty: false, endTime: null, deathTime: null, timeLeft: 0 };
                        } else {
                            return {
                                ...plot,
                                timeLeft: targetThreshold,
                                isThirsty: true,
                                endTime: null,
                                deathTime: exactDeathTime
                            };
                        }
                    }
                }
                return { ...plot, timeLeft: remaining };
            }
        }
        return plot;
    };

    // 2. XỬ LÝ ĐỒNG BỘ THỜI GIAN NGAY LẬP TỨC & BẬT VÒNG LẶP ĐẾM NGƯỢC
    useEffect(() => {
        // Hàm tick xử lý logic thời gian
        const tick = () => {
            setPlots(prevPlots => {
                let needsBackendSync = false;

                const newPlots = prevPlots.map(plot => {
                    const processed = processPlotTime(plot);
                    // Bắt mạch: Nếu cây chuyển từ Khỏe mạnh -> Khát hoặc Chết trong lúc offline
                    if (plot.status !== processed.status || plot.isThirsty !== processed.isThirsty) {
                        needsBackendSync = true;
                    }
                    return processed;
                });

                // Nếu có cây bị thay đổi trạng thái offline, ta LƯU THẲNG LÊN FIREBASE để sửa lỗi gốc
                if (needsBackendSync) {
                    syncGardenToBackend(newPlots);
                }

                return newPlots;
            });
        };

        // 3. CHẠY NGAY 1 LẦN KHI DỮ LIỆU FIREBASE VỪA TẢI XONG (Xóa bỏ độ trễ 1 giây gây nháy hình)
        tick();

        // 4. BẬT BỘ ĐẾM 1 GIÂY NHƯ BÌNH THƯỜNG
        const timer = setInterval(tick, 1000);

        return () => clearInterval(timer);

        // 🔥 Theo dõi gameUserData: Mỗi khi Firebase tải xong dữ liệu, Effect này sẽ tự động reset và chạy mượt mà
    }, [gameUserData, setPlots]);

    const formatTime = (seconds: number) => {
        if (seconds <= 0) return "00:00:00";
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    // Đợi dữ liệu ô đất từ AuthContext nạp xong để tránh lỗi giao diện trống
    if (!plots || plots.length === 0) {
        return <div className="text-center p-10 text-white">Đang khởi tạo lại vườn cây mới...</div>;
    }

    return (
        <div className={`garden-overlay ${quicksand.className}`}>
            <div className="garden-board">
                <button className="close-btn" onClick={() => window.history.back()}>✖</button>

                {/* NÚT BẤM MỞ TÚI TINH HOA (Nằm cạnh nút X) */}
                <button
                    onClick={() => setShowEssenceMenu(!showEssenceMenu)}
                    className="absolute top-[20px] right-[80px] z-[999] bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-md border border-white/40 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                >
                    <span className="text-[18px]">💎</span>
                    <span className="text-white font-bold text-sm tracking-wide">Kho Tinh Hoa</span>
                </button>

                {/* BẢNG HƯỚNG DẪN TINH HOA (Đã được bọc điều kiện ẩn/hiện) */}
                {showEssenceMenu && (
                    <div className="glass-panel panel-reward-top animate-in fade-in zoom-in-95 duration-300 z-[1000]">
                        {/* Nút X để đóng bảng */}
                        <button
                            onClick={() => setShowEssenceMenu(false)}
                            className="absolute top-3 right-4 text-gray-300 hover:text-white font-bold text-lg transition-colors"
                        >
                            ✕
                        </button>

                        <div className="panel-header text-center pr-4">BỘ SƯU TẬP TINH HOA</div>
                        <p className="sub-text">Thu thập khi chặt cây để đổi thú cưng</p>
                        <div className="reward-container" style={{ flexWrap: 'wrap' }}>
                            <div className="reward-box" style={{ width: '45%', marginBottom: '10px', borderColor: '#60a5fa', background: 'rgba(96, 165, 250, 0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <img src="/vuonhoa/tinhhoa/tinhhoalam.png" alt="Pha lê lam" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%', marginBottom: '8px' }} />
                                </div>
                                <p style={{ color: '#60a5fa' }}>TINH HOA LAM</p>
                                {/* Hiển thị số lượng đang có */}
                                <div className="text-white text-xs font-bold bg-blue-500/20 rounded-full mt-1 py-0.5">Sở hữu: {essences.lam}</div>
                            </div>
                            <div className="reward-box" style={{ width: '45%', marginBottom: '10px', borderColor: '#c084fc', background: 'rgba(192, 132, 252, 0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <img src="/vuonhoa/tinhhoa/tinhhoatim.png" alt="Pha lê tím" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%', marginBottom: '8px' }} />
                                </div>
                                <p style={{ color: '#c084fc' }}>TINH HOA TÍM</p>
                                <div className="text-white text-xs font-bold bg-purple-500/20 rounded-full mt-1 py-0.5">Sở hữu: {essences.tim}</div>
                            </div>
                            <div className="reward-box" style={{ width: '45%', borderColor: '#facc15', background: 'rgba(250, 204, 21, 0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <img src="/vuonhoa/tinhhoa/tinhhoavang.png" alt="Pha lê vàng" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%', marginBottom: '8px' }} />
                                </div>
                                <p style={{ color: '#facc15' }}>TINH HOA VÀNG</p>
                                <div className="text-white text-xs font-bold bg-yellow-500/20 rounded-full mt-1 py-0.5">Sở hữu: {essences.vang}</div>
                            </div>
                            <div className="reward-box" style={{ width: '45%', borderColor: '#fb923c', background: 'rgba(251, 146, 60, 0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <img src="/vuonhoa/tinhhoa/tinhhoacam.png" alt="Pha lê cam" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%', marginBottom: '8px' }} />
                                </div>
                                <p style={{ color: '#fb923c' }}>TINH HOA CAM</p>
                                <div className="text-white text-xs font-bold bg-orange-500/20 rounded-full mt-1 py-0.5">Sở hữu: {essences.cam}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* RENDER CÁC Ô ĐẤT */}
                {/* 1. Thêm 'index' vào trong .map() */}
                {plots.map((plot, index) => (
                    <React.Fragment key={plot.id}>
                        {/* 2. Thay chữ plot.id thành chữ index ở dòng className này */}
                        <div className={`plot-area plot-${index}`} onClick={() => handlePlotClick(plot.id, plot.status)}>

                            {plot.status === 'empty' && (
                                <>
                                    <div className="soil-base empty-glow"></div>
                                    <div className="hover-pointer pulse-pointer"></div>
                                    {/* 👉 Gắn thêm class 'text-empty' */}
                                    <div className="tutorial-text text-empty pulse">CLICK ĐỂ TRỒNG</div>
                                </>
                            )}

                            {plot.status === 'growing' && plot.selectedTree && (
                                <>
                                    <div className={`soil-base ${plot.isThirsty ? 'thirsty-glow' : ''}`}></div>
                                    <img
                                        src={plot.selectedTree.saplingPath}
                                        alt="Cây con"
                                        className="sapling-img"
                                        style={{ filter: plot.isThirsty ? 'grayscale(80%) sepia(50%)' : 'none' }} // Làm cây héo khi khát
                                    />

                                    {plot.isThirsty ? (
                                        <>
                                            <div className="tutorial-text text-growing pulse" style={{ color: '#fca5a5' }}>CÂY ĐANG KHÁT!</div>
                                            {/* 🔥 THAY THẾ NÚT BUTTON BẰNG HÌNH ẢNH BÌNH TƯỚI */}
                                            <img
                                                src="/vuonhoa/BinhTuoiNuoc.png"
                                                alt="Bình tưới nước"
                                                className={`water-can-btn ${wateringPlotId === plot.id ? 'is-watering' : 'float-anim'}`}
                                                onClick={(e) => handleWaterPlot(e, plot.id)}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <div className="tutorial-text text-growing pulse">CÂY ĐANG LỚN...</div>
                                            <div className="timer-badge timer-growing">
                                                <div className="timer-label">SẮP TRƯỞNG THÀNH</div>
                                                <div className="timer-value">⏳ {formatTime(plot.timeLeft)}</div>
                                                {/* Hiển thị tiến độ tưới */}
                                                <div style={{ fontSize: '10px', color: '#6ee7b7', marginTop: '3px' }}>Đã tưới: {plot.waterCount}/3</div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {plot.status === 'mature' && plot.selectedTree && (
                                <>
                                    {/* 1. GẮN SỰ KIỆN CLICK VÀO BẢNG THU HOẠCH */}
                                    <div
                                        className="harvest-badge pulse-glow"
                                        style={{
                                            opacity: harvestingPlotId === plot.id ? 0 : 1,
                                            transition: 'opacity 0.2s',
                                            cursor: 'pointer' // Thêm con trỏ chuột chỉ tay
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleHarvest(plot.id);
                                        }}
                                    >
                                        ⛏️ THU HOẠCH
                                    </div>

                                    <div className="soil-base mature-glow"></div>

                                    {/* Gắn class tree-shake vào cây nếu đang bị chặt */}
                                    <img
                                        src={plot.selectedTree.maturePath}
                                        alt="Cây trưởng thành"
                                        className={`mature-tree-img ${harvestingPlotId === plot.id ? 'tree-shake' : ''}`}
                                    />

                                    {/* 2. ẨN CHIẾC RÌU ĐI, CHỈ HIỆN LÊN KHI BẮT ĐẦU CHẶT */}
                                    <img
                                        src="/vuonhoa/CaiRiu.png"
                                        alt="Rìu thu hoạch"
                                        className={`axe-btn ${harvestingPlotId === plot.id ? 'is-chopping' : ''}`}
                                        style={{
                                            opacity: harvestingPlotId === plot.id ? 1 : 0, // Tàng hình khi không chặt
                                            pointerEvents: 'none' // Cho phép click xuyên qua rìu tàng hình trúng cái cây
                                        }}
                                    />

                                    <div
                                        className="tutorial-text text-mature"
                                        style={{ opacity: harvestingPlotId === plot.id ? 0 : 1, transition: 'opacity 0.2s' }}
                                    >
                                        CLICK ĐỂ THU HOẠCH
                                    </div>
                                </>
                            )}
                            {/* TRẠNG THÁI CÂY CHẾT DO QUÊN TƯỚI NƯỚC */}
                            {plot.status === 'dead' && (
                                <>
                                    <div className="soil-base thirsty-glow"></div>

                                    {plot.selectedTree && (
                                        <img
                                            src={plot.selectedTree.saplingPath}
                                            alt="Cây héo úa"
                                            className="sapling-img"
                                            // 🔥 Làm cây chuyển thành màu xám tro, héo hon
                                            style={{ filter: 'grayscale(100%) brightness(50%) sepia(30%) hue-rotate(-50deg)' }}
                                        />
                                    )}

                                    <div className="tutorial-text text-growing pulse" style={{ color: '#94a3b8' }}>
                                        CÂY ĐÃ HÉO ÚA 🥀
                                    </div>

                                    {/* Dùng chiếc cuốc để người chơi click vào dọn dẹp xác cây */}
                                    <img
                                        src="/vuonhoa/CaiCuoc.png"
                                        alt="Dọn dẹp"
                                        // Đổi class để dùng CSS của cuốc, và kiểm tra xem có đang chặt không
                                        className={`pickaxe-btn ${clearingPlotId === plot.id ? 'is-digging' : 'float-anim'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleClearDeadTree(plot.id); // Gọi hàm mới thay vì updatePlot trực tiếp
                                        }}
                                    />
                                </>
                            )}
                        </div>
                        {/* MENU CHỌN CÂY CHO Ô ĐẤT */}
                        {plot.status === 'menu' && (
                            <div className="glass-panel panel-menu pop-in" style={{ width: '450px' }}>
                                <div className="panel-header">
                                    <span className="step-number"></span> CHỌN MẦM CÂY GỬI GẮM
                                </div>

                                {/* Khung chứa danh sách có thanh cuộn (để chứa đủ 7 cây) */}
                                <div className="menu-list custom-scrollbar" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
                                    {TREE_OPTIONS.map((tree) => (
                                        <div key={tree.id} className="menu-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                            <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                                                <div className="item-icon" style={{ flexShrink: 0, backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                                    <img src={tree.iconPath} alt={tree.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                </div>
                                                <div className="item-info" style={{ flex: 1, marginLeft: '10px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                        <h4 style={{ fontSize: '14px', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)', margin: 0 }}>{tree.name}</h4>

                                                        {/* 🔥 THÊM BADGE HIỂN THỊ ĐỘ HIẾM TỰ ĐỘNG ĐỔI MÀU 🔥 */}
                                                        {/* 🔥 ĐÃ SỬA: Thêm whitespace-nowrap và shrink-0 vào class 🔥 */}
                                                        <span className={`whitespace-nowrap shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-bold tracking-wide ${tree.rarity === 'Huyền Thoại' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50 shadow-[0_0_8px_rgba(234,179,8,0.5)]' :
                                                            tree.rarity === 'Sử Thi' ? 'bg-purple-500/20 text-purple-300 border-purple-400/50 shadow-[0_0_8px_rgba(168,85,247,0.4)]' :
                                                                tree.rarity === 'Hiếm' ? 'bg-blue-500/20 text-blue-300 border-blue-400/50' :
                                                                    'bg-gray-500/20 text-gray-300 border-gray-400/50'
                                                            }`}>
                                                            {tree.rarity}
                                                        </span>
                                                    </div>

                                                    <p style={{ color: '#bae6fd', margin: 0 }}>
                                                        Giá: {tree.seedCost} 🌱 | Lớn trong: {tree.growTimeSeconds >= 3600 ? `${tree.growTimeSeconds / 3600} giờ` : `${tree.growTimeSeconds / 60} phút`}
                                                    </p>
                                                </div>
                                                <button className="btn-primary" onClick={(e) => { e.stopPropagation(); handlePlantTree(tree, plot.id); }}>
                                                    GIEO HẠT 🖱️
                                                </button>
                                            </div>
                                            {/* Hiển thị mô tả cây dưới dạng chữ nghiêng nhật ký */}
                                            <div style={{ fontSize: '12px', color: '#e2e8f0', fontStyle: 'italic', lineHeight: '1.4', borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '6px', width: '100%' }}>
                                                "{tree.description}"
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="inventory-status" style={{ marginTop: '12px' }}>
                                    <div>HẠT GIỐNG: {seedCount} 🌱 | VÀNG: {moneyCount} 💰</div>

                                    {/* 🔥 THANH HIỂN THỊ TÚI ĐỒ PHA LÊ 🔥 */}
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '8px', fontSize: '14px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <img src="/vuonhoa/tinhhoa/tinhhoalam.png" style={{ width: 18, height: 18, borderRadius: '50%' }} /> {essences.lam}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <img src="/vuonhoa/tinhhoa/tinhhoatim.png" style={{ width: 18, height: 18, borderRadius: '50%' }} /> {essences.tim}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <img src="/vuonhoa/tinhhoa/tinhhoavang.png" style={{ width: 18, height: 18, borderRadius: '50%' }} /> {essences.vang}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <img src="/vuonhoa/tinhhoa/tinhhoacam.png" style={{ width: 18, height: 18, borderRadius: '50%' }} /> {essences.cam}
                                        </span>
                                    </div>
                                </div>

                                {/* Đổi chữ Hủy thành Gấp sổ lại cho hợp phong cách */}
                                <button className="cancel-btn" style={{ marginTop: 15 }} onClick={(e) => { e.stopPropagation(); updatePlot(plot.id, { status: 'empty' }); }}>
                                    Gấp sổ lại
                                </button>
                            </div>
                        )}

                        {/* BẢNG CHÚC MỪNG KHI NHẬN TINH HOA */}
                        {plot.status === 'reward' && plot.reward && (
                            <div className="glass-panel panel-congrats pop-in" style={{ borderColor: plot.reward.color, boxShadow: `0 8px 32px rgba(0,0,0,0.8), 0 0 20px ${plot.reward.color}40` }}>
                                <div className="panel-header text-center" style={{ color: plot.reward.color }}>THU HOẠCH THÀNH CÔNG!</div>
                                <p className="sub-text">Bạn đã nhận được vật phẩm:</p>

                                <div className="reward-container" style={{ justifyContent: 'center' }}>
                                    <div className="reward-box" style={{ width: '80%', borderColor: plot.reward.color, backgroundColor: 'rgba(0,0,0,0.6)' }}>
                                        {/* 🔥 THAY THẺ DIV BẰNG THẺ IMG CHỨA PHA LÊ 🔥 */}
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                                            <img
                                                src={plot.reward.icon}
                                                alt={plot.reward.name}
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    objectFit: 'cover',
                                                    borderRadius: '50%',
                                                    filter: `drop-shadow(0 0 15px ${plot.reward.color})`
                                                }}
                                            />
                                        </div>
                                        <p style={{ color: plot.reward.color, fontSize: '15px', marginTop: '10px', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                                            {plot.reward.name.toUpperCase()}
                                        </p>
                                    </div>
                                </div>

                                <div className="step-label text-center">CẤT VÀO TÚI ĐỒ</div>
                                <button
                                    className="btn-primary"
                                    style={{ marginTop: 15, width: '100%', background: plot.reward.color, borderColor: plot.reward.color, color: '#000', textShadow: 'none' }}
                                    onClick={() => handleCloseReward(plot.id)}
                                >
                                    XÁC NHẬN
                                </button>
                            </div>
                        )}
                        {/* 🔥 BẢNG HƯỚNG DẪN LÀM VƯỜN (Hiển thị khi mới vào) 🔥 */}
                        {showGuide && (
                            <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
                                <div className="relative bg-[#0f172a] border border-emerald-500/30 w-[90vw] max-w-[650px] rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.2)] p-8 flex flex-col items-center text-left">

                                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-6 tracking-widest drop-shadow-md text-center">
                                        CẨM NANG LÀM VƯỜN
                                    </h2>

                                    <div className="flex flex-col gap-4 text-gray-200 text-sm w-full">
                                        <div className="flex gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className="text-3xl drop-shadow-md">🌱</div>
                                            <p className="leading-relaxed"><strong>Gieo Hạt:</strong> Sử dụng Hạt Giống để mua mầm cây từ cuốn sổ. Mỗi loại cây có thời gian sinh trưởng và độ hiếm khác nhau.</p>
                                        </div>
                                        <div className="flex gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className="text-3xl drop-shadow-md">💦</div>
                                            <p className="leading-relaxed"><strong>Tưới Nước:</strong> Trong quá trình lớn lên, cây sẽ bị khát. Bạn cần tiêu hao Vàng để tưới. Cây cần được chăm sóc đều đặn mới có thể phát triển.</p>
                                        </div>
                                        <div className="flex gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className="text-3xl drop-shadow-md">🥀</div>
                                            <p className="leading-relaxed"><strong>Héo Úa:</strong> Đừng bỏ mặc khu vườn nhé! Nếu cây khát nước quá lâu mà không được tưới, cây sẽ chết khô và bạn buộc phải dùng cuốc để dọn dẹp.</p>
                                        </div>
                                        <div className="flex gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className="text-3xl drop-shadow-md">💎</div>
                                            <p className="leading-relaxed"><strong>Thu Hoạch:</strong> Khi cây trưởng thành, bấm thu hoạch để nhận ngẫu nhiên các loại <strong>Tinh Hoa</strong> (Lam, Tím, Vàng, Cam). Độ hiếm của cây càng cao, cơ hội ra Tinh Hoa xịn càng lớn!</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowGuide(false)}
                                        className="mt-8 py-3.5 w-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white font-black uppercase tracking-widest hover:scale-105 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all duration-300 cursor-pointer"
                                    >
                                        Đã Hiểu - Bắt Đầu Trồng Cây!
                                    </button>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}

                {/* Nút thoát ra homepage */}
                <Link
                    href="/homepage"
                    className="absolute cursor-pointer group z-[999] flex items-center justify-center font-sans"
                    style={{ top: '90%', left: '90%', width: '12%', height: '10%' }}
                >
                    <div className="absolute pointer-events-none animate-pulse">
                        <span className="text-white/60 font-semibold text-lg tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] whitespace-nowrap">LỐI RA</span>
                    </div>

                    <div className="absolute top-[-45px] left-1/2 -translate-x-1/2 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none text-center">
                        <h3 className="text-white font-bold text-sm whitespace-nowrap">Ra khỏi vườn tâm hồn</h3>
                    </div>
                </Link>


                {alertPopup && alertPopup.isOpen && (
                    <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="relative bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-2 border-emerald-500/30 w-[90vw] max-w-[400px] rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.15)] p-6 flex flex-col items-center text-center">

                            {/* Icon cảnh báo */}
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20 shadow-inner">
                                <span className="text-3xl">⚠️</span>
                            </div>

                            <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2 tracking-wide uppercase">
                                {alertPopup.title || "Thông báo"}
                            </h3>

                            <p className="text-gray-300 text-sm font-medium mb-6 leading-relaxed">
                                {alertPopup.message}
                            </p>

                            <button
                                onClick={() => setAlertPopup(null)}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white font-black uppercase tracking-wider hover:scale-102 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-200 cursor-pointer"
                            >
                                Đồng ý
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}