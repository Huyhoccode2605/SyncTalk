// src/components/chat/direct-chat-panel.tsx

"use client";

import browserClient from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import {
    ChangeEvent,
    KeyboardEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import { type Socket } from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Send, Wifi, WifiOff } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface DirectMessage {
    id: string
    sender_id: string
    receiver_id: string
    content: string
    image_url: string | null
    is_read: boolean
    created_at: string
    edited_at: string | null
}

interface ChatUser {
    id: string
    username: string
    is_online: boolean
}

type DirectChatPanelProps = {
    otherUserId: string
    otherUser: ChatUser | null
    socket: Socket | null
    connected: boolean
}

function DirectChatPanel(props: DirectChatPanelProps) {
    const { otherUser, otherUserId, socket, connected } = props;
    const { user, token } = useAuthStore();

    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [typingLabel, setTypingLabel] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        let isMounted = true;

        async function load() {
            setIsLoading(true);
            try {
                const res = await browserClient.get(`/api/messages/${otherUserId}`);
                if (!isMounted) return;
                setMessages(res.data.data || []);
            } catch (err) {
                console.log(err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        if (otherUserId) load();

        return () => { isMounted = false; };
    }, [otherUserId]);

    useEffect(() => {
        if (!socket) return;

        function handleMessage(message: DirectMessage) {
            if (
                message.sender_id !== otherUserId &&
                message.receiver_id !== otherUserId
            ) return;

            setMessages((prev) => {
                const exists = prev.find((m) => m.id === message.id);
                if (exists) return prev;
                return [...prev, message];
            });
        }

        function handleTyping(payload: { user_id: string }) {
            if (payload.user_id !== otherUserId) return;
            setTypingLabel("Đang nhập...");
        }

        function handleStopTyping(payload: { user_id: string }) {
            if (payload.user_id !== otherUserId) return;
            setTypingLabel(null);
        }

        socket.on("new_message", handleMessage);
        socket.on("user_typing", handleTyping);
        socket.on("user_stop_typing", handleStopTyping);

        return () => {
            socket.off("new_message", handleMessage);
            socket.off("user_typing", handleTyping);
            socket.off("user_stop_typing", handleStopTyping);
        };
    }, [socket, otherUserId]);

    function handleInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
        setInput(event.target.value);
        if (!socket) return;

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        socket.emit("typing", { token, receiver_id: otherUserId });

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stop_typing", { token, receiver_id: otherUserId });
            typingTimeoutRef.current = null;
        }, 2000);
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
        }
    }

    async function handleSend() {
        if (!socket || !connected) {
            toast("Chưa kết nối", {
                description: "Kết nối realtime chưa được thiết lập!",
            });
            return;
        }

        const body = input.trim();
        if (!body) return;

        setSending(true);
        try {
            socket.emit("send_message", {
                token,
                receiver_id: otherUserId,
                content: body,
            });
            setInput("");
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            socket.emit("stop_typing", { token, receiver_id: otherUserId });
        } finally {
            setSending(false);
        }
    }

    const title = otherUser?.username ?? "Cuộc trò chuyện";

    return (
        <Card className="flex h-full flex-col overflow-hidden border-border/70 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border pb-3">
                <div>
                    <CardTitle className="text-base text-foreground">{title}</CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">Tin nhắn trực tiếp</p>
                </div>
                <span className={`flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium ${
                    connected ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"
                }`}>
                    {connected ? (
                        <><Wifi className="w-3 h-3" />Online</>
                    ) : (
                        <><WifiOff className="w-3 h-3" />Offline</>
                    )}
                </span>
            </CardHeader>

            <CardContent className="flex-1 space-y-3 overflow-y-auto bg-background/60 p-4">
                {isLoading && (
                    <div className="flex items-center justify-center py-8">
                        <p className="text-xs text-muted-foreground">Đang tải tin nhắn...</p>
                    </div>
                )}
                {!isLoading && messages.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-xs text-muted-foreground">
                            Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!
                        </p>
                    </div>
                )}

                {!isLoading && messages.map((msg) => {
                    const isOther = msg.sender_id === otherUserId;
                    const label = isOther ? title : "Bạn";
                    const time = new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                    });

                    return (
                        <div
                            className={`flex gap-2 text-xs ${isOther ? "justify-start" : "justify-end"}`}
                            key={msg.id}
                        >
                            <div className={`max-w-xs ${isOther ? "" : "order-2"}`}>
                                <div className={`mb-1 text-[12px] font-medium ${
                                    isOther ? "text-muted-foreground" : "text-muted-foreground text-right"
                                }`}>
                                    {label} - {time}
                                </div>
                                {msg?.content && (
                                    <div className={`inline-block rounded-lg px-3 py-2 ${
                                        isOther
                                            ? "bg-accent text-accent-foreground"
                                            : "bg-primary/80 text-primary-foreground"
                                    }`}>
                                        <p className="text-[16px] leading-relaxed">{msg.content}</p>
                                    </div>
                                )}
                                {msg?.image_url && (
                                    <div className="mt-2 overflow-hidden rounded-lg border border-border">
                                        <img
                                            src={msg.image_url}
                                            alt="attachment"
                                            className="max-h-52 max-w-xs rounded-lg object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {typingLabel && (
                    <div className="flex justify-start gap-2 text-xs">
                        <div className="italic text-muted-foreground">{typingLabel}</div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </CardContent>

            <div className="space-y-3 border-t border-border bg-card p-5">
                <div className="flex gap-2">
                    <Textarea
                        rows={2}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Nhập tin nhắn..."
                        disabled={!connected || sending}
                        className="min-h-14 resize-none border-border bg-background text-sm"
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={sending || !connected || !input.trim()}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}

export default DirectChatPanel;