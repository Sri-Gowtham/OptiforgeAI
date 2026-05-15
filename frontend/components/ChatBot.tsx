'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface Message { role: 'user' | 'ai'; content: string; }

const CHIPS = [
  'How do I create a design?',
  'What is the optimization score?',
  'Best material for a bracket?',
  'How does the optimizer work?',
];

export default function ChatBot() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hi! I am your OptiForge AI assistant. Ask me anything about design, materials, or optimization.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const hideOnPages = ['/login', '/register'];
  if (hideOnPages.includes(pathname) || !user) return null;

  const send = async (text?: string) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setMessages(p => [...p, { role: 'user', content: q }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history: messages.slice(-6), pageContext: pathname }),
      });
      const data = await res.json();
      setMessages(p => [...p, { role: 'ai', content: data.answer || 'Sorry, try again.' }]);
    } catch (e: any) {
      console.error('CHAT ERROR:', e);
      setMessages(p => [...p, { role: 'ai', content: 'Connection error. Please try again.' }]);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      {open && (
        <div style={{ width: '320px', height: '480px', background: '#13131f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', flexDirection: 'column', marginBottom: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))', borderRadius: '16px 16px 0 0' }}>
            <div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>AI Design Assistant</div>
              <div style={{ color: '#94a3b8', fontSize: '11px' }}>OptiForge AI</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '85%', padding: '8px 12px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: m.role === 'user' ? '#6366f1' : 'rgba(255,255,255,0.07)', color: 'white', fontSize: '13px', lineHeight: 1.5, border: m.role === 'ai' ? '1px solid rgba(255,255,255,0.1)' : 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: '4px', padding: '8px 12px', background: 'rgba(255,255,255,0.07)', borderRadius: '16px 16px 16px 4px', width: 'fit-content' }}>
                {[0,1,2].map(i => <div key={i} style={{ width: '8px', height: '8px', background: '#6366f1', borderRadius: '50%', animation: 'bounce 1s infinite', animationDelay: `${i*150}ms` }} />)}
              </div>
            )}
            {messages.length === 1 && !loading && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {CHIPS.map(c => (
                  <button key={c} onClick={() => send(c)} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer' }}>{c}</button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '8px' }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ask about design..." disabled={loading} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 12px', color: 'white', fontSize: '13px', outline: 'none' }} />
            <button onClick={() => send()} disabled={loading || !input.trim()} style={{ width: '36px', height: '36px', background: '#6366f1', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '16px' }}>↑</button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setOpen(!open)} style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '22px', boxShadow: '0 8px 24px rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {open ? '×' : '💬'}
        </button>
      </div>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}
