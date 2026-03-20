'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    User,
    Lock,
    Mail,
    Phone,
    ShieldCheck,
    ArrowRight,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import styles from './register.module.css'; // Sử dụng chung file CSS để đồng bộ giao diện

const RegisterPage: React.FC = () => {
    const router = useRouter();

    // State quản lý dữ liệu form
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    // State quản lý thông báo và trạng thái loading
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Hàm cập nhật dữ liệu khi người dùng nhập liệu
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Hàm xử lý gửi form đăng ký
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // 1. Kiểm tra mật khẩu khớp nhau (Client-side validation)
        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp!');
            return;
        }

        setLoading(true);

        try {
            // 2. Gửi yêu cầu API đến Backend
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');
                // Chuyển hướng sau 2 giây để người dùng kịp đọc thông báo
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                // Hiển thị lỗi trả về từ server (ví dụ: email đã tồn tại)
                setError(data.error || 'Đăng ký thất bại, vui lòng thử lại.');
            }
        } catch (err) {
            setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Video nền giữ nguyên phong cách Đảo Bình Yên */}
            <div className={styles.videoBackground}>
                <video autoPlay muted loop className={styles.video}>
                    <source src="/beach2.mp4" type="video/mp4" />
                </video>
            </div>
            <audio autoPlay loop src="/tiengchi.mp3" />
            <div className={styles.formContainer} style={{ maxWidth: '450px' }}>
                {/* Logo và Tiêu đề */}
                <img src="/logo.png" alt="Logo Đảo Bình Yên" className={styles.logo} />
                <h1>THAM GIA ĐẢO BÌNH YÊN</h1>
                <p className={styles.subtitle}>Tạo tài khoản mới để bắt đầu hành trình</p>

                {/* Hiển thị thông báo Lỗi hoặc Thành công */}
                {error && <div className={styles.errorBadge}>{error}</div>}
                {message && <div className={styles.successBadge}>{message}</div>}

                <form onSubmit={handleRegister} className={styles.form}>
                    {/* Tên người dùng */}


                    {/* Email */}
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

                    {/* Số điện thoại */}
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

                    {/* Mật khẩu */}
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

                    {/* Nhập lại mật khẩu */}
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

                    {/* Nút Đăng ký với trạng thái Loading */}
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

                {/* Footer chuyển hướng */}
                <div className={styles.footer}>
                    <p>
                        Bạn đã có tài khoản?
                        <Link href="/login"> Bấm đăng nhập</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;