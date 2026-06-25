'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000'

interface UseSocketOptions {
  autoConnect?: boolean
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true } = options
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    if (!autoConnect) return

    const token = typeof window !== 'undefined' ? localStorage.getItem('slm_token') : null

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      setConnectionError(null)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      setConnectionError(error.message)
      setIsConnected(false)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [autoConnect])

  const emit = (event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    }
  }

  const on = (event: string, callback: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, callback)
  }

  const off = (event: string, callback?: (...args: unknown[]) => void) => {
    if (callback) {
      socketRef.current?.off(event, callback)
    } else {
      socketRef.current?.off(event)
    }
  }

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    emit,
    on,
    off,
  }
}
