import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MessageRole = 'user' | 'assistant' | 'system' | 'state-event'
export type EmergencyState = 'DETECTING_URGENCY' | 'GUIDING' | 'SUGGEST_CALL' | 'CALL_NOW' | null

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  isStreaming?: boolean
  emergencyState?: EmergencyState
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

interface ChatState {
  // Chats
  chats: Chat[]
  activeChat: string | null
  
  // Realtime state
  isRealtimeMode: boolean
  isListening: boolean
  isVideoActive: boolean
  currentTranscription: string
  
  // Emergency state
  emergencyState: EmergencyState
  emergencyMessage: string | null
  
  // Settings
  darkMode: boolean
  showSubtitles: boolean
  selectedAudioDevice: string | null
  selectedVideoDevice: string | null
  
  // Actions - Chat management
  createChat: () => string
  deleteChat: (chatId: string) => void
  setActiveChat: (chatId: string) => void
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'> & { id?: string }) => void
  updateMessage: (chatId: string, messageId: string, content: string) => void
  clearChat: (chatId: string) => void
  
  // Actions - Realtime
  setRealtimeMode: (enabled: boolean) => void
  setListening: (listening: boolean) => void
  setVideoActive: (active: boolean) => void
  setCurrentTranscription: (text: string) => void
  
  // Actions - Emergency
  setEmergencyState: (state: EmergencyState, message?: string) => void
  clearEmergencyState: () => void
  
  // Actions - Settings
  toggleDarkMode: () => void
  setShowSubtitles: (show: boolean) => void
  setSelectedAudioDevice: (deviceId: string) => void
  setSelectedVideoDevice: (deviceId: string) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      chats: [],
      activeChat: null,
      isRealtimeMode: false,
      isListening: false,
      isVideoActive: false,
      currentTranscription: '',
      emergencyState: null,
      emergencyMessage: null,
      darkMode: false,
      showSubtitles: true,
      selectedAudioDevice: null,
      selectedVideoDevice: null,

      // Chat management
      createChat: () => {
        const chatId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newChat: Chat = {
          id: chatId,
          title: 'New Conversation',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        
        set((state) => ({
          chats: [newChat, ...state.chats],
          activeChat: chatId,
        }))
        
        return chatId
      },

      deleteChat: (chatId: string) => {
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== chatId),
          activeChat: state.activeChat === chatId ? null : state.activeChat,
        }))
      },

      setActiveChat: (chatId: string) => {
        set({ activeChat: chatId })
      },

      addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'> & { id?: string }) => {
        const messageId = message.id ?? `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const { id, ...rest } = message
        const newMessage: Message = {
          ...rest,
          id: messageId,
          timestamp: Date.now(),
        }

        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [...chat.messages, newMessage],
                  updatedAt: Date.now(),
                  title: chat.messages.length === 0 && message.role === 'user'
                    ? message.content.slice(0, 50)
                    : chat.title,
                }
              : chat
          ),
        }))
      },

      updateMessage: (chatId: string, messageId: string, content: string) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, content } : msg
                  ),
                  updatedAt: Date.now(),
                }
              : chat
          ),
        }))
      },

      clearChat: (chatId: string) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? { ...chat, messages: [], updatedAt: Date.now() }
              : chat
          ),
        }))
      },

      // Realtime actions
      setRealtimeMode: (enabled: boolean) => {
        set({ isRealtimeMode: enabled })
        if (!enabled) {
          set({ isListening: false, currentTranscription: '' })
        }
      },

      setListening: (listening: boolean) => {
        set({ isListening: listening })
      },

      setVideoActive: (active: boolean) => {
        set({ isVideoActive: active })
      },

      setCurrentTranscription: (text: string) => {
        set({ currentTranscription: text })
      },

      // Emergency actions
      setEmergencyState: (state: EmergencyState, message?: string) => {
        set({ emergencyState: state, emergencyMessage: message || null })
      },

      clearEmergencyState: () => {
        set({ emergencyState: null, emergencyMessage: null })
      },

      // Settings actions
      toggleDarkMode: () => {
        set((state) => ({ darkMode: !state.darkMode }))
      },

      setShowSubtitles: (show: boolean) => {
        set({ showSubtitles: show })
      },

      setSelectedAudioDevice: (deviceId: string) => {
        set({ selectedAudioDevice: deviceId })
      },

      setSelectedVideoDevice: (deviceId: string) => {
        set({ selectedVideoDevice: deviceId })
      },
    }),
    {
      name: 'cura-ai-storage',
      partialize: (state) => ({
        chats: state.chats,
        activeChat: state.activeChat,
        darkMode: state.darkMode,
        showSubtitles: state.showSubtitles,
        selectedAudioDevice: state.selectedAudioDevice,
        selectedVideoDevice: state.selectedVideoDevice,
      }),
    }
  )
)
