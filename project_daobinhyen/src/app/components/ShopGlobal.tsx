'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/app/context/AuthContext';
import { usePathname } from 'next/navigation';
import { Quicksand } from 'next/font/google';
const quicksand = Quicksand({
    subsets: ['vietnamese'],
    weight: ['400', '500', '600', '700'], // Các độ đậm nhạt
    display: 'swap',
});

interface PetCost {
    lam?: number;
    tim?: number;
    vang?: number;
    cam?: number;
}

interface PetItem {
    id: string;
    name: string;
    description: string;
    image: string;
    rarity: 'Thường' | 'Hiếm' | 'Sử Thi' | 'Huyền Thoại';
    costType: 'money' | 'leaves' | 'essence';
    cost: number | PetCost;
}

const PET_LIST: PetItem[] = [
    {
        id: 'pet_cat',
        name: 'Tiểu Miêu',
        description: 'Bé mèo mướp ngoan ngoãn, mang lại tiếng purr bình yên mỗi ngày.',
        image: '/thucung/ConMeo.png',
        rarity: 'Thường',
        costType: 'money',
        cost: 1500
    },
    {
        id: 'pet_dog',
        name: 'Cún Học Giả',
        description: 'Đeo balo xanh năng động, luôn trung thành đồng hành cùng bạn.',
        image: '/thucung/ConCho.png',
        rarity: 'Thường',
        costType: 'money',
        cost: 2500
    },
    {
        id: 'pet_fox',
        name: 'Hồ Ly Nhỏ',
        description: 'Ánh mắt lanh lợi, chiếc đuôi xù ấm áp xua tan sự lạnh lẽo.',
        image: '/thucung/ConCao.png',
        rarity: 'Hiếm',
        costType: 'essence',
        cost: { lam: 50, tim: 25 }
    },
    {
        id: 'pet_dino',
        name: 'Long Cổ Đại',
        description: 'Sinh vật tiền sử có nụ cười hiền khô, rất thích ăn lá cây.',
        image: '/thucung/ConKhungLong.png',
        rarity: 'Hiếm',
        costType: 'essence',
        cost: { lam: 100, tim: 50 }
    },
    {
        id: 'pet_tiger',
        name: 'Tiểu Hổ Dũng Mãnh',
        description: 'Mạnh mẽ và dũng cảm, bảo vệ khu vườn khỏi mọi muộn phiền.',
        image: '/thucung/ConHo.png',
        rarity: 'Sử Thi',
        costType: 'essence',
        cost: { tim: 50, vang: 50 }
    },
    {
        id: 'pet_dragon',
        name: 'Thanh Long Hỏa Ngọc',
        description: 'Rồng thần điều khiển hỏa ngọc, loài linh thú trong truyền thuyết.',
        image: '/thucung/ConRong.png',
        rarity: 'Huyền Thoại',
        costType: 'essence',
        cost: { vang: 100, cam: 40 }
    }
];

export default function ShopGlobal() {
    const pathname = usePathname() || '';
    const { user: firebaseUser, userDataExtended, setUserDataExtended } = useAuthContext();

    const [mounted, setMounted] = useState(false);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [shopTab, setShopTab] = useState<'seeds' | 'pets'>('seeds');

    // 🔥 STATE MỚI: QUẢN LÝ THÔNG BÁO CUSTOM 🔥
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const allowedRoutes = [
        '/homepage', '/vuonhoa', '/hangdong',
        '/haidang', '/thanthu', '/nhago',
        '/vachda', '/honuoc'
    ];
    const isAllowed = allowedRoutes.some(route => pathname.startsWith(route));

    if (!isAllowed || !firebaseUser) return null;

    const activeData = userDataExtended?.data || userDataExtended || {};
    const moneyCount = Number(activeData.money ?? 0);
    const seedCount = Number(activeData.seeds ?? 0);
    const leavesCount = Number(activeData.leaves ?? 0);
    const ownedPets = activeData.ownedPets || [];
    const essences = {
        lam: Number(activeData.essence_lam ?? 0),
        tim: Number(activeData.essence_tim ?? 0),
        vang: Number(activeData.essence_vang ?? 0),
        cam: Number(activeData.essence_cam ?? 0),
    };

    const handleBuyItem = async (
        type: 'seed' | 'pet' | 'essence_lam' | 'essence_tim' | 'essence_vang' | 'essence_cam',
        costType: 'money' | 'leaves' | 'essence',
        cost: any,
        rewardAmount: number,
        itemName: string,
        petIdStr?: string
    ) => {

        // 1. KIỂM TRA ĐIỀU KIỆN
        if (type === 'pet' && ownedPets.includes(itemName)) {
            setNotification({ message: 'Bạn đã sở hữu thú cưng này rồi!', type: 'error' });
            return;
        }
        if (costType === 'money' && moneyCount < cost) {
            setNotification({ message: 'Không đủ Vàng để giao dịch!', type: 'error' });
            return;
        }
        if (costType === 'leaves' && leavesCount < cost) {
            setNotification({ message: 'Không đủ Lá Cây để giao dịch!', type: 'error' });
            return;
        }
        if (costType === 'essence') {
            if (essences.lam < (cost.lam || 0) || essences.tim < (cost.tim || 0) ||
                essences.vang < (cost.vang || 0) || essences.cam < (cost.cam || 0)) {
                setNotification({ message: 'Không đủ Tinh Hoa để trao đổi!', type: 'error' });
                return;
            }
        }

        // 2. TÍNH TOÁN SỐ DƯ MỚI TRƯỚC KHI GỌI API
        let newMoney = moneyCount;
        let newLeaves = leavesCount;
        let newSeeds = seedCount;
        let newLam = essences.lam;
        let newTim = essences.tim;
        let newVang = essences.vang;
        let newCam = essences.cam;

        // Trừ chi phí
        if (costType === 'money') newMoney -= cost;
        if (costType === 'leaves') newLeaves -= cost;
        if (costType === 'essence') {
            newLam -= (cost.lam || 0);
            newTim -= (cost.tim || 0);
            newVang -= (cost.vang || 0);
            newCam -= (cost.cam || 0);
        }

        // Cộng phần thưởng
        if (type === 'seed') newSeeds += rewardAmount;
        if (type === 'essence_lam') newLam += rewardAmount;
        if (type === 'essence_tim') newTim += rewardAmount;
        if (type === 'essence_vang') newVang += rewardAmount;
        if (type === 'essence_cam') newCam += rewardAmount;

        // 3. CẬP NHẬT GIAO DIỆN NGAY LẬP TỨC (MƯỢT MÀ)
        if (setUserDataExtended) {
            setUserDataExtended((prev: any) => {
                const prevData = prev?.data || prev || {};
                return {
                    ...prev,
                    data: {
                        ...prevData,
                        money: newMoney,
                        leaves: newLeaves,
                        seeds: newSeeds,
                        essence_lam: newLam,
                        essence_tim: newTim,
                        essence_vang: newVang,
                        essence_cam: newCam,
                        ...(type === 'pet' ? { ownedPets: [...(prevData.ownedPets || []), itemName] } : {})
                    }
                };
            });
        }

        // 4. GỌI API ĐỂ LƯU VÀO DATABASE FIREBASE
        try {
            if (type === 'pet') {
                // API mua thú cưng cũ của bạn
                const res = await fetch('/api/shop/buyPet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: firebaseUser.uid, petId: petIdStr, petName: itemName, costType, cost })
                });

                const data = await res.json();
                if (data.success) {
                    setNotification({ message: `🎉 Chúc mừng! Bạn đã đón ${itemName} về đảo!`, type: 'success' });
                } else {
                    setNotification({ message: `Lỗi: ${data.message}`, type: 'error' });
                }
            } else {
                // 🔥 API MỚI CHO GIAO DỊCH HẠT GIỐNG VÀ TINH HOA
                const res = await fetch('/api/shop/transaction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: firebaseUser.uid,
                        updates: {
                            money: newMoney,
                            leaves: newLeaves,
                            seeds: newSeeds,
                            essence_lam: newLam,
                            essence_tim: newTim,
                            essence_vang: newVang,
                            essence_cam: newCam,
                        }
                    })
                });

                const data = await res.json();
                if (data.success) {
                    setNotification({ message: `Giao dịch thành công: Nhận ${itemName}!`, type: 'success' });
                } else {
                    setNotification({ message: `Lỗi lưu trữ: ${data.message}`, type: 'error' });
                }
            }
        } catch (error) {
            console.error("Lỗi khi gọi API mua sắm", error);
            setNotification({ message: 'Có lỗi kết nối với máy chủ!', type: 'error' });
        }
    };
    const getRarityStyles = (rarity: string) => {
        switch (rarity) {
            case 'Thường': return { tag: 'bg-gray-500', glow: 'shadow-[0_0_10px_#9ca3af]', text: 'text-white', border: 'border-white/10' };
            case 'Hiếm': return { tag: 'bg-blue-500', glow: 'shadow-[0_0_15px_#3b82f6]', text: 'text-blue-300', border: 'border-blue-500/30' };
            case 'Sử Thi': return { tag: 'bg-purple-500', glow: 'shadow-[0_0_20px_#a855f7]', text: 'text-purple-300', border: 'border-purple-500/40' };
            case 'Huyền Thoại': return { tag: 'bg-yellow-500', glow: 'shadow-[0_0_25px_#eab308]', text: 'text-yellow-300', border: 'border-yellow-500/60' };
            default: return { tag: 'bg-gray-500', glow: '', text: 'text-white', border: 'border-white/10' };
        }
    };

    return (

        <div className={`fixed inset-0 z-[1500] pointer-events-none ${quicksand.className}`}>
            {/* NÚT MỞ GIAO DIỆN CỬA HÀNG */}
            <button
                onClick={() => setIsShopOpen(true)}
                className="fixed bottom-8 left-8 z-[1500] group flex items-center gap-3 bg-gradient-to-r from-pink-600/80 to-purple-800/80 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:scale-105 hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] transition-all duration-300 pointer-events-auto"
            >
                <span className="text-2xl drop-shadow-md group-hover:rotate-12 transition-transform">🏪</span>
                <span className="text-white font-black tracking-widest text-sm uppercase">CỬA HÀNG</span>
            </button>

            {/* GIAO DIỆN CỬA HÀNG CHÍNH */}
            {isShopOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center animate-in fade-in duration-300 pointer-events-auto">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsShopOpen(false)} />

                    <div className="relative bg-[#0f172a]/90 backdrop-blur-3xl border border-white/20 w-[900px] max-w-[95vw] h-[600px] rounded-[2rem] shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* CỘT TRÁI - MENU */}
                        <div className="w-1/3 bg-black/40 border-r border-white/10 p-6 flex flex-col">
                            <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-widest bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">CỬA HÀNG</h2>

                            <button onClick={() => setShopTab('seeds')} className={`text-left px-5 py-4 rounded-2xl font-bold transition-all mb-3 ${shopTab === 'seeds' ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/50 text-green-400' : 'text-gray-400 hover:bg-white/5'}`}>
                                🛍️ Đổi Vật Phẩm
                            </button>
                            <button onClick={() => setShopTab('pets')} className={`text-left px-5 py-4 rounded-2xl font-bold transition-all ${shopTab === 'pets' ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-400/50 text-pink-400' : 'text-gray-400 hover:bg-white/5'}`}>
                                🦊 Trại Thú Cưng
                            </button>

                            <div className="mt-auto bg-white/5 border border-white/10 rounded-2xl p-4">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Số dư của bạn</p>
                                <div className="grid grid-cols-2 gap-2 text-xs font-black">
                                    <span className="text-yellow-400">{moneyCount} 💰</span>
                                    <span className="text-green-400">{seedCount} 🌱</span>
                                    <span className="text-emerald-300">{leavesCount} 🍃</span>
                                </div>
                                <div className="flex gap-2 mt-2 pt-2 border-t border-white/10">
                                    <span className="text-blue-400 font-black text-xs flex items-center gap-1"><img src="/vuonhoa/tinhhoa/tinhhoalam.png" className="w-3 h-3 rounded-full" /> {essences.lam}</span>
                                    <span className="text-purple-400 font-black text-xs flex items-center gap-1"><img src="/vuonhoa/tinhhoa/tinhhoatim.png" className="w-3 h-3 rounded-full" /> {essences.tim}</span>
                                    <span className="text-yellow-400 font-black text-xs flex items-center gap-1"><img src="/vuonhoa/tinhhoa/tinhhoavang.png" className="w-3 h-3 rounded-full" /> {essences.vang}</span>
                                    <span className="text-orange-400 font-black text-xs flex items-center gap-1"><img src="/vuonhoa/tinhhoa/tinhhoacam.png" className="w-3 h-3 rounded-full" /> {essences.cam}</span>
                                </div>
                            </div>
                        </div>

                        {/* CỘT PHẢI - DANH SÁCH */}
                        <div className="w-2/3 p-6 h-full overflow-y-auto shop-scrollbar">
                            {/* TAB ĐỔI VẬT PHẨM */}
                            {shopTab === 'seeds' && (
                                <div className="grid grid-cols-2 gap-4 pb-10">
                                    {/* 1. Gói Hạt Giống (Cũ) */}
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-3xl mb-3 shadow-[0_0_15px_rgba(74,222,128,0.3)]">🌱</div>
                                        <h4 className="text-white font-bold mb-1">Gói Hạt Giống 1</h4>
                                        <p className="text-gray-400 text-[11px] mb-4">Nhận ngay 5 hạt giống để bắt đầu trồng trọt.</p>
                                        <button onClick={() => handleBuyItem('seed', 'money', 20, 5, '5 Hạt Giống')} className="w-full py-2 mt-auto bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 font-black text-xs rounded-xl hover:bg-yellow-500/40 transition-colors">
                                            MUA: 20 💰
                                        </button>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-3xl mb-3 shadow-[0_0_15px_rgba(52,211,153,0.3)]">🌿</div>
                                        <h4 className="text-white font-bold mb-1">Gói Hạt Giống 2</h4>
                                        <p className="text-gray-400 text-[11px] mb-4">Dùng lá cây rụng trên đảo để quy đổi.</p>
                                        <button onClick={() => handleBuyItem('seed', 'leaves', 50, 5, '5 Hạt Giống')} className="w-full py-2 mt-auto bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-black text-xs rounded-xl hover:bg-emerald-500/40 transition-colors">
                                            ĐỔI: 50 🍃
                                        </button>
                                    </div>

                                    {/* 2. CÁC GÓI TINH HOA BẰNG VÀNG (Mới) */}

                                    {/* Tinh Hoa Lam */}
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                            <img src="/vuonhoa/tinhhoa/tinhhoalam.png" alt="Lam" className="w-8 h-8 object-contain" />
                                        </div>
                                        <h4 className="text-white font-bold mb-1">5 Tinh Hoa Lam</h4>
                                        <p className="text-gray-400 text-[11px] mb-4">Mảnh vỡ xanh thẳm, dùng để ấp thú cưng Hiếm.</p>
                                        <button onClick={() => handleBuyItem('essence_lam', 'money', 200, 10, '10 Tinh Hoa Lam')} className="w-full py-2 mt-auto bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 font-black text-xs rounded-xl hover:bg-yellow-500/40 transition-colors">
                                            MUA: 200 💰
                                        </button>
                                    </div>

                                    {/* Tinh Hoa Tím */}
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                                        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                            <img src="/vuonhoa/tinhhoa/tinhhoatim.png" alt="Tím" className="w-8 h-8 object-contain" />
                                        </div>
                                        <h4 className="text-white font-bold mb-1">5 Tinh Hoa Tím</h4>
                                        <p className="text-gray-400 text-[11px] mb-4">Kết tinh ma thuật, ẩn chứa sức mạnh Sử Thi.</p>
                                        <button onClick={() => handleBuyItem('essence_tim', 'money', 500, 5, '5 Tinh Hoa Tím')} className="w-full py-2 mt-auto bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 font-black text-xs rounded-xl hover:bg-yellow-500/40 transition-colors">
                                            MUA: 500 💰
                                        </button>
                                    </div>

                                    {/* Tinh Hoa Vàng */}
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                                        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                                            <img src="/vuonhoa/tinhhoa/tinhhoavang.png" alt="Vàng" className="w-8 h-8 object-contain" />
                                        </div>
                                        <h4 className="text-white font-bold mb-1">2 Tinh Hoa Vàng</h4>
                                        <p className="text-gray-400 text-[11px] mb-4">Ánh sáng thuần khiết, rực rỡ như Mặt Trời.</p>
                                        <button onClick={() => handleBuyItem('essence_vang', 'money', 500, 2, '2 Tinh Hoa Vàng')} className="w-full py-2 mt-auto bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 font-black text-xs rounded-xl hover:bg-yellow-500/40 transition-colors">
                                            MUA: 400 💰
                                        </button>
                                    </div>

                                    {/* Tinh Hoa Cam */}
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                                        <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                                            <img src="/vuonhoa/tinhhoa/tinhhoacam.png" alt="Cam" className="w-8 h-8 object-contain" />
                                        </div>
                                        <h4 className="text-white font-bold mb-1">1 Tinh Hoa Cam</h4>
                                        <p className="text-gray-400 text-[11px] mb-4">Vật phẩm tối thượng để chiêu mộ Thần Thú.</p>
                                        <button onClick={() => handleBuyItem('essence_cam', 'money', 400, 1, '1 Tinh Hoa Cam')} className="w-full py-2 mt-auto bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 font-black text-xs rounded-xl hover:bg-yellow-500/40 transition-colors">
                                            MUA: 400 💰
                                        </button>
                                    </div>
                                </div>
                            )}
                            {/* TAB ĐỔI THÚ CƯNG */}
                            {shopTab === 'pets' && (
                                <div className="grid grid-cols-2 gap-4 pb-10">
                                    {PET_LIST.map((pet) => {
                                        const styles = getRarityStyles(pet.rarity);
                                        const isOwned = ownedPets.includes(pet.name);

                                        return (
                                            <div key={pet.id} className={`bg-white/5 border ${styles.border} rounded-2xl p-4 flex flex-col items-center text-center hover:bg-white/10 transition-all relative overflow-hidden group`}>
                                                <div className={`absolute top-2 left-2 ${styles.tag} text-white text-[9px] px-2 py-0.5 rounded-md font-black uppercase ${styles.glow}`}>
                                                    {pet.rarity}
                                                </div>
                                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 mt-2 bg-white/5 ${styles.glow} group-hover:scale-110 transition-transform duration-300`}>
                                                    <img src={pet.image} alt={pet.name} className="w-[90%] h-[90%] object-contain" />
                                                </div>
                                                <h4 className={`${styles.text} font-bold mb-1 text-[14px]`}>{pet.name}</h4>
                                                <p className="text-gray-400 text-[10px] mb-4 line-clamp-2 h-7">{pet.description}</p>

                                                {isOwned ? (
                                                    <button
                                                        disabled
                                                        className="w-full py-2 flex items-center justify-center gap-1.5 bg-gray-500/40 border border-gray-500/50 text-gray-300 font-black text-[11px] rounded-xl cursor-not-allowed opacity-70"
                                                    >
                                                        ✔ ĐÃ SỞ HỮU
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleBuyItem('pet', pet.costType as any, pet.cost, 1, pet.name, pet.id)}
                                                        className="w-full py-2 flex items-center justify-center gap-1.5 bg-white/10 border border-white/20 text-white font-black text-[11px] rounded-xl hover:bg-white/20 transition-colors"
                                                    >
                                                        {pet.costType === 'money' ? (
                                                            <>ĐÓN VỀ: {pet.cost} 💰</>
                                                        ) : (
                                                            <>
                                                                ĐỔI:
                                                                {typeof pet.cost === 'object' && (
                                                                    <>
                                                                        {pet.cost.lam && <>{pet.cost.lam}<img src="/vuonhoa/tinhhoa/tinhhoalam.png" className="w-3 h-3 rounded-full" /></>}
                                                                        {pet.cost.tim && <>{pet.cost.tim}<img src="/vuonhoa/tinhhoa/tinhhoatim.png" className="w-3 h-3 rounded-full" /></>}
                                                                        {pet.cost.vang && <>{pet.cost.vang}<img src="/vuonhoa/tinhhoa/tinhhoavang.png" className="w-3 h-3 rounded-full" /></>}
                                                                        {pet.cost.cam && <>{pet.cost.cam}<img src="/vuonhoa/tinhhoa/tinhhoacam.png" className="w-3 h-3 rounded-full" /></>}
                                                                    </>
                                                                )}
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <button onClick={() => setIsShopOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 border border-white/20 text-white hover:bg-red-500/50 transition-colors z-50">✖</button>
                    </div>
                </div>
            )}

            {/* BẢNG THÔNG BÁO CUSTOM (THAY THẾ CHO ALERT) */}
            {notification && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center animate-in fade-in duration-300 pointer-events-auto">
                    {/* Nền mờ đằng sau */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setNotification(null)} />

                    {/* Hộp thoại thông báo */}
                    <div className="relative bg-[#0f172a]/95 backdrop-blur-3xl border border-white/20 w-[400px] max-w-[90vw] rounded-[2rem] shadow-2xl p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">

                        {/* Icon trạng thái */}
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg ${notification.type === 'error' ? 'bg-red-500/20 shadow-red-500/40 text-red-400' : 'bg-green-500/20 shadow-green-500/40 text-green-400'}`}>
                            {notification.type === 'error' ? '❌' : '✨'}
                        </div>

                        {/* Tiêu đề */}
                        <h3 className={`text-xl font-black mb-2 uppercase tracking-wide ${notification.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                            {notification.type === 'error' ? 'Giao dịch thất bại' : 'Thành công'}
                        </h3>

                        {/* Lời nhắn */}
                        <p className="text-gray-300 text-sm mb-6 leading-relaxed px-2">
                            {notification.message}
                        </p>

                        {/* Nút xác nhận */}
                        <button
                            onClick={() => setNotification(null)}
                            className={`w-full py-3 rounded-xl font-black text-[13px] uppercase tracking-widest text-white shadow-lg transition-all ${notification.type === 'error' ? 'bg-gradient-to-r from-red-600 to-pink-700 hover:opacity-90' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90'}`}
                        >
                            Xác nhận
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}