import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '1mb' }));

  // Initialisation du SDK Google GenAI côté serveur (jamais exposé au client)
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  /**
   * Route API de l'assistant financier personnel
   * Reçoit uniquement les métriques calculées par l'application locale
   */
  app.post('/api/financial-assistant', async (req: Request, res: Response) => {
    try {
      const { query, financialContext, conversationHistory } = req.body;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'La question est requise.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
          error: 'Clé API Gemini non configurée sur le serveur.'
        });
      }

      const systemInstruction = `Tu es l'assistant financier personnel de l'application « Mon Budget » (spécialisée dans la gestion budgétaire personnelle et l'épargne en FCFA / XAF).

RÈGLES IMPÉRATIVES DE SÉCURITÉ ET DE VÉRACITÉ :
1. VÉRACITÉ ABSOLUE : Tu ne dois JAMAIS inventer de montants, transactions, dates ou dépenses qui ne sont pas explicitement présents dans les données calculées ci-dessous.
2. CALCULS RÉELS : Tous les chiffres ont déjà été calculés de manière déterministe par l'application locale à partir des données réelles de l'utilisateur. Ton rôle est d'expliquer, commenter et interpréter ces résultats exacts avec pédagogie.
3. CONSEILS FINANCIERS : Donne des recommandations concrètes et adaptées aux réalités financières :
   - Règle 50/30/20 (50% besoins essentiels, 30% envies/loisirs, 20% épargne).
   - Importance de se constituer un fonds d'urgence.
   - Vigilance sur les catégories qui dépassent les seuils d'alerte (70%, 90% ou 100%+).
4. TON & FORMAT : Sois courtois, clair, direct et encourageant. Utilise des listes à puces et mets les montants clés en gras avec la devise (ex: **150 000 FCFA**).
5. CONFIDENTIALITÉ : Ne demande jamais d'informations bancaires confidentielles (codes secrets, numéros de carte).

DONNÉES FINANCIÈRES RÉELLES ET CALCULÉES DE L'UTILISATEUR :
${JSON.stringify(financialContext, null, 2)}
`;

      const contents: any[] = [];

      // Inclure l'historique récent de la conversation
      if (Array.isArray(conversationHistory)) {
        for (const msg of conversationHistory.slice(-6)) {
          if (msg && (msg.role === 'user' || msg.role === 'model') && msg.text) {
            contents.push({
              role: msg.role,
              parts: [{ text: String(msg.text) }]
            });
          }
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: query }]
      });

      let reply = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.3
          }
        });
        reply = response.text || '';
      } catch (primaryError: any) {
        console.warn('Gemini 3.8 Flash temporairement indisponible, essai avec 3.1 Flash Lite:', primaryError?.message);
        // Fallback sur gemini-3.1-flash-lite si pic de charge sur 3.8
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents,
          config: {
            systemInstruction,
            temperature: 0.3
          }
        });
        reply = fallbackResponse.text || '';
      }

      if (!reply) {
        return res.status(500).json({ error: 'Aucune réponse générée par le modèle.' });
      }

      return res.json({ reply });
    } catch (error: any) {
      console.error('Erreur assistant Gemini serveur:', error);
      return res.status(500).json({
        error: error?.message || 'Erreur lors du traitement de la requête par l’assistant.'
      });
    }
  });

  // Montage de Vite en développement ou distribution statique en production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Serveur Mon Budget démarré sur http://0.0.0.0:${PORT}`);
  });
}

startServer();
