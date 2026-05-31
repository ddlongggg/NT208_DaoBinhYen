// @/haidang/components/modals/ThaThuyenModal.tsx
"use client";
import React, { useState } from 'react';

interface ThaThuyenModalProps {
    onClose: () => void;
    onRelease: (message: string) => void;
}

export default function ThaThuyenModal({ onClose, onRelease }: ThaThuyenModalProps) {
    const [message, setMessage] = useState('');

    const handleReleaseClick = () => {
        if (!message.trim()) return;
        onRelease(message);
    };

    return (
        <div className="parchment-modal">
            <h2 className="modal-title">Hãy chia sẻ nỗi niềm của bạn</h2>
            <p className="modal-subtitle">
                Trong cuộc sống này, mỗi người đều có trong mình những tâm sự. Bạn cũng không phải ngoại lệ, hãy chia sẻ với chúng tôi nhé!
            </p>
            <textarea
                className="parchment-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Viết tâm sự của bạn vào đây..."
                autoFocus
            />
            <div className="button-group">
                <button className="cancel-btn" onClick={onClose}>Đóng</button>
                <button className="wood-btn" onClick={handleReleaseClick}>THẢ TRÔI</button>
            </div>
        </div>
    );
}