'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Import CSS Module
import styles from './daily-checkin.module.css';

// --- INTERFACES ---
interface UserData {
  userId: string;
  userName: string;
  lastLoginDate: string;
  lastSurveyType: 'study' | 'emotion' | 'sleep' | null;
  lastScore: number;
  topicStreak: number;
  pendingLetter?: { content: string; unlockDate: string } | null;
}

interface Scene {
  id: string;
  speaker: string;
  text: string;
  type?: 'options' | 'next_button';
  next?: string;
  next_text?: string;
  action?: string;
  options?: { text: string; value?: string; next: string }[];
}

// --- OPTIONS CHECK-IN CỐ ĐỊNH ---
const CHECKIN_OPTIONS = [
  { text: 'Con cần một nơi để tập trung làm việc.', value: 'study', next: 'checkin_study_result' },
  { text: 'Con thấy hơi mệt, muốn tìm chỗ giải tỏa.', value: 'emotion', next: 'checkin_emotion_result' },
  { text: 'Con muốn tìm sự an yên để dễ ngủ.', value: 'sleep', next: 'checkin_sleep_result' }
];

export default function DailyCheckinPage() {
  const router = useRouter();
  
  // --- STATE ---
  const [userData, setUserData] = useState<UserData | null>(null);
  const [scenario, setScenario] = useState<Scene[]>([]);
  const [currentSceneId, setCurrentSceneId] = useState<string>('');
  
  // UI State
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Audio Refs
  const typingSoundRef = useRef<HTMLAudioElement | null>(null);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);

  // --- 1. LẤY DỮ LIỆU TỪ BACKEND ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/user/getUserInFo');
        if (!res.ok) {
          router.replace('/login');
          return;
        }

        const data = await res.json();
        
        // Chuyển đổi dữ liệu từ API thành chuẩn UserData của component
        const dbUser: UserData = {
          userId: data.userId,
          userName: data.username || 'Bạn',
          lastLoginDate: data.lastLoginDate,
          lastSurveyType: data.lastSurveyType,
          lastScore: data.lastSurveyScore || 0,
          topicStreak: data.topicStreak || 0,
        };

        setUserData(dbUser);
        
        // Xây dựng kịch bản dựa trên dữ liệu
        const generatedScenario = buildScenario(dbUser);
        setScenario(generatedScenario);
        setCurrentSceneId(generatedScenario[0].id);
        setIsLoading(false);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu người dùng:", error);
        router.replace('/login');
      }
    };

    fetchUserData();
  }, []);

  // --- 2. BỘ NÃO XỬ LÝ 8 TRƯỜNG HỢP ---
  const buildScenario = (data: UserData): Scene[] => {
    const now = new Date();
    const lastLogin = new Date(data.lastLoginDate);
    const diffTime = Math.abs(now.getTime() - lastLogin.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const currentHour = now.getHours();
    
    let generatedScenes: Scene[] = [];
    const speaker = 'Trưởng đảo "LÂM QUANG MINH"';
    const name = data.userName;

    // Các Scene kết thúc: Đưa ra lời khuyên và chung một nút "Vào đảo"
    const ENDING_SCENES: Scene[] = [
      { id: 'checkin_study_result', speaker, text: 'Tuyệt vời, lát nữa con có thể ghé qua Hải đăng tập trung. Hãy thả lỏng và cày cuốc nhé!', type: 'next_button', next_text: 'Vào đảo', action: 'go_island' },
      { id: 'checkin_emotion_result', speaker, text: 'Đừng lo, lúc nào buồn con có thể ra Suối nguồn cảm xúc hoặc tìm bé Mèo con để trút bầu tâm sự nhé.', type: 'next_button', next_text: 'Vào đảo', action: 'go_island' },
      { id: 'checkin_sleep_result', speaker, text: 'Tối nay con có thể thử vào Nhà gỗ bình yên, nằm lên chiếc võng và nghe chút nhạc lofi cho dễ ngủ nhé.', type: 'next_button', next_text: 'Vào đảo', action: 'go_island' }
    ];

    // Cấu trúc Scene hỏi Check-in chung
    const checkInScene = (id: string, text: string): Scene => ({
      id, speaker, text, type: 'options', options: CHECKIN_OPTIONS
    });

    // XỬ LÝ LOGIC ƯU TIÊN
    const randomChance = Math.random();

    if (diffDays >= 180) {
      // TH1: Hơn 6 tháng
      generatedScenes = [
        { id: 's1', speaker, text: `Ô hô hô... Gió biển hôm nay thổi về một người quen cũ. ${name} đấy ư? Chà, phải hơn nửa năm rồi cái thân già này mới thấy con.`, next: 's2' },
        { id: 's2', speaker, text: `Nửa năm ngoài kia chắc có nhiều đổi thay. Nán lại một chút, làm lại bài khảo sát để ta xem dạo này tâm hồn con mang màu sắc gì nhé...`, type: 'next_button', next_text: 'Làm bài khảo sát', action: 'force_full_survey' }
      ];
    } 
    else if (randomChance < 0.15 && diffDays < 180) {
      // TH5: Sự kiện ngẫu nhiên (15% cơ hội xuất hiện)
      generatedScenes = [
        { id: 's1', speaker, text: `A ${name} tới đúng lúc lắm! Nay ta đi dạo nhặt được hạt giống lạ. Tí nữa con rảnh thì mang ra Vườn hoa ươm thử nhé!`, next: 's2' },
        checkInScene('s2', 'Còn bây giờ, cơn gió nào đưa con đến Đảo Bình Yên hôm nay?')
      ];
    }
    else if (data.topicStreak >= 5 && data.lastScore <= 45) {
      // TH6: Mắc kẹt với nỗi buồn (Streak >= 5)
      generatedScenes = [
        { id: 's1', speaker, text: `Này ${name}... Ta thấy con loanh quanh với nỗi buồn này hơi lâu rồi đấy. Trốn tránh mãi không phải là cách đâu.`, next: 's2' },
        checkInScene('s2', `Ta thách con lên Vách đá tầm nhìn rồi nhảy xuống cho tỉnh ra đấy! Hay nay con muốn đổi gió làm việc khác?`)
      ];
    }
    else if (data.topicStreak === 1 && diffDays < 7) {
       // TH7: Biến động liên tục (Đổi chủ đề xoành xoạch)
       generatedScenes = [
        { id: 's1', speaker, text: `Hôm trước ta vừa thấy con bận tâm chuyện khác, nay gió lại đổi chiều rồi à? Cảm giác như tâm trí con đang hơi lộn xộn đúng không?`, next: 's2' },
        checkInScene('s2', 'Đừng cố gồng gánh tất cả cùng lúc. Hôm nay con muốn ưu tiên giải quyết điều gì trước?')
      ];
    }
    else if (diffDays >= 30) {
      // TH2: Vắng bóng 1-6 tháng
      let text = '';
      if (data.lastScore <= 45) text = `Cũng hơn tháng rồi ta mới gặp con. Bão giông ngoài kia đã qua chưa con? Vấn đề ${data.lastSurveyType === 'study' ? 'học tập' : data.lastSurveyType === 'emotion' ? 'cảm xúc' : 'giấc ngủ'} có còn làm con phiền lòng không?`;
      else text = `Chào người bạn cũ! Bẵng đi một dạo, không biết con có còn giữ được năng lượng rạng rỡ như lần trước đến đây không?`;
      
      generatedScenes = [
        { id: 's1', speaker, text, next: 's2' },
        checkInScene('s2', 'Hôm nay ghé đảo, con định tìm kiếm điều gì?')
      ];
    }
    else if (data.lastSurveyType === 'emotion' && data.lastScore <= 40 && randomChance < 0.5) {
       // TH8: Cộng đồng (Gợi ý nếu Emotion thấp)
       generatedScenes = [
        { id: 's1', speaker, text: `Ta biết dạo này con mang nhiều tâm sự. Ta thấy ở Đảo Chung cũng đang có nhiều người buồn giống con đấy.`, next: 's2' },
        checkInScene('s2', 'Con muốn ra Suối nguồn tìm người trò chuyện hay muốn làm gì khác hôm nay?')
      ];
    }
    else {
      // TH3 & TH4: Khách quen / Lời chào thời gian thực
      let greeting = `Lại gặp con rồi ${name}!`;
      if (currentHour >= 5 && currentHour <= 8) greeting = `Ô hô hô, dậy sớm thế ${name}! Sương trên Đảo còn chưa tan hết đâu.`;
      else if (currentHour >= 22 || currentHour <= 2) greeting = `Khuya lắm rồi {name} ơi. Tiếng sóng biển đã rì rào hát ru rồi, sao con còn chưa nghỉ ngơi?`;

      generatedScenes = [
        { id: 's1', speaker, text: greeting, next: 's2' },
        checkInScene('s2', 'Ta đoán là con đang cần một không gian riêng. Hôm nay con muốn ta dẫn đến đâu?')
      ];
    }

    return [...generatedScenes, ...ENDING_SCENES];
  };

  const currentScene = scenario.find(s => s.id === currentSceneId) || scenario[0];

  // --- 3. LOGIC GÕ CHỮ & ÂM THANH ---
  useEffect(() => {
    if (isLoading || !currentScene) return;

    let index = 0;
    setDisplayedText('');
    setIsTyping(true);

    const interval = setInterval(() => {
      index++;
      setDisplayedText(currentScene.text.slice(0, index));

      const sound = typingSoundRef.current;
      if (sound) {
        if (index >= currentScene.text.length) {
          clearInterval(interval);
          setIsTyping(false);
          sound.pause();
          sound.currentTime = 0;
          return;
        }

        if (currentScene.text[index - 1] !== ' ') {
          sound.pause();
          sound.currentTime = 0;
          sound.volume = 0.2;
          sound.play().catch(() => { });
          setTimeout(() => { sound.pause(); }, 60);
        }
      }
    }, 50);

    return () => {
      clearInterval(interval);
      if (typingSoundRef.current) {
        typingSoundRef.current.pause();
        typingSoundRef.current.currentTime = 0;
      }
    };
  }, [currentSceneId, isLoading]);

  const playClickSound = () => {
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch(() => { });
    }
  };

  // --- 4. XỬ LÝ CHUYỂN CẢNH & CHỌN CHECK-IN ---
  const handleNext = async (nextId: string, choiceValue?: string) => {
    playClickSound();

    if (choiceValue && userData) {
      const newStreak = (choiceValue === userData.lastSurveyType) ? userData.topicStreak + 1 : 1;
      
      try {
        await fetch('/api/user/daily-checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            surveyType: choiceValue,
            topicStreak: newStreak,
            lastScore: userData.lastScore 
          }),
        });

        setUserData({
          ...userData,
          lastSurveyType: choiceValue as 'study' | 'emotion' | 'sleep',
          topicStreak: newStreak
        });
      } catch (error) {
        console.error('Lỗi khi lưu check-in:', error);
      }
    }

    setDisplayedText('');
    setIsTyping(true);
    setCurrentSceneId(nextId);
  };

  const handleBoxClick = () => {
    if (!isTyping && !currentScene.type && currentScene.next) {
      handleNext(currentScene.next);
    }
  };

  const handleAction = (action: string) => {
    playClickSound();
    if (action === 'force_full_survey') {
      router.push('/survey');
    } else if (action === 'go_island') {
      router.push('/homepage'); 
    }
  };

  if (isLoading) return <div className="h-screen bg-[#1a1a1a] flex justify-center items-center"><div className="text-[#d2c4a7] animate-pulse">Đang kết nối Đảo Bình Yên...</div></div>;

  // --- 5. RENDERING ---
  return (
    <div className="relative w-full h-screen bg-[#1a1a1a] font-sans overflow-hidden">
      <audio ref={typingSoundRef} src="/typing.wav" preload="auto" />
      <audio ref={clickSoundRef} src="/select.wav" preload="auto" />

      {/* BACKGROUND (CSS Module) */}
      <div className={`absolute inset-0 bg-cover bg-center ${styles.animateKenBurns}`} style={{ backgroundImage: "url('/Island8.0.jpg')" }}></div>
      <div className="absolute inset-0 bg-black/30"></div>

      {/* NHÂN VẬT (CSS Module) */}
      <div className={`fixed bottom-[15%] left-[5%] md:left-[8%] w-[260px] h-[400px] md:w-[420px] md:h-[620px] z-10 pointer-events-none drop-shadow-2xl ${styles.animateFloat}`}>
        <Image src="/oldman.png" alt="Elder" fill className="object-contain object-bottom" priority />
      </div>

      {/* TÙY CHỌN CHECK-IN */}
      {!isTyping && currentScene.type === 'options' && (
        <div className="fixed inset-0 flex items-start justify-center md:justify-end md:pr-[10%] z-40 pointer-events-none pt-[5vh] md:pt-[10vh]">
          <div className="flex flex-col gap-3 w-[90%] max-w-[450px] pointer-events-auto animate-in fade-in slide-in-from-top-10 duration-500">
            {currentScene.options?.map((opt, i) => (
              <button key={i} onClick={() => handleNext(opt.next, opt.value)}
                className="group relative w-full py-4 px-6 bg-[#fdfbf7]/95 border-2 border-[#d2c4a7] rounded-xl text-[#4a4036] font-bold text-base shadow-lg hover:bg-[#6c7a65] hover:text-white transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#8c7d6c] group-hover:bg-white shrink-0"></div>
                  <span className="leading-tight">{opt.text}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* NÚT TIẾP TỤC */}
      {!isTyping && currentScene.type === 'next_button' && (
        <div className="fixed inset-0 flex items-center justify-center md:justify-end md:pr-[15%] z-50 pointer-events-none">
          <button onClick={() => handleAction(currentScene.action!)}
            className="pointer-events-auto px-12 py-5 bg-[#6c7a65] text-white text-xl font-black rounded-3xl shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
            {currentScene.next_text} <span>→</span>
          </button>
        </div>
      )}

      {/* HỘP THOẠI TRƯỞNG ĐẢO */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-[950px] z-50">
        <div className="relative p-8 md:p-10 bg-[#fdfbf7] border-[4px] border-[#d2c4a7] text-[#4a4036] rounded-[2.5rem] shadow-2xl min-h-[160px] cursor-pointer"
          onClick={handleBoxClick}>
          <div className="absolute -top-5 left-10 px-6 py-2 bg-[#8c7d6c] text-white font-black text-sm rounded-xl shadow-md uppercase">
            {currentScene.speaker}
          </div>
          <p className="text-[20px] md:text-[24px] leading-[1.6] font-bold text-[#3d342c] text-center md:text-left antialiased">
            {displayedText}
            {/* Dấu nhấp nháy (CSS Module) */}
            {isTyping && <span className={`inline-block w-2 h-6 bg-[#8c7d6c] ml-1 ${styles.animatePulseCursor}`}></span>}
          </p>
          {!isTyping && !currentScene.type && currentScene.next && (
            <div className="absolute bottom-4 right-8 text-2xl animate-bounce text-[#8c7d6c]">▼</div>
          )}
        </div>
      </div>
    </div>
  );
}