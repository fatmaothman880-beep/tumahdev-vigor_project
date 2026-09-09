import React, { useState } from 'react';
import { Modal } from './ui/KpiCard';
import { useAppData } from '../hooks/useAppData';
import { formatCurrency, formatHoursAndMinutes, formatTime } from '../lib/format';
import { Bot, Send, Sparkles, Ship, Anchor, CreditCard, ArrowRight } from 'lucide-react';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPayments: () => void;
  onNavigateToBerths: () => void;
  onSelectVessel: (vesselId: string) => void;
}

interface Message {
  sender: 'USER' | 'ASSISTANT';
  text: string;
  actions?: { label: string; onClick: () => void }[];
}

export function AiAssistantModal({
  isOpen,
  onClose,
  onNavigateToPayments,
  onNavigateToBerths,
  onSelectVessel,
}: AiAssistantModalProps) {
  const { vessels, voyages, paymentAccounts, paymentTransactions, alerts } = useAppData();

  const v1 = voyages.find((v) => v.vesselId === 'v-01');
  const v3 = voyages.find((v) => v.vesselId === 'v-03');

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ASSISTANT',
      text: "Hello! I am your VIGOR Smart Port Operations Assistant. I monitor real-time vessel movements, Berth B01 pneumatic discharge rates, bunkering windows, and mainland payment eligibility gates. How can I assist your shift?",
    },
  ]);

  const quickPrompts = [
    'Why is MV VIGOR 03 delayed at Berth B01?',
    'What happens if we wire the Tanga Cement balance now?',
    'How can we eliminate the 2.7h anchorage idle time?',
    'Summarize current fleet cycle status for management.',
  ];

  const handleSend = (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    const userMsg: Message = { sender: 'USER', text: q };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');

    // Generate smart context-aware operational response
    setTimeout(() => {
      let reply = '';
      let actions: { label: string; onClick: () => void }[] | undefined = undefined;

      const lower = q.toLowerCase();

      if (lower.includes('vigor 03') || lower.includes('berth conflict') || lower.includes('delayed')) {
        reply = `**Berth B01 Conflict Analysis for MV VIGOR 03:**\n\n• MV VIGOR 03 is forecast to arrive at Zanzibar waters at **${formatTime(v3?.returnEtaForecast)}**.\n• However, Berth B01 is currently occupied by MV VIGOR 01, which will not clear until **${formatTime(v1?.expectedBerthRelease)}** (factoring in the 1.5-hour pneumatic line purge).\n• Result: MV VIGOR 03 faces an anticipated **${formatHoursAndMinutes(v3?.predictedAnchorageWaitHours || 2.7)}** wait at anchorage Charlie.\n\n**Recommended Action:** Option A (Eco-Steaming) — instruct MV VIGOR 03 to reduce speed from 11.2 to 8.5 knots to save 1.8T bunker fuel and arrive synchronously.`;
        actions = [
          { label: 'Open Berth B01 Console', onClick: () => { onClose(); onNavigateToBerths(); } },
          { label: 'Inspect MV VIGOR 03', onClick: () => { onClose(); onSelectVessel('v-03'); } },
        ];
      } else if (lower.includes('tanga') || lower.includes('payment') || lower.includes('wire')) {
        reply = `**Tanga Cement Payment Gate Status:**\n\n• Invoice total: TZS 500,000,000.\n• Currently cleared: TZS 300,000,000 (60%).\n• **Remaining balance due: TZS 200,000,000** before tomorrow 17:00 EAT.\n• Because payment is under the 100% threshold, Tanga Cement has **withheld confirmed slot scheduling** for MV VIGOR 01. Once the wire transaction is cleared, the system will instantly flag eligibility as confirmed.`;
        actions = [
          { label: 'Record Wire Payment', onClick: () => { onClose(); onNavigateToPayments(); } },
        ];
      } else if (lower.includes('eliminate') || lower.includes('solve') || lower.includes('speed')) {
        reply = `**Two primary operational solutions exist:**\n\n1. **Eco-Steaming**: Reduce MV VIGOR 03 speed from 11.2 kts to 8.5 kts. Arrival pushes to ${formatTime(v1?.expectedBerthRelease)}, saving ~$1,200 in fuel.\n2. **Unloading Booster**: Increase MV VIGOR 01 compressor pressure on Silo Line 2 from 605 t/h to 660 t/h to advance berth clearance by 35 minutes.`;
        actions = [
          { label: 'View Scenario Controls in Admin', onClick: () => { onClose(); } },
        ];
      } else {
        reply = `**Fleet Operations Summary:**\n• **MV VIGOR 01**: Discharging at B01 (72% unloaded, rate 605 t/h). Release forecast: **${formatTime(v1?.expectedBerthRelease)}**.\n• **MV VIGOR 02**: Northbound in Pemba Channel at 10.8 kts. ETA Tanga tomorrow morning. 100% paid.\n• **MV VIGOR 03**: Southbound returning to Zanzibar laden with 9,400T cement. Berth conflict detected (+${formatHoursAndMinutes(v3?.predictedAnchorageWaitHours || 2.7)} anchorage wait).`;
        actions = [
          { label: 'Open Control Tower', onClick: () => { onClose(); } },
        ];
      }

      setMessages((prev) => [...prev, { sender: 'ASSISTANT', text: reply, actions }]);
    }, 500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="VIGOR Port Operations Assistant"
      subtitle="AI-driven decision intelligence for Zanzibar cement fleet coordination."
    >
      <div className="space-y-4 text-xs">
        {/* Chat History */}
        <div className="h-[340px] overflow-y-auto space-y-3 p-3 bg-[#F7F5F0] rounded-xl border border-[#E1DED4]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                m.sender === 'USER' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-xl leading-relaxed whitespace-pre-line ${
                  m.sender === 'USER'
                    ? 'bg-[#14181A] text-white rounded-br-none'
                    : 'bg-white border border-[#E1DED4] text-[#14181A] rounded-bl-none shadow-2xs'
                }`}
              >
                {m.text}

                {m.actions && m.actions.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#E1DED4] flex flex-wrap gap-2">
                    {m.actions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={act.onClick}
                        className="px-2 py-1 text-[10px] font-semibold rounded bg-[#0C9349] hover:bg-[#0A7A3D] text-white flex items-center gap-1 transition shadow-xs"
                      >
                        {act.label} <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Prompts */}
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="text-[10px] px-2 py-1 rounded-full bg-white border border-[#C9C4B6] hover:border-[#0C9349] hover:text-[#0C9349] text-[#3F4A47] font-medium transition"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#E1DED4]">
          <input
            type="text"
            placeholder="Ask about berth clearance, speed adjustments, payments..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg focus:outline-none focus:border-[#0C9349] text-xs font-medium"
          />
          <button
            onClick={() => handleSend()}
            className="p-2 rounded-lg bg-[#0C9349] hover:bg-[#0A7A3D] text-white transition shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
