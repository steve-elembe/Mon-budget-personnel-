import {
  Transaction,
  Category,
  Budget,
  SavingsGoal,
  SavingsMovement,
  ChatMessage,
  FinancialCalculatedContext
} from '../types';
import {
  calculateFinancialContext,
  generateLocalCalculatedAnswer
} from '../utils/financialAnalysisUtils';

export class AiAssistantService {
  /**
   * Envoie une question à l'assistant financier Gemini via le proxy serveur sécurisé.
   * L'analyse n'est effectuée qu'à la demande explicite de l'utilisateur.
   * Les données envoyées sont strictement limitées aux métriques financières calculées localement.
   */
  public static async askAssistant(
    query: string,
    data: {
      transactions: Transaction[];
      categories: Category[];
      budgets: Budget[];
      savingsGoals: SavingsGoal[];
      savingsMovements: SavingsMovement[];
      currency: string;
    },
    conversationHistory: ChatMessage[]
  ): Promise<{ text: string; isOfflineFallback: boolean; context: FinancialCalculatedContext }> {
    // 1. Calcul rigoureux et local des données réelles
    const context = calculateFinancialContext(
      data.transactions,
      data.categories,
      data.budgets,
      data.savingsGoals,
      data.savingsMovements,
      data.currency
    );

    // 2. Détection du mode hors-ligne
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) {
      const localAnswer = generateLocalCalculatedAnswer(query, context);
      return {
        text: `${localAnswer}\n\n*(Réponse calculée localement en mode hors-ligne)*`,
        isOfflineFallback: true,
        context
      };
    }

    // 3. Appel du serveur proxy backend /api/financial-assistant
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const historyPayload = conversationHistory.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.content
      }));

      const res = await fetch('/api/financial-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          financialContext: context,
          conversationHistory: historyPayload
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        console.warn('Erreur serveur Gemini, utilisation de la réponse calculée locale:', errorData);

        const localAnswer = generateLocalCalculatedAnswer(query, context);
        return {
          text: `${localAnswer}\n\n*(Analyse calculée localement)*`,
          isOfflineFallback: true,
          context
        };
      }

      const responseJson = await res.json();
      return {
        text: responseJson.reply || generateLocalCalculatedAnswer(query, context),
        isOfflineFallback: false,
        context
      };
    } catch (err: any) {
      console.warn('Échec requête API Gemini, bascule sur calcul local:', err);
      const localAnswer = generateLocalCalculatedAnswer(query, context);
      return {
        text: `${localAnswer}\n\n*(Données calculées localement d'après vos chiffres réels)*`,
        isOfflineFallback: true,
        context
      };
    }
  }
}
