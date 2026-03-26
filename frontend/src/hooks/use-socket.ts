"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from '@/lib/auth-store'
import { set } from "zod";

type UseSocketResult = {
  socket: Socket | null;
  connected: boolean;
};


export function useSocket(): UseSocketResult {
  const { token, isAuthenticated } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
        setConnected(false);
        setSocket((prev) => {
          if (prev) prev.disconnect();
          return null
    })
     return;
  }

  const baseUrl=process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5001'

  const socketInstance: Socket = io(baseUrl, {
    auth: { token },
    withCredentials: true,
    transports: ["websocket"],
  }); 

  setSocket(socketInstance)

  const handleConnect = () => {
    console.log('[Socket Connected]', socketInstance.id)
    setConnected(true)
  }

  const handleDisConnect = (reason: any) => {
    console.log('[Socket Disconnected]', reason)
    setConnected(false)
  }

  const handleConnectError = (err: any) => {
    console.error('[Socket Error]', err)
  }

  socketInstance.on('connect', handleConnect)
  socketInstance.on('disconnect', handleDisConnect)
  socketInstance.on('connect_error', handleConnectError)
 
  return () => {
    socketInstance.off('connect', handleConnect)
    socketInstance.off('disconnect', handleDisConnect)
    socketInstance.off('connect_error', handleConnectError)
    socketInstance.disconnect()
    setConnected(false)
    setSocket(null)
    }
  }, [token, isAuthenticated])

  return { socket, connected }
}