import React, { useEffect, useState, useCallback } from "react";

interface Announcement {
  message: string;
  id: number;
}

let announceCallback: ((message: string) => void) | null = null;

/**
 * スクリーンリーダーにメッセージを通知する
 * @param message 通知するメッセージ
 */
export const announce = (message: string) => {
  if (announceCallback) {
    announceCallback(message);
  }
};

/**
 * スクリーンリーダー向けのライブリージョンコンポーネント
 * アプリケーションのルートに1つだけ配置する
 */
export const SrAnnouncer: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [counter, setCounter] = useState(0);

  const handleAnnounce = useCallback((message: string) => {
    setCounter((prev) => prev + 1);
    setAnnouncements((prev) => [...prev, { message, id: counter }]);

    // 古い通知を削除
    setTimeout(() => {
      setAnnouncements((prev) => prev.slice(1));
    }, 1000);
  }, [counter]);

  useEffect(() => {
    announceCallback = handleAnnounce;
    return () => {
      announceCallback = null;
    };
  }, [handleAnnounce]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcements.map((announcement) => (
        <p key={announcement.id}>{announcement.message}</p>
      ))}
    </div>
  );
};
