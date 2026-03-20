'use client'
import React, { useState } from 'react';
import { User, Lock, ArrowRight, KeyRound } from 'lucide-react';
import styles from './login.module.css';
import Link from 'next/link';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (res.ok) {
            setMessage('Đăng nhập thành công!');
        } else {
            setError(data.error || 'Đăng nhập thất bại');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.videoBackground}>
                <video autoPlay muted loop className={styles.video}>
                    <source src="/beach2.mp4" type="video/mp4" />
                </video>
            </div>
            <audio autoPlay loop src="/tiengchi.mp3" />

            <div className={styles.formContainer}>
                <img src="/logo.png" alt="Logo Đảo Bình Yên" className={styles.logo} />
                <h1>CHÀO MỪNG BẠN ĐẾN VỚI ĐẢO BÌNH YÊN</h1>
                <p className={styles.subtitle}>Vui lòng đăng nhập để tiếp tục</p>

                {error && <div className={styles.errorBadge}>{error}</div>}
                {message && <div className={styles.successBadge}>{message}</div>}

                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <User className={styles.icon} size={20} />
                        <input
                            type="text"
                            placeholder="Tên người dùng"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <Lock className={styles.icon} size={20} />
                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>
                    <div className={styles.forgotPassword}>
                        <Link href="/forgot-password">
                            <KeyRound size={14} /> Quên mật khẩu?
                        </Link>
                    </div>

                    <button type="submit" className={styles.submitButton}>
                        Đăng nhập <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>Bạn chưa có tài khoản? <Link href="/register">Bấm đăng ký</Link></p>
                </div>

            </div>
        </div >
    );
};

export default LoginPage;