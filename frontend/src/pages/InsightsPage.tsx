import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Brain, MessageCircle, Sparkles, AlertTriangle, TrendingUp, Send, Loader2, Target, Lightbulb } from 'lucide-react';
import { analyticsAPI, type AiInsightsChatResponse, type AiInsightsHighlight } from '../lib/services';
import { mockInsights } from '../data/mockAnalytics';
import './InsightsPage.css';

type ChatAuthor = 'assistant' | 'user';

interface ChatMessage {
  id: string;
  author: ChatAuthor;
  content: string;
  timestamp: string;
}

const quickPrompts = [
  'Resume el estado general',
  '¿Qué datasets debo revisar primero?',
  'Genera acciones recomendadas',
  '¿Detectaste anomalías recientes?'
];

const actionTiles = [
  {
    icon: Sparkles,
    title: 'Resumen ejecutivo',
    description: 'Compila un informe listo para comité con datos clave y próximos pasos.'
  },
  {
    icon: TrendingUp,
    title: 'Acciones comerciales',
    description: 'Identifica campañas, bundles o descuentos basados en patrones de compra.'
  },
  {
    icon: AlertTriangle,
    title: 'Detección de anomalías',
    description: 'Monitorea variaciones inusuales en ventas, inventario o encuestas.'
  }
];

const capabilityTiles = [
  {
    icon: Brain,
    title: 'Insights automáticos',
    description: 'La IA interpreta tus datasets y resalta hallazgos relevantes.'
  },
  {
    icon: Target,
    title: 'Seguimiento de KPIs',
    description: 'Visualiza métricas críticas con alertas proactivas cuando algo cambia.'
  },
  {
    icon: Lightbulb,
    title: 'Recomendaciones accionables',
    description: 'Convierte tendencias y anomalías en iniciativas priorizadas.'
  }
];

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

export function InsightsPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<AiInsightsHighlight[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>(quickPrompts);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const response = await analyticsAPI.askAssistant({ message: 'Dame un resumen general del estado actual.' });
        if (!active) {
          return;
        }

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          author: 'assistant',
          content: response.reply,
          timestamp: new Date().toISOString()
        };

        setMessages([assistantMessage]);
        setHighlights(response.highlights);
        setSuggestions(response.suggestions.length ? response.suggestions : quickPrompts);
        setError(null);
      } catch (err) {
        if (!active) {
          return;
        }
        setError('No se pudo inicializar el asistente. Intenta más tarde.');
      } finally {
        if (active) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isBootstrapping]);

  const handleSendPrompt = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      author: 'user',
      content: trimmed,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);
    setError(null);

    try {
      const response: AiInsightsChatResponse = await analyticsAPI.askAssistant({ message: trimmed });
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        author: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setHighlights(response.highlights);
      setSuggestions(response.suggestions.length ? response.suggestions : quickPrompts);
    } catch (err) {
      setError('No se pudo generar una respuesta en este momento.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSendPrompt(input);
  };

  const handleSuggestionClick = (prompt: string) => {
    void handleSendPrompt(prompt);
  };

  const currentHighlights = useMemo(() => highlights, [highlights]);

  return (
    <div className="insights-page">
      <section className="insights-hero">
        <div className="insights-hero__icon">
          <Brain size={28} />
        </div>
        <div className="insights-hero__content">
          <span className="insights-hero__eyebrow">DataPulse AI Studio</span>
          <h1 className="insights-hero__title">Analítica inteligente asistida por IA</h1>
          <p className="insights-hero__subtitle">
            Orquesta análisis avanzados, detecta patrones relevantes y transforma tus datasets en decisiones listas para ejecutar.
          </p>
          <div className="insights-hero__actions">
            <button type="button" className="insights-hero__cta" onClick={() => void handleSendPrompt('Genera un resumen ejecutivo con próximos pasos')} disabled={isSending}>
              <Sparkles size={16} />
              Explorar con IA
            </button>
            <button type="button" className="insights-hero__cta insights-hero__cta--ghost" onClick={() => void handleSendPrompt('Ayúdame a crear un prompt personalizado')} disabled={isSending}>
              <MessageCircle size={16} />
              Prompt personalizado
            </button>
          </div>
        </div>
      </section>

      <section className="insights-actions">
        {actionTiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <article key={tile.title} className="insights-actions__card">
              <div className="insights-actions__icon">
                <Icon size={20} />
              </div>
              <h3 className="insights-actions__title">{tile.title}</h3>
              <p className="insights-actions__description">{tile.description}</p>
              <button type="button" className="insights-actions__button" onClick={() => void handleSendPrompt(tile.title)} disabled={isSending}>
                Activar ahora
              </button>
            </article>
          );
        })}
      </section>

      <section className="insights-grid">
        <header className="insights-grid__header">
          <div className="insights-grid__header-icon">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="insights-grid__title">Insights recientes</h2>
            <p className="insights-grid__subtitle">Generados automáticamente en base a tus datasets más activos.</p>
          </div>
        </header>
        <div className="insights-grid__cards">
          {mockInsights.map((insight) => (
            <article key={insight.id} className="insights-grid__card">
              <span className={`insights-grid__badge insights-grid__badge--${insight.impact}`}>
                Impacto {insight.impact}
              </span>
              <h3 className="insights-grid__card-title">{insight.title}</h3>
              <p className="insights-grid__card-description">{insight.description}</p>
              <button type="button" className="insights-grid__card-button" onClick={() => void handleSendPrompt(`Profundiza en: ${insight.title}`)} disabled={isSending}>
                Ver recomendaciones
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="insights-capabilities">
        {capabilityTiles.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="insights-capabilities__card">
              <div className="insights-capabilities__icon">
                <Icon size={18} />
              </div>
              <h3 className="insights-capabilities__title">{item.title}</h3>
              <p className="insights-capabilities__description">{item.description}</p>
            </article>
          );
        })}
      </section>

      <section className="insights-chat">
        <div className="insights-chat__panel">
          <header className="insights-chat__header">
            <div className="insights-chat__header-icon">
              <MessageCircle size={18} />
            </div>
            <div>
              <h2 className="insights-chat__title">Chat de insights</h2>
              <p className="insights-chat__subtitle">Haz preguntas en lenguaje natural y obtén respuestas contextualizadas con tus métricas.</p>
            </div>
          </header>

          <div className="insights-chat__messages" ref={listRef}>
            {isBootstrapping ? (
              <div className="insights-chat__message insights-chat__message--assistant insights-chat__message--skeleton">
                <div className="insights-chat__avatar">IA</div>
                <div className="insights-chat__bubble insights-chat__bubble--assistant">
                  <span className="insights-chat__loader" />
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`insights-chat__message insights-chat__message--${message.author}`}
                >
                  <div className="insights-chat__avatar">
                    {message.author === 'assistant' ? 'IA' : 'Tú'}
                  </div>
                  <div className={`insights-chat__bubble insights-chat__bubble--${message.author}`}>
                    <p>{message.content}</p>
                    <span className="insights-chat__timestamp">{formatTime(message.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {error ? <div className="insights-chat__error">{error}</div> : null}

          <form className="insights-chat__composer" onSubmit={handleSubmit}>
            <input
              className="insights-chat__input"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Pregunta algo como: '¿Dónde debo priorizar la inversión?'"
              disabled={isSending}
            />
            <button type="submit" className="insights-chat__send" disabled={isSending}>
              {isSending ? <Loader2 size={16} className="insights-chat__spinner" /> : <Send size={16} />}
            </button>
          </form>

          <div className="insights-chat__suggestions">
            {suggestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="insights-chat__suggestion"
                onClick={() => handleSuggestionClick(prompt)}
                disabled={isSending}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <aside className="insights-chat__sidebar">
          <h3 className="insights-chat__sidebar-title">Highlights recientes</h3>
          <ul className="insights-chat__highlight-list">
            {currentHighlights.length === 0 ? (
              <li className="insights-chat__highlight-item insights-chat__highlight-item--empty">
                Aún no hay métricas resaltadas. Envía una pregunta para comenzar.
              </li>
            ) : (
              currentHighlights.map((item) => (
                <li key={item.label} className="insights-chat__highlight-item">
                  <span className="insights-chat__highlight-label">{item.label}</span>
                  <span className="insights-chat__highlight-value">{item.value}</span>
                  <span className="insights-chat__highlight-helper">{item.helper}</span>
                </li>
              ))
            )}
          </ul>
        </aside>
      </section>
    </div>
  );
}
