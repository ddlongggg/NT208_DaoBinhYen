'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { Ship } from 'lucide-react'; // Icon con tàu để hợp chủ đề Đảo
import styles from './home.module.css';

const HomePage: React.FC = () => {
    const router = useRouter();

    const handleEnterIsland = () => {
        router.push('/login'); // Chuyển hướng đến trang login
    };

    return (
        <div className={styles.container}>
            {/* Video nền */}
            <div className={styles.videoBackground}>
                <video autoPlay muted loop playsInline className={styles.video}>
                    <source src="/beach2.mp4" type="video/mp4" />
                </video>
            </div>

            {/* Âm thanh chim hót */}
            <audio autoPlay loop src="/tiengchi.mp3" />

            <div className={styles.content}>
                <img src="/logo.png" alt="Logo Đảo Bình Yên" className={styles.logo} />
                <h1 className={styles.title}>ĐẢO BÌNH YÊN</h1>
                <p className={styles.description}>
                    Nơi dừng chân của những tâm hồn tìm kiếm sự tĩnh lặng
                </p>

                <button onClick={handleEnterIsland} className={styles.enterButton}>
                    <Ship size={24} style={{ marginRight: '10px' }} />
                    BẮT ĐẦU HÀNH TRÌNH
                </button>
            </div>

            <div className={styles.overlay}></div>
        </div>
    );
};

export default HomePage;