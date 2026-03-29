'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Kịch bản trò chuyện
const scenario = [
  { id: 'start_1', speaker: 'Ông lão', text: 'Ô hô hô... Chào mừng con đã đặt chân đến Đảo Bình Yên. Ta là trưởng đảo ở đây.', next: 'start_2' },
  { id: 'start_2', speaker: 'Ông lão', text: 'Nhìn mặt con có vẻ mang theo khá nhiều tâm sự từ thế giới ngoài kia nhỉ? Đừng lo, hòn đảo này được sinh ra là để dành cho con.', type: 'next_button', next_text: 'Dạ, con sẵn sàng!', next: 'intro_survey' },
  { id: 'intro_survey', speaker: 'Ông lão', text: 'Nhưng mà này... Để ta biết hòn đảo có thể giúp con tốt nhất bằng cách nào, ta cần hỏi con một vài câu hỏi nhỏ. Con sẵn sàng chia sẻ với ta chứ?', type: 'next_button', next_text: 'Con luôn sẵn lòng ạ', next: 'question_1' },
  { id: 'question_1', speaker: 'Ông lão', text: 'Hôm nay của con thế nào? Có chuyện gì vui buồn muốn kể ta nghe không? Cứ thoải mái nhé, ở đây chỉ có ta và những rặng cây thôi.', type: 'options', key: 'mood', options: [
    { text: 'Hôm nay là một ngày tuyệt vời, con rất vui!', value: 'super_happy', next: 'question_2_happy' },
    { text: 'Mọi thứ trôi qua bình yên, không có gì đặc biệt thưa ông.', value: 'calm', next: 'question_2_happy' },
    { text: 'Con thấy hơi kiệt sức, năng lượng của con cạn cả rồi...', value: 'exhausted', next: 'question_2_sad' },
    { text: 'Con đang buồn và áp lực quá, mọi thứ rối bời.', value: 'stressed', next: 'question_2_sad' }
  ]},
  { id: 'question_2_happy', speaker: 'Ông lão', text: 'Tuyệt vời lắm... Một ngày bình yên cũng là một ngày đáng quý. Vậy hiện tại, điều gì con đang quan tâm nhất?', type: 'options', key: 'cause', options: [
    { text: 'Con muốn tìm một nơi nghỉ ngơi nạp lại năng lượng.', value: 'physical', next: 'question_3' },
    { text: 'Con muốn tập trung hoàn thành nốt công việc, bài vở.', value: 'mental', next: 'question_3' },
    { text: 'Con muốn tận hưởng cảm giác thư giãn này lâu hơn.', value: 'emotional', next: 'question_3' },
    { text: 'Con chỉ muốn đi dạo khám phá hòn đảo thôi.', value: 'space', next: 'question_3' }
  ]},
  { id: 'question_2_sad', speaker: 'Ông lão', text: 'Ta hiểu... Cuộc sống ngoài kia hẳn là có nhiều lúc làm con chùn bước. Đừng lo, hãy chia sẻ với ta, điều gì đang khiến con bận lòng nhất?', type: 'options', key: 'cause', options: [
    { text: 'Cơ thể con rã rời, con chỉ muốn được nghỉ ngơi thật sâu.', value: 'physical', next: 'question_3' },
    { text: 'Đầu óc con căng thẳng vì deadline, công việc và bài vở.', value: 'mental', next: 'question_3' },
    { text: 'Trái tim con đang tổn thương, con thấy cô đơn...', value: 'emotional', next: 'question_3' },
    { text: 'Con không sao cả, con chỉ muốn tìm một nơi trốn thôi.', value: 'space', next: 'question_3' }
  ]},
  { id: 'question_3', speaker: 'Ông lão', text: 'Đảo Bình Yên có rất nhiều góc nhỏ diệu kỳ chờ con khám phá. Ngay lúc này, con muốn ta dẫn con đến nơi nào?', type: 'options', key: 'intent', options: [
    { text: 'Con cần một góc tĩnh lặng để tập trung làm việc/học tập.', value: 'focus', next: 'question_4' },
    { text: 'Con muốn thả lỏng, dọn dẹp lại tâm trí và nghe nhạc.', value: 'relax', next: 'question_4' },
    { text: 'Con khó ngủ quá, ông ru con ngủ được không?', value: 'sleep', next: 'question_4' },
    { text: 'Con muốn đọc những lời động viên để thấy yêu đời hơn.', value: 'healing', next: 'question_4' }
  ]},
  { id: 'question_4', speaker: 'Ông lão', text: 'Tuyệt lắm. Ta đã biết phải đưa con đi đâu rồi. Nhưng trước khi bước qua cánh cổng đảo, con thích âm thanh nào của thiên nhiên nhất để bầu bạn cùng mình?', type: 'options', key: 'soundFav', options: [
    { text: 'Tiếng mưa rơi rầm rì ngoài hiên vắng.', value: 'rain', next: 'ending_1' },
    { text: 'Tiếng sóng biển vỗ về bờ cát êm êm.', value: 'ocean', next: 'ending_1' },
    { text: 'Tiếng chim hót và cành lá xạc xào trong rừng sâu.', value: 'forest', next: 'ending_1' },
    { text: 'Tiếng củi cháy tí tách bên đống lửa trại ấm áp.', value: 'fire', next: 'ending_1' }
  ]},
  { id: 'ending_1', speaker: 'Ông lão', text: 'Ta đã hiểu được nỗi lòng của con rồi. Hãy để những cơn gió của Đảo Bình Yên cuốn trôi đi những mệt mỏi đó nhé.', next: 'ending_2' },
  { id: 'ending_2', speaker: 'Ông lão', text: 'Bây giờ, hãy nhắm mắt lại hít một hơi thật sâu... Cánh cửa đảo đã mở. Chúc con có một khoảng thời gian thật bình yên.', type: 'next_button', next_text: 'Bắt đầu khám phá hòn đảo', action: 'finish' },
];

export default function SurveyPage() {
  const router = useRouter();
  
  const [hasStarted, setHasStarted] = useState(false);
  
  const [currentSceneId, setCurrentSceneId] = useState('start_1');
  const [userProfile, setUserProfile] = useState<Record<string, string>>({}); 
  
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const hoverSoundRef = useRef<HTMLAudioElement | null>(null);
  const selectSoundRef = useRef<HTMLAudioElement | null>(null);
  const typingSoundRef = useRef<HTMLAudioElement | null>(null);

  const currentScene = scenario.find(scene => scene.id === currentSceneId) || scenario[0];

  useEffect(() => {
    if (!hasStarted) return; 

    let currentText = currentScene.text;
    let index = 0;
    
    setDisplayedText('');
    setIsTyping(true);

    if (typingSoundRef.current) {
      typingSoundRef.current.currentTime = 0;
      typingSoundRef.current.loop = true;
      typingSoundRef.current.play().catch(e => console.log("Audio play error:", e));
    }

    const interval = setInterval(() => {
      index++;
      setDisplayedText(currentText.slice(0, index));

      if (index >= currentText.length) {
        clearInterval(interval);
        setIsTyping(false);
        if (typingSoundRef.current) {
          typingSoundRef.current.pause();
        }
      }
    }, 35); 

    return () => {
      clearInterval(interval);
      if (typingSoundRef.current) {
        typingSoundRef.current.pause();
      }
    };
  }, [currentScene, hasStarted]);

  const playHoverSound = () => {
    if (hoverSoundRef.current) hoverSoundRef.current.currentTime = 0;
    hoverSoundRef.current?.play().catch(() => {});
  };

  const playSelectSound = () => {
    if (selectSoundRef.current) selectSoundRef.current.currentTime = 0;
    selectSoundRef.current?.play().catch(() => {});
  };

  const handleNext = (nextId: string, value?: string, key?: string) => {
    playSelectSound();
    if (key && value) {
      setUserProfile(prev => ({ ...prev, [key]: value }));
    }
    
    // Báo cho React biết là chuẩn bị chạy chữ luôn để giấu các nút đi
    setIsTyping(true);    
    setDisplayedText(''); 

    setCurrentSceneId(nextId);
  };

  const finishSurvey = () => {
    playSelectSound();
    const finalProfile = { ...userProfile, lastVisit: new Date().toISOString() };
    localStorage.setItem('daoBinhYen_UserProfile', JSON.stringify(finalProfile));
    router.push('/home'); 
  };

  const handleBoxClick = () => {
    if (isTyping) {
      return; 
    }
    if (!currentScene.type && currentScene.next) {
      handleNext(currentScene.next as string);
    }
  };

  if (!hasStarted) {
    return (
      <div 
        className="flex items-center justify-center w-full h-screen bg-black cursor-pointer"
        onClick={() => setHasStarted(true)}
      >
        <p className="text-white text-xl animate-pulse">Nhấp chuột vào màn hình để bắt đầu...</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-screen bg-cover bg-center font-sans" 
      style={{ backgroundImage: "url('/islandblur.png')" }} 
    >
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      <audio ref={hoverSoundRef} src="/hover.wav" preload="auto"></audio>
      <audio ref={selectSoundRef} src="/select.wav" preload="auto"></audio>
      <audio ref={typingSoundRef} src="/typing.wav" preload="auto"></audio>

      {/* NHÂN VẬT ÔNG LÃO - Đã dời sang trái */}
      <div className="fixed bottom-[35%] left-[5%] md:left-[10%] w-[280px] h-[450px] md:w-[350px] md:h-[550px] z-10 pointer-events-none opacity-95">        
        
        {/* --- ANIMATION DẤU BA CHẤM KHI ĐANG TYPING --- */}
        {isTyping && (
          <div className="absolute top-[10%] md:top-[30%] right-[30%] bg-[#fdfbf7]/95 border-[2px] border-[#d2c4a7] rounded-3xl px-4 py-3 shadow-md flex items-center justify-center gap-1.5 z-20 transition-all duration-300">
            <div className="w-2.5 h-2.5 bg-[#8c7d6c] rounded-full animate-[bounce_1s_infinite_0ms]"></div>
            <div className="w-2.5 h-2.5 bg-[#8c7d6c] rounded-full animate-[bounce_1s_infinite_200ms]"></div>
            <div className="w-2.5 h-2.5 bg-[#8c7d6c] rounded-full animate-[bounce_1s_infinite_400ms]"></div>
            {/* Đuôi của bong bóng chat (chỉa xuống ông lão) */}
            <div className="absolute -bottom-2 right-[20%] w-3.5 h-3.5 bg-[#fdfbf7] border-b-[2px] border-r-[2px] border-[#d2c4a7] transform rotate-45"></div>
          </div>
        )}
        {/* ------------------------------------------- */}

        <Image 
          src="/oldman.png" 
          alt="Trưởng đảo" 
          fill
          style={{ objectFit: 'contain', objectPosition: 'bottom' }}
          priority
        />
      </div>

      {/* NÚT LỰA CHỌN - Đã dời sang phải */}
      {!isTyping && currentScene.type === 'options' && currentScene.options && (
      <div className="fixed top-[30%] right-[5%] md:right-[10%] z-50">
        <div className="w-[85vw] max-w-[450px] flex flex-col gap-3">
          {currentScene.options.map((option, index) => (
            <button
              key={index}
              className="w-full text-center py-3 px-5 bg-[#fdfbf7]/95 backdrop-blur-md border-[2px] border-[#c1b5a0] rounded-xl hover:bg-[#e6ddcf] hover:scale-[1.02] text-[#4a4036] font-medium transition-all duration-200 shadow-lg text-[15px]"
              onMouseEnter={playHoverSound}
              onClick={() => handleNext(option.next, option.value, currentScene.key)}
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
    )}

      {/* NÚT TIẾP TỤC - Cũng dời sang phải cho đồng bộ */}
      {!isTyping && currentScene.type === 'next_button' && (
        <div className="fixed top-[50%] right-[5%] md:right-[10%] z-50">
          <div className="w-[85vw] max-w-[350px]">
            <button 
              onClick={currentScene.action === 'finish' ? finishSurvey : () => handleNext(currentScene.next as string)}
              className="w-full text-center py-3 px-5 bg-[#6c7a65]/95 backdrop-blur-md border-[2px] border-[#525e4c] text-white rounded-xl hover:bg-[#525e4c] hover:scale-[1.02] font-semibold transition-all duration-200 shadow-xl text-[15px]"
              onMouseEnter={playHoverSound}
            >
              {currentScene.next_text}
            </button>
          </div>
        </div>
      )}

      {/* HỘP THOẠI CHÍNH */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[95%] md:w-[750px] z-20">
        <div 
          className="relative p-5 md:p-6 bg-[#fdfbf7]/95 backdrop-blur-md border-[3px] border-[#d2c4a7] text-[#4a4036] rounded-2xl shadow-2xl min-h-[140px] md:min-h-[160px] cursor-pointer"
          onClick={handleBoxClick}
        >
          {/* Tên Nhân Vật */}
          <div className="absolute -top-5 left-8 px-5 py-1.5 bg-[#8c7d6c] border-[2px] border-[#d2c4a7] text-[#fdfbf7] font-bold text-md rounded-xl shadow-md">
            {currentScene.speaker}
          </div>

          {/* Lời thoại */}
          <p className="mt-3 text-[16px] md:text-[18px] leading-relaxed whitespace-pre-line font-medium">
            {displayedText}
          </p>

          {!isTyping && !currentScene.type && currentScene.next && (
            <div className="absolute bottom-3 right-5 text-[#8c7d6c] text-[18px] animate-bounce">
              ▼
            </div>
          )}
        </div>
      </div>

    </div>
  );
}