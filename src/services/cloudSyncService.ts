import {
  UserAccount,
  CloudSyncInfo,
  CloudBackupPayload,
  Category,
  Transaction,
  Budget,
  SavingsGoal,
  SavingsMovement
} from '../types';
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
  doc,
  getDoc,
  setDoc,
  onAuthStateChanged
} from './firebase';
import { hashPin, generateSalt } from '../utils/securityUtils';

const STORAGE_USERS_KEY = 'mon_budget_registered_users';
const STORAGE_CURRENT_USER_KEY = 'mon_budget_active_user_session';
const STORAGE_REMOTE_FIRESTORE_PREFIX = 'mon_budget_remote_firestore_';
const STORAGE_LAST_SYNC_KEY = 'mon_budget_last_sync_timestamp';

interface StoredUserRecord extends UserAccount {
  passwordHash: string;
  salt: string;
}

export class CloudSyncService {
  /**
   * Récupère la liste des comptes utilisateurs locaux de secours (offline cache)
   */
  private static getLocalUsers(): StoredUserRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveLocalUsers(users: StoredUserRecord[]) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  }

  /**
   * Récupère la session utilisateur active (mémoire/localStorage pour offline-first)
   */
  public static getCurrentUser(): UserAccount | null {
    if (auth.currentUser) {
      return {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || '',
        displayName: auth.currentUser.displayName || (auth.currentUser.email ? auth.currentUser.email.split('@')[0] : 'Utilisateur'),
        createdAt: auth.currentUser.metadata.creationTime ? new Date(auth.currentUser.metadata.creationTime).getTime() : Date.now(),
        lastLoginAt: Date.now()
      };
    }
    try {
      const data = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Initialise un écouteur de session Firebase Auth
   */
  public static initAuthListener(onUserChange: (user: UserAccount | null) => void): () => void {
    return onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const userAccount: UserAccount = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Utilisateur'),
          createdAt: fbUser.metadata.creationTime ? new Date(fbUser.metadata.creationTime).getTime() : Date.now(),
          lastLoginAt: Date.now()
        };
        localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(userAccount));
        onUserChange(userAccount);
      } else {
        localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
        onUserChange(null);
      }
    });
  }

  /**
   * Inscription d'un nouvel utilisateur (Firebase Auth avec fallback offline)
   */
  public static async signUp(
    email: string,
    pass: string,
    displayName: string
  ): Promise<{ success: boolean; user?: UserAccount; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Adresse email invalide.' };
    }
    if (pass.length < 6) {
      return { success: false, message: 'Le mot de passe doit contenir au moins 6 caractères.' };
    }

    const trimmedName = displayName.trim() || cleanEmail.split('@')[0];

    try {
      // 1. Essai Firebase Authentication en ligne
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, { displayName: trimmedName });
        } catch {}
      }

      const fbUser = userCredential.user;
      const user: UserAccount = {
        uid: fbUser.uid,
        email: cleanEmail,
        displayName: trimmedName,
        createdAt: Date.now(),
        lastLoginAt: Date.now()
      };

      // Sauvegarde du compte en cache local pour disponibilité hors ligne
      const salt = generateSalt(16);
      const passwordHash = await hashPin(pass, salt);
      const localUsers = this.getLocalUsers();
      localUsers.push({ ...user, passwordHash, salt });
      this.saveLocalUsers(localUsers);

      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
      return { success: true, user, message: 'Compte Firebase créé avec succès !' };
    } catch (fbError: any) {
      console.warn('Firebase Auth signup non disponible ou erreur, tentative locale:', fbError);

      // Si erreur spécifique (ex: email déjà utilisé), la remonter
      if (fbError.code === 'auth/email-already-in-use') {
        return { success: false, message: 'Un compte avec cette adresse email existe déjà sur Firebase.' };
      }

      // Mode hors-ligne / fallback local
      const localUsers = this.getLocalUsers();
      if (localUsers.some(u => u.email === cleanEmail)) {
        return { success: false, message: 'Un compte avec cette adresse email existe déjà en local.' };
      }

      const salt = generateSalt(16);
      const passwordHash = await hashPin(pass, salt);
      const localUser: StoredUserRecord = {
        uid: 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        email: cleanEmail,
        displayName: trimmedName,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        passwordHash,
        salt
      };

      localUsers.push(localUser);
      this.saveLocalUsers(localUsers);

      const publicUser: UserAccount = {
        uid: localUser.uid,
        email: localUser.email,
        displayName: localUser.displayName,
        createdAt: localUser.createdAt,
        lastLoginAt: localUser.lastLoginAt
      };

      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(publicUser));
      return {
        success: true,
        user: publicUser,
        message: 'Compte créé en mode local hors-ligne (synchronisation activée dès reconnexion).'
      };
    }
  }

  /**
   * Connexion utilisateur (Firebase Auth avec fallback offline)
   */
  public static async signIn(
    email: string,
    pass: string
  ): Promise<{ success: boolean; user?: UserAccount; message: string }> {
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Essai Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const fbUser = userCredential.user;

      const user: UserAccount = {
        uid: fbUser.uid,
        email: cleanEmail,
        displayName: fbUser.displayName || cleanEmail.split('@')[0],
        createdAt: fbUser.metadata.creationTime ? new Date(fbUser.metadata.creationTime).getTime() : Date.now(),
        lastLoginAt: Date.now()
      };

      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
      return { success: true, user, message: 'Connexion Firebase réussie !' };
    } catch (fbError: any) {
      console.warn('Firebase signIn échoué, essai fallback local offline:', fbError);

      if (fbError.code === 'auth/wrong-password' || fbError.code === 'auth/invalid-credential') {
        return { success: false, message: 'Mot de passe ou identifiant incorrect.' };
      }

      // 2. Fallback offline cache
      const localUsers = this.getLocalUsers();
      const userRecord = localUsers.find(u => u.email === cleanEmail);

      if (!userRecord) {
        return {
          success: false,
          message: fbError?.message || 'Aucun compte associé à cette adresse email.'
        };
      }

      const computedHash = await hashPin(pass, userRecord.salt);
      if (computedHash !== userRecord.passwordHash) {
        return { success: false, message: 'Mot de passe incorrect.' };
      }

      userRecord.lastLoginAt = Date.now();
      this.saveLocalUsers(localUsers);

      const publicUser: UserAccount = {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        createdAt: userRecord.createdAt,
        lastLoginAt: userRecord.lastLoginAt
      };

      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(publicUser));
      return { success: true, user: publicUser, message: 'Connexion hors-ligne réussie !' };
    }
  }

  /**
   * Déconnexion
   */
  public static async signOut(): Promise<void> {
    try {
      await fbSignOut(auth);
    } catch {}
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  }

  /**
   * Récupération de compte / réinitialisation de mot de passe Firebase
   */
  public static async sendPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        success: true,
        message: `Un email de réinitialisation sécurisé a été envoyé à ${cleanEmail}.`
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Impossible d’envoyer le lien de réinitialisation.'
      };
    }
  }

  /**
   * Récupère la sauvegarde Cloud depuis Firestore (avec fallback cache local)
   */
  public static async getCloudBackup(uid: string): Promise<CloudBackupPayload | null> {
    try {
      if (navigator.onLine) {
        const userDocRef = doc(db, 'users', uid);
        const snapshot = await getDoc(userDocRef);
        if (snapshot.exists()) {
          const data = snapshot.data() as CloudBackupPayload;
          // Met à jour le cache local
          localStorage.setItem(STORAGE_REMOTE_FIRESTORE_PREFIX + uid, JSON.stringify(data));
          return data;
        }
      }
    } catch (e) {
      console.warn('Erreur lecture Firestore, fallback cache local:', e);
    }

    // Fallback cache local offline
    try {
      const data = localStorage.getItem(STORAGE_REMOTE_FIRESTORE_PREFIX + uid);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Sauvegarde les données locales vers Cloud Firestore (avec persistance cache local)
   */
  public static async saveToCloud(payload: CloudBackupPayload): Promise<void> {
    // 1. Toujours mettre en cache localement
    localStorage.setItem(
      STORAGE_REMOTE_FIRESTORE_PREFIX + payload.uid,
      JSON.stringify(payload)
    );
    localStorage.setItem(STORAGE_LAST_SYNC_KEY, Date.now().toString());

    // 2. Si connecté, synchroniser avec Firestore
    if (navigator.onLine) {
      try {
        const userDocRef = doc(db, 'users', payload.uid);
        await setDoc(userDocRef, {
          ...payload,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (e) {
        console.error('Erreur écriture Firestore:', e);
        throw e;
      }
    }
  }

  /**
   * Timestamp de la dernière synchronisation réussie
   */
  public static getLastSyncTimestamp(): number | null {
    const raw = localStorage.getItem(STORAGE_LAST_SYNC_KEY);
    return raw ? parseInt(raw, 10) : null;
  }

  /**
   * Algorithme de fusion intelligente bi-directionnelle (Conflict Resolution & Deduplication)
   * Évite les doublons et les pertes de données entre les données locales (Room) et Cloud (Firestore).
   */
  public static mergeData(
    local: {
      categories: Category[];
      transactions: Transaction[];
      budgets: Budget[];
      savingsGoals: SavingsGoal[];
      savingsMovements: SavingsMovement[];
      currency: string;
    },
    remote: CloudBackupPayload
  ): {
    categories: Category[];
    transactions: Transaction[];
    budgets: Budget[];
    savingsGoals: SavingsGoal[];
    savingsMovements: SavingsMovement[];
    currency: string;
    addedCount: number;
    updatedCount: number;
  } {
    let addedCount = 0;
    let updatedCount = 0;

    // 1. Fusion des Catégories par ID
    const categoryMap = new Map<string, Category>();
    local.categories.forEach(c => categoryMap.set(c.id, c));
    (remote.categories || []).forEach(remoteCat => {
      if (!categoryMap.has(remoteCat.id)) {
        categoryMap.set(remoteCat.id, remoteCat);
        addedCount++;
      } else {
        categoryMap.set(remoteCat.id, { ...categoryMap.get(remoteCat.id)!, ...remoteCat });
      }
    });

    // 2. Fusion des Transactions par ID unique (Dédoublonnage strict)
    const transactionMap = new Map<string, Transaction>();
    local.transactions.forEach(t => transactionMap.set(t.id, t));
    (remote.transactions || []).forEach(remoteTx => {
      if (!transactionMap.has(remoteTx.id)) {
        transactionMap.set(remoteTx.id, remoteTx);
        addedCount++;
      } else {
        const localTx = transactionMap.get(remoteTx.id)!;
        if (new Date(remoteTx.date).getTime() > new Date(localTx.date).getTime()) {
          transactionMap.set(remoteTx.id, remoteTx);
          updatedCount++;
        }
      }
    });

    // 3. Fusion des Budgets par ID
    const budgetMap = new Map<string, Budget>();
    local.budgets.forEach(b => budgetMap.set(b.id, b));
    (remote.budgets || []).forEach(remoteBudget => {
      if (!budgetMap.has(remoteBudget.id)) {
        budgetMap.set(remoteBudget.id, remoteBudget);
        addedCount++;
      } else {
        budgetMap.set(remoteBudget.id, remoteBudget);
      }
    });

    // 4. Fusion des Objectifs d'Épargne
    const goalsMap = new Map<string, SavingsGoal>();
    local.savingsGoals.forEach(g => goalsMap.set(g.id, g));
    (remote.savingsGoals || []).forEach(remoteGoal => {
      if (!goalsMap.has(remoteGoal.id)) {
        goalsMap.set(remoteGoal.id, remoteGoal);
        addedCount++;
      } else {
        const localGoal = goalsMap.get(remoteGoal.id)!;
        goalsMap.set(remoteGoal.id, {
          ...localGoal,
          ...remoteGoal,
          currentAmount: Math.max(localGoal.currentAmount, remoteGoal.currentAmount)
        });
      }
    });

    // 5. Fusion des Mouvements d'Épargne par ID unique
    const movementMap = new Map<string, SavingsMovement>();
    local.savingsMovements.forEach(m => movementMap.set(m.id, m));
    (remote.savingsMovements || []).forEach(remoteMv => {
      if (!movementMap.has(remoteMv.id)) {
        movementMap.set(remoteMv.id, remoteMv);
        addedCount++;
      }
    });

    return {
      categories: Array.from(categoryMap.values()),
      transactions: Array.from(transactionMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
      budgets: Array.from(budgetMap.values()),
      savingsGoals: Array.from(goalsMap.values()),
      savingsMovements: Array.from(movementMap.values()).sort((a, b) => b.timestamp - a.timestamp),
      currency: local.currency || remote.currency || 'FCFA',
      addedCount,
      updatedCount
    };
  }
}
