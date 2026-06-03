'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/app/context/AuthContext';
import { Quicksand } from 'next/font/google';
const quicksand = Quicksand({
    subsets: ['vietnamese'],
    weight: ['400', '500', '600', '700'], // Các độ đậm nhạt
    display: 'swap',
});

// Định nghĩa dữ liệu chuẩn cho Thú Cưng từ Database
interface PetData {
    id: string;
    petId: string;
    name: string;
    hunger: number;
    thirst: number;
    xp: number;
    level: number;
    lastPetted: number;
}

// TỪ ĐIỂN HÌNH ẢNH (Map mã petId với hình ảnh tương ứng)
const PET_IMAGES: Record<string, { normal: string, sad: string, adult: string, adult_sad: string }> = {
    'pet_cat': {
        normal: '/thucung/ConMeo.png', sad: '/thucung/ConMeo_sad.png',
        adult: '/thucung/ConMeo_adult.png', adult_sad: '/thucung/ConMeo_adult_sad.png'
    },
    'pet_dog': {
        normal: '/thucung/ConCho.png', sad: '/thucung/ConCho_sad.png',
        adult: '/thucung/ConCho_adult.png', adult_sad: '/thucung/ConCho_adult_sad.png'
    },
    'pet_fox': {
        normal: '/thucung/ConCao.png', sad: '/thucung/ConCao_sad.png',
        adult: '/thucung/ConCao_adult.png', adult_sad: '/thucung/ConCao_adult_sad.png'
    },
    'pet_dino': {
        normal: '/thucung/ConKhungLong.png', sad: '/thucung/ConKhungLong_sad.png',
        adult: '/thucung/ConKhungLong_adult.png', adult_sad: '/thucung/ConKhungLong_adult_sad.png'
    },
    'pet_tiger': {
        normal: '/thucung/ConHo.png', sad: '/thucung/ConHo_sad.png',
        adult: '/thucung/ConHo_adult.png', adult_sad: '/thucung/ConHo_adult_sad.png'
    },
    'pet_dragon': {
        normal: '/thucung/ConRong.png', sad: '/thucung/ConRong_sad.png',
        adult: '/thucung/ConRong_adult.png', adult_sad: '/thucung/ConRong_adult_sad.png'
    }
};

// TỪ ĐIỂN THỨC ĂN (Giá tiền, Điểm hồi phục, XP nhận được)
const FOOD_ITEMS = [
    {
        id: 'food_apple_red',
        name: 'Táo Đỏ',
        image: '/thucung/thucan/TaoDo.png',
        price: 3,   // Giá: 10 vàng
        hunger: 6,  // Tăng 15 độ đói
        xp: 5        // Tăng 5 XP
    },
    {
        id: 'food_apple_green',
        name: 'Táo Xanh',
        image: '/thucung/thucan/TaoXanh.png',
        price: 10,   // Giá đắt hơn
        hunger: 15,  // No lâu hơn
        xp: 15       // Được nhiều XP hơn
    },
    {
        id: 'chicken',
        name: 'Gà Rán',
        image: '/thucung/thucan/GaRan.png',
        price: 15,   // Giá đắt hơn
        hunger: 25,  // No lâu hơn
        xp: 20       // Được nhiều XP hơn
    }, {
        id: 'banana',
        name: 'Chuối',
        image: '/thucung/thucan/Chuoi.png',
        price: 3,   // Giá đắt hơn
        hunger: 5,  // No lâu hơn
        xp: 6       // Được nhiều XP hơn
    }, {
        id: 'thitnuong',
        name: 'Thịt Nướng',
        image: '/thucung/thucan/ThitNuong.png',
        price: 15,   // Giá đắt hơn
        hunger: 20,  // No lâu hơn
        xp: 25       // Được nhiều XP hơn
    }, {
        id: 'sushi',
        name: 'Sushi',
        image: '/thucung/thucan/Sushi.png',
        price: 10,   // Giá đắt hơn
        hunger: 20,  // No lâu hơn
        xp: 10       // Được nhiều XP hơn
    }, {
        id: 'chagio',
        name: 'Chả Giò',
        image: '/thucung/thucan/ChaGio.png',
        price: 10,   // Giá đắt hơn
        hunger: 12,  // No lâu hơn
        xp: 25     // Được nhiều XP hơn
    }, {
        id: 'banhmi',
        name: 'Bánh Mì',
        image: '/thucung/thucan/BanhMi.png',
        price: 25,   // Giá đắt hơn
        hunger: 25,  // No lâu hơn
        xp: 30       // Được nhiều XP hơn
    }
];

const DRINK_ITEMS = [
    {
        id: 'nuocloc',
        name: 'Nước Lọc',
        image: '/thucung/thucan/NuocLoc.png',
        price: 2,    // Giá rẻ nhất
        thirst: 5,  // Tăng 10 độ khát
        xp: 2
    },
    {
        id: 'trasua',
        name: 'Trà Sữa',
        image: '/thucung/thucan/TraSua.png',
        price: 5,
        thirst: 15,
        xp: 10
    },
    {
        id: 'nuoccam',
        name: 'Nước Cam',
        image: '/thucung/thucan/NuocCam.png',
        price: 5,
        thirst: 20,
        xp: 5
    },
    {
        id: 'coca',
        name: 'Coca Cola',
        image: '/thucung/thucan/Coca.png',
        price: 10,
        thirst: 25,
        xp: 25
    },
    {
        id: 'matcha',
        name: 'Matcha Latte',
        image: '/thucung/thucan/Matcha.png',
        price: 15,
        thirst: 40,
        xp: 35
    }
];

export default function PetSanctuary() {
    const { user: firebaseUser, userDataExtended, setUserDataExtended } = useAuthContext();
    const [mounted, setMounted] = useState(false);
    const activeData = userDataExtended?.data || userDataExtended || {};
    const moneyCount = Number(activeData.money ?? 0);

    // UI States
    const [showGuide, setShowGuide] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    // Data States
    const [myPets, setMyPets] = useState<PetData[]>([]);
    const [selectedPet, setSelectedPet] = useState<PetData | null>(null);

    const [showFoodMenu, setShowFoodMenu] = useState(false);
    const [showDrinkMenu, setShowDrinkMenu] = useState(false);

    // 🔥 THÊM MỚI TẠI ĐÂY: Quản lý trạng thái đổi tên
    const [isRenaming, setIsRenaming] = useState(false);
    const [editName, setEditName] = useState('');

    const [showPetMenu, setShowPetMenu] = useState(false);

    //State cho Đám Mây Lời Thoại
    const [showBubble, setShowBubble] = useState(false);
    const [bubbleText, setBubbleText] = useState('');
    const [quotes, setQuotes] = useState<string[]>([]);
    const [messageBox, setMessageBox] = useState({ isOpen: false, message: '' });

    const showMessageBox = (message: string) => {
        setMessageBox({ isOpen: true, message });
    };

    const myPetsRef = useRef<PetData[]>([]);
    useEffect(() => {
        myPetsRef.current = myPets;
    }, [myPets]);
    useEffect(() => {
        const saveAllPetsState = () => {
            const petsToSave = myPetsRef.current;
            if (petsToSave.length === 0) return;

            // Dùng keepalive: true để request không bị hủy khi tab trình duyệt đóng/F5
            fetch('/api/pets/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pets: petsToSave }),
                keepalive: true
            }).catch(err => console.error("Lỗi lưu offline:", err));
        };

        // 1. Lắng nghe hành động F5 hoặc Đóng tab trình duyệt
        window.addEventListener('beforeunload', saveAllPetsState);

        // 2. Lắng nghe hành động khi chuyển component bằng Next.js Router (Bấm nút Về Đảo Chính)
        return () => {
            saveAllPetsState();
            window.removeEventListener('beforeunload', saveAllPetsState);
        };
    }, []);

    // 1. KÉO DỮ LIỆU THÚ CƯNG TỪ DATABASE KHI MỞ TRANG
    useEffect(() => {
        setMounted(true);
        const fetchPets = async () => {
            try {
                const res = await fetch('/api/pets/get');
                const json = await res.json();

                if (json.success) {
                    const now = Date.now();
                    const DECAY_TIME_MS = 5000; // Đổi thành 120000 (2 phút) khi chơi thật

                    // Duyệt qua từng bé pet để trừ điểm offline
                    const calculatedPets = json.data.map((pet: PetData & { lastUpdated?: string }) => {
                        // Nếu pet chưa có lastUpdated (vừa tạo xong) thì bỏ qua
                        if (!pet.lastUpdated) return pet;

                        const lastSavedTime = new Date(pet.lastUpdated).getTime();
                        const timePassed = now - lastSavedTime; // Tổng thời gian offline (ms)

                        // Tính xem offline như vậy thì mất bao nhiêu điểm
                        const pointsToDrop = Math.floor(timePassed / DECAY_TIME_MS);

                        if (pointsToDrop > 0) {
                            return {
                                ...pet,
                                hunger: Math.max(0, pet.hunger - pointsToDrop),
                                thirst: Math.max(0, pet.thirst - pointsToDrop),
                                // Cập nhật lại mốc thời gian để setInterval lúc sau chạy tiếp không bị sai
                                lastUpdated: new Date(lastSavedTime + pointsToDrop * DECAY_TIME_MS).toISOString()
                            };
                        }

                        return pet; // Nếu thời gian trôi qua chưa đủ 1 nhịp (VD < 5s) thì giữ nguyên
                    });

                    setMyPets(calculatedPets);
                }
            } catch (error) {
                console.error("Lỗi khi lấy dữ liệu thú cưng:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPets();
    }, []);
    // LẤY DANH SÁCH LỜI CHÚC TỪ FIREBASE (healing_messages)
    useEffect(() => {
        const fetchQuotes = async () => {
            try {
                const res = await fetch('/api/quotes/get');
                const json = await res.json();
                if (json.success && json.data.length > 0) {
                    setQuotes(json.data); // Lưu mảng các câu text vào State
                }
            } catch (error) {
                console.error("Lỗi khi tải câu chúc:", error);
            }
        };
        fetchQuotes();
    }, []);
    // 2. LOGIC THỜI GIAN THỰC: TRỪ ĐIỂM ĐÓI/KHÁT (Mô phỏng ở Font-end)
    useEffect(() => {
        const decayTimer = setInterval(() => {
            setMyPets(prevPets => prevPets.map(pet => ({
                ...pet,
                hunger: Math.max(0, pet.hunger - 1),
                thirst: Math.max(0, pet.thirst - 1)
            })));

            // Nếu đang mở 1 con thú, cũng phải trừ điểm con đó trên màn hình
            setSelectedPet(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    hunger: Math.max(0, prev.hunger - 1),
                    thirst: Math.max(0, prev.thirst - 1)
                };
            });
        }, 120000);

        return () => clearInterval(decayTimer);
    }, []);

    if (!mounted) return null;

    // Các hàm tính toán chỉ số cho thú cưng đang được chọn
    const maxXP = selectedPet ? selectedPet.level * 100 : 100;
    const isHungryOrThirsty = selectedPet ? (selectedPet.hunger < 50 || selectedPet.thirst < 50) : false;
    const isAdult = selectedPet ? selectedPet.level >= 10 : false;
    const canPet = selectedPet ? (Date.now() - selectedPet.lastPetted) >= 3600000 : false;

    // Lấy hình ảnh từ TỪ ĐIỂN
    let displayImage = '/logo.png';
    if (selectedPet && PET_IMAGES[selectedPet.petId]) {
        const images = PET_IMAGES[selectedPet.petId];

        if (isAdult) {
            // Nếu đã trưởng thành: Đói/Khát thì lấy ảnh adult_sad, bình thường lấy ảnh adult
            displayImage = isHungryOrThirsty ? images.adult_sad : images.adult;
        } else {
            // Nếu còn nhỏ: Đói/Khát thì lấy ảnh sad, bình thường lấy ảnh normal
            displayImage = isHungryOrThirsty ? images.sad : images.normal;
        }
    }

    // 🔥 HÀM TƯƠNG TÁC VỚI THÚ CƯNG 🔥
    // 🔥 HÀM TƯƠNG TÁC VỚI THÚ CƯNG (ĐÃ TÍCH HỢP LƯU DATABASE) 🔥
    const handleAction = async (action: 'feed' | 'water' | 'pet') => {
        if (!selectedPet) return;

        let newHunger = selectedPet.hunger;
        let newThirst = selectedPet.thirst;
        let newXp = selectedPet.xp;
        let newLevel = selectedPet.level;
        let newLastPetted = selectedPet.lastPetted;

        if (action === 'feed') {
            if (newHunger >= 100) { showMessageBox('Bé đang no, không ăn thêm được nữa!'); return; }
            newHunger = Math.min(100, newHunger + 20);
            newXp += 10;
        }
        else if (action === 'water') {
            if (newThirst >= 100) { showMessageBox('Bé không khát nước lúc này!'); return; }
            newThirst = Math.min(100, newThirst + 20);
            newXp += 10;
        }
        else if (action === 'pet') {
            newXp += 30;
            newLastPetted = Date.now();
        }

        // Tăng Cấp (Level Up)
        let reqXp = newLevel * 100;
        if (newXp >= reqXp) {
            newLevel += 1;
            newXp -= reqXp;
            showMessageBox(`🎉 Chúc mừng! ${selectedPet.name} đã thăng cấp lên Level ${newLevel}!`);
        }

        const updatedPet = { ...selectedPet, hunger: newHunger, thirst: newThirst, xp: newXp, level: newLevel, lastPetted: newLastPetted };

        // 1. CẬP NHẬT GIAO DIỆN NGAY LẬP TỨC (Cho cảm giác mượt mà không độ trễ)
        setSelectedPet(updatedPet);
        setMyPets(prev => prev.map(p => p.id === updatedPet.id ? updatedPet : p));

        // 2. GỌI API LƯU LÊN FIREBASE (Chạy ngầm phía sau)
        try {
            await fetch('/api/pets/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    petId: updatedPet.id, // Chú ý: Đây là Document ID của Firebase
                    hunger: newHunger,
                    thirst: newThirst,
                    xp: newXp,
                    level: newLevel,
                    lastPetted: newLastPetted
                })
            });
            console.log("Đã lưu tiến trình lên Database!");
        } catch (error) {
            console.error("Lỗi kết nối khi lưu DB:", error);
        }
    };
    // 🔥 HÀM MỚI: MUA VÀ CHO ĂN
    const handleBuyAndFeed = async (food: typeof FOOD_ITEMS[0]) => {
        if (!selectedPet) return;

        // 1. Kiểm tra điều kiện bằng TIỀN THẬT (moneyCount)
        if (moneyCount < food.price) {
            showMessageBox('Bạn không đủ tiền để mua món này!');
            return;
        }
        if (selectedPet.hunger >= 100) {
            showMessageBox('Bé đang no, không ăn thêm được nữa đâu!');
            return;
        }

        // 2. Trừ tiền người chơi ngay trên giao diện (Optimistic Update)
        if (setUserDataExtended) {
            setUserDataExtended((prev: any) => {
                const prevData = prev?.data || prev || {};
                return {
                    ...prev,
                    data: {
                        ...prevData,
                        money: Number(prevData.money || 0) - food.price
                    }
                };
            });
        }

        // 3. Tính toán chỉ số mới
        let newHunger = Math.min(100, selectedPet.hunger + food.hunger);
        let newThirst = selectedPet.thirst; // Nước giữ nguyên
        let newXp = selectedPet.xp + food.xp;
        let newLevel = selectedPet.level;
        let newLastPetted = selectedPet.lastPetted;

        // Kiểm tra lên cấp
        let reqXp = newLevel * 100;
        if (newXp >= reqXp) {
            newLevel += 1;
            newXp -= reqXp;
            showMessageBox(`🎉 Chúc mừng! ${selectedPet.name} đã thăng cấp lên Level ${newLevel}!`);
        }

        const updatedPet = { ...selectedPet, hunger: newHunger, thirst: newThirst, xp: newXp, level: newLevel, lastPetted: newLastPetted };

        // 4. Cập nhật giao diện lập tức
        setSelectedPet(updatedPet);
        setMyPets(prev => prev.map(p => p.id === updatedPet.id ? updatedPet : p));

        // 5. Lưu lên Firebase
        try {
            await fetch('/api/pets/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    petId: updatedPet.id,
                    hunger: newHunger,
                    thirst: newThirst,
                    xp: newXp,
                    level: newLevel,
                    lastPetted: newLastPetted
                })
            });
        } catch (error) {
            console.error("Lỗi kết nối khi lưu DB:", error);
        }
    };
    // 🔥 HÀM MỚI: MUA VÀ CHO UỐNG
    const handleBuyAndDrink = async (drink: typeof DRINK_ITEMS[0]) => {
        if (!selectedPet) return;

        // 1. Kiểm tra điều kiện bằng TIỀN THẬT
        if (moneyCount < drink.price) {
            showMessageBox('Bạn không đủ tiền để mua thức uống này!');
            return;
        }
        if (selectedPet.thirst >= 100) {
            showMessageBox('Bé không khát nước lúc này!');
            return;
        }

        // 2. Trừ tiền người chơi ngay trên giao diện
        if (setUserDataExtended) {
            setUserDataExtended((prev: any) => {
                const prevData = prev?.data || prev || {};
                return {
                    ...prev,
                    data: {
                        ...prevData,
                        money: Number(prevData.money || 0) - drink.price
                    }
                };
            });
        }

        // 3. Tính toán chỉ số mới (CHỈ TĂNG NƯỚC, KHÔNG TĂNG ĐÓI)
        let newHunger = selectedPet.hunger;
        let newThirst = Math.min(100, selectedPet.thirst + drink.thirst);
        let newXp = selectedPet.xp + drink.xp;
        let newLevel = selectedPet.level;
        let newLastPetted = selectedPet.lastPetted;

        // Kiểm tra lên cấp
        let reqXp = newLevel * 100;
        if (newXp >= reqXp) {
            newLevel += 1;
            newXp -= reqXp;
            showMessageBox(`🎉 Chúc mừng! ${selectedPet.name} đã thăng cấp lên Level ${newLevel}!`);
        }

        const updatedPet = { ...selectedPet, hunger: newHunger, thirst: newThirst, xp: newXp, level: newLevel, lastPetted: newLastPetted };

        // 4. Cập nhật giao diện
        setSelectedPet(updatedPet);
        setMyPets(prev => prev.map(p => p.id === updatedPet.id ? updatedPet : p));

        // 5. Lưu lên Firebase
        try {
            await fetch('/api/pets/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    petId: updatedPet.id,
                    hunger: newHunger,
                    thirst: newThirst,
                    xp: newXp,
                    level: newLevel,
                    lastPetted: newLastPetted
                })
            });
        } catch (error) {
            console.error("Lỗi kết nối khi lưu DB:", error);
        }
    };
    // 🔥 HÀM MỚI: ĐỔI TÊN THÚ CƯNG
    const handleRename = async () => {
        if (!selectedPet || !editName.trim()) return;

        const newName = editName.trim();
        const updatedPet = { ...selectedPet, name: newName };

        // 1. Cập nhật giao diện ngay lập tức
        setSelectedPet(updatedPet);
        setMyPets(prev => prev.map(p => p.id === updatedPet.id ? updatedPet : p));
        setIsRenaming(false); // Tắt chế độ chỉnh sửa

        // 2. Gửi API lên Firebase để lưu tên mới
        try {
            await fetch('/api/pets/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    petId: updatedPet.id,
                    name: newName, // Gửi kèm tên mới
                    hunger: updatedPet.hunger,
                    thirst: updatedPet.thirst,
                    xp: updatedPet.xp,
                    level: updatedPet.level,
                    lastPetted: updatedPet.lastPetted
                })
            });
        } catch (error) {
            console.error("Lỗi khi đổi tên:", error);
        }
    };
    // 🔥 HÀM MỚI: XỬ LÝ KHI CLICK VÀO THÚ CƯNG
    // 🔥 HÀM MỚI: XỬ LÝ KHI CLICK VÀO THÚ CƯNG
    const handlePetClick = () => {
        if (canPet) {
            // 1. Ưu tiên vuốt ve nếu đến thời gian
            handleAction('pet');
            setShowBubble(false); // Ẩn đám mây đi nếu đang hiện
        } else {
            // 2. Lấy câu thoại ngẫu nhiên từ mảng quotes tải về
            // Nếu Firebase chưa tải kịp hoặc rỗng, dùng câu dự phòng mặc định
            const availableQuotes = quotes.length > 0 ? quotes : ["Bình yên là khi tâm trí không còn những ồn ào. ✨"];

            const randomQuote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];

            setBubbleText(randomQuote);
            setShowBubble(true);

            // Tự động tắt đám mây sau 5 giây
            setTimeout(() => {
                setShowBubble(false);
            }, 20000);
        }
    };

    return (
        <main className={`relative w-screen h-screen flex flex-col overflow-hidden bg-black ${quicksand.className}`}>
            {/* Background Khu Nuôi Thú */}
            <div className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 scale-105" style={{ backgroundImage: "url('/thucung/KhuNuoiThu.png')" }} />
            <div className="absolute inset-0 z-0 bg-black/20 pointer-events-none" />

            {/* CÁC NÚT ĐIỀU HƯỚNG TRÊN CÙNG */}
            {selectedPet ? (
                // Nếu đang chăm 1 bé -> Nút Quay lại Danh sách
                <button onClick={() => setSelectedPet(null)} className="absolute top-6 left-6 z-50 flex items-center gap-2 px-5 py-2.5 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white font-bold hover:bg-white/10 transition-all cursor-pointer">
                    <span>⬅</span> Chọn Bé Khác
                </button>
            ) : (
                // Nếu đang ở Danh sách -> Nút Về Đảo
                <Link href="/homepage" className="absolute top-6 left-6 z-50 flex items-center gap-2 px-5 py-2.5 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white font-bold hover:bg-white/10 transition-all cursor-pointer">
                    <span>⬅</span> Về Đảo Chính
                </Link>
            )}

            <button onClick={() => setShowGuide(true)} className="absolute top-6 right-20 z-50 px-5 py-2.5 bg-blue-500/30 backdrop-blur-md border border-blue-400/50 rounded-full text-blue-200 font-bold hover:bg-blue-500/50 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                📖 Sổ Tay Chăm Sóc
            </button>

            {/* =========================================================================
                MÀN HÌNH 1: DANH SÁCH THÚ CƯNG (Khi chưa chọn bé nào)
                ========================================================================= */}
            {!selectedPet && !showGuide && (
                <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-8 animate-in fade-in zoom-in-95 duration-700">

                    {/* Tiêu đề rực rỡ */}
                    <div className="flex flex-col items-center mb-8">
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-pink-200 tracking-widest drop-shadow-[0_5px_15px_rgba(236,72,153,0.5)] uppercase text-center">
                            Vườn Sinh Thái
                        </h1>
                        <p className="text-pink-300/80 text-xs font-bold tracking-[0.3em] uppercase mt-2 drop-shadow-md">
                            Hãy chăm sóc chúng thật cẩn thận nhé!
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(236,72,153,0.5)]"></div>
                            <div className="text-white text-sm font-bold tracking-widest uppercase animate-pulse">Đang tìm các bé...</div>
                        </div>
                    ) : myPets.length === 0 ? (
                        <div className="bg-black/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 text-center shadow-2xl max-w-lg">
                            <div className="text-6xl mb-6 drop-shadow-lg">🌱</div>
                            <p className="text-gray-200 text-lg mb-8 font-bold leading-relaxed">
                                Khu vườn đang trống vắng. Hãy ghé Thương Hội để đón các bé về nuôi dưỡng nhé!
                            </p>
                            <Link href="/homepage" className="inline-block px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl text-white font-black tracking-widest uppercase hover:scale-105 transition-transform shadow-[0_0_20px_rgba(236,72,153,0.4)]">
                                Đi đến Thương Hội
                            </Link>
                        </div>
                    ) : (
                        /* Bảng kính chứa danh sách */
                        <div className="bg-black/30 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 w-full max-w-6xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-h-[60vh] overflow-y-auto shop-scrollbar pr-4 pb-4">

                                {myPets.map(pet => {
                                    const isWarning = pet.hunger < 50 || pet.thirst < 50;

                                    return (
                                        <div
                                            key={pet.id}
                                            onClick={() => setSelectedPet(pet)}
                                            className="group relative bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex flex-col items-center cursor-pointer transition-all duration-500 hover:bg-white/10 hover:-translate-y-3 hover:border-pink-500/50 hover:shadow-[0_20px_40px_rgba(236,72,153,0.2)] overflow-hidden"
                                        >
                                            {/* Ánh sáng nền lấp lánh khi hover */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                            {/* Nút cảnh báo (Nếu đói/khát) */}
                                            {isWarning && (
                                                <div className="absolute top-4 right-4 bg-red-500/90 backdrop-blur-sm text-white w-8 h-8 rounded-full flex items-center justify-center font-black shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse border border-red-300 z-20">
                                                    !
                                                </div>
                                            )}

                                            {/* Khu vực Bệ đỡ & Hình ảnh */}
                                            <div className="w-32 h-32 mb-6 relative mt-4 z-10">
                                                {/* Bóng đổ giả 3D dưới chân */}
                                                <div className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 w-24 h-6 bg-black/60 rounded-[100%] blur-[6px] group-hover:w-20 group-hover:bg-pink-900/60 transition-all duration-500" />

                                                {/* Vòng tròn hào quang */}
                                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-full opacity-50 group-hover:opacity-100 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-500" />

                                                <img
                                                    src={PET_IMAGES[pet.petId]?.normal || '/logo.png'}
                                                    alt={pet.name}
                                                    className="relative w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)] group-hover:scale-110 group-hover:-translate-y-4 transition-transform duration-700 ease-out"
                                                />
                                            </div>

                                            {/* Thông tin Text */}
                                            <h3 className="text-white font-black text-xl mb-2 group-hover:text-pink-300 transition-colors z-10">
                                                {pet.name}
                                            </h3>

                                            <div className="bg-black/50 border border-white/10 px-4 py-1.5 rounded-full mb-6 z-10 shadow-inner">
                                                <p className="text-purple-300 text-[10px] font-black uppercase tracking-widest">
                                                    Level {pet.level}
                                                </p>
                                            </div>

                                            {/* Thanh trạng thái Mini */}
                                            <div className="w-full space-y-3 z-10 px-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs filter drop-shadow-md">🍖</span>
                                                    <div className="w-full h-2 bg-black/80 rounded-full overflow-hidden border border-white/10 shadow-inner">
                                                        <div className={`h-full rounded-full transition-all duration-1000 ${pet.hunger < 50 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-gradient-to-r from-orange-500 to-amber-400'}`} style={{ width: `${pet.hunger}%` }} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs filter drop-shadow-md">💧</span>
                                                    <div className="w-full h-2 bg-black/80 rounded-full overflow-hidden border border-white/10 shadow-inner">
                                                        <div className={`h-full rounded-full transition-all duration-1000 ${pet.thirst < 50 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`} style={{ width: `${pet.thirst}%` }} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Nút hành động trượt lên khi Hover */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out bg-gradient-to-t from-pink-600/90 to-transparent pt-12 z-0">
                                                <div className="w-full text-center text-white text-[11px] font-black uppercase tracking-widest drop-shadow-md">
                                                    Chăm Sóc Ngay
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* =========================================================================
                MÀN HÌNH 2: CHĂM SÓC THÚ CƯNG ĐƯỢC CHỌN
                ========================================================================= */}
            {selectedPet && (
                <>
                    {/* KHU VỰC HIỂN THỊ THÚ CƯNG Ở GIỮA */}
                    <div className="relative z-10 flex-1 flex items-center justify-center animate-in fade-in duration-500">
                        {/* Hào quang */}
                        <div className={`absolute w-[250px] h-[250px] rounded-full blur-[60px] pointer-events-none ${isHungryOrThirsty ? 'bg-red-500/20' : (isAdult ? 'bg-yellow-500/30' : 'bg-emerald-500/20')}`} />

                        {/* KHU VỰC HIỂN THỊ THÚ CƯNG Ở GIỮA */}
                        {/* 🔥 THÊM class translate-y-[-100px] VÀO DÒNG DƯỚI ĐÂY 🔥 */}
                        <div className="relative z-10 flex-1 flex items-center justify-center animate-in fade-in duration-500 translate-y-[50px]">

                            {/* Hào quang */}
                            <div className={`absolute w-[250px] h-[250px] rounded-full blur-[60px] pointer-events-none ${isHungryOrThirsty ? 'bg-red-500/20' : (isAdult ? 'bg-yellow-500/30' : 'bg-emerald-500/20')}`} />

                            {/* Khung chứa Thú cưng */}
                            <div
                                className="relative cursor-pointer group shrink-0"
                                style={{ width: '400px', height: '400px' }}
                                // 🔥 SỬA DÒNG NÀY: Gọi hàm mới tạo
                                onClick={handlePetClick}
                            >
                                {/* 🔥 ĐÁM MÂY LỜI THOẠI BẰNG CODE (KHÔNG CẦN DÙNG ẢNH) 🔥 */}
                                {showBubble && (
                                    <div className="absolute -top-30 -right-15 z-50 animate-in zoom-in-75 fade-in duration-300 pointer-events-none drop-shadow-xl">

                                        {/* Khung chữ chính (Bo tròn mềm mại) */}
                                        <div className="relative bg-white border-[3px] border-gray-800 rounded-[2rem] px-6 py-4 w-[240px] shadow-md z-10">
                                            <p className="text-gray-800 font-black text-[13px] text-center leading-relaxed">
                                                {bubbleText}
                                            </p>
                                        </div>

                                        {/* Bong bóng đuôi 1 (To vừa) */}
                                        <div className="absolute -bottom-4 left-10 w-6 h-6 bg-white border-[3px] border-gray-800 rounded-full shadow-sm z-0" />

                                        {/* Bong bóng đuôi 2 (Nhỏ xíu chỉ xuống dưới) */}
                                        <div className="absolute -bottom-8 left-5 w-3 h-3 bg-white border-[2.5px] border-gray-800 rounded-full shadow-sm z-0" />
                                    </div>
                                )}

                                <img
                                    src={displayImage}
                                    alt={selectedPet.name}
                                    className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700 group-hover:scale-105"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 1. BẢNG THÔNG TIN DỌC - GÓC TRÁI BÊN DƯỚI (Chỉ giữ lại Text và Thanh máu) */}
                    <div className="absolute bottom-8 left-8 w-[350px] bg-[#0a0f1a]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-40 flex flex-col animate-in slide-in-from-left-10 duration-700 overflow-hidden group">

                        {/* Hào quang lấp lánh */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-500/20 blur-[50px] rounded-full pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/20 blur-[50px] rounded-full pointer-events-none" />

                        {/* Header: Tên & Level */}
                        <div className="relative flex items-start justify-between mb-6 pb-5 border-b border-white/10 z-10">
                            <div>
                                {/* 🔥 KHU VỰC TÊN ĐÃ ĐƯỢC CẬP NHẬT 🔥 */}
                                <div className="flex items-center gap-3">
                                    {isRenaming ? (
                                        // Giao diện khi đang nhập tên
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                maxLength={15} // Giới hạn 15 ký tự
                                                className="bg-black/50 border border-white/20 rounded-lg px-3 py-1.5 text-white font-bold outline-none focus:border-pink-500 w-40 text-xl"
                                                autoFocus
                                            />
                                            <button onClick={handleRename} className="text-green-400 bg-white/10 w-8 h-8 rounded-full hover:bg-green-500 hover:text-white transition-all flex items-center justify-center">✔</button>
                                            <button onClick={() => setIsRenaming(false)} className="text-red-400 bg-white/10 w-8 h-8 rounded-full hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">✖</button>
                                        </div>
                                    ) : (
                                        // Giao diện hiển thị bình thường
                                        <h2
                                            className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 tracking-wide drop-shadow-md flex items-center group/name cursor-pointer"
                                            onClick={() => { setIsRenaming(true); setEditName(selectedPet.name); }}
                                        >
                                            {selectedPet.name}
                                            {/* Nút bút chì hiện ra khi hover */}
                                            <span className="opacity-0 group-hover/name:opacity-100 text-sm ml-3 filter grayscale hover:grayscale-0 transition-all">✏️</span>

                                            {isAdult && <span className="text-yellow-400 text-2xl ml-2 filter drop-shadow-[0_0_5px_yellow]" title="Trưởng thành">👑</span>}
                                        </h2>
                                    )}
                                </div>
                                {/* Phần hiển thị Cấp độ giữ nguyên */}
                                <div className="mt-2 inline-flex items-center justify-center px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                                    <p className="text-pink-300 text-[10px] font-black uppercase tracking-[0.2em]">
                                        Cấp độ {selectedPet.level}
                                    </p>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-2xl border border-white/10 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                                {isAdult ? '🐉' : '🐾'}
                            </div>
                        </div>

                        {/* Chỉ số (Bars) - ĐÃ BỎ KHAY NỀN ĐEN */}
                        <div className="relative flex flex-col gap-6 z-10 mt-2">
                            {/* Độ Đói */}
                            <div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider mb-2.5">
                                    <span className="text-orange-300 flex items-center gap-2"><span className="text-base drop-shadow-md">🍖</span> Độ Đói</span>
                                    <span className={selectedPet.hunger < 50 ? 'text-red-400 animate-pulse' : 'text-white'}>{selectedPet.hunger}/100</span>
                                </div>
                                <div className="w-full h-3 bg-black/80 rounded-full overflow-hidden border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                                    <div className={`h-full rounded-full transition-all duration-700 ${selectedPet.hunger < 50 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-gradient-to-r from-orange-500 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} style={{ width: `${selectedPet.hunger}%` }} />
                                </div>
                            </div>

                            {/* Độ Khát */}
                            <div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider mb-2.5">
                                    <span className="text-blue-300 flex items-center gap-2"><span className="text-base drop-shadow-md">💧</span> Độ Khát</span>
                                    <span className={selectedPet.thirst < 50 ? 'text-red-400 animate-pulse' : 'text-white'}>{selectedPet.thirst}/100</span>
                                </div>
                                <div className="w-full h-3 bg-black/80 rounded-full overflow-hidden border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                                    <div className={`h-full rounded-full transition-all duration-700 ${selectedPet.thirst < 50 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]'}`} style={{ width: `${selectedPet.thirst}%` }} />
                                </div>
                            </div>

                            {/* Kinh Nghiệm (XP) */}
                            <div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider mb-2.5">
                                    <span className="text-purple-300 flex items-center gap-2"><span className="text-base drop-shadow-md">✨</span> Kinh Nghiệm</span>
                                    <span className="text-white">{selectedPet.xp}/{maxXP}</span>
                                </div>
                                <div className="w-full h-3 bg-black/80 rounded-full overflow-hidden border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(236,72,153,0.5)]" style={{ width: `${(selectedPet.xp / maxXP) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. THANH CÔNG CỤ (ACTION BUBBLES) - CĂN GIỮA BÊN DƯỚI */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-6 animate-in slide-in-from-bottom-10 duration-700">

                        {/* 🔥 SỬA NÚT NÀY: Thay vì handleAction('feed'), đổi thành mở Menu */}
                        {/* Nút Cho Ăn */}
                        <button
                            onClick={() => { setShowFoodMenu(!showFoodMenu); setShowDrinkMenu(false); }}
                            className={`w-24 h-24 relative overflow-hidden flex flex-col items-center justify-center gap-1.5 backdrop-blur-xl border rounded-full hover:-translate-y-2 hover:shadow-[0_10px_25px_rgba(249,115,22,0.5)] shadow-xl transition-all duration-300 group ${showFoodMenu ? 'bg-orange-500/30 border-orange-400/80' : 'bg-[#0a0f1a]/60 border-white/10 hover:border-orange-500/50'}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <span className="text-3xl drop-shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 z-10">🥣</span>
                            <span className="text-gray-300 group-hover:text-orange-300 text-[10px] font-black uppercase tracking-widest transition-colors z-10">Cho Ăn</span>
                        </button>

                        {/* Nút Cho Uống */}
                        <button
                            onClick={() => { setShowDrinkMenu(!showDrinkMenu); setShowFoodMenu(false); }}
                            className={`w-24 h-24 relative overflow-hidden flex flex-col items-center justify-center gap-1.5 backdrop-blur-xl border rounded-full hover:-translate-y-2 hover:shadow-[0_10px_25px_rgba(59,130,246,0.5)] shadow-xl transition-all duration-300 group ${showDrinkMenu ? 'bg-blue-500/30 border-blue-400/80' : 'bg-[#0a0f1a]/60 border-white/10 hover:border-blue-500/50'}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <span className="text-3xl drop-shadow-lg group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300 z-10">🍼</span>
                            <span className="text-gray-300 group-hover:text-blue-300 text-[10px] font-black uppercase tracking-widest transition-colors z-10">Cho Uống</span>
                        </button>

                        {/* Nút Vuốt Ve */}
                        <button onClick={() => handleAction('pet')} disabled={!canPet} className={`w-24 h-24 relative overflow-hidden flex flex-col items-center justify-center gap-1.5 rounded-full transition-all duration-300 shadow-xl group ${canPet ? 'bg-[#0a0f1a]/60 backdrop-blur-xl border border-white/10 hover:-translate-y-2 hover:border-pink-500/50 hover:shadow-[0_10px_25px_rgba(236,72,153,0.5)] cursor-pointer' : 'bg-black/80 backdrop-blur-md border border-white/5 cursor-not-allowed opacity-60'}`}>
                            {canPet && <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />}
                            <span className="text-3xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300 z-10">{canPet ? '💖' : '💤'}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors z-10 ${canPet ? 'text-gray-300 group-hover:text-pink-300' : 'text-gray-600'}`}>Vuốt Ve</span>
                        </button>
                    </div>
                    {/* 🔥 THÊM MỚI: MENU CHỌN THỨC ĂN NẰM NGANG */}
                    {/* 🔥 MENU CHỌN THỨC ĂN NẰM NGANG CÓ THANH CUỘN */}
                    {showFoodMenu && (
                        // 1. Thay w-max bằng w-[90vw] max-w-[700px] để giới hạn chiều rộng khung
                        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-40 w-[90vw] max-w-[700px] bg-black/15 backdrop-blur-xl border border-white/20 rounded-[2rem] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-5 duration-300">

                            {/* Nút Tắt */}
                            <button onClick={() => setShowFoodMenu(false)} className="absolute top-3 right-4 text-gray-300 hover:text-white font-bold text-lg transition-colors z-50">
                                ✕
                            </button>

                            <div className="text-center mb-4">
                                <h3 className="text-white font-black uppercase tracking-widest text-sm drop-shadow-md">Cửa Hàng Thực Phẩm</h3>
                                <p className="text-yellow-400 text-xs font-bold mt-1 drop-shadow-md">Số dư: {moneyCount} 🪙</p>
                            </div>

                            {/* 2. Bật cuộn ngang: Thêm overflow-x-auto và shop-scrollbar */}
                            <div className="flex gap-4 overflow-x-auto shop-scrollbar pb-4 pt-2 px-2 snap-x snap-mandatory">
                                {/* Dùng thêm tham số index trong map để fix lỗi trùng Key */}
                                {FOOD_ITEMS.map((food, index) => (
                                    <div
                                        key={`${food.id}-${index}`}
                                        onClick={() => handleBuyAndFeed(food)}
                                        // 3. Thêm shrink-0 để các thẻ không bị bóp nghẹt, w-[120px] để cố định kích thước
                                        className="shrink-0 snap-center w-[120px] flex flex-col items-center bg-white/5 border border-white/10 p-3 rounded-2xl cursor-pointer hover:bg-white/15 hover:border-orange-500/50 hover:-translate-y-2 transition-all duration-300 group"
                                    >
                                        <div className="w-16 h-10 flex items-center justify-center mb-2">
                                            <img src={food.image} alt={food.name} className="max-w-full max-h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform" />
                                        </div>

                                        <span className="text-gray-200 font-bold text-sm mb-1">{food.name}</span>

                                        <span className="text-yellow-400 text-xs font-black bg-yellow-400/10 px-2 py-0.5 rounded-md mb-2">
                                            {food.price} 🪙
                                        </span>

                                        <div className="flex flex-col w-full text-[10px] font-bold text-gray-400 gap-1 bg-black/40 p-2 rounded-lg">
                                            <span className="flex justify-between"><span>Đói:</span> <span className="text-orange-400">+{food.hunger}</span></span>
                                            <span className="flex justify-between"><span>XP:</span> <span className="text-purple-400">+{food.xp}</span></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* 🔥 MENU CHỌN THỨC UỐNG NẰM NGANG CÓ THANH CUỘN */}
                    {showDrinkMenu && (
                        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-40 w-[90vw] max-w-[700px] bg-black/15 backdrop-blur-xl border border-blue-500/30 rounded-[2rem] p-5 shadow-[0_10px_40px_rgba(59,130,246,0.3)] animate-in slide-in-from-bottom-5 duration-300">

                            <button onClick={() => setShowDrinkMenu(false)} className="absolute top-3 right-4 text-blue-300 hover:text-white font-bold text-lg transition-colors z-50">
                                ✕
                            </button>

                            <div className="text-center mb-4">
                                <h3 className="text-blue-200 font-black uppercase tracking-widest text-sm drop-shadow-md">Quầy Giải Khát</h3>
                                <p className="text-yellow-400 text-xs font-bold mt-1 drop-shadow-md">Số dư: {moneyCount} 🪙</p>
                            </div>

                            <div className="flex gap-4 overflow-x-auto shop-scrollbar pb-4 pt-2 px-2 snap-x snap-mandatory">
                                {DRINK_ITEMS.map((drink, index) => (
                                    <div
                                        key={`${drink.id}-${index}`}
                                        onClick={() => handleBuyAndDrink(drink)}
                                        className="shrink-0 snap-center w-[120px] flex flex-col items-center bg-white/5 border border-white/10 p-3 rounded-2xl cursor-pointer hover:bg-white/15 hover:border-blue-500/50 hover:-translate-y-2 transition-all duration-300 group"
                                    >
                                        <div className="w-16 h-10 flex items-center justify-center mb-2">
                                            <img src={drink.image} alt={drink.name} className="max-w-full max-h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform" />
                                        </div>

                                        <span className="text-gray-200 font-bold text-sm mb-1">{drink.name}</span>

                                        <span className="text-yellow-400 text-xs font-black bg-yellow-400/10 px-2 py-0.5 rounded-md mb-2">
                                            {drink.price} 🪙
                                        </span>

                                        <div className="flex flex-col w-full text-[10px] font-bold text-gray-400 gap-1 bg-black/40 p-2 rounded-lg">
                                            <span className="flex justify-between"><span>Khát:</span> <span className="text-blue-400">+{drink.thirst}</span></span>
                                            <span className="flex justify-between"><span>XP:</span> <span className="text-purple-400">+{drink.xp}</span></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <Link
                        href="/homepage"
                        className="absolute bottom-8 right-[15.5rem] z-50 group flex h-12 w-36 items-center justify-center font-sans animate-in slide-in-from-right-10 duration-700"
                    >
                        <div className="absolute pointer-events-none animate-pulse">
                            <span className="text-white/60 font-semibold text-lg tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] whitespace-nowrap">LỐI RA</span>
                        </div>
                        <div className="absolute top-[-45px] left-1/2 -translate-x-1/2 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none text-center">
                            <h3 className="text-white font-bold text-sm whitespace-nowrap">Rời khỏi khu thú cưng</h3>
                        </div>
                    </Link>

                    {/* NÚT ĐỔI THÚ CƯNG - GÓC PHẢI BÊN DƯỚI */}
                    <button
                        onClick={() => setShowPetMenu(true)}
                        className="absolute bottom-8 right-8 z-50 group flex items-center gap-3 bg-gradient-to-r from-indigo-500/80 to-purple-600/80 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300 cursor-pointer animate-in slide-in-from-right-10 duration-700"
                    >
                        <span className="text-2xl drop-shadow-md group-hover:-rotate-12 transition-transform">🐾</span>
                        <span className="text-white font-black tracking-widest text-sm uppercase">Đổi Thú Cưng</span>
                    </button>
                    {/* 🔥 MENU CHỌN THÚ CƯNG KHÁC 🔥 */}
                    {showPetMenu && (
                        <div className="fixed inset-0 z-[2000] flex items-center justify-center animate-in fade-in duration-300">
                            {/* Nền mờ */}
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPetMenu(false)} />

                            {/* Khung Menu */}
                            <div className="relative bg-[#0f172a]/95 backdrop-blur-3xl border border-white/20 w-[90vw] max-w-[800px] rounded-[2rem] shadow-2xl p-15 flex flex-col animate-in zoom-in-95 duration-300">
                                <button onClick={() => setShowPetMenu(false)} className="absolute top-4 right-5 text-gray-300 hover:text-white font-bold text-xl transition-colors z-50">
                                    ✕
                                </button>

                                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 text-center uppercase tracking-widest mb-6 drop-shadow-md">
                                    Đội Hình Thú Cưng
                                </h2>

                                <div className="flex gap-4 overflow-x-auto shop-scrollbar pb-4 pt-4 snap-x snap-mandatory px-2">
                                    {myPets.map(pet => {
                                        const isCurrent = selectedPet?.id === pet.id;
                                        return (
                                            <div
                                                key={pet.id}
                                                onClick={() => {
                                                    setSelectedPet(pet); // Chuyển đổi bé thú cưng đang chăm
                                                    setShowPetMenu(false); // Tắt menu
                                                }}
                                                className={`shrink-0 snap-center w-[160px] p-4 rounded-3xl flex flex-col items-center cursor-pointer transition-all duration-300 group border ${isCurrent ? 'bg-indigo-500/20 border-indigo-400/80 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-100 pointer-events-none' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-400/50 hover:-translate-y-2'}`}
                                            >
                                                {/* Hình ảnh */}
                                                <div className="w-20 h-20 relative mb-3">
                                                    {isCurrent && <div className="absolute -inset-2 bg-indigo-500/20 rounded-full blur-md animate-pulse" />}
                                                    <img
                                                        src={PET_IMAGES[pet.petId]?.normal || '/logo.png'}
                                                        alt={pet.name}
                                                        className="relative w-full h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-300"
                                                    />
                                                </div>

                                                {/* Thông tin */}
                                                <h4 className={`font-black text-center ${isCurrent ? 'text-indigo-300' : 'text-gray-200'}`}>{pet.name}</h4>
                                                <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider mt-1">Lv {pet.level}</p>

                                                {/* Mini stats đói/khát */}
                                                <div className="w-full flex justify-between mt-3 px-1 bg-black/30 py-1.5 rounded-lg border border-white/5">
                                                    <span className="text-[10px] flex items-center gap-1 font-bold">
                                                        <span className="text-orange-400 text-xs">🍖</span> {pet.hunger}
                                                    </span>
                                                    <span className="text-[10px] flex items-center gap-1 font-bold">
                                                        <span className="text-blue-400 text-xs">💧</span> {pet.thirst}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* HỘP THÔNG BÁO */}
            {messageBox.isOpen && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center animate-in fade-in duration-300">
                    <button
                        aria-label="Đóng thông báo"
                        onClick={() => setMessageBox({ isOpen: false, message: '' })}
                        className="absolute inset-0 bg-black/55 backdrop-blur-sm cursor-default"
                    />
                    <div className="relative w-[min(90vw,420px)] overflow-hidden rounded-3xl border border-white/20 bg-slate-950/90 p-7 text-center shadow-[0_0_45px_rgba(236,72,153,0.35)] animate-in zoom-in-95 duration-300">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-pink-300/40 bg-pink-500/20 text-3xl shadow-[0_0_24px_rgba(236,72,153,0.35)]">
                            🐾
                        </div>
                        <p className="text-white text-lg font-black leading-relaxed whitespace-pre-line">
                            {messageBox.message}
                        </p>
                        <button
                            onClick={() => setMessageBox({ isOpen: false, message: '' })}
                            className="mt-6 rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-[0_0_18px_rgba(255,255,255,0.18)]"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}

            {/* BẢNG HƯỚNG DẪN */}
            {showGuide && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowGuide(false)} />
                    <div className="relative bg-[#0f172a]/95 backdrop-blur-3xl border border-white/20 w-[500px] max-w-[90vw] rounded-[2rem] shadow-2xl p-8 flex flex-col animate-in zoom-in-95 duration-300">
                        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 text-center uppercase tracking-widest mb-6">Sổ Tay Nuôi Thú</h2>
                        <div className="space-y-4 text-sm text-gray-300">
                            <div className="flex gap-4 items-start bg-white/5 p-3 rounded-xl border border-white/5"><div className="text-2xl">⏳</div><p><strong>Sinh Tồn:</strong> Thú cưng sẽ tự động tiêu hao Điểm Đói và Điểm Khát theo thời gian thực. Nếu giảm dưới 50, bé sẽ buồn bã.</p></div>
                            <div className="flex gap-4 items-start bg-white/5 p-3 rounded-xl border border-white/5"><div className="text-2xl">🥣</div><p><strong>Chăm Sóc:</strong> Cung cấp thức ăn và nước uống kịp thời để duy trì sức khỏe. Mỗi lần chăm sóc bé sẽ nhận được Điểm Kinh Nghiệm (XP).</p></div>
                            <div className="flex gap-4 items-start bg-white/5 p-3 rounded-xl border border-white/5"><div className="text-2xl">💖</div><p><strong>Vuốt Ve:</strong> Cứ mỗi 1 giờ, bé sẽ cần tình yêu thương từ bạn. Vuốt ve giúp bé thư giãn và tăng một lượng lớn XP.</p></div>
                            <div className="flex gap-4 items-start bg-white/5 p-3 rounded-xl border border-white/5"><div className="text-2xl">👑</div><p><strong>Trưởng Thành:</strong> Khi đạt đến <strong>Level 10</strong>, thú cưng sẽ tiến hóa, lột xác thành hình dáng trưởng thành vô cùng oai vệ!</p></div>
                        </div>
                        <button onClick={() => setShowGuide(false)} className="mt-8 py-3 w-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                            Đã Hiểu, Bắt Đầu Thôi!
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
