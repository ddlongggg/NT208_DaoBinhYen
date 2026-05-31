// @/haidang/components/modals/NhatKy.tsx
"use client";
import React, { useState, useRef } from 'react';

interface DiaryEntry {
    id: string;
    title: string;
    content: string;
    createdAt: string;
}

interface NhatKyNeoDauProps {
    user: any;
    onClose: () => void;
    showAlert: (title: string, message: string, isConfirm?: boolean, confirmText?: string) => void;
}

export default function NhatKyNeoDau({ user, onClose, showAlert }: NhatKyNeoDauProps) {
    const [diaryMode, setDiaryMode] = useState<'cover' | 'menu' | 'write' | 'read' | 'view'>('cover');
    const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
    const [isDiaryLoading, setIsDiaryLoading] = useState(false);
    const [pages, setPages] = useState<string[]>(['', '']);
    const [currentSpread, setCurrentSpread] = useState(0);
    const [diaryTitle, setDiaryTitle] = useState('');

    const leftTextareaRef = useRef<HTMLTextAreaElement>(null);
    const rightTextareaRef = useRef<HTMLTextAreaElement>(null);

    const MAX_CHARS_FIRST_PAGE = 297;
    const MAX_CHARS_NORMAL_PAGE = 351;

    const handleOpenWriteMode = () => {
        setDiaryTitle('');
        setPages(['', '']);
        setCurrentSpread(0);
        setDiaryMode('write');
    };

    const handlePageInput = (index: number, e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const cursorPosition = e.target.selectionStart;

        const textBefore = pages.slice(0, index).join('');
        const textAfter = pages.slice(index + 1).join('');
        const fullText = textBefore + newValue + textAfter;

        const globalCursor = textBefore.length + cursorPosition;
        const updatedPages: string[] = [];
        let remainingText = fullText;

        while (remainingText.length > 0) {
            const currentCapacity = updatedPages.length === 0 ? MAX_CHARS_FIRST_PAGE : MAX_CHARS_NORMAL_PAGE;

            if (remainingText.length <= currentCapacity) {
                updatedPages.push(remainingText);
                break;
            }

            let breakPoint = remainingText.lastIndexOf(' ', currentCapacity);
            let breakNewline = remainingText.lastIndexOf('\n', currentCapacity);
            breakPoint = Math.max(breakPoint, breakNewline);

            if (breakPoint <= 0) breakPoint = currentCapacity;

            updatedPages.push(remainingText.slice(0, breakPoint));
            remainingText = remainingText.slice(breakPoint);

            if (remainingText.startsWith(' ')) {
                remainingText = remainingText.substring(1);
                updatedPages[updatedPages.length - 1] += ' ';
            }
        }

        if (updatedPages.length === 0) updatedPages.push('', '');
        else if (updatedPages.length % 2 !== 0) updatedPages.push('');

        let targetPageIndex = 0;
        let localCursor = globalCursor;

        for (let i = 0; i < updatedPages.length; i++) {
            if (localCursor <= updatedPages[i].length) {
                targetPageIndex = i;
                break;
            }
            localCursor -= updatedPages[i].length;
        }

        setPages(updatedPages);

        const targetSpread = Math.floor(targetPageIndex / 2) * 2;
        if (targetSpread !== currentSpread) {
            setCurrentSpread(targetSpread);
        }

        if (targetPageIndex !== index || targetSpread !== currentSpread) {
            setTimeout(() => {
                const isTargetLeft = targetPageIndex % 2 === 0;
                const targetRef = isTargetLeft ? leftTextareaRef : rightTextareaRef;
                if (targetRef?.current) {
                    targetRef.current.focus();
                    targetRef.current.setSelectionRange(localCursor, localCursor);
                }
            }, 10);
        }
    };

    const turnPageNext = () => {
        if (currentSpread + 2 >= pages.length) {
            setPages([...pages, '', '']);
        }
        setCurrentSpread(currentSpread + 2);
    };

    const turnPagePrev = () => {
        if (currentSpread >= 2) {
            setCurrentSpread(currentSpread - 2);
        }
    };

    const handleViewDiary = (entry: DiaryEntry) => {
        setDiaryTitle(entry.title);
        const resultPages: string[] = [];
        let remainingText = entry.content;

        while (remainingText.length > 0) {
            const currentCapacity = resultPages.length === 0 ? MAX_CHARS_FIRST_PAGE : MAX_CHARS_NORMAL_PAGE;
            if (remainingText.length <= currentCapacity) {
                resultPages.push(remainingText);
                break;
            }
            let breakPoint = remainingText.lastIndexOf(' ', currentCapacity);
            let breakNewline = remainingText.lastIndexOf('\n', currentCapacity);
            breakPoint = Math.max(breakPoint, breakNewline);
            if (breakPoint <= 0) breakPoint = currentCapacity;

            resultPages.push(remainingText.slice(0, breakPoint));
            remainingText = remainingText.slice(breakPoint);

            if (remainingText.startsWith(' ')) {
                remainingText = remainingText.substring(1);
                resultPages[resultPages.length - 1] += ' ';
            }
        }

        if (resultPages.length === 0) resultPages.push('', '');
        else if (resultPages.length % 2 !== 0) resultPages.push('');

        setPages(resultPages);
        setCurrentSpread(0);
        setDiaryMode('view');
    };

    const handleSaveDiary = async () => {
        if (!user) {
            showAlert("Chưa đăng nhập", "Bạn cần đăng nhập để hòn đảo lưu giữ ký ức nhé!");
            return;
        }

        const fullContent = pages.filter(page => page.trim() !== '').join('\n\n');

        if (!diaryTitle.trim() && !fullContent) {
            showAlert("Trang trống", "Hãy viết gì đó trước khi lưu nhé!");
            return;
        }

        setIsDiaryLoading(true);

        try {
            const response = await fetch('/api/diary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    title: diaryTitle,
                    content: fullContent
                }),
            });

            if (!response.ok) throw new Error('Lỗi từ API');

            setPages(['', '']);
            setDiaryTitle('');
            setCurrentSpread(0);
            setDiaryMode('menu');
            showAlert("Hoàn tất", "Tâm sự của bạn đã được cất giữ an toàn!");
        } catch (error) {
            console.error("Lỗi:", error);
            showAlert("Lỗi", "Không thể lưu nhật ký, bạn hãy thử lại nhé.");
        } finally {
            setIsDiaryLoading(false);
        }
    };

    const handleReadDiary = async () => {
        if (!user) {
            showAlert("Chưa đăng nhập", "Bạn cần đăng nhập để tìm lại ký ức cũ.");
            return;
        }

        setDiaryMode('read');
        setIsDiaryLoading(true);
        setCurrentSpread(0);

        try {
            const res = await fetch(`/api/diary?uid=${user.uid}`);
            if (!res.ok) throw new Error('Lỗi từ API');

            const data = await res.json();
            setDiaryEntries(data.entries || []);
        } catch (error) {
            console.error("Lỗi:", error);
            showAlert("Lỗi", "Không thể tải nhật ký của bạn.");
        } finally {
            setIsDiaryLoading(false);
        }
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="diary-overlay">
            <button className="close-book-btn" onClick={onClose}>✖</button>
            {diaryMode === 'menu' && (
                <img src="/diary/butlong.png" className="magic-spinning-pen" style={{ width: '120px', height: '120px' }} alt="Bút phép thuật" />
            )}

            {diaryMode === 'cover' && (
                <div className="diary-container2 cover-bg">
                    <div className="cover-content">
                        <h2>NHẬT KÍ</h2>
                        <button className="open-diary-btn" onClick={() => setDiaryMode('menu')}>MỞ NHẬT KÍ</button>
                    </div>
                </div>
            )}

            {diaryMode === 'menu' && (
                <div className="diary-container menu-bg">
                    <div className="left-page-leather">
                        <button className="leather-btn" onClick={handleOpenWriteMode}>✍️ Viết nhật ký mới</button>
                        <button className="leather-btn" onClick={handleReadDiary}>📖 Đọc nhật ký cũ</button>
                    </div>
                    <div className="right-page-paper paper-text-area">
                        <h3 className="author-title">Lời tâm sự</h3>
                        <p className="author-message">
                            Chào bạn, người đang mang trong lòng những tâm tư nặng trĩu. <br /><br />
                            Cuộc sống không phải lúc nào cũng được theo ý ta muốn. Đôi khi sẽ có những khó khăn ập tới một cách bất ngờ. Nhưng bạn không biết phải tâm sự với ai. <br /><br />
                            Đừng lo lắng, hãy cứ viết ra nhé! Chúng tôi sẽ giúp bạn lưu trữ những tâm tư này vào cuốn nhật kí. <br />Chúc bạn một ngày tốt lành!
                        </p>
                    </div>
                </div>
            )}

            {diaryMode === 'write' && (
                <div className="diary-container content-bg">
                    <button className="back-btn" onClick={() => setDiaryMode('menu')}>← Menu</button>
                    <div className="book-spread-area">
                        <div className="book-page left-page relative">
                            {currentSpread === 0 && (
                                <input type="text" className="diary-title-input" placeholder="Viết tiêu đề ở đây..." value={diaryTitle} onChange={(e) => setDiaryTitle(e.target.value)} />
                            )}
                            <textarea
                                key={`left-page-${currentSpread}`}
                                ref={leftTextareaRef}
                                className={`lined-textarea split-textarea ${currentSpread === 0 ? 'has-title' : ''}`}
                                value={pages[currentSpread] || ''}
                                onChange={(e) => handlePageInput(currentSpread, e)}
                                placeholder={currentSpread === 0 ? "Viết những gì bạn đang nghĩ vào đây..." : ""}
                            />
                            <div className="page-number">{currentSpread + 1}</div>
                        </div>
                        <div className="book-page right-page">
                            <textarea
                                key={`right-page-${currentSpread}`}
                                ref={rightTextareaRef}
                                className="lined-textarea split-textarea"
                                value={pages[currentSpread + 1] || ''}
                                onChange={(e) => handlePageInput(currentSpread + 1, e)}
                                placeholder=""
                            />
                            <div className="page-number">{currentSpread + 2}</div>
                        </div>
                    </div>
                    <div className="book-controls">
                        {currentSpread > 0 ? <button className="page-btn" onClick={turnPagePrev}>◀ Trang trước</button> : <div style={{ width: '100px' }}></div>}
                        <button className="save-diary-btn" onClick={handleSaveDiary} disabled={isDiaryLoading}>
                            {isDiaryLoading ? 'Đang cất giữ...' : 'Lưu Nhớ Toàn Bộ'}
                        </button>
                        <button className="page-btn" onClick={turnPageNext}>Trang sau ▶</button>
                    </div>
                </div>
            )}

            {diaryMode === 'read' && (() => {
                const ENTRIES_PER_PAGE = 5;
                const startIndex = currentSpread * (ENTRIES_PER_PAGE * 2);
                const leftEntries = diaryEntries.slice(startIndex, startIndex + ENTRIES_PER_PAGE);
                const rightEntries = diaryEntries.slice(startIndex + ENTRIES_PER_PAGE, startIndex + (ENTRIES_PER_PAGE * 2));

                return (
                    <div className="diary-container content-bg">
                        <button className="back-btn" onClick={() => setDiaryMode('menu')}>← Menu</button>
                        {isDiaryLoading ? (
                            <div className="right-page-paper full-read-area"><p className="loading-text">Đang lật tìm ký ức...</p></div>
                        ) : diaryEntries.length === 0 ? (
                            <div className="right-page-paper full-read-area"><p className="loading-text">Cuốn sổ vẫn còn giấy trắng.</p></div>
                        ) : (
                            <>
                                <div className="book-spread-area">
                                    <div className="book-page left-page relative">
                                        <ul className="diary-list-menu left-menu">
                                            {leftEntries.map(entry => (
                                                <li key={entry.id} className="diary-list-item" onClick={() => handleViewDiary(entry)}>
                                                    <div className="diary-item-info">
                                                        <span className="diary-item-title">{entry.title || 'Tâm sự không tên'}</span>
                                                        <span className="diary-item-date">{formatDate(entry.createdAt)}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="page-number">{currentSpread + 1}</div>
                                    </div>
                                    <div className="book-page right-page relative">
                                        <ul className="diary-list-menu right-menu">
                                            {rightEntries.map(entry => (
                                                <li key={entry.id} className="diary-list-item" onClick={() => handleViewDiary(entry)}>
                                                    <div className="diary-item-info">
                                                        <span className="diary-item-title">{entry.title || 'Tâm sự không tên'}</span>
                                                        <span className="diary-item-date">{formatDate(entry.createdAt)}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="page-number">{currentSpread + 2}</div>
                                    </div>
                                </div>
                                <div className="book-controls">
                                    {currentSpread > 0 ? <button className="page-btn" onClick={() => setCurrentSpread(prev => prev - 1)}>◀ Trang trước</button> : <div style={{ width: '100px' }}></div>}
                                    <div style={{ width: '150px' }}></div>
                                    {startIndex + (ENTRIES_PER_PAGE * 2) < diaryEntries.length ? <button className="page-btn" onClick={() => setCurrentSpread(prev => prev + 1)}>Trang sau ▶</button> : <div style={{ width: '100px' }}></div>}
                                </div>
                            </>
                        )}
                    </div>
                );
            })()}

            {diaryMode === 'view' && (
                <div className="diary-container content-bg">
                    <button className="back-btn" onClick={() => setDiaryMode('read')}>← Mục lục</button>
                    <div className="book-spread-area">
                        <div className="book-page left-page relative">
                            {currentSpread === 0 && <input type="text" className="diary-title-input" value={diaryTitle} readOnly />}
                            <textarea className={`lined-textarea split-textarea ${currentSpread === 0 ? 'has-title' : ''}`} value={pages[currentSpread] || ''} readOnly />
                            <div className="page-number">{currentSpread + 1}</div>
                        </div>
                        <div className="book-page right-page">
                            <textarea className="lined-textarea split-textarea" value={pages[currentSpread + 1] || ''} readOnly />
                            <div className="page-number">{currentSpread + 2}</div>
                        </div>
                    </div>
                    <div className="book-controls">
                        {currentSpread > 0 ? <button className="page-btn" onClick={turnPagePrev}>◀ Trang trước</button> : <div style={{ width: '100px' }}></div>}
                        <div style={{ width: '150px' }}></div>
                        {currentSpread + 2 < pages.length ? <button className="page-btn" onClick={turnPageNext}>Trang sau ▶</button> : <div style={{ width: '100px' }}></div>}
                    </div>
                </div>
            )}
        </div>
    );
}