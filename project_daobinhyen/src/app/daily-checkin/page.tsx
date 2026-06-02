'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import SettingsButton from '@/app/components/SettingsButton';
import styles from './daily-checkin.module.css';

// --- INTERFACES ---
interface UserData {
  userId: string;
  userName: string;
  lastLoginDate: string;
  lastSurveyType: 'study' | 'emotion' | 'sleep' | null;
  lastScore: number;
  topicStreak: number;
  // 🔥 THÊM 3 TRƯỜNG DỮ LIỆU ĐIỂM SỐ RIÊNG BIỆT 🔥
  survey_study: number | null;
  survey_emotion: number | null;
  survey_sleep: number | null;
  seeds: number;
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

// 🔥 KHAI BÁO CÁC MỐC ĐIỂM SAO CHO MINI SURVEY 🔥
const SCORE_LEVELS = [
  { text: '1 ⭐', weight: 1 }, { text: '2 ⭐', weight: 2 },
  { text: '3 ⭐', weight: 3 }, { text: '4 ⭐', weight: 4 },
  { text: '5 ⭐', weight: 5 }, { text: '6 ⭐', weight: 6 },
  { text: '7 ⭐', weight: 7 }, { text: '8 ⭐', weight: 8 },
  { text: '9 ⭐', weight: 9 }, { text: '10 ⭐', weight: 10 },
];

const SPEAKER = 'Trưởng đảo "LÂM QUANG MINH"';

export default function DailyCheckinPage() {
  const router = useRouter();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [pendingChoice, setPendingChoice] = useState<string | null>(null);

  // 🔥 STATE QUẢN LÝ XU HƯỚNG TÂM LÝ (TỐT LÊN HAY TỆ ĐI) 🔥
  const [trend, setTrend] = useState<'better' | 'worse' | null>(null);

  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [seedReward, setSeedReward] = useState<number | null>(null);

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const typingSoundRef = useRef<HTMLAudioElement | null>(null);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);

  const getGlobalVol = (): number => {
    if (typeof window === 'undefined') return 1;
    if (localStorage.getItem('app_muted') === 'true') return 0;
    return Number(localStorage.getItem('app_volume') ?? '70') / 100;
  };

  // --- 1. FETCH USER DATA ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/user/getUserInFo');
        if (!res.ok) { router.replace('/login'); return; }
        const data = await res.json();

        // Calculate daily check-in branch once here!
        const rand = Math.random();
        let branch = 'normal';
        let rewardAmt = null;

        const now = new Date();
        const lastLogin = new Date(data.lastLoginDate);
        const diffDays = Math.ceil(Math.abs(now.getTime() - lastLogin.getTime()) / 86400000);

        if (diffDays >= 180) {
          branch = 'long_absence';
        } else if (rand < 0.15) {
          branch = 'seeds_gift';
          rewardAmt = Math.floor(Math.random() * 3) + 3; // 3 to 5 seeds
        } else if ((data.topicStreak || 0) >= 5 && (data.lastSurveyScore || 0) <= 45) {
          branch = 'stuck';
        } else if (diffDays >= 30) {
          branch = 'medium_absence';
        } else if (data.lastSurveyType === 'emotion' && (data.lastSurveyScore || 0) <= 40 && Math.random() < 0.5) {
          branch = 'bad_emotion';
        }

        setUserData({
          userId: data.userId,
          userName: data.username || 'Bạn',
          lastLoginDate: data.lastLoginDate,
          lastSurveyType: data.lastSurveyType,
          lastScore: data.lastSurveyScore || 0,
          topicStreak: data.topicStreak || 0,
          // Lấy 3 trường survey từ backend, nếu không có thì gán null
          survey_study: data.survey_study ?? null,
          survey_emotion: data.survey_emotion ?? null,
          survey_sleep: data.survey_sleep ?? null,
          seeds: data.seeds ?? 0,
        });

        setSelectedBranch(branch);
        setSeedReward(rewardAmt);
        setIsLoading(false);
      } catch {
        router.replace('/login');
      }
    };
    fetchUserData();
  }, [router]);

  // --- 2. BUILD SCENARIO ---
  const scenario = useMemo<Scene[]>(() => {
    if (!userData || !selectedBranch) return [];

    const now = new Date();
    const currentHour = now.getHours();
    const name = userData.userName;

    const mkCheckin = (id: string, text: string): Scene => ({
      id, speaker: SPEAKER, text, type: 'options', options: CHECKIN_OPTIONS
    });

    // 🔥 1. BỔ SUNG LẠI CÁC CÂU THOẠI KẾT QUẢ (Để có đường đi tiếp) 🔥
    const resultScenes: Scene[] = [
      { id: 'checkin_study_result', speaker: SPEAKER, text: 'Tuyệt vời, lát nữa con có thể ghé qua Hải đăng tập trung. Hãy thả lỏng và cày cuốc nhé!', next: 'DO_LETTER_CHECK' },
      { id: 'checkin_emotion_result', speaker: SPEAKER, text: 'Đừng lo, lúc nào buồn con có thể ra Suối nguồn cảm xúc hoặc tìm bé Mèo con để trút bầu tâm sự nhé.', next: 'DO_LETTER_CHECK' },
      { id: 'checkin_sleep_result', speaker: SPEAKER, text: 'Tối nay con có thể thử vào Nhà gỗ bình yên, nằm lên chiếc võng và nghe chút nhạc lofi cho dễ ngủ nhé.', next: 'DO_LETTER_CHECK' },
    ];

    let conversationScenes: Scene[] = [];

    // Nhánh: Lặn mất tăm 6 tháng -> Bắt làm lại Full Khảo sát
    if (selectedBranch === 'long_absence') {
      conversationScenes = [
        { id: 's1', speaker: SPEAKER, text: `Ô hô hô... Gió biển hôm nay thổi về một người quen cũ. ${name} đấy ư? Chà, phải hơn nửa năm rồi cái thân già này mới thấy con.`, next: 's2' },
        { id: 's2', speaker: SPEAKER, text: `Nửa năm ngoài kia chắc có nhiều đổi thay. Nán lại một chút, làm lại bài khảo sát để ta xem dạo này tâm hồn con mang màu sắc gì nhé...`, type: 'next_button', next_text: 'Làm bài khảo sát', action: 'force_full_survey' }
      ];
    }
    // Nhánh: Xác suất 15% tặng hạt giống
    else if (selectedBranch === 'seeds_gift') {
      conversationScenes = [
        { id: 's1', speaker: SPEAKER, text: `A ${name} tới đúng lúc lắm! Nay ta đi dạo nhặt được ${seedReward} hạt giống lạ. Ta gửi tặng con làm quà gặp mặt nhé!`, next: 's1_claim_seeds' },
        { id: 's1_claim_seeds', speaker: SPEAKER, text: `(Bạn nhận được ${seedReward} hạt giống 🌱)`, next: 's2' },
        mkCheckin('s2', 'Còn bây giờ, cơn gió nào đưa con đến Đảo Bình Yên hôm nay?')
      ];
    }
    // Nhánh: Bị kẹt trong 1 vấn đề (Streak >= 5 ngày) mà điểm vẫn lẹt đẹt
    else if (selectedBranch === 'stuck') {
      conversationScenes = [
        { id: 's1', speaker: SPEAKER, text: `Này ${name}... Ta thấy con loanh quanh với những mệt mỏi này hơi lâu rồi đấy. Trốn tránh mãi không phải là cách đâu.`, next: 's2' },
        mkCheckin('s2', 'Đừng cố gồng gánh tất cả cùng lúc. Hôm nay con muốn ưu tiên giải quyết điều gì trước?')
      ];
    }
    // Nhánh: Bỏ đi 1 tháng mới về
    else if (selectedBranch === 'medium_absence') {
      const text = userData.lastScore <= 45
        ? `Cũng hơn tháng rồi ta mới gặp con. Bão giông ngoài kia đã qua chưa con? Không biết dạo này con có ổn không?`
        : `Chào người bạn cũ! Bẵng đi một dạo, không biết con có còn giữ được năng lượng rạng rỡ như lần trước đến đây không?`;
      conversationScenes = [
        { id: 's1', speaker: SPEAKER, text, next: 's2' },
        mkCheckin('s2', 'Hôm nay ghé đảo, con định tìm kiếm điều gì?')
      ];
    }
    // Nhánh: Cảm xúc đang tệ (< 40)
    else if (selectedBranch === 'bad_emotion') {
      conversationScenes = [
        { id: 's1', speaker: SPEAKER, text: `Ta biết dạo này con mang nhiều tâm sự. Ta thấy ở Đảo Chung cũng đang có nhiều người buồn giống con đấy.`, next: 's2' },
        mkCheckin('s2', 'Con muốn ra Suối nguồn tìm người trò chuyện hay muốn làm gì khác hôm nay?')
      ];
    }
    // Nhánh: Chào hỏi bình thường theo buổi trong ngày
    else {
      let greeting = `Lại gặp con rồi ${name}!`;
      if (currentHour >= 5 && currentHour <= 8) greeting = `Ô hô hô, dậy sớm thế ${name}! Sương trên Đảo còn chưa tan hết đâu.`;
      else if (currentHour >= 22 || currentHour <= 2) greeting = `Khuya lắm rồi ${name} ơi. Tiếng sóng biển đã rì rào hát ru rồi, sao con còn chưa nghỉ ngơi?`;

      conversationScenes = [
        { id: 's1', speaker: SPEAKER, text: greeting, next: 's2' },
        mkCheckin('s2', 'Ta đoán là con đang cần một không gian riêng. Hôm nay con muốn ta dẫn đến đâu?')
      ];
    }

    // 🔥 2. GỘP CẢ CÂU CHÀO HỎI VÀ CÂU KẾT QUẢ VÀO CHUNG 1 KỊCH BẢN 🔥
    return [...conversationScenes, ...resultScenes];
  }, [userData, selectedBranch, seedReward]);
  useEffect(() => {
    if (scenario.length > 0 && !currentScene) {
      setCurrentScene(scenario[0]);
    }
  }, [scenario, currentScene]);

  // --- 3. TYPING EFFECT ---
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
          sound.volume = 0.2 * getGlobalVol();
          sound.play().catch(() => { });
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
      clickSoundRef.current.volume = 1 * getGlobalVol();
      clickSoundRef.current.play().catch(() => { });
    }
  };

  const awardSeeds = async () => {
    if (!userData || !seedReward) return;

    const currentSeeds = userData.seeds ?? 0;
    const newSeeds = currentSeeds + seedReward;

    setUserData(prev => prev ? { ...prev, seeds: newSeeds } : null);

    try {
      await fetch('/api/user/updateSeeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.userId, seeds: newSeeds })
      });
      window.dispatchEvent(new Event('userDataUpdated'));
    } catch (error) {
      console.error("Lỗi cộng hạt giống checkin:", error);
    }
  };

  // --- 4. ĐIỀU HƯỚNG BẮT MẠCH NGƯỜI CHƠI ---
  const handleOptionSelect = (opt: { text: string; value?: string; next: string }) => {
    playClickSound();

    // LUỒNG 1: CHỌN ĐỊA ĐIỂM CHECK-IN (Sau khi user vừa chọn Vấn đề của ngày hôm nay)
    if (['checkin_study_result', 'checkin_emotion_result', 'checkin_sleep_result'].includes(opt.next)) {
      const topic = opt.value as 'study' | 'emotion' | 'sleep';
      setPendingChoice(topic);

      const oldScore = userData?.[`survey_${topic}` as keyof UserData] as number | null;
      const isDifferentTopic = userData?.lastSurveyType && userData.lastSurveyType !== topic;
      const diffDays = Math.ceil(Math.abs(new Date().getTime() - new Date(userData!.lastLoginDate).getTime()) / 86400000);

      // TRƯỜNG HỢP A: CHƯA TỪNG KHẢO SÁT CHỦ ĐỀ NÀY
      if (oldScore === null || oldScore === undefined) {
        let prefix = '';
        // Trưởng đảo nhận ra người chơi vừa đổi sang 1 vấn đề hoàn toàn mới
        if (isDifferentTopic) prefix = 'Hôm trước ta vừa thấy con bận tâm chuyện khác, nay gió lại đổi chiều rồi à? ';

        setCurrentScene({
          id: 'force_survey',
          speaker: SPEAKER,
          text: `${prefix}Chà... Hình như ta chưa từng nghe con tâm sự chi tiết về vấn đề này. Hãy làm một bài khảo sát nhỏ để ta hiểu rõ hơn về con nhé!`,
          type: 'next_button',
          next_text: 'Bắt đầu khảo sát',
          action: 'go_to_full_survey',
          actionParams: { topic } // Truyền chủ đề để form kia nhận
        });
        return;
      }

      // TRƯỜNG HỢP B: ĐÃ TỪNG KHẢO SÁT -> TÙY BIẾN CÂU NÓI DẪN VÀO MINI SURVEY
      let introText = '';

      if (diffDays >= 30) {
        introText = `Cũng lâu rồi ta mới gặp con. Lần trước tâm trạng của con với vấn đề này đang ở mức ${oldScore}/100. Hôm nay quay lại, con thấy trong lòng đã khá hơn chưa?`;
      } else if (isDifferentTopic) {
        // Nhận ra người dùng vừa than phiền chuyện khác hôm qua, nay lại quay về chuyện cũ này
        introText = `Hôm trước ta thấy con bận tâm chuyện khác, nay lại quay về trăn trở chuyện này sao? Lần trước con đang ở mức ${oldScore}/100 điểm. Nay có khá hơn chút nào không?`;
      } else if (userData!.topicStreak >= 3) {
        // Nhận ra người dùng đang kẹt trong 1 vấn đề nhiều ngày liên tiếp
        introText = `Này ${userData!.userName}... Ta thấy con loanh quanh với nỗi buồn này hơi lâu rồi đấy. Mức ${oldScore}/100 của lần trước liệu hôm nay có xê dịch được chút nào theo hướng tích cực không con?`;
      } else {
        // Hỏi thăm bình thường
        introText = `Lần trước đến đây, tâm trạng của con với vấn đề này đang ở mức ${oldScore}/100 điểm. Liệu hôm nay con có cảm thấy bản thân mình tốt lên chút nào không?`;
      }

      setCurrentScene({
        id: 'mini_survey_intro',
        speaker: SPEAKER,
        text: introText,
        type: 'options',
        options: [
          { text: 'Con cảm thấy mệt mỏi và tệ hơn 😔', value: 'worse', next: 'mini_survey_rate' },
          { text: 'Con đã cảm thấy khá lên rồi ☀️', value: 'better', next: 'mini_survey_rate' }
        ]
      });
      return;
    }

    // LUỒNG 2: CHỌN XU HƯỚNG TÂM LÝ (Tốt lên / Tệ đi)
    if (opt.next === 'mini_survey_rate') {
      setTrend(opt.value as 'better' | 'worse');
      setCurrentScene({
        id: 'mini_survey_rate_scene',
        speaker: SPEAKER,
        text: `Hãy cho ta biết mức độ thay đổi đó là bao nhiêu sao nhé?`,
        type: 'options',
        options: SCORE_LEVELS.map(s => ({
          text: s.text,
          value: s.weight.toString(),
          next: 'PROCESS_MINI_SURVEY'
        }))
      });
      return;
    }

    // LUỒNG 3: XỬ LÝ SỐ ĐIỂM SAO VÀ LƯU DATABASE
    if (opt.next === 'PROCESS_MINI_SURVEY') {
      const weight = parseInt(opt.value || '0');
      const oldScore = userData![`survey_${pendingChoice}` as keyof UserData] as number;

      // Tính điểm mới (Giả sử điểm cao = tích cực, điểm thấp = tiêu cực)
      let newScore = oldScore;
      if (trend === 'better') newScore += weight;
      if (trend === 'worse') newScore -= weight;

      if (newScore > 100) newScore = 100;
      if (newScore < 0) newScore = 0;

      // Gọi API chạy ngầm để lưu lại điểm Mini Survey này
      fetch('/api/user/updateMiniSurvey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: pendingChoice, newScore })
      }).catch(e => console.error("Lỗi lưu Mini Survey", e));

      // Thông báo ghi nhận và nối mạch trở lại với nhánh Check-in gốc
      setCurrentScene({
        id: 'saving_mini_survey',
        speaker: SPEAKER,
        text: `Ta đã ghi nhận. Trạng thái hiện tại của con đang ở mức ${newScore}/100. Dù có ra sao, hãy nhớ rằng hòn đảo này luôn ở đây vì con.`,
        next: `checkin_${pendingChoice}_result` // Nhảy thẳng về câu an ủi ban đầu
      });
      return;
    }

    // LUỒNG MẶC ĐỊNH KHÁC
    const nextScene = scenario.find(s => s.id === opt.next);
    if (nextScene) setCurrentScene(nextScene);
  };

  const handleNext = async (nextId: string) => {
    playClickSound();

    if (nextId === 'DO_LETTER_CHECK') {
      if (!userData || !pendingChoice) return;
      setCurrentScene({ id: 'loading', speaker: SPEAKER, text: 'Khoan đã, để ta xem hòm thư...' });

      try {
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

        let nextScene: Scene;
        const resInbox = await fetch('/api/user/mailbox/inbox');

        if (resInbox.ok) {
          const inboxData = await resInbox.json();
          const letters: LetterData[] = inboxData.letters || [];
          const validUnread = letters.filter(l => l.status === 'delivered');

          if (validUnread.length === 1) {
            nextScene = {
              id: 'letter_one', speaker: SPEAKER,
              text: `À đúng rồi ${userData.userName} ơi! Ta vừa xem qua hòm thư, có một bức thư con gửi từ trước vừa được mở khóa đấy. Để ta đọc cho nghe nhé: "${validUnread[0].content}"`,
              type: 'next_button', next_text: 'Vào đảo', action: 'read_and_go', actionParams: { letterId: validUnread[0].id }
            };
          } else if (validUnread.length > 1) {
            nextScene = {
              id: 'letter_many', speaker: SPEAKER,
              text: `Chà ${userData.userName}, hòm thư của con hôm nay nhộn nhịp lắm nhé! Có tận ${validUnread.length} bức thư từ quá khứ chưa đọc đã đến ngày mở rồi. Lát nữa vào đảo nhớ ghé qua hòm thư đến kiểm tra lại nhé!`,
              type: 'next_button', next_text: 'Vào đảo', action: 'direct_go'
            };
          } else {
            nextScene = { id: 'go_island_final', speaker: SPEAKER, text: 'Gió yên biển lặng, chúc con một ngày thật an lành trên đảo.', type: 'next_button', next_text: 'Vào đảo', action: 'direct_go' };
          }
        } else {
          nextScene = { id: 'go_island_final', speaker: SPEAKER, text: 'Hôm nay con không có bức thư nào gửi cho bản thân cả, Gió yên biển lặng, chúc con một ngày thật an lành trên đảo.', type: 'next_button', next_text: 'Vào đảo', action: 'direct_go' };
        }
        setCurrentScene(nextScene);

      } catch (error) {
        setCurrentScene({ id: 'go_island_final', speaker: SPEAKER, text: 'Gió yên biển lặng, chúc con một ngày thật an lành trên đảo.', type: 'next_button', next_text: 'Vào đảo', action: 'direct_go' });
      }
      return;
    }

    const nextScene = scenario.find(s => s.id === nextId);
    if (nextScene) setCurrentScene(nextScene);
  };

  const handleBoxClick = () => {
    if (!isTyping && currentScene && !currentScene.type && currentScene.next) {
      if (currentScene.id === 's1_claim_seeds') {
        awardSeeds();
      }
      handleNext(currentScene.next);
    }
  };

  const handleAction = async (scene: Scene) => {
    playClickSound();
    const { action, actionParams } = scene;

    if (action === 'force_full_survey') {
      router.push('/survey');
    } else if (action === 'go_to_full_survey') {
      // Đẩy thêm param url để trang Survey gốc biết phải bật ngay chủ đề nào
      router.push(`/survey?topic=${actionParams.topic}`);
    } else if (action === 'read_and_go') {
      if (actionParams?.letterId) {
        try {
          await fetch('/api/user/mailbox/read', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ letterId: actionParams.letterId })
          });
        } catch (e) { }
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
      <SettingsButton />
      <div className={`absolute inset-0 bg-cover bg-center ${styles.animateKenBurns}`} style={{ backgroundImage: "url('/Island8.0.jpg')" }} />
      <div className="absolute inset-0 bg-black/30" />
      <div className={`fixed bottom-[15%] left-[5%] md:left-[8%] w-[260px] h-[400px] md:w-[420px] md:h-[620px] z-10 pointer-events-none drop-shadow-2xl ${styles.animateFloat}`}>
        <Image src="/oldman.png" alt="Elder" fill className="object-contain object-bottom" priority />
      </div>

      {!isTyping && currentScene.type === 'options' && (
        <div className="fixed inset-0 flex items-start justify-center md:justify-end md:pr-[10%] z-40 pointer-events-none pt-[5vh] md:pt-[10vh]">
          <div className="flex flex-col gap-3 w-[90%] max-w-[450px] pointer-events-auto animate-in fade-in slide-in-from-top-10 duration-500 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
            {currentScene.options?.map((opt, i) => (
              <button key={i} onClick={() => handleOptionSelect(opt)} className="group relative w-full py-4 px-6 bg-[#fdfbf7]/95 border-2 border-[#d2c4a7] rounded-xl text-[#4a4036] font-bold text-base shadow-lg hover:bg-[#6c7a65] hover:text-white transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#8c7d6c] group-hover:bg-white shrink-0" />
                  <span className="leading-tight">{opt.text}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isTyping && currentScene.type === 'next_button' && (
        <div className="fixed inset-0 flex items-center justify-center md:justify-end md:pr-[15%] z-50 pointer-events-none">
          <button onClick={() => handleAction(currentScene)} className="pointer-events-auto px-12 py-5 bg-[#6c7a65] text-white text-xl font-black rounded-3xl shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
            {currentScene.next_text} <span>→</span>
          </button>
        </div>
      )}

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-[950px] z-50">
        <div className="relative p-8 md:p-10 bg-[#fdfbf7] border-[4px] border-[#d2c4a7] text-[#4a4036] rounded-[2.5rem] shadow-2xl min-h-[160px] cursor-pointer" onClick={handleBoxClick}>
          <div className="absolute -top-5 left-10 px-6 py-2 bg-[#8c7d6c] text-white font-black text-sm rounded-xl shadow-md uppercase">{currentScene.speaker}</div>
          <p className="text-[20px] md:text-[24px] leading-[1.6] font-bold text-[#3d342c] text-center md:text-left antialiased">
            {displayedText}
            {isTyping && <span className={`inline-block w-2 h-6 bg-[#8c7d6c] ml-1 ${styles.animatePulseCursor}`} />}
          </p>
          {!isTyping && !currentScene.type && currentScene.next && <div className="absolute bottom-4 right-8 text-2xl animate-bounce text-[#8c7d6c]">▼</div>}
        </div>
      </div>

      {/* Kế thừa UI Scrollbar cho thanh chọn sao (nếu chật) */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d2c4a7; border-radius: 10px; }
      `}</style>
    </div>
  );
}