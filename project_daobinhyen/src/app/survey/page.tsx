'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Scene {
  id: string; speaker: string; text: string; type?: string; next?: string;
  next_text?: string; action?: string;
  options?: { text: string; value?: string; weight?: number; next: string; }[];
}

const SCORE_LEVELS = [
  { text: 'Rất tồi tệ', weight: 1 }, { text: 'Rất tệ', weight: 2 },
  { text: 'Tệ', weight: 3 }, { text: 'Bình thường', weight: 4 },
  { text: 'Tốt', weight: 5 }, { text: 'Rất tốt', weight: 6 }, { text: 'Tuyệt vời', weight: 7 },
];

const SURVEY_DATA = {
  study: ["Khả năng tập trung vào bài vở hôm nay của con thế nào?", "Con có cảm thấy hứng thú với việc tiếp thu kiến thức mới không?", "Tiến độ hoàn thành công việc/deadline của con hiện tại ra sao?", "Khả năng ghi nhớ thông tin của con trong vài ngày qua thế nào?", "Con đánh giá sự ngăn nắp và kỷ luật bản thân lúc này thế nào?", "Môi trường xung quanh có đang ủng hộ việc học của con không?", "Con có cảm thấy đầu óc mình nhạy bén khi giải quyết vấn đề không?", "Sự kiên trì của con khi gặp bài toán khó hiện tại ra sao?", "Con có thấy mình quản lý thời gian hiệu quả không?", "Tổng quan năng suất học tập/làm việc của con hôm nay thế nào?"],
  emotion: ["Hôm nay con cảm thấy cảm xúc chủ đạo của mình như thế nào?", "Con có cảm thấy yêu thương bản thân mình lúc này không?", "Sự bình tĩnh của con trước những tin tức tiêu cực ra sao?", "Con có cảm thấy kết nối được với những người xung quanh không?", "Mức độ lạc quan về tương lai của con hiện tại thế nào?", "Con thấy lòng mình có nhẹ nhàng, thanh thản không?", "Khả năng kiềm chế sự nóng giận của con hôm nay thế nào?", "Con có cảm thấy được thấu hiểu và sẻ chia không?", "Sự tự tin vào khả năng của chính mình hiện tại ra sao?", "Tổng quan trạng thái tinh thần của con lúc này thế nào?"],
  sleep: ["Chất lượng giấc ngủ đêm qua của con thế nào?", "Con có cảm thấy dễ dàng chìm vào giấc ngủ không?", "Cảm giác của cơ thể con khi vừa thức dậy sáng nay ra sao?", "Con có thấy tâm trí mình yên tĩnh khi nằm xuống không?", "Mức độ tràn đầy năng lượng của cơ thể con lúc này thế nào?", "Con có thấy mình được nghỉ ngơi đầy đủ trong ngày không?", "Không gian nghỉ ngơi hiện tại có làm con thấy an tâm không?", "Khả năng thả lỏng các cơ bắp của con hiện tại thế nào?", "Con có hay gặp phải những giấc mơ mệt mỏi không?", "Tổng quan sự an yên trong tâm hồn con hôm nay thế nào?"]
};

const generateSurveyScenes = (type: 'study' | 'emotion' | 'sleep') => {
  return SURVEY_DATA[type].map((q, index) => ({
    id: `${type}_q${index + 1}`,
    speaker: 'Trưởng đảo',
    text: q,
    type: 'options',
    options: SCORE_LEVELS.map(level => ({
      text: level.text,
      weight: level.weight,
      next: index === 9 ? 'calculating' : `${type}_q${index + 2}`
    }))
  }));
};

const baseScenario: Scene[] = [
  { id: 'start_1', speaker: 'Trưởng đảo "LÂM QUANG MINH"', text: 'Ô hô hô... Chào mừng {name} đã đặt chân đến hòn Đảo Bình Yên.', next: 'start_2' },
  { id: 'start_2', speaker: 'Trưởng đảo "LÂM QUANG MINH"', text: 'Ta xin giới thiệu bản thân 1 chút, ta là trưởng đảo ở đây.', next: 'start_3' },
  { id: 'start_3', speaker: 'Trưởng đảo "LÂM QUANG MINH"', text: 'Ta hi vọng con có thể tìm được thứ con cần ở trên hòn đảo này. Con đã sẵn sàng chưa?', type: 'next_button', next_text: 'Dạ con sẵn sàng', next: 'intro_survey' },
  { id: 'intro_survey', speaker: 'Trưởng đảo "LÂM QUANG MINH"', text: 'Nhưng mà này... ta có hơi nhiều chuyện 1 chút nhưng ta có thể hỏi là con đến đây với mục đích gì được không?', type: 'options', options: [{ text: 'Con đang gặp vấn đề về tập trung và học tập ạ', value: 'study', next: 'study_q1' }, { text: 'Con đang gặp vấn đề về mặt cảm xúc ạ', value: 'emotion', next: 'emotion_q1' }, { text: 'Con đang gặp vấn đề về sự an yên, giấc ngủ ạ', value: 'sleep', next: 'sleep_q1' }] },
  ...generateSurveyScenes('study'), ...generateSurveyScenes('emotion'), ...generateSurveyScenes('sleep'),
  { id: 'calculating', speaker: 'Trưởng đảo "LÂM QUANG MINH"', text: 'Đợi ta một chút nhé... Để ta xem tâm hồn con đang cần điều gì nhất...', next: 'final_result' },
  { id: 'final_result', speaker: 'Trưởng đảo "LÂM QUANG MINH"', text: '{result_text}', type: 'next_button', next_text: 'Bắt đầu khám phá hòn đảo', action: 'finish' }
];

export default function SurveyPage() {
  const router = useRouter();

  const [stage, setStage] = useState('CHECKING');
  const [userName, setUserName] = useState('');
  const [usernameError, setUsernameError] = useState(''); // 🆕 lỗi trùng tên
  const [usernameLoading, setUsernameLoading] = useState(false); // 🆕 loading khi check
  const [currentSceneId, setCurrentSceneId] = useState('start_1');
  const [totalScore, setTotalScore] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const typingSoundRef = useRef<HTMLAudioElement | null>(null);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);

  const currentScene = baseScenario.find(s => s.id === currentSceneId) || baseScenario[0];

  const introSentences = [
    "Chào mừng bạn đến với Đảo Bình Yên",
    "Tại sao bạn lại tìm đến hòn đảo này?",
    "Bạn đang tìm kiếm sự bình yên?",
    "Hay là đang tìm một không gian để học bài?",
    "Hay một nơi để an ủi tâm hồn?",
    "Bạn đừng lo dù bạn là ai và đang gặp vấn đề gì",
    "Thì chúng tôi luôn sẵn sàng chào đón bạn",
    "Hãy quên đi cuộc sống xô bồ ngoài kia",
    "và tận hưởng thiên nhiên nơi đây",
    "NHẤN ĐỂ TIẾP TỤC"
  ];

  const getResultText = (score: number) => {
    if (score <= 25) return `Ta thấy lòng con đang trĩu nặng quá. Đừng cố quá sức nhé, hãy để hòn đảo này ôm lấy con.`;
    if (score <= 45) return `Mọi thứ hơi xáo trộn một chút đúng không? Đừng lo, ta sẽ dẫn con đến nơi yên bình nhất.`;
    if (score <= 60) return `Con đang làm rất tốt! Hòn đảo này sẽ giúp con duy trì nguồn năng lượng tích cực này.`;
    return `Tuyệt vời! Tâm hồn con rạng rỡ như ánh nắng trên đảo vậy. Hãy tận hưởng nhé!`;
  };

  // CHECK USER KHI VÀO TRANG — PHÂN NHÁNH 3 LUỒNG
  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch('/api/user/getUserInFo');
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const data = await res.json();
        const hasUsername = !!data.username;
        const hasSurvey = data.lastSurveyScore !== null && data.lastSurveyType !== null;

        if (!hasUsername) {
          setStage('START');
        } else if (!hasSurvey) {
          setUserName(data.username);
          setStage('INTRO');
        } else {
          router.replace('/homepage');
        }
      } catch {
        setStage('START');
      }
    };
    checkUser();
  }, []);

  // LOGIC GÕ CHỮ
  useEffect(() => {
    if (stage !== 'SURVEY') return;

    let rawText = currentScene.text.replace('{name}', userName);
    if (currentScene.id === 'final_result') rawText = getResultText(totalScore);

    let index = 0;
    setDisplayedText('');
    setIsTyping(true);

    const interval = setInterval(() => {
      index++;
      setDisplayedText(rawText.slice(0, index));
      const sound = typingSoundRef.current;
      if (sound) {
        if (index >= rawText.length) {
          clearInterval(interval);
          setIsTyping(false);
          sound.pause();
          sound.currentTime = 0;
          return;
        }
        if (rawText[index - 1] !== ' ') {
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
  }, [currentSceneId, stage]);

  // Logic Intro sentences
  useEffect(() => {
    if (stage !== 'START' || sentenceIndex === introSentences.length - 1) return;
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => { setSentenceIndex(prev => prev + 1); setIsFading(false); }, 600);
    }, 2800);
    return () => clearTimeout(timer);
  }, [sentenceIndex, stage]);

  const playClickSound = () => {
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch(() => { });
    }
  };

  const handleNext = (nextId: string, weight?: number) => {
    playClickSound();
    if (weight) setTotalScore(prev => prev + weight);
    setDisplayedText('');
    setIsTyping(true);
    setCurrentSceneId(nextId);
  };

  const handleBoxClick = () => {
    if (!isTyping && !currentScene.type && currentScene.next) {
      handleNext(currentScene.next as string);
    }
  };

  // 🆕 Submit username với check trùng tên
  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    setUsernameError('');
    setUsernameLoading(true);

    try {
      const res = await fetch('/api/user/updateusername', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userName }),
      });

      if (res.status === 409) {
        const data = await res.json();
        setUsernameError(data.error || 'Tên này đã được dùng, hãy chọn tên khác!');
        return; // Không chuyển stage
      }

      setStage('SURVEY'); // Tên OK → vào survey
    } catch {
      setUsernameError('Lỗi kết nối, thử lại nhé!');
    } finally {
      setUsernameLoading(false);
    }
  };

  const finishSurvey = () => {
    playClickSound();
    fetch('/api/user/updateusername', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: totalScore,
        surveyType: currentScene.id.split('_')[0],
      }),
    });
    localStorage.setItem('user_data', JSON.stringify({ name: userName, score: totalScore }));
    router.push('/homepage');
  };

  // --- RENDERING ---

  if (stage === 'CHECKING') {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-[#0a0a0a]">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (stage === 'START') {
    return (
      <div
        className="flex items-center justify-center w-full h-screen bg-[#0a0a0a] cursor-pointer text-center p-6 font-sans"
        onClick={() => {
          playClickSound();
          if (sentenceIndex === introSentences.length - 1) setStage('INTRO');
        }}
      >
        <p className={`text-white text-2xl md:text-3xl tracking-wider transition-all duration-1000 uppercase ${isFading ? 'opacity-0' : 'opacity-100'}`}>
          {introSentences[sentenceIndex]}
        </p>
      </div>
    );
  }

  if (stage === 'INTRO' || stage === 'NAME_INPUT') {
    return (
      <div className="fixed inset-0 bg-black z-[100] overflow-hidden font-sans">
        <video
          ref={videoRef}
          src="/intro.mp4"
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover opacity-80"
          onEnded={() => setStage('NAME_INPUT')}
        />
        {stage === 'NAME_INPUT' && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="flex flex-col md:flex-row items-center gap-12 max-w-5xl w-full animate-in fade-in duration-700">
              <div className="relative w-[240px] h-[360px] md:w-[380px] md:h-[550px] animate-float">
                <Image src="/oldman.png" alt="Elder" fill className="object-contain" priority />
              </div>
              <form
                onSubmit={handleUsernameSubmit}
                className="bg-[#fdfbf7] p-10 rounded-[2rem] border-4 border-[#d2c4a7] shadow-2xl max-w-md w-full"
              >
                <h2 className="text-[#4a4036] text-3xl font-extrabold mb-2 tracking-tight">WELCOME!</h2>
                <p className="text-[#8c7d6c] mb-8 font-medium leading-relaxed uppercase text-xs tracking-widest">Hãy cho ta biết danh xưng của con nhé!</p>
                <input
                  autoFocus
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    setUsernameError(''); // Xóa lỗi khi user gõ lại
                  }}
                  required
                  placeholder="Nhập tên của bạn..."
                  className={`w-full bg-transparent border-b-2 py-3 text-2xl text-[#4a4036] font-bold outline-none mb-2 placeholder:font-normal placeholder:text-gray-300 transition-colors
                    ${usernameError ? 'border-red-400 focus:border-red-500' : 'border-[#d2c4a7] focus:border-[#8c7d6c]'}`}
                />
                {/* 🆕 Hiển thị lỗi trùng tên */}
                {usernameError && (
                  <p className="text-red-500 text-sm mb-4 font-medium">⚠️ {usernameError}</p>
                )}
                <div className="mb-10" />
                <button
                  type="submit"
                  disabled={usernameLoading}
                  className="w-full py-5 bg-[#6c7a65] text-white rounded-2xl font-black text-lg shadow-lg hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {usernameLoading ? 'Đang kiểm tra...' : 'BẮT ĐẦU'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-[#1a1a1a] font-sans overflow-hidden">
      <audio ref={typingSoundRef} src="/typing.wav" preload="auto" />
      <audio ref={clickSoundRef} src="/select.wav" preload="auto" />

      <div className="absolute inset-0 bg-cover bg-center animate-ken-burns" style={{ backgroundImage: "url('/Island8.0.jpg')" }}></div>
      <div className="absolute inset-0 bg-black/30"></div>

      {/* 1. NHÂN VẬT */}
      <div className="fixed bottom-[15%] left-[5%] md:left-[8%] w-[260px] h-[400px] md:w-[420px] md:h-[620px] z-10 pointer-events-none animate-float drop-shadow-2xl">
        <Image src="/oldman.png" alt="Elder" fill className="object-contain object-bottom" priority />
      </div>

      {/* 2. CÂU TRẢ LỜI */}
      {!isTyping && currentScene.type === 'options' && (
        <div className="fixed inset-0 flex items-start justify-center md:justify-end md:pr-[10%] z-40 pointer-events-none pt-[5vh] md:pt-[10vh]">
          <div className="flex flex-col gap-2 w-[90%] max-w-[400px] pointer-events-auto animate-in fade-in slide-in-from-top-10 duration-500 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
            {currentScene.options?.map((opt: any, i: number) => (
              <button
                key={i}
                onClick={() => handleNext(opt.next, opt.weight)}
                className="group relative w-full py-3 px-6 bg-[#fdfbf7]/95 border-2 border-[#d2c4a7] rounded-xl text-[#4a4036] font-bold text-base shadow-lg hover:bg-[#6c7a65] hover:text-white transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#8c7d6c] group-hover:bg-white shrink-0"></div>
                  <span className="leading-tight">{opt.text}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. NÚT TIẾP TỤC */}
      {!isTyping && currentScene.type === 'next_button' && (
        <div className="fixed inset-0 flex items-center justify-center md:justify-end md:pr-[15%] z-50 pointer-events-none">
          <button
            onClick={() => (currentScene as any).action === 'finish' ? finishSurvey() : handleNext(currentScene.next!)}
            className="pointer-events-auto px-12 py-5 bg-[#6c7a65] text-white text-xl font-black rounded-3xl shadow-2xl hover:scale-105 transition-all flex items-center gap-3"
          >
            {currentScene.next_text} <span>→</span>
          </button>
        </div>
      )}

      {/* 4. HỘP THOẠI */}
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
            {isTyping && <span className="inline-block w-2 h-6 bg-[#8c7d6c] ml-1 animate-pulse"></span>}
          </p>
          {!isTyping && !currentScene.type && currentScene.next && (
            <div className="absolute bottom-4 right-8 text-2xl animate-bounce text-[#8c7d6c]">▼</div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        @keyframes ken-burns { 0% { transform: scale(1); } 100% { transform: scale(1.08); } }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-ken-burns { animation: ken-burns 15s linear infinite alternate; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d2c4a7; border-radius: 10px; }
      `}</style>
    </div>
  );
}