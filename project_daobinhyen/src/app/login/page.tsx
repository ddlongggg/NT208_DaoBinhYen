'use client'
import React, { useState } from 'react';
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
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
    const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);

    // ─── Social login (popup) ─────────────────────────────────────────────────
    const handleSocialLogin = async (providerType: 'google' | 'facebook') => {
        setError('');
        setMessage('');
        setSocialLoading(providerType);

        const provider =
            providerType === 'google'
                ? new GoogleAuthProvider()
                : new FacebookAuthProvider();

        if (providerType === 'facebook') {
            (provider as FacebookAuthProvider).addScope('public_profile');
        }

        try {
            const result = await signInWithPopup(auth, provider);
            console.log('POPUP RESULT:', result.user.email);

            const idToken = await result.user.getIdToken();
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            const data = await res.json();
            console.log('API STATUS:', res.status, data);

            if (res.ok) {
                setMessage('Đăng nhập thành công! Đang chuyển hướng...');
                setTimeout(() => router.push('/'), 1500);
            } else {
                setError(data.error || 'Đăng nhập thất bại');
            }
        } catch (err: any) {
            console.log('POPUP ERROR:', err.code, err.message);
            const msgs: Record<string, string> = {
                'auth/popup-blocked': 'Trình duyệt chặn popup — hãy cho phép popup cho trang này',
                'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập',
                'auth/cancelled-popup-request': 'Yêu cầu đăng nhập đã bị huỷ',
                'auth/account-exists-with-different-credential': 'Email đã đăng ký bằng phương thức khác',
                'auth/user-cancelled': 'Bạn đã huỷ đăng nhập',
            };
            setError(msgs[err.code] || 'Đăng nhập thất bại');
        } finally {
            setSocialLoading(null);
        }
    };

    // ─── Email / Password login ───────────────────────────────────────────────
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

    // ─── UI ───────────────────────────────────────────────────────────────────
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

                    <button type="submit" className={styles.submitButton} disabled={loading || !!socialLoading}>
                        {loading ? (
                            <><Loader2 className={styles.spinner} size={18} /> Đang xử lý...</>
                        ) : (
                            <>Đăng nhập <ArrowRight size={18} style={{ marginLeft: '8px' }} /></>
                        )}
                    </button>
                </form>

                <div className={styles.divider}>
                    <span>Hoặc đăng nhập bằng</span>
                </div>

                <div className={styles.socialGroup}>
                    <button
                        type="button"
                        onClick={() => handleSocialLogin('google')}
                        className={styles.socialButton}
                        disabled={!!socialLoading || loading}
                    >
                        {socialLoading === 'google' ? (
                            <Loader2 className={styles.spinner} size={18} />
                        ) : (
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                        )}
                        <span>{socialLoading === 'google' ? 'Đang xử lý...' : 'Google'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSocialLogin('facebook')}
                        className={styles.socialButton}
                        disabled={!!socialLoading || loading}
                    >
                        {socialLoading === 'facebook' ? (
                            <Loader2 className={styles.spinner} size={18} />
                        ) : (
                            <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" />
                        )}
                        <span>{socialLoading === 'facebook' ? 'Đang xử lý...' : 'Facebook'}</span>
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
