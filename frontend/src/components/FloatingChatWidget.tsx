import { Loader2, MessageCircle, SendHorizontal, X } from "lucide-react"
import { useState } from "react"
import type { FormEvent } from "react"
import { api } from "../lib/api"

type ChatMessage = {
  id: number
  role: "user" | "assistant"
  text: string
}

const starterPrompts = [
  "Outstanding amount for customer ABC Logistics",
  "Lorry hire amount for challan number CH-001",
  "Booking amount for consignment number CN-10025",
  "Payment details for invoice INV-1045",
]

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "Read-only finance assistant is ready. Ask customer outstanding, booking, lorry hire, or invoice payment details.",
    },
  ])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const query = input.trim()
    if (!query || isLoading) return

    const userMessage: ChatMessage = { id: Date.now(), role: "user", text: query }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await api.chatAsk(query)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: response.answer,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "Unable to fetch chat response right now. Please verify chat service is running.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function applyPrompt(prompt: string) {
    setInput(prompt)
    setIsOpen(true)
  }

  return (
    <div className="floating-chat-root">
      {isOpen ? (
        <section className="floating-chat-panel" aria-label="Sangu chat">
          <header className="floating-chat-header">
            <div>
              <strong>Sangu Chat</strong>
              <p>Read-only database assistant</p>
            </div>
            <button
              type="button"
              className="floating-chat-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </header>

          <div className="floating-chat-prompts">
            {starterPrompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => applyPrompt(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <div className="floating-chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "floating-chat-message user"
                    : "floating-chat-message assistant"
                }
              >
                {message.text}
              </div>
            ))}
          </div>

          <form className="floating-chat-form" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask finance question..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 size={15} className="spin" /> : <SendHorizontal size={15} />}
              Send
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="floating-chat-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open Sangu chat"
      >
        <MessageCircle size={22} />
      </button>
    </div>
  )
}
