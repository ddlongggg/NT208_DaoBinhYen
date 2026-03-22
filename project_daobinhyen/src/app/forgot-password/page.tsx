'use client'
import React, { useState } from 'react';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import styles from '../forgot-password/forgot-password.module.css'; // Dùng chung CSS để đồng bộ
import Link from 'next/link';
import { auth } from '@/app/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Một liên kết đặt lại mật khẩu đã được gửi đến Email của bạn. Vui lòng kiểm tra hộp thư (hoặc thư rác).');
        } catch (err: any) {
            if (err.code === 'auth/user-not-found') {
                setError('Email này chưa được đăng ký trên hệ thống.');
            } else {
                setError('Có lỗi xảy ra, vui lòng thử lại sau.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.videoBackground}>
                <video autoPlay muted loop playsInline className={styles.video}>
                    <source src="/beach2.mp4" type="video/mp4" />
                </video>
            </div>
            <audio autoPlay loop src="/tiengchi.mp3" />

            <div className={styles.formContainer}>
                <img src="/logo.png" alt="Logo" className={styles.logo} />
                <h1>KHÔI PHỤC MẬT KHẨU</h1>
                <p className={styles.subtitle}>Nhập email của bạn để nhận liên kết đặt lại mật khẩu</p>

                {error && <div className={styles.errorBadge}>{error}</div>}
                {message && <div className={styles.successBadge}>{message}</div>}

                <form onSubmit={handleReset} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <Mail className={styles.icon} size={20} />
                        <input
                            type="email"
                            placeholder="Địa chỉ Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={loading}
                    >
                        {loading ? 'Đang gửi...' : (
                            <>Gửi yêu cầu <Send size={18} style={{ marginLeft: '8px' }} /></>
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    <Link href="/login" className={styles.backLink}>
                        <ArrowLeft size={16} style={{ marginRight: '5px' }} /> Quay lại Đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;