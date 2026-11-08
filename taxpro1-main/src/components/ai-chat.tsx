"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
}

const SAMPLE_RESPONSES = [
  {
    keywords: ["webinar", "course", "class", "self-study"],
    response:
      "You can browse all our self-study courses on the Courses page (/courses). Learn at your own pace, with optional e-Transcripts and slides.",
  },
  {
    keywords: ["price", "cost", "pricing"],
    response:
      "We offer flexible pricing:\n• Self-Study Course: priced per course (see /courses)\n• Annual Unlimited: $199/year (includes 5000+ hours of CPE)\n• Team & Enterprise: Custom pricing\n\nVisit our home page (/) to see all plans.",
  },
  {
    keywords: ["register", "account", "signup"],
    response:
      "You can create an account by clicking the Register button at the top of the page. Registration unlocks access to our full course library. Go to /register",
  },
  {
    keywords: ["tax", "taxation", "banking"],
    response:
      "We have extensive offerings in Banking & Taxation. Check our Courses page (/courses) for courses on tax planning, IRA strategies, and more.",
  },
  {
    keywords: ["housing", "construction"],
    response:
      "Our Housing & Taxation track covers courses relevant to construction and real estate tax professionals. Browse all courses (/courses) to find courses in this category.",
  },
  {
    keywords: ["contact", "support", "help"],
    response:
      "You can reach us at support@taxpropath.com or visit our Contact Us page (/contact). We're here to help!",
  },
  {
    keywords: ["about", "company", "mission"],
    response:
      "Learn more about Taxpropath on our About Us page (/about-us). We've been providing high-quality CPE courses for almost a decade.",
  },
  {
    keywords: ["cpe", "credit", "certificate"],
    response:
      "Our self-study courses carry CPE/CE credits. You'll receive your certificate through your portal after completing each course. Our Annual Unlimited plan includes automated CPE credit tracking.",
  },
];

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    for (const sample of SAMPLE_RESPONSES) {
      if (sample.keywords.some((kw) => lowerMessage.includes(kw))) {
        return sample.response;
      }
    }

    return `I can help you navigate Taxpropath! Here are some things you can ask me about:\n• Browse self-study courses\n• Learn about pricing and plans\n• Create an account\n• Find courses in specific industries (Tax, Housing & Taxation, Leadership)\n• Get information about CPE credits\n• Contact us\n\nFeel free to ask me anything about navigating the platform!`;
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input,
    };

    const currentInput = input;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate a slight delay for more natural conversation
    setTimeout(() => {
      const assistantResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: generateResponse(currentInput),
      };
      setMessages((prev) => [...prev, assistantResponse]);
      setIsLoading(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Always render a placeholder to avoid hydration mismatch
  const content = isOpen ? (
    <div className="flex flex-col h-[500px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-brand-gradient px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <MessageCircle className="size-5" />
          <div>
            <h3 className="font-bold text-sm">Taxpropath Assistant</h3>
            <p className="text-xs text-white/80">Always here to help</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            setMessages([]);
            setInput("");
          }}
          className="rounded-full p-1 hover:bg-white/20 transition-colors"
          aria-label="Close chat"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <MessageCircle className="mx-auto size-12 text-brand-300 mb-2" />
              <p className="text-sm font-medium text-navy-950">Hi! I&rsquo;m your Taxpropath Assistant</p>
              <p className="text-xs text-slate-500 mt-1">Ask me anything about our self-study courses</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs rounded-lg px-4 py-2 text-sm ${
                msg.type === "user" ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-navy-950"
              }`}
            >
              <p className="whitespace-pre-line">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="size-2 rounded-full bg-slate-400 animate-bounce" />
                <div className="size-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0.15s" }} />
                <div className="size-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor. Empty, so it renders identically on server and client. */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-brand-600 p-2 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  ) : (
    <button
      onClick={() => setIsOpen(true)}
      className="flex items-center justify-center size-14 rounded-full bg-brand-gradient text-white shadow-lg hover:shadow-xl hover:scale-110 transition-transform duration-200"
      aria-label="Open chat"
    >
      <MessageCircle className="size-6" />
    </button>
  );

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isOpen ? "w-96" : "w-auto"}`}>
      {content}
    </div>
  );
}
