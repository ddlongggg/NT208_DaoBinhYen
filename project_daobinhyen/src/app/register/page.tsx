'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Lock,
    Mail,
    Phone,
    ShieldCheck,
    ArrowRight,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import styles from './register.module.css';

const RegisterPage: React.FC = () => {
    const router = useRouter();

    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // 🆕 thêm
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [cooldown, setCooldown] = useState(0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp!');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            setError('Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và ký tự đặc biệt (!@#$%...)');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.');
                setRegisteredEmail(formData.email);
            } else {
                setError(data.error || 'Đăng ký thất bại, vui lòng thử lại.');
            }
        } catch {
            setError('Không thể kết nối đến máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    // 🆕 resend email
    const handleResend = async () => {
        try {
            setLoading(true);

            const res = await fetch('/api/auth/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: registeredEmail }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage('Đã gửi lại email xác minh!');
                setError('');

                // cooldown 30s
                setCooldown(30);
                const timer = setInterval(() => {
                    setCooldown(prev => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

            } else {
                setError(data.error || 'Gửi lại thất bại');
            }
        } catch {
            setError('Lỗi kết nối server');
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

            <div className={styles.formContainer} style={{ maxWidth: '450px' }}>
                <img src="/logo.png" alt="Logo Đảo Bình Yên" className={styles.logo} />
                <h1>THAM GIA ĐẢO BÌNH YÊN</h1>
                <p className={styles.subtitle}>Tạo tài khoản mới để bắt đầu hành trình</p>

                {error && <div className={styles.errorBadge}>{error}</div>}
                {message && <div className={styles.successBadge}>{message}</div>}

                <form onSubmit={handleRegister} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <Mail className={styles.icon} size={18} />
                        <input
                            type="email"
                            name="email"
                            placeholder="Địa chỉ Email"
                            value={formData.email}
                            onChange={handleChange}
                            className={styles.input}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <Phone className={styles.icon} size={18} />
                        <input
                            type="tel"
                            name="phone"
                            placeholder="Số điện thoại"
                            value={formData.phone}
                            onChange={handleChange}
                            className={styles.input}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <Lock className={styles.icon} size={18} />
                        <input
                            type="password"
                            name="password"
                            placeholder="Mật khẩu"
                            value={formData.password}
                            onChange={handleChange}
                            className={styles.input}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <ShieldCheck className={styles.icon} size={18} />
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Xác nhận mật khẩu"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={styles.input}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={loading}
                        style={{ marginTop: '10px' }}
                    >
                        {loading ? (
                            <><Loader2 className={styles.spinner} size={18} /> Đang xử lý...</>
                        ) : (
                            <>Đăng ký ngay <ArrowRight size={18} style={{ marginLeft: '8px' }} /></>
                        )}
                    </button>
                </form>

                {/* 🆕 resend + login */}
                {registeredEmail && (
                    <>
                        <div style={{ marginTop: '15px', textAlign: 'center' }}>
                            <button
                                onClick={handleResend}
                                className={styles.submitButton}
                                disabled={loading || cooldown > 0}
                                style={{ background: '#888' }}
                            >
                                {cooldown > 0 ? `Gửi lại (${cooldown}s)` : 'Gửi lại email xác minh'}
                            </button>
                        </div>

                        <div style={{ marginTop: '10px', textAlign: 'center' }}>
                            <button
                                onClick={() => router.push('/login')}
                                className={styles.submitButton}
                                style={{ background: '#4CAF50' }}
                            >
                                Tôi đã xác minh → Đăng nhập
                            </button>
                        </div>
                    </>
                )}

                <div className={styles.footer}>
                    <p>Bạn đã có tài khoản? <Link href="/login">Bấm đăng nhập</Link></p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;