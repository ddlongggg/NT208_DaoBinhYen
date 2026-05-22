"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/app/lib/firebase'; // Đảm bảo đường dẫn này trỏ đúng tới file cấu hình Firebase của bạn

// Khởi tạo Auth từ Firebase app
const auth = getAuth(app);

// Định nghĩa kiểu dữ liệu cho Context
interface AuthContextType {
    user: User | null;
    loading: boolean;
}

// Tạo Context
const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// Tạo Provider để bọc ứng dụng
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Lắng nghe sự thay đổi trạng thái đăng nhập từ Firebase
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        // Hủy lắng nghe khi component unmount
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {/* Trong lúc Firebase đang kiểm tra đăng nhập thì không render children để tránh lỗi */}
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Tạo Custom Hook để sử dụng ở bất kỳ đâu
export const useAuthContext = () => useContext(AuthContext);