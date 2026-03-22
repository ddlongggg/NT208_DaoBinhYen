'use client'
import React, { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';
import { Mail, Lock, ArrowRight, KeyRound, Loader2 } from 'lucide-react';
import styles from './login.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const LoginPage: React.FC = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Xử lý đăng nhập Social (Google/Facebook)
    const handleSocialLogin = async (providerType: 'google' | 'facebook') => {
        setError('');
        const provider = providerType === 'google'
            ? new GoogleAuthProvider()
            : new FacebookAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();

            // Gửi idToken lên server để tạo session (giống logic cũ của bạn)
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            if (res.ok) {
                setMessage(`Đăng nhập bằng ${providerType} thành công!`);
                setTimeout(() => router.push('/'), 1500);
            }
        } catch (err: any) {
            setError('Đăng nhập mạng xã hội thất bại. Vui lòng thử lại.');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage('Đăng nhập thành công! Đang chuyển hướng...');
                setTimeout(() => router.push('/'), 1500);
            } else {
                setError(data.error || 'Đăng nhập thất bại');
            }
        } catch (err: any) {
            const firebaseErrors: Record<string, string> = {
                'auth/invalid-credential': 'Email hoặc mật khẩu không đúng',
                'auth/user-not-found': 'Tài khoản không tồn tại',
                'auth/wrong-password': 'Mật khẩu không đúng',
                'auth/invalid-email': 'Email không hợp lệ',
                'auth/too-many-requests': 'Quá nhiều lần thử, vui lòng thử lại sau',
            };
            setError(firebaseErrors[err.code] || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
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

                    <button type="submit" className={styles.submitButton} disabled={loading}>
                        {loading ? (
                            <><Loader2 className={styles.spinner} size={18} /> Đang xử lý...</>
                        ) : (
                            <>Đăng nhập <ArrowRight size={18} style={{ marginLeft: '8px' }} /></>
                        )}
                    </button>
                </form>

                {/* Phần đăng nhập bằng MXH */}
                <div className={styles.divider}>
                    <span>Hoặc đăng nhập bằng</span>
                </div>

                <div className={styles.socialGroup}>
                    <button
                        type="button"
                        onClick={() => handleSocialLogin('google')}
                        className={styles.socialButton}
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                        <span>Google</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSocialLogin('facebook')}
                        className={styles.socialButton}
                    >
                        <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" />
                        <span>Facebook</span>
                    </button>
                </div>

                <div className={styles.footer}>
                    <p>Bạn chưa có tài khoản? <Link href="/register">Bấm đăng ký</Link></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;