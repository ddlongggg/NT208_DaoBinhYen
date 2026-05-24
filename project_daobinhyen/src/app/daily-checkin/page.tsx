'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import styles from './daily-checkin.module.css';

// --- INTERFACES ---
interface UserData {
  userId: string;
  userName: string;
  lastLoginDate: string;
  lastSurveyType: 'study' | 'emotion' | 'sleep' | null;
  lastScore: number;
  topicStreak: number;
}

interface LetterData {
  id: string;
  content: string;
  deliver_at: string;
  sent_at: string;
  status: 'pending' | 'delivered' | 'read';
}

interface Scene {
  id: string;
  speaker: string;
  text: string;
  type?: 'options' | 'next_button';
  next?: string;
  next_text?: string;
  action?: string;
  actionParams?: any;
  options?: { text: string; value?: string; next: string }[];
}

const CHECKIN_OPTIONS = [
  { text: 'Con cần một nơi để tập trung làm việc.', value: 'study', next: 'checkin_study_result' },
  { text: 'Con thấy hơi mệt, muốn tìm chỗ giải tỏa.', value: 'emotion', next: 'checkin_emotion_result' },
  { text: 'Con muốn tìm sự an yên để dễ ngủ.', value: 'sleep', next: 'checkin_sleep_result' }
];

const SPEAKER = 'Trưởng đảo "LÂM QUANG MINH"';

export default function DailyCheckinPage() {
  const router = useRouter();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ KEY FIX: currentScene là state trực tiếp — không lookup qua scenario.
  // Đảm bảo typing effect luôn thấy đúng text vì chỉ setCurrentScene 1 lần
  // sau khi đã có đầy đủ data (kể cả nội dung thư từ inbox API).
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);

  // Lưu choiceValue khi user chọn option, dùng khi click ▼ ở result scene
  const [pendingChoice, setPendingChoice] = useState<string | null>(null);

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const typingSoundRef = useRef<HTMLAudioElement | null>(null);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);

  // --- 1. FETCH USER DATA ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/user/getUserInFo');
        if (!res.ok) { router.replace('/login'); return; }
        const data = await res.json();
        setUserData({
          userId: data.userId,
          userName: data.username || 'Bạn',
          lastLoginDate: data.lastLoginDate,
          lastSurveyType: data.lastSurveyType,
          lastScore: data.lastSurveyScore || 0,
          topicStreak: data.topicStreak || 0,
        });
        setIsLoading(false);
      } catch {
        router.replace('/login');
      }
    };
    fetchUserData();
  }, [router]);

  // --- 2. BUILD SCENARIO ---
  const scenario = useMemo<Scene[]>(() => {
    if (!userData) return [];

    const now = new Date();
    const lastLogin = new Date(userData.lastLoginDate);
    const diffDays = Math.ceil(Math.abs(now.getTime() - lastLogin.getTime()) / 86400000);
    const currentHour = now.getHours();
    const name = userData.userName;

    const mkCheckin = (id: string, text: string): Scene => ({
      id, speaker: SPEAKER, text, type: 'options', options: CHECKIN_OPTIONS
    });

    // next: 'DO_LETTER_CHECK' là sentinel — handleNext xử lý riêng,
    // KHÔNG lookup trong scenario. Tránh hoàn toàn vấn đề race condition.
    const resultScenes: Scene[] = [
      { id: 'checkin_study_result',   speaker: SPEAKER, text: 'Tuyệt vời, lát nữa con có thể ghé qua Hải đăng tập trung. Hãy thả lỏng và cày cuốc nhé!',             next: 'DO_LETTER_CHECK' },
      { id: 'checkin_emotion_result', speaker: SPEAKER, text: 'Đừng lo, lúc nào buồn con có thể ra Suối nguồn cảm xúc hoặc tìm bé Mèo con để trút bầu tâm sự nhé.', next: 'DO_LETTER_CHECK' },
      { id: 'checkin_sleep_result',   speaker: SPEAKER, text: 'Tối nay con có thể thử vào Nhà gỗ bình yên, nằm lên chiếc võng và nghe chút nhạc lofi cho dễ ngủ nhé.', next: 'DO_LETTER_CHECK' },
    ];

    const randomChance = Math.random();
    let conversationScenes: Scene[] = [];

    if (diffDays >= 180) {
      conversationScenes = [
        { id: 's1', speaker: SPEAKER, text: `Ô hô hô... Gió biển hôm nay thổi về một người quen cũ. ${name} đấy ư? Chà, phải hơn nửa năm rồi cái thân già này mới thấy con.`, next: 's2' },
        { id: 's2', speaker: SPEAKER, text: `Nửa năm ngoài kia chắc có nhiều đổi thay. Nán lại một chút, làm lại bài khảo sát để ta xem dạo này tâm hồn con mang màu sắc gì nhé...`, type: 'next_button', next_text: 'Làm bài khảo sát', action: 'force_full_survey' }
      ];
    } else if (randomChance < 0.15) {
      conversationScenes = [
        { id: 's1', speaker: SPEAKER, text: `A ${name} tới đúng lúc lắm! Nay ta đi dạo nhặt được hạt giống lạ. Tí nữa con rảnh thì mang ra Vườn hoa ươm thử nhé!`, next: 's2' },
        mkCheckin('s2', 'Còn bây giờ, cơn gió nào đưa con đến Đảo Bình Yên hôm nay?')
      ];
    } else if (userData.topicStreak >= 5 && userData.lastScore <= 45) {
      conversationScenes = [
        { id: 's1', speaker: SPEAKER, text: `Này ${name}... Ta thấy con loanh quanh với nỗi buồn này hơi lâu rồi đấy. Trốn tránh mãi không phải là cách đâu.`, next: 's2' },
        mkCheckin('s2', 'Ta thách con lên Vách đá tầm nhìn rồi nhảy xuống cho tỉnh ra đấy! Hay nay con muốn đổi gió làm việc khác?')
      ];
    } else if (userData.topicStreak === 1 && diffDays < 7) {
      conversationScenes = [
        { id: 's1', speaker: SPEAKER, text: `Hôm trước ta vừa thấy con bận tâm chuyện khác, nay gió lại đổi chiều rồi à? Cảm giác như tâm trí con đang hơi lộn xộn đúng không?`, next: 's2' },
        mkCheckin('s2', 'Đừng cố gồng gánh tất cả cùng lúc. Hôm nay con muốn ưu tiên giải quyết điều gì trước?')
      ];
    } else if (diffDays >= 30) {
      const topic = userData.lastSurveyType === 'study' ? 'học tập' : userData.lastSurveyType === 'emotion' ? 'cảm xúc' : 'giấc ngủ';
      const text = userData.lastScore <= 45
        ? `Cũng hơn tháng rồi ta mới gặp con. Bão giông ngoài kia đã qua chưa con? Vấn đề ${topic} có còn làm con phiền lòng không?`
        : `Chào người bạn cũ! Bẵng đi một dạo, không biết con có còn giữ được năng lượng rạng rỡ như lần trước đến đây không?`;
      conversationScenes = [
        { id: 's1', speaker: SPEAKER, text, next: 's2' },
        mkCheckin('s2', 'Hôm nay ghé đảo, con định tìm kiếm điều gì?')
      ];
    } else if (userData.lastSurveyType === 'emotion' && userData.lastScore <= 40 && randomChance < 0.5) {
      conversationScenes = [
        { id: 's1', speaker: SPEAKER, text: `Ta biết dạo này con mang nhiều tâm sự. Ta thấy ở Đảo Chung cũng đang có nhiều người buồn giống con đấy.`, next: 's2' },
        mkCheckin('s2', 'Con muốn ra Suối nguồn tìm người trò chuyện hay muốn làm gì khác hôm nay?')
      ];
    } else {
      let greeting = `Lại gặp con rồi ${name}!`;
      if (currentHour >= 5 && currentHour <= 8) greeting = `Ô hô hô, dậy sớm thế ${name}! Sương trên Đảo còn chưa tan hết đâu.`;
      else if (currentHour >= 22 || currentHour <= 2) greeting = `Khuya lắm rồi ${name} ơi. Tiếng sóng biển đã rì rào hát ru rồi, sao con còn chưa nghỉ ngơi?`;
      conversationScenes = [
        { id: 's1', speaker: SPEAKER, text: greeting, next: 's2' },
        mkCheckin('s2', 'Ta đoán là con đang cần một không gian riêng. Hôm nay con muốn ta dẫn đến đâu?')
      ];
    }

    return [...conversationScenes, ...resultScenes];
  }, [userData]);

  // Set scene đầu tiên khi scenario sẵn sàng
  useEffect(() => {
    if (scenario.length > 0 && !currentScene) {
      setCurrentScene(scenario[0]);
    }
  }, [scenario, currentScene]);

  // --- 3. TYPING EFFECT ---
  // deps vào currentScene?.text: mỗi lần text thay đổi → chạy lại đúng nội dung
  useEffect(() => {
    if (!currentScene?.text) return;

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
          sound.play().catch(() => {});
          setTimeout(() => { sound.pause(); }, 60);
        }
      }
    }, 45);

    return () => {
      clearInterval(interval);
      if (typingSoundRef.current) {
        typingSoundRef.current.pause();
        typingSoundRef.current.currentTime = 0;
      }
    };
  }, [currentScene?.text]);

  const playClickSound = () => {
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch(() => {});
    }
  };

  // --- 4. ĐIỀU HƯỚNG ---

  // User click vào option checkin → đi tới result scene, lưu choiceValue
  const handleOptionSelect = (opt: { text: string; value?: string; next: string }) => {
    playClickSound();
    if (opt.value) setPendingChoice(opt.value);
    const nextScene = scenario.find(s => s.id === opt.next);
    if (nextScene) setCurrentScene(nextScene);
  };

  // User click ▼ hoặc next button
  const handleNext = async (nextId: string) => {
    playClickSound();

    // ✅ Sentinel DO_LETTER_CHECK: fetch API → build scene hoàn chỉnh → setCurrentScene 1 lần
    if (nextId === 'DO_LETTER_CHECK') {
      if (!userData || !pendingChoice) return;

      // Scene loading tạm để user không thấy màn hình trống khi đang gọi API
      setCurrentScene({
        id: 'loading',
        speaker: SPEAKER,
        text: 'Khoan đã, để ta xem hòm thư...',
        // Không có type → không hiện button, không hiện options
      });

      try {
        // Bước A: Daily checkin
        const resCheckin = await fetch('/api/user/daily-checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ surveyType: pendingChoice }),
        });
        const checkinResult = await resCheckin.json();
        setUserData(prev => prev ? {
          ...prev,
          lastSurveyType: pendingChoice as 'study' | 'emotion' | 'sleep',
          topicStreak: checkinResult.data?.topicStreak ?? prev.topicStreak
        } : null);

        // Bước B: Fetch inbox
        let nextScene: Scene;
        const resInbox = await fetch('/api/user/mailbox/inbox');

        if (resInbox.ok) {
          const inboxData = await resInbox.json();
          // API trả về { letters: [...] }, server đã lọc sẵn delivered + read
          const letters: LetterData[] = inboxData.letters || [];
          // status "delivered" = đã đến hạn nhưng chưa đọc
          const validUnread = letters.filter(l => l.status === 'delivered');

          if (validUnread.length === 1) {
            // ✅ Build scene với text đầy đủ trước khi set — typing effect chạy đúng
            nextScene = {
              id: 'letter_one',
              speaker: SPEAKER,
              text: `À đúng rồi ${userData.userName} ơi! Ta vừa xem qua hòm thư, có một bức thư con gửi từ trước vừa được mở khóa đấy. Để ta đọc cho nghe nhé: "${validUnread[0].content}"`,
              type: 'next_button',
              next_text: 'Vào đảo',
              action: 'read_and_go',
              actionParams: { letterId: validUnread[0].id }
            };
          } else if (validUnread.length > 1) {
            nextScene = {
              id: 'letter_many',
              speaker: SPEAKER,
              text: `Chà ${userData.userName}, hòm thư của con hôm nay nhộn nhịp lắm nhé! Có tận ${validUnread.length} bức thư từ quá khứ chưa đọc đã đến ngày mở rồi. Lát nữa vào đảo nhớ ghé qua hòm thư đến kiểm tra lại nhé!`,
              type: 'next_button',
              next_text: 'Vào đảo',
              action: 'direct_go'
            };
          } else {
            nextScene = {
              id: 'go_island_final',
              speaker: SPEAKER,
              text: 'Gió yên biển lặng, chúc con một ngày thật an lành trên đảo.',
              type: 'next_button',
              next_text: 'Vào đảo',
              action: 'direct_go'
            };
          }
        } else {
          nextScene = {
            id: 'go_island_final',
            speaker: SPEAKER,
            text: 'Hôm nay con không có bức thư nào gửi cho bản thân cả, Gió yên biển lặng, chúc con một ngày thật an lành trên đảo.',
            type: 'next_button',
            next_text: 'Vào đảo',
            action: 'direct_go'
          };
        }

        // ✅ 1 lần setCurrentScene duy nhất với text đầy đủ
        setCurrentScene(nextScene);

      } catch (error) {
        console.error('Lỗi API:', error);
        setCurrentScene({
          id: 'go_island_final',
          speaker: SPEAKER,
          text: 'Gió yên biển lặng, chúc con một ngày thật an lành trên đảo.',
          type: 'next_button',
          next_text: 'Vào đảo',
          action: 'direct_go'
        });
      }
      return;
    }

    // Điều hướng thông thường
    const nextScene = scenario.find(s => s.id === nextId);
    if (nextScene) setCurrentScene(nextScene);
  };

  const handleBoxClick = () => {
    if (!isTyping && currentScene && !currentScene.type && currentScene.next) {
      handleNext(currentScene.next);
    }
  };

  const handleAction = async (scene: Scene) => {
    playClickSound();
    const { action, actionParams } = scene;

    if (action === 'force_full_survey') {
      router.push('/survey');
    } else if (action === 'read_and_go') {
      if (actionParams?.letterId) {
        try {
          await fetch('/api/user/mailbox/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ letterId: actionParams.letterId })
          });
        } catch (e) {
          console.error('Lỗi đánh dấu đã đọc thư:', e);
        }
      }
      router.push('/homepage');
    } else if (action === 'direct_go') {
      router.push('/homepage');
    }
  };

  if (isLoading || !currentScene) {
    return (
      <div className="h-screen bg-[#1a1a1a] flex justify-center items-center">
        <div className="text-[#d2c4a7] animate-pulse">Đang kết nối Đảo Bình Yên...</div>
      </div>
    );
  }

  // --- 5. RENDER ---
  return (
    <div className="relative w-full h-screen bg-[#1a1a1a] font-sans overflow-hidden">
      <audio ref={typingSoundRef} src="/typing.wav" preload="auto" />
      <audio ref={clickSoundRef} src="/select.wav" preload="auto" />

      {/* BACKGROUND */}
      <div
        className={`absolute inset-0 bg-cover bg-center ${styles.animateKenBurns}`}
        style={{ backgroundImage: "url('/Island8.0.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/30" />

      {/* NHÂN VẬT */}
      <div className={`fixed bottom-[15%] left-[5%] md:left-[8%] w-[260px] h-[400px] md:w-[420px] md:h-[620px] z-10 pointer-events-none drop-shadow-2xl ${styles.animateFloat}`}>
        <Image src="/oldman.png" alt="Elder" fill className="object-contain object-bottom" priority />
      </div>

      {/* TÙY CHỌN CHECK-IN */}
      {!isTyping && currentScene.type === 'options' && (
        <div className="fixed inset-0 flex items-start justify-center md:justify-end md:pr-[10%] z-40 pointer-events-none pt-[5vh] md:pt-[10vh]">
          <div className="flex flex-col gap-3 w-[90%] max-w-[450px] pointer-events-auto animate-in fade-in slide-in-from-top-10 duration-500">
            {currentScene.options?.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleOptionSelect(opt)}
                className="group relative w-full py-4 px-6 bg-[#fdfbf7]/95 border-2 border-[#d2c4a7] rounded-xl text-[#4a4036] font-bold text-base shadow-lg hover:bg-[#6c7a65] hover:text-white transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#8c7d6c] group-hover:bg-white shrink-0" />
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
          <button
            onClick={() => handleAction(currentScene)}
            className="pointer-events-auto px-12 py-5 bg-[#6c7a65] text-white text-xl font-black rounded-3xl shadow-2xl hover:scale-105 transition-all flex items-center gap-3"
          >
            {currentScene.next_text} <span>→</span>
          </button>
        </div>
      )}

      {/* HỘP THOẠI */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-[950px] z-50">
        <div
          className="relative p-8 md:p-10 bg-[#fdfbf7] border-[4px] border-[#d2c4a7] text-[#4a4036] rounded-[2.5rem] shadow-2xl min-h-[160px] cursor-pointer"
          onClick={handleBoxClick}
        >
          <div className="absolute -top-5 left-10 px-6 py-2 bg-[#8c7d6c] text-white font-black text-sm rounded-xl shadow-md uppercase">
            {currentScene.speaker}
          </div>
          <p className="text-[20px] md:text-[24px] leading-[1.6] font-bold text-[#3d342c] text-center md:text-left antialiased">
            {displayedText}
            {isTyping && (
              <span className={`inline-block w-2 h-6 bg-[#8c7d6c] ml-1 ${styles.animatePulseCursor}`} />
            )}
          </p>
          {!isTyping && !currentScene.type && currentScene.next && (
            <div className="absolute bottom-4 right-8 text-2xl animate-bounce text-[#8c7d6c]">▼</div>
          )}
        </div>
      </div>
    </div>
  );
}