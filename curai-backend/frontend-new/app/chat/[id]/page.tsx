
"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useChatStore } from "@/store/chatStore"
import { SidebarChatList } from "@/components/layout/SidebarChatList"
import { TopBar } from "@/components/layout/TopBar"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { ChatInputBar } from "@/components/chat/ChatInputBar"
import { RealtimeModeUI } from "@/components/realtime/RealtimeModeUI"
import { SettingsDialog } from "@/components/settings/SettingsDialog"
// import { initWebSocketManager, disconnectWebSocket } from "@/lib/websocket" // Disabled for mock mode
import { AudioRecorder } from "@/lib/audio"
import { VideoCapture } from "@/lib/video"

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.id as string

  const {
    chats,
    activeChat,
    createChat,
    setActiveChat,
    addMessage,
    updateMessage,
    setRealtimeMode,
    setListening,
    setVideoActive,
    setCurrentTranscription,
    setEmergencyState,
    isRealtimeMode,
    selectedAudioDevice,
    selectedVideoDevice,
  } = useChatStore()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showMockBanner, setShowMockBanner] = useState(true)
  const audioRecorderRef = useRef<AudioRecorder | null>(null)
  const videoCaptureRef = useRef<VideoCapture | null>(null)
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)

  // Set active chat on mount - only run when chatId changes, not when messages update
  useEffect(() => {
    if (chatId && chatId !== activeChat) {
      const chatExists = chats.find((chat) => chat.id === chatId)
      if (chatExists) {
        setActiveChat(chatId)
      } else if (chats.length > 0) {
        router.replace(`/chat/${chats[0].id}`)
      } else if (typeof window !== 'undefined' && !sessionStorage.getItem('cura_ai_first_chat_created')) {
        // Only create a new chat if there are no chats at all (first visit, not refresh)
        const newChatId = createChat()
        sessionStorage.setItem('cura_ai_first_chat_created', 'true');
        router.replace(`/chat/${newChatId}`)
      }
    } else if (!chatId && chats.length === 0 && typeof window !== 'undefined' && !sessionStorage.getItem('cura_ai_first_chat_created')) {
      const newChatId = createChat()
      sessionStorage.setItem('cura_ai_first_chat_created', 'true');
      router.replace(`/chat/${newChatId}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  // Send text message
  const handleSendMessage = async (message: string) => {
    if (!activeChat) return;

    const currentChatId = activeChat;

    // Add user message
    addMessage(currentChatId, {
      role: "user",
      content: message,
    });

    // Wait for the user message to be rendered in the DOM using MutationObserver
    await new Promise((resolve) => {
      const chatWindow = document.querySelector('[data-chat-window]');
      if (!chatWindow) return resolve(undefined);
      const observer = new MutationObserver(() => {
        observer.disconnect();
        resolve(undefined);
      });
      observer.observe(chatWindow, { childList: true, subtree: true });
    });

    // Generate a unique assistant message ID
    const assistantMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Add empty assistant message with known ID
    addMessage(currentChatId, {
      role: "assistant",
      content: "",
      isStreaming: true,
      id: assistantMessageId,
    });

    // Simulate streaming response (mock)
    let accumulatedText = "";
    try {
      // Simulate streaming chunks
      for (const chunk of [
        "I understand you're asking about: ",
        `"${message}".`,
        " This is a mock response simulating the Cura AI assistant. In the real implementation, I would provide medical guidance based on your symptoms and urgency level. Remember: For any emergency, call 108 or 112 immediately."
      ]) {
        await new Promise((r) => setTimeout(r, 500));
        accumulatedText += chunk;
        updateMessage(currentChatId, assistantMessageId, accumulatedText);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      addMessage(currentChatId, {
        role: "system",
        content: "Failed to send message. Please try again.",
      });
    }
  }

  // Toggle realtime mode
  const handleToggleRealtime = async () => {
    if (!activeChat) return

    if (!isRealtimeMode) {
      // Start realtime mode (MOCK MODE - No Backend Required)
      try {
        // MOCK: Start audio recording without WebSocket
        audioRecorderRef.current = new AudioRecorder()
        audioRecorderRef.current.setOnDataAvailable((audioChunk) => {
          // MOCK: Log audio chunks instead of sending
          console.log("[MOCK] Audio chunk captured:", audioChunk.byteLength, "bytes")
        })
        await audioRecorderRef.current.start(
          selectedAudioDevice && selectedAudioDevice !== "default" ? selectedAudioDevice : undefined
        )

        setRealtimeMode(true)
        setListening(true)

        // MOCK: Simulate transcription after 2 seconds (removed mock text)
        setTimeout(() => {
          setCurrentTranscription("")
        }, 2000)

        // MOCK: Simulate AI response after 5 seconds
        setTimeout(() => {
          addMessage(activeChat, {
            role: "assistant",
            content: "I can hear you clearly! This is a mock realtime response. In production, I would process your speech through ASR and provide real-time medical guidance.",
          })
        }, 5000)

        // MOCK: Simulate emergency detection after 8 seconds
        setTimeout(() => {
          setEmergencyState("DETECTING_URGENCY", "Analyzing your symptoms...")
          
          setTimeout(() => {
            setEmergencyState("GUIDING", "Based on your symptoms, here are some immediate steps...")
          }, 3000)
        }, 8000)
      } catch (error) {
        console.error("Failed to start realtime mode:", error)
        addMessage(activeChat, {
          role: "system",
          content: "Failed to start realtime mode. Please check your microphone permissions.",
        })
      }
    } else {
      // Stop realtime mode
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop()
        audioRecorderRef.current = null
      }

      if (videoCaptureRef.current) {
        videoCaptureRef.current.stop()
        videoCaptureRef.current = null
        setVideoElement(null)
      }

      // MOCK: No WebSocket to disconnect
      setRealtimeMode(false)
      setListening(false)
      setVideoActive(false)
      setCurrentTranscription("")
      setEmergencyState(null)
    }
  }

  // Toggle video
  const handleToggleVideo = async () => {
    if (!activeChat || !isRealtimeMode) return

    if (!videoCaptureRef.current) {
      // Start video capture (MOCK MODE)
      try {
        videoCaptureRef.current = new VideoCapture()
        await videoCaptureRef.current.start(
          selectedVideoDevice && selectedVideoDevice !== "default" ? selectedVideoDevice : undefined
        )

        // MOCK: Log frames instead of sending to WebSocket
        videoCaptureRef.current.setOnFrameCapture((frameData) => {
          console.log("[MOCK] Video frame captured:", frameData.length, "bytes")
        })

        setVideoElement(videoCaptureRef.current.getVideoElement())
        setVideoActive(true)
      } catch (error) {
        console.error("Failed to start video:", error)
      }
    } else {
      // Stop video capture
      videoCaptureRef.current.stop()
      videoCaptureRef.current = null
      setVideoElement(null)
      setVideoActive(false)
    }
  }

  const handleNewChat = () => {
    const newChatId = createChat()
    router.push(`/chat/${newChatId}`)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "block" : "hidden"} lg:block`}>
        <SidebarChatList onNewChat={handleNewChat} onOpenSettings={() => setSettingsOpen(true)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        

        
        <div className="flex-1 relative overflow-hidden">
          <ChatWindow />
          <RealtimeModeUI videoElement={videoElement} />
        </div>

        <ChatInputBar
          onSendMessage={handleSendMessage}
          onToggleRealtime={handleToggleRealtime}
          onToggleVideo={handleToggleVideo}
        />
      </div>

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
