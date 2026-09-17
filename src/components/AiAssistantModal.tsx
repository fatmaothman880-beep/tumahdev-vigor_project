import { apiFetch } from '../api/client';
import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Send, ArrowRight, Bot, AlertTriangle, CheckCircle, Info, Sparkles } from 'lucide-react';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (pageId: string, vesselId?: string) => void;
  onNavigateToPayments?: () => void;
  onNavigateToBerths?: () => void;
  onSelectVessel?: (vesselId: string) => void;
}

interface AssistantMessage {
  sender: 'USER' | 'ASSISTANT';
  text: string;
  severity?: 'warning' | 'alert' | 'info' | 'normal';
  statusBadge?: string | null;
  relatedEntity?: string | null;
  relatedRoute?: string;
  routeLabel?: string;
  vesselId?: string;
  actions?: { label: string; onClick: () => void; primary?: boolean }[];
}

export function AiAssistantModal({
  isOpen,
  onClose,
  onNavigate,
  onNavigateToPayments,
  onNavigateToBerths,
  onSelectVessel,
}: AiAssistantModalProps) {
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      sender: 'ASSISTANT',
      text: "Hello. Ask me about your vessels, their recorded status, unloading forecasts, berths, delays, fuel or payments. I?ll use the system records and link you to the details.",
    },
  ]);

  // 4 suggested prompt chips (Requirement 10)
  const quickPrompts = [
    'How many vessels do we have?',
    'Where is MV VIGOR 01 at the moment?',
    'When will MV VIGOR 01 finish unloading?',
    'What is the current berth situation?',
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Centralized navigation handler
  const triggerNavigation = (routeId: string, vesselId?: string) => {
    onClose();
    if (onNavigate) {
      onNavigate(routeId, vesselId);
    } else if (vesselId && onSelectVessel) {
      onSelectVessel(vesselId);
    } else if (routeId === 'berths' && onNavigateToBerths) {
      onNavigateToBerths();
    } else if (routeId === 'payments' && onNavigateToPayments) {
      onNavigateToPayments();
    } else if (onSelectVessel && (routeId === 'vessel-detail' || routeId === 'vessels')) {
      if (vesselId) onSelectVessel(vesselId);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q || isThinking) return;

    const userMsg: AssistantMessage = { sender: 'USER', text: q };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsThinking(true);

    // Build conversation history for pronoun and contextual follow-ups
    const conversationHistory = messages.slice(-6).map((m) => ({
      role: m.sender === 'USER' ? 'user' : 'assistant',
      content: m.text,
    }));

    try {
      const data = await apiFetch<{
        answer: string; statusBadge?: string;
        actions: { label: string; page: string; vesselId?: string }[];
      }>('/ai/assistant', {
        method: 'POST',
        body: JSON.stringify({ prompt: q, conversationHistory }),
      });
      setMessages(prev => [...prev, {
        sender: 'ASSISTANT', text: data.answer, statusBadge: data.statusBadge,
        actions: (data.actions ?? []).map((action, index) => ({
          label: action.label, primary: index === 0,
          onClick: () => triggerNavigation(action.page, action.vesselId),
        })),
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        sender: 'ASSISTANT', severity: 'warning',
        text: error instanceof Error ? error.message : 'The assistant could not read the system records. Please retry.',
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="VIGOR Port Operations Assistant"
      subtitle="Answers from saved system records, with links to the details"
    >
      <div className="space-y-4 text-xs font-sans">
        {/* Chat History Canvas */}
        <div
          ref={chatScrollRef}
          className="h-[370px] overflow-y-auto space-y-3.5 p-4 bg-[#F8F7F4] rounded-xl border border-[#E8E5DC] scroll-smooth"
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                m.sender === 'USER' ? 'items-end' : 'items-start'
              }`}
            >
              {m.sender === 'ASSISTANT' && (
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#5A6764] mb-1 pl-1">
                  <Bot className="w-3.5 h-3.5 text-[#0C9349]" />
                  <span>VIGOR Operations Analyst</span>
                </div>
              )}

              <div
                className={`max-w-[88%] p-3.5 rounded-xl leading-relaxed text-xs ${
                  m.sender === 'USER'
                    ? 'bg-[#14181A] text-white rounded-br-2xs shadow-2xs font-medium'
                    : 'bg-white border border-[#E4E1D8] text-[#14181A] rounded-bl-2xs shadow-2xs'
                }`}
              >
                {/* Natural-Language Explanation Paragraphs */}
                <div className="text-[13px] leading-relaxed text-[#1D2523] whitespace-pre-line">
                  {m.text}
                </div>

                {/* Status Badge Pill (Requirement 16) */}
                {m.statusBadge && (
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                        m.severity === 'alert'
                          ? 'bg-[#FDF2F0] text-[#AE3B2E] border border-[#F2C2BB]'
                          : m.severity === 'warning'
                          ? 'bg-[#FEF7EC] text-[#B5760F] border border-[#F4DCBA]'
                          : 'bg-[#E7F4EB] text-[#0A7A3D] border border-[#BBE3C7]'
                      }`}
                    >
                      {m.severity === 'alert' ? (
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                      ) : m.severity === 'warning' ? (
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                      ) : (
                        <CheckCircle className="w-3 h-3 shrink-0" />
                      )}
                      {m.statusBadge}
                    </span>
                  </div>
                )}

                {/* Clickable Deep-Link Action Button(s) (Requirement 15 & 16) */}
                {m.actions && m.actions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#F0ECE1] flex flex-wrap items-center gap-2">
                    {m.actions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={act.onClick}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                          act.primary
                            ? 'bg-[#0C9349] hover:bg-[#0A7A3D] text-white'
                            : 'bg-[#F2EFE8] hover:bg-[#E8E4DA] text-[#242E2B] border border-[#DDD8CB]'
                        }`}
                      >
                        <span>{act.label}</span>
                        {act.primary && <ArrowRight className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking Indicator */}
          {isThinking && (
            <div className="flex items-center gap-2 text-xs text-[#5A6764] pl-2 pt-1">
              <Sparkles className="w-3.5 h-3.5 text-[#0C9349] animate-spin" />
              <span>Reading system records...</span>
            </div>
          )}
        </div>

        {/* Suggested Quick Prompt Chips (Requirement 10) */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#7C8884]">
            Suggested Inquiries
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                disabled={isThinking}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-white border border-[#DCD8CD] hover:border-[#0C9349] hover:text-[#0C9349] hover:bg-[#F9FCFA] text-[#333D3A] font-medium transition shadow-2xs cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#E8E5DC]">
          <input
            type="text"
            placeholder="Ask naturally (e.g., Why is VIGOR 03 waiting? How much fuel do we have?)"
            maxLength={2000}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-3.5 py-2.5 bg-white border border-[#DCD8CD] rounded-lg focus:outline-none focus:border-[#0C9349] focus:ring-1 focus:ring-[#0C9349] text-xs font-medium placeholder:text-[#9EA8A5] text-[#14181A] shadow-2xs"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isThinking}
            className="px-3.5 py-2.5 rounded-lg bg-[#0C9349] hover:bg-[#0A7A3D] disabled:opacity-40 disabled:cursor-not-allowed text-white transition shadow-2xs cursor-pointer flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
