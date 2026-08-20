import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  X,
  Minus,
  Maximize2,
  Minimize2,
  Send,
  Trash2,
  RotateCcw,
  Download,
  User,
  ShoppingBag,
  Star,
  ExternalLink,
  MessageSquare,
  Heart
} from 'lucide-react'

// Define Product Item
interface ProductItem {
  id: string
  name: string
  price: number
  rating: number
  highlights: string[]
  image: string
  slug: string
}

// Define Message types
interface Message {
  id: string
  sender: 'ai' | 'customer'
  text: string
  timestamp: string // ISO string
  products?: ProductItem[]
  totalMatchingCount?: number
  feedback?: 'helpful' | 'not_helpful'
}

// Suggestion Chip Translation mapping
const CHIP_TRANSLATIONS = [
  { en: 'Designer Mekhela below ₹10000', as: '₹১০,০০০ ৰ তলৰ ডিজাইনাৰ মেখেলা' },
  { en: 'Wedding Collection', as: 'বিবাহৰ সংগ্ৰহ' },
  { en: 'Bihu Collection', as: 'বিহুৰ সংগ্ৰহ' },
  { en: 'Premium Silk', as: 'প্ৰিমিয়াম চিল্ক' },
  { en: 'Gift for Mother', as: 'মাতৃৰ বাবে উপহাৰ' },
  { en: 'New Arrivals', as: 'নতুন আগমন' },
  { en: 'Best Sellers', as: 'শ্ৰেষ্ঠ বিক্ৰী হোৱা সামগ্ৰী' },
  { en: 'Compare Two Products', as: 'দুটা সামগ্ৰীৰ তুলনা কৰক' }
]

// Localized strings
const LOCALIZED_STRINGS = {
  English: {
    welcomeTitle: "✨ Hokhiyoti AI Stylist",
    welcomeSubtitle: "Your Personal Assamese Fashion Expert",
    welcomeDesc: "Discover the elegance of genuine Sualkuchi silks, custom Mekhela drapes, and traditional styling advice tailored just for you.",
    inputPlaceholder: "Ask me about Assam handloom sarees...",
    btnClear: "Clear",
    btnRestart: "Restart",
    btnDownload: "Download (.txt)",
    btnClearTitle: "Clear conversation",
    btnRestartTitle: "Restart stylist session",
    btnDownloadTitle: "Download chat history",
    enterSend: "Press Enter to send",
    escClose: "Esc to close",
    wasHelpful: "Was this helpful?",
    showMore: "Show More Products",
    foundMore: (count: number) => `I found ${count} more matching products.`,
    defaultResponse: `I'm delighted to guide you through the beautiful heritage of Assamese textiles! As your Hokhiyoti AI Stylist, I can help you select authentic Sualkuchi silks, decode traditional motifs like *Kingkhap* or *Kaziranga*, and recommend the perfect outfit for weddings, Bihu, or casual elegance. 

Feel free to ask me anything or click one of the suggestions below!`,
    buyText: "Buy",
    viewText: "View",
    saveText: "Save",
    savedText: "Saved"
  },
  Assamese: {
    welcomeTitle: "✨ হখীয়তী এআই ষ্টাইলিষ্ট",
    welcomeSubtitle: "আপোনাৰ ব্যক্তিগত অসমীয়া ফেশ্বন বিশেষজ্ঞ",
    welcomeDesc: "প্ৰকৃত সুৱালকুছি চিল্ক, কাষ্টম মেখেলা ড্ৰেপ আৰু আপোনাৰ বাবে উপযোগী পৰম্পৰাগত ষ্টাইলিং পৰামৰ্শৰ সৌন্দৰ্য আৱিষ্কাৰ কৰক।",
    inputPlaceholder: "অসমৰ হাতশালৰ কাপোৰৰ বিষয়ে সোধক...",
    btnClear: "মচক",
    btnRestart: "পুনৰ আৰম্ভ",
    btnDownload: "ডাউনলোড (.txt)",
    btnClearTitle: "কথোপকথন মচক",
    btnRestartTitle: "ষ্টাইলিষ্ট অধিবেশন পুনৰ আৰম্ভ কৰক",
    btnDownloadTitle: "ডাউনলোড কৰক (.txt)",
    enterSend: "প্ৰেৰণ কৰিবলৈ এণ্টাৰ টিপক",
    escClose: "বন্ধ কৰিবলৈ Esc টিপক",
    wasHelpful: "এইটো সহায়কাৰী আছিলনে?",
    showMore: "অধিক সামগ্ৰী দেখুৱাওক",
    foundMore: (count: number) => `মই আৰু ${count} টা খাপ খোৱা সামগ্ৰী পালোঁ।`,
    defaultResponse: `অসমৰ বস্ত্ৰশিল্পৰ ধুনীয়া ঐতিহ্যৰ মাজেৰে আপোনাক পথ প্ৰদৰ্শন কৰিবলৈ পাই মই অতি আনন্দিত হৈছোঁ! আপোনাৰ হখীয়তী এআই ষ্টাইলিষ্ট হিচাপে, মই আপোনাক প্ৰকৃত সুৱালকুছি চিল্ক বাছনি কৰাত, 'কিংখাপ' বা 'কাজিৰঙা'ৰ দরে পৰম্পৰাগত মটিফসমূহ বুজাত সহায় কৰিব পাৰোঁ।

মোক যিকোনো কথা সোধক বা তলৰ পৰামৰ্শবোৰত ক্লিক কৰক!`,
    buyText: "ক্ৰয়",
    viewText: "দৰ্শন",
    saveText: "সংৰক্ষণ",
    savedText: "সংৰক্ষিত"
  }
}

export default function HokhiyotiAIStylist() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [preferredLanguage, setPreferredLanguage] = useState<'English' | 'Assamese'>('English')

  // Wishlist locally saved state
  const [savedProductIds, setSavedProductIds] = useState<string[]>([])

  // Pagination count for products in chat messages
  const [visibleProductCounts, setVisibleProductCounts] = useState<Record<string, number>>({})

  // Drag-Resize state for desktop
  const [dimensions, setDimensions] = useState({ width: 420, height: 600 })
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatWindowRef = useRef<HTMLDivElement>(null)

  const t = LOCALIZED_STRINGS[preferredLanguage]

  // Load chat history and wishlist on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('hokhiyoti_stylist_chat')
      if (stored) {
        setMessages(JSON.parse(stored))
      } else {
        // Initial welcome message
        const welcomeMessage: Message = {
          id: 'welcome',
          sender: 'ai',
          text: t.defaultResponse,
          timestamp: new Date().toISOString()
        }
        setMessages([welcomeMessage])
        sessionStorage.setItem('hokhiyoti_stylist_chat', JSON.stringify([welcomeMessage]))
      }

      const storedWishlist = localStorage.getItem('hokhiyoti_saved_products')
      if (storedWishlist) {
        setSavedProductIds(JSON.parse(storedWishlist))
      }
    } catch (e) {
      console.error('Failed to load storage items:', e)
    }
  }, [])

  // Dynamically update welcome message text if language changes and conversation is fresh
  useEffect(() => {
    const firstMsg = messages[0]
    if (messages.length === 1 && firstMsg && firstMsg.id === 'welcome') {
      const updatedWelcome: Message = {
        ...firstMsg,
        text: t.defaultResponse
      }
      setMessages([updatedWelcome])
    }
  }, [preferredLanguage])

  // Save chat history to sessionStorage
  const saveMessages = (newMsgs: Message[]) => {
    setMessages(newMsgs)
    try {
      sessionStorage.setItem('hokhiyoti_stylist_chat', JSON.stringify(newMsgs))
    } catch (e) {
      console.error('Failed to save chat to sessionStorage:', e)
    }
  }

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom()
    }
  }, [messages, isOpen, isMinimized, isTyping])

  // Handle Resize Mouse Events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return
      
      const deltaX = resizeRef.current.startX - e.clientX
      const deltaY = resizeRef.current.startY - e.clientY
      
      const newWidth = Math.max(340, Math.min(800, resizeRef.current.startWidth + deltaX))
      const newHeight = Math.max(400, Math.min(900, resizeRef.current.startHeight + deltaY))
      
      setDimensions({
        width: newWidth,
        height: newHeight
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.userSelect = ''
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // Keyboard Shortcuts (Esc to close/minimize)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isMaximized) {
          setIsMaximized(false)
        } else {
          setIsOpen(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isMaximized])

  // Start resize drag handler
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: dimensions.width,
      startHeight: dimensions.height
    }
    setIsResizing(true)
  }

  // Send message handler with Session Caching
  const handleSendMessage = async (text: string, displayVal?: string) => {
    if (!text.trim()) return

    const bubbleText = displayVal || text.trim()

    // Customer message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'customer',
      text: bubbleText,
      timestamp: new Date().toISOString()
    }

    const updated = [...messages, userMsg]
    saveMessages(updated)
    setInputValue('')
    setIsTyping(true)

    // Performance Optimization: Check Cache
    const cacheKey = `${text.trim().toLowerCase()}_${preferredLanguage}`
    try {
      const cachedData = sessionStorage.getItem('hokhiyoti_stylist_cache')
      if (cachedData) {
        const cacheObj = JSON.parse(cachedData)
        if (cacheObj[cacheKey]) {
          const cachedItem = cacheObj[cacheKey]
          setTimeout(() => {
            const aiMsg: Message = {
              id: `ai-${Date.now()}`,
              sender: 'ai',
              text: cachedItem.text,
              timestamp: new Date().toISOString(),
              products: cachedItem.products || [],
              totalMatchingCount: cachedItem.totalMatchingCount || 0
            }
            saveMessages([...updated, aiMsg])
            setIsTyping(false)
          }, 800)
          return
        }
      }
    } catch (e) {
      console.error('Failed to read from cache:', e)
    }

    const workerUrl = import.meta.env.VITE_NEWSLETTER_WORKER_URL as string | undefined

    if (workerUrl) {
      try {
        const response = await fetch(`${workerUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: text.trim(),
            history: messages.map(m => ({ sender: m.sender, text: m.text })),
            currentPage: window.location.href,
            preferredLanguage: preferredLanguage,
          }),
        })

        if (!response.ok) {
          throw new Error('API status not OK')
        }

        const data = await response.json()
        if (data.success && data.text) {
          const aiMsg: Message = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: data.text,
            timestamp: new Date().toISOString(),
            products: data.products || [],
            totalMatchingCount: data.totalMatchingCount || 0
          }

          // Save response to cache
          try {
            const cachedData = sessionStorage.getItem('hokhiyoti_stylist_cache')
            const cacheObj = cachedData ? JSON.parse(cachedData) : {}
            cacheObj[cacheKey] = {
              text: data.text,
              products: data.products || [],
              totalMatchingCount: data.totalMatchingCount || 0
            }
            sessionStorage.setItem('hokhiyoti_stylist_cache', JSON.stringify(cacheObj))
          } catch (e) {
            console.error('Failed to save to cache:', e)
          }

          saveMessages([...updated, aiMsg])
          setIsTyping(false)
          return
        }
      } catch (err) {
        console.error('[Hokhiyoti AI Stylist] Backend error, falling back to simulation:', err)
      }
    }

    // Show error if backend fails - never use fake responses
    setTimeout(() => {
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `I apologize, but I'm unable to connect to our product database right now. Please check your internet connection and try again. If the problem persists, please contact support.`,
        timestamp: new Date().toISOString()
      }

      saveMessages([...updated, aiMsg])
      setIsTyping(false)
    }, 500)
  }

  // Clear conversation
  const handleClear = () => {
    const welcomeMessage: Message = {
      id: `welcome-${Date.now()}`,
      sender: 'ai',
      text: t.defaultResponse,
      timestamp: new Date().toISOString()
    }
    saveMessages([welcomeMessage])
    setVisibleProductCounts({})
  }

  // Restart chat
  const handleRestart = () => {
    handleClear()
    setIsMinimized(false)
    setIsMaximized(false)
  }

  // Download conversation
  const handleDownload = () => {
    const textContent = messages
      .map(
        m =>
          `[${new Date(m.timestamp).toLocaleTimeString()}] ${
            m.sender === 'ai' ? 'Hokhiyoti AI Stylist' : 'Customer'
          }:\n${m.text}\n\n`
      )
      .join('---\n')

    const header = `==================================================\n✨ Hokhiyoti AI Stylist Conversation Export\nGenerated: ${new Date().toLocaleString()}\n==================================================\n\n`
    const blob = new Blob([header + textContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `hokhiyoti_stylist_chat_${Date.now()}.txt`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle local rating feedback
  const handleFeedback = (msgId: string, feedbackType: 'helpful' | 'not_helpful') => {
    const updated = messages.map(m => {
      if (m.id === msgId) {
        return {
          ...m,
          feedback: m.feedback === feedbackType ? undefined : feedbackType
        }
      }
      return m
    })
    saveMessages(updated)
  }

  // Toggle saving products to wishlist (strictly local)
  const toggleSaveProduct = (productId: string) => {
    let updated: string[]
    if (savedProductIds.includes(productId)) {
      updated = savedProductIds.filter(id => id !== productId)
    } else {
      updated = [...savedProductIds, productId]
    }
    setSavedProductIds(updated)
    try {
      localStorage.setItem('hokhiyoti_saved_products', JSON.stringify(updated))
    } catch (e) {
      console.error('Failed to update wishlist storage:', e)
    }
  }

  // Format message time
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  // Message grouping checker
  const shouldGroupMessage = (curr: Message, prev?: Message) => {
    if (!prev) return false
    if (curr.sender !== prev.sender) return false
    const currTime = new Date(curr.timestamp).getTime()
    const prevTime = new Date(prev.timestamp).getTime()
    return currTime - prevTime < 120000
  }

  // Show More Products handler
  const handleShowMoreProducts = (msgId: string) => {
    setVisibleProductCounts(prev => ({
      ...prev,
      [msgId]: (prev[msgId] || 3) + 3
    }))
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end font-sans">
      {/* Trigger Button overlaying all content */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="trigger-btn"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsOpen(true)
              setIsMinimized(false)
            }}
            className="relative flex items-center gap-3 px-6 py-4 rounded-full bg-[#111111] text-white border border-[#B08D57]/40 shadow-[0_12px_40px_rgba(176,141,87,0.25)] cursor-pointer group z-[99999]"
          >
            <span className="absolute inset-0 rounded-full border border-[#B08D57] opacity-60 animate-ping pointer-events-none scale-105" />
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-[#B08D57] to-[#DFD3C3] text-black">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B08D57]/80 font-medium">Assistant</span>
              <span className="text-sm font-semibold tracking-wide font-sans text-white group-hover:text-[#DFD3C3] transition-colors">
                {preferredLanguage === 'Assamese' ? 'হখীয়তী এআই ষ্টাইলিষ্ট' : 'Hokhiyoti AI Stylist'}
              </span>
            </div>
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black animate-pulse ml-1" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window with z-[99999] positioning */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            ref={chatWindowRef}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              width: isMaximized ? '100vw' : isMinimized ? 320 : dimensions.width,
              height: isMaximized ? '100vh' : isMinimized ? 60 : dimensions.height,
              right: isMaximized ? 0 : '',
              bottom: isMaximized ? 0 : ''
            }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className={`
              flex flex-col bg-[#FAF9F6] border border-[#B08D57]/30 shadow-[0_24px_80px_rgba(0,0,0,0.22)] z-[99999]
              ${isMaximized ? 'fixed inset-0 rounded-none' : 'rounded-2xl'}
              overflow-hidden transition-all duration-300
            `}
            style={
              !isMaximized && !isMinimized
                ? { width: dimensions.width, height: dimensions.height }
                : undefined
            }
          >
            {/* Drag Handle */}
            {!isMaximized && !isMinimized && (
              <div
                onMouseDown={startResize}
                className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize z-[100000] hover:bg-[#B08D57]/10 transition-colors flex items-center justify-center rounded-br-lg border-b border-r border-[#B08D57]/20"
                title="Drag to resize window"
              >
                <div className="w-1.5 h-1.5 bg-[#B08D57]/50 rounded-full" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#111111] via-[#1A1A1A] to-[#111111] text-white border-b border-[#B08D57]/20 select-none">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#B08D57] to-[#DFD3C3] text-black">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase tracking-[0.25em] text-[#B08D57] font-semibold">{t.welcomeSubtitle}</span>
                  <span className="text-sm font-bold tracking-wide font-sans">{t.welcomeTitle}</span>
                </div>
              </div>

              {/* Window Commands */}
              <div className="flex items-center gap-1.5 text-white/70">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                  title={isMinimized ? 'Restore' : 'Minimize'}
                >
                  <Minus className="w-4 h-4" />
                </button>
                {!isMinimized && (
                  <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-1.5 hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                    title={isMaximized ? 'Restore' : 'Maximize'}
                  >
                    {isMaximized ? <Minimize2 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4 text-white" />}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-[#ff4d4d]/20 hover:text-[#ff4d4d] rounded-md transition-colors cursor-pointer"
                  title="Close Stylist"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            {!isMinimized && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#FAF9F6] relative">
                <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 custom-scrollbar">
                  
                  {/* Welcome Card */}
                  <div className="bg-white border border-[#B08D57]/15 rounded-2xl p-6 shadow-sm mb-6 text-center max-w-md mx-auto">
                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-[#FAF9F6] border border-[#B08D57]/20 text-[#B08D57] mb-3">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-serif font-semibold text-[#111111] mb-1">{t.welcomeTitle}</h3>
                    <p className="text-xs text-[#B08D57] uppercase tracking-wider font-semibold mb-3">{t.welcomeSubtitle}</p>
                    <p className="text-xs text-[#666666] leading-relaxed">{t.welcomeDesc}</p>
                  </div>

                  {/* Conversation Streams */}
                  {messages.map((msg, index) => {
                    const prev = messages[index - 1]
                    const isGrouped = shouldGroupMessage(msg, prev)
                    const visibleCount = visibleProductCounts[msg.id] || 3
                    const hasProducts = msg.products && msg.products.length > 0
                    const displayedProducts = hasProducts ? msg.products!.slice(0, visibleCount) : []
                    const totalCount = msg.totalMatchingCount || (msg.products ? msg.products.length : 0)
                    const remainingCount = totalCount - visibleCount

                    return (
                      <div key={msg.id} className="space-y-3">
                        <div
                          className={`flex gap-3 text-left ${
                            msg.sender === 'customer' ? 'justify-end' : 'justify-start'
                          } ${isGrouped ? 'mt-1' : 'mt-4'}`}
                        >
                          {msg.sender === 'ai' && !isGrouped && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#111111] border border-[#B08D57]/30 flex items-center justify-center text-[#B08D57]">
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {msg.sender === 'ai' && isGrouped && <div className="w-8" />}

                          {/* Bubble Box */}
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                              msg.sender === 'customer'
                                ? 'bg-[#111111] text-white rounded-br-sm'
                                : 'bg-white text-[#111111] border border-[#B08D57]/10 rounded-bl-sm'
                            }`}
                          >
                            <div className="whitespace-pre-line font-sans tracking-wide">{msg.text}</div>
                            <div className={`text-[9px] mt-1.5 flex items-center justify-between font-medium opacity-50 ${
                              msg.sender === 'customer' ? 'text-white' : 'text-[#666666]'
                            }`}>
                              <span>{formatTime(msg.timestamp)}</span>
                              {msg.sender === 'ai' && (
                                <div className="flex items-center gap-1.5 ml-2 select-none">
                                  <button
                                    type="button"
                                    onClick={() => handleFeedback(msg.id, 'helpful')}
                                    className={`hover:scale-110 active:scale-95 transition-all cursor-pointer p-0.5 rounded ${
                                      msg.feedback === 'helpful' ? 'brightness-125 saturate-150 scale-110' : 'grayscale opacity-75'
                                    }`}
                                    title="Helpful"
                                  >
                                    👍
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleFeedback(msg.id, 'not_helpful')}
                                    className={`hover:scale-110 active:scale-95 transition-all cursor-pointer p-0.5 rounded ${
                                      msg.feedback === 'not_helpful' ? 'brightness-125 saturate-150 scale-110' : 'grayscale opacity-75'
                                    }`}
                                    title="Not Helpful"
                                  >
                                    👎
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {msg.sender === 'customer' && !isGrouped && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#B08D57]/20 border border-[#B08D57]/40 flex items-center justify-center text-[#B08D57]">
                              <User className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {msg.sender === 'customer' && isGrouped && <div className="w-8" />}
                        </div>

                        {/* Interactive Cards Deck */}
                        {hasProducts && displayedProducts.length > 0 && (
                          <div className="pl-11 pr-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {displayedProducts.map(product => {
                                const isSaved = savedProductIds.includes(product.id)
                                const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(
                                  `Hello Hokhiyoti Biponi, I would like to buy ${product.name} (Price: ₹${product.price})!`
                                )}`

                                return (
                                  <div
                                    key={product.id}
                                    className="bg-white border border-[#B08D57]/15 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between text-left group hover:shadow-md hover:border-[#B08D57]/40 transition-all duration-300"
                                  >
                                    <div className="aspect-[4/3] w-full bg-[#FAF9F6] relative overflow-hidden">
                                      {product.image ? (
                                        <img
                                          src={product.image}
                                          alt={product.name}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#DFD3C3]/10 text-[#B08D57]/40">
                                          <ShoppingBag className="w-8 h-8" />
                                        </div>
                                      )}
                                      <div className="absolute top-2 right-2 bg-[#111111]/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-semibold text-white">
                                        ₹{product.price.toLocaleString()}
                                      </div>
                                    </div>

                                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                                      <div>
                                        <h4 className="text-xs font-semibold text-[#111111] line-clamp-1 group-hover:text-[#B08D57] mb-1">
                                          {product.name}
                                        </h4>
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-1">
                                            <Star className="w-3.5 h-3.5 fill-[#B08D57] text-[#B08D57]" />
                                            <span className="text-[10px] font-bold text-[#111111]">
                                              {product.rating > 0 ? product.rating.toFixed(1) : 'New'}
                                            </span>
                                          </div>
                                          
                                          {/* Save Product (wishlist) button */}
                                          <button
                                            type="button"
                                            onClick={() => toggleSaveProduct(product.id)}
                                            className={`p-1 rounded hover:bg-[#B08D57]/10 transition-colors flex items-center gap-1 cursor-pointer`}
                                            title={isSaved ? t.savedText : t.saveText}
                                          >
                                            <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-[#666666]/60'}`} />
                                            <span className="text-[9px] font-medium text-[#666666]/70">
                                              {isSaved ? t.savedText : t.saveText}
                                            </span>
                                          </button>
                                        </div>
                                        
                                        {product.highlights && product.highlights.length > 0 && (
                                          <ul className="space-y-0.5 mb-3">
                                            {product.highlights.slice(0, 2).map((h, i) => (
                                              <li key={i} className="text-[9px] text-[#666666] flex items-center gap-1">
                                                <span className="w-1 h-1 bg-[#B08D57] rounded-full flex-shrink-0" />
                                                <span className="line-clamp-1">{h}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#B08D57]/10">
                                        <a
                                          href={`#/product/${product.id}`}
                                          className="flex items-center justify-center gap-1 py-1.5 text-[9px] font-medium text-[#111111] bg-[#FAF9F6] border border-[#B08D57]/20 rounded-lg hover:bg-[#111111] hover:text-white hover:border-[#111111] transition-all text-center"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          {t.viewText}
                                        </a>
                                        <a
                                          href={whatsappUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center justify-center gap-1 py-1.5 text-[9px] font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all text-center shadow-sm"
                                        >
                                          <MessageSquare className="w-3 h-3" />
                                          {t.buyText}
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Show More Products Panel */}
                            {remainingCount > 0 && (
                              <div className="bg-white border border-[#B08D57]/15 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                                <span className="text-[10px] text-[#666666] font-medium">
                                  {t.foundMore(remainingCount)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleShowMoreProducts(msg.id)}
                                  className="px-3 py-1.5 text-[9px] font-semibold text-white bg-[#111111] border border-[#111111] rounded-lg hover:bg-[#B08D57] hover:border-[#B08D57] hover:text-black transition-all cursor-pointer shadow-sm"
                                >
                                  {t.showMore}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {isTyping && (
                    <div className="flex gap-3 text-left justify-start mt-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#111111] border border-[#B08D57]/30 flex items-center justify-center text-[#B08D57]">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="bg-white border border-[#B08D57]/10 rounded-2xl px-4 py-3.5 flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 bg-[#B08D57] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-[#B08D57] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-[#B08D57] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Suggestion Chips Area with dynamic translation */}
                <div className="px-5 py-3 border-t border-[#B08D57]/10 bg-white">
                  <div className="flex flex-wrap gap-2 max-h-[110px] overflow-y-auto custom-scrollbar select-none justify-center">
                    {CHIP_TRANSLATIONS.map(trans => {
                      const label = preferredLanguage === 'Assamese' ? trans.as : trans.en
                      return (
                        <button
                          key={trans.en}
                          onClick={() => handleSendMessage(trans.en, label)}
                          className="px-3 py-1.5 text-[11px] font-sans font-medium text-[#111111] bg-[#FAF9F6] border border-[#B08D57]/20 rounded-full hover:bg-[#111111] hover:text-white hover:border-[#111111] transition-all cursor-pointer shadow-sm"
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Bottom Control Bar */}
                <div className="border-t border-[#B08D57]/15 bg-white p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between border-b border-[#B08D57]/10 pb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleClear}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title={t.btnClearTitle}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t.btnClear}
                      </button>
                      <button
                        type="button"
                        onClick={handleRestart}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-amber-700 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                        title={t.btnRestartTitle}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {t.btnRestart}
                      </button>
                    </div>

                    {/* Language Switch */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-[#666666]/60">Lang:</span>
                      <select
                        value={preferredLanguage}
                        onChange={e => setPreferredLanguage(e.target.value as 'English' | 'Assamese')}
                        className="bg-[#FAF9F6] border border-[#B08D57]/20 rounded px-1 py-0.5 text-[9px] text-[#111111] focus:outline-none font-medium cursor-pointer"
                      >
                        <option value="English">English</option>
                        <option value="Assamese">অসমীয়া (Assamese)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownload}
                      className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-[#B08D57] hover:bg-[#B08D57]/10 rounded-md transition-colors cursor-pointer"
                      title={t.btnDownloadTitle}
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t.btnDownload}
                    </button>
                  </div>

                  <form
                    onSubmit={e => {
                      e.preventDefault()
                      handleSendMessage(inputValue)
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      placeholder={t.inputPlaceholder}
                      className="flex-1 bg-[#FAF9F6] border border-[#B08D57]/20 rounded-xl px-4 py-2.5 text-xs text-[#111111] placeholder-[#666666]/60 focus:outline-none focus:border-[#B08D57] focus:ring-1 focus:ring-[#B08D57] transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim()}
                      className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#111111] hover:bg-[#B08D57] text-white hover:text-black transition-all cursor-pointer disabled:opacity-40 disabled:hover:bg-[#111111] disabled:hover:text-white"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="flex items-center justify-between text-[9px] text-[#666666]/60 px-1 font-mono">
                    <span>{t.enterSend}</span>
                    <span>{t.escClose}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
