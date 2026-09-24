import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  TrendingUp,
  PieChart,
  PiggyBank,
  Wallet,
  ShieldCheck,
  Bot,
  User,
  RefreshCw,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  Transaction,
  Category,
  Budget,
  SavingsGoal,
  SavingsMovement,
  ChatMessage,
  FinancialCalculatedContext
} from '../types';
import { AiAssistantService } from '../services/aiAssistantService';
import { calculateFinancialContext } from '../utils/financialAnalysisUtils';

interface AssistantScreenProps {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  savingsMovements: SavingsMovement[];
  currency: string;
}

const STORAGE_CHAT_KEY = 'mon_budget_assistant_messages';

const SUGGESTED_QUERIES = [
  {
    icon: <PieChart className="h-4 w-4 text-emerald-600" />,
    text: 'Analyse mes dépenses du mois'
  },
  {
    icon: <TrendingUp className="h-4 w-4 text-blue-600" />,
    text: 'Où ai-je le plus dépensé ce mois-ci ?'
  },
  {
    icon: <Wallet className="h-4 w-4 text-amber-600" />,
    text: 'Combien me reste-t-il sur mon budget ?'
  },
  {
    icon: <PiggyBank className="h-4 w-4 text-purple-600" />,
    text: 'Combien ai-je économisé ?'
  }
];

export const AssistantScreen: React.FC<AssistantScreenProps> = ({
  transactions,
  categories,
  budgets,
  savingsGoals,
  savingsMovements,
  currency
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Bonjour ! Je suis votre **Assistant Financier Personnel** pour « Mon Budget ».\n\nJe suis à votre disposition pour analyser vos chiffres réels, vous expliquer la répartition de vos dépenses, faire le point sur vos budgets et vos cagnottes d'épargne, et vous donner des conseils personnalisés.\n\n*Cliquez sur une suggestion ci-dessous ou posez-moi directement votre question.*`,
        timestamp: Date.now()
      }
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextSnapshot, setContextSnapshot] = useState<FinancialCalculatedContext | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll en bas de discussion
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Sauvegarde locale de l'historique du chat
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Calcul du contexte réel actuel
  const currentContext = calculateFinancialContext(
    transactions,
    categories,
    budgets,
    savingsGoals,
    savingsMovements,
    currency
  );

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    setInputQuery('');

    const userMessage: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const result = await AiAssistantService.askAssistant(
        textToSend,
        {
          transactions,
          categories,
          budgets,
          savingsGoals,
          savingsMovements,
          currency
        },
        [...messages, userMessage]
      );

      setContextSnapshot(result.context);

      const assistantMessage: ChatMessage = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        content: result.text,
        timestamp: Date.now(),
        isOfflineFallback: result.isOfflineFallback
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: 'err_' + Date.now(),
        role: 'assistant',
        content: `Désolé, une erreur s'est produite lors de l'analyse : ${err?.message || 'Erreur inattendue'}.`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const initialWelcome: ChatMessage = {
      id: 'welcome_' + Date.now(),
      role: 'assistant',
      content: `Conversation réinitialisée. Comment puis-je vous aider dans la gestion de votre budget aujourd'hui ?`,
      timestamp: Date.now()
    };
    setMessages([initialWelcome]);
    localStorage.removeItem(STORAGE_CHAT_KEY);
  };

  // Rendu Markdown simplifié pour le texte généré
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Puces
      if (line.startsWith('• ') || line.startsWith('- ')) {
        const content = line.substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-xs leading-relaxed my-0.5">
            {formatBold(content)}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs leading-relaxed my-0.5">
          {formatBold(line)}
        </p>
      );
    });
  };

  const formatBold = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-zinc-900 dark:text-zinc-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto p-3 sm:p-4">
      {/* Top Banner: Confidentialité & Données Réelles */}
      <div className="mb-3 rounded-2xl bg-emerald-50/70 p-3 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/60 shadow-xs">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                Assistant Financier Gemini
                <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[9px] font-bold text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-300">
                  Données réelles
                </span>
              </h2>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-snug">
                Analyse uniquement à votre demande. Tous les calculs sont réalisés par l'application locale sans inventer de montants.
              </p>
            </div>
          </div>
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
            title="Effacer la conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Effacer</span>
          </button>
        </div>

        {/* Mini stats réelles en temps réel */}
        <div className="mt-2.5 grid grid-cols-3 gap-2 pt-2 border-t border-emerald-100/80 dark:border-emerald-900/40 text-center">
          <div className="rounded-lg bg-white/80 dark:bg-zinc-900/60 p-1.5 border border-emerald-100/60 dark:border-emerald-950">
            <span className="block text-[10px] text-zinc-500 dark:text-zinc-400">Dépenses {currentContext.currentMonth}</span>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {currentContext.totalExpenseMonth.toLocaleString()} {currency}
            </span>
          </div>
          <div className="rounded-lg bg-white/80 dark:bg-zinc-900/60 p-1.5 border border-emerald-100/60 dark:border-emerald-950">
            <span className="block text-[10px] text-zinc-500 dark:text-zinc-400">Budget restant</span>
            <span className={`text-xs font-bold ${currentContext.budgetStatus.isExceeded ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {currentContext.budgetStatus.remainingBudget.toLocaleString()} {currency}
            </span>
          </div>
          <div className="rounded-lg bg-white/80 dark:bg-zinc-900/60 p-1.5 border border-emerald-100/60 dark:border-emerald-950">
            <span className="block text-[10px] text-zinc-500 dark:text-zinc-400">Épargne totale</span>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
              {currentContext.savingsStatus.totalSaved.toLocaleString()} {currency}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
        {messages.map(message => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-xs'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-xs'
                }`}
              >
                <div className="text-xs">{renderFormattedText(message.content)}</div>
                <div
                  className={`mt-1.5 flex items-center justify-between gap-2 text-[9px] ${
                    isUser ? 'text-emerald-100' : 'text-zinc-400'
                  }`}
                >
                  <span>
                    {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {message.isOfflineFallback && (
                    <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1 py-0.2 font-medium text-zinc-500 dark:text-zinc-400">
                      Calcul local
                    </span>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 shadow-2xs">
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                <span>Analyse de vos données financières en cours...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="py-2">
        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
          Questions rapides suggérées
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_QUERIES.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sq.text)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition shadow-2xs active:scale-95 disabled:opacity-50"
            >
              {sq.icon}
              <span>{sq.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="relative flex items-center gap-2 pt-1"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={e => setInputQuery(e.target.value)}
          placeholder="Posez une question sur vos finances..."
          disabled={isLoading}
          className="flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder-zinc-400 shadow-sm transition focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md transition hover:bg-emerald-700 active:scale-95 disabled:opacity-40"
          title="Envoyer la question"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
};
