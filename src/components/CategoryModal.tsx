import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  FolderPlus,
  Layers,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { Category, TransactionType } from '../types';
import { CategoryIcon, AVAILABLE_CATEGORY_ICONS } from './CategoryIcon';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialType?: TransactionType;
  onAddCategory: (data: {
    name: string;
    type: TransactionType;
    icon: string;
    color?: string;
  }) => { success: boolean; message: string; category?: Category };
  onUpdateCategory: (
    id: string,
    updates: { name?: string; icon?: string; color?: string }
  ) => { success: boolean; message: string };
  onDeleteCategory: (id: string) => { success: boolean; message: string };
  isCategoryUsed: (categoryName: string) => boolean;
  onSelectCategory?: (categoryName: string) => void;
}

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#64748b'  // Slate
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialType = 'EXPENSE',
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  isCategoryUsed,
  onSelectCategory
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType>(initialType);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('Tag');
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Icon picker state
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Deletion confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCategories = categories.filter(c => c.type === activeTab);

  const handleStartCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormName('');
    setFormIcon(activeTab === 'INCOME' ? 'Briefcase' : 'ShoppingBag');
    setFormColor(activeTab === 'INCOME' ? '#10b981' : '#ef4444');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleStartEdit = (cat: Category) => {
    setIsEditing(true);
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormIcon(cat.icon || 'Tag');
    setFormColor(cat.color || PRESET_COLORS[0]);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formName.trim()) {
      setErrorMsg('Le nom de la catégorie est obligatoire.');
      return;
    }

    if (isEditing && editingId) {
      const res = onUpdateCategory(editingId, {
        name: formName.trim(),
        icon: formIcon,
        color: formColor
      });
      if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setSuccessMsg(res.message);
        setIsEditing(false);
        setEditingId(null);
        setFormName('');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } else {
      const res = onAddCategory({
        name: formName.trim(),
        type: activeTab,
        icon: formIcon,
        color: formColor
      });
      if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setSuccessMsg(res.message);
        setFormName('');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    }
  };

  const handleDelete = (cat: Category) => {
    setErrorMsg(null);
    const res = onDeleteCategory(cat.id);
    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setSuccessMsg(res.message);
      setConfirmDeleteId(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Gestion des Catégories
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stockage local Room • Personnalisation des icônes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Dépenses / Revenus) */}
        <div className="p-3 sm:px-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-800 rounded-2xl text-xs font-bold">
            <button
              onClick={() => {
                setActiveTab('EXPENSE');
                handleStartCreate();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'EXPENSE'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Dépenses ({categories.filter(c => c.type === 'EXPENSE').length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('INCOME');
                handleStartCreate();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'INCOME'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Revenus ({categories.filter(c => c.type === 'INCOME').length})</span>
            </button>
          </div>

          <button
            onClick={handleStartCreate}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nouvelle catégorie</span>
          </button>
        </div>

        {/* Messages Feedback */}
        {errorMsg && (
          <div className="m-3 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="m-3 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body: Scrollable list & Add/Edit form */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Add / Edit Form Card */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-emerald-600" />
                <span>
                  {isEditing ? 'Modifier la catégorie' : 'Créer une catégorie personnalisée'}
                </span>
              </h3>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Annuler la modification
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nom de la catégorie <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder={
                    activeTab === 'EXPENSE'
                      ? 'ex: Carburant Moto, Restaurant, Internet pro...'
                      : 'ex: Salaire, Ventes WhatsApp, Prestation freelance...'
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Icon Selector and Color Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Selected Icon Trigger */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Icône associée
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: formColor }}
                      >
                        <CategoryIcon name={formIcon} className="w-4 h-4" />
                      </div>
                      <span className="font-semibold">{formIcon}</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-bold">Choisir...</span>
                  </button>
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Couleur du badge
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {PRESET_COLORS.map(c => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setFormColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          formColor === c ? 'scale-115 ring-2 ring-offset-2 ring-emerald-500' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Icon Picker Panel */}
              {showIconPicker && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Sélectionnez une icône Lucide :
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowIconPicker(false)}
                      className="text-[10px] text-slate-400 hover:text-slate-600"
                    >
                      Fermer
                    </button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto pr-1">
                    {AVAILABLE_CATEGORY_ICONS.map(item => (
                      <button
                        type="button"
                        key={item.name}
                        onClick={() => {
                          setFormIcon(item.name);
                          setShowIconPicker(false);
                        }}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] transition-all ${
                          formIcon === item.name
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                        title={item.label}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="truncate max-w-[55px]">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all"
              >
                {isEditing ? 'Enregistrer les modifications' : 'Ajouter cette catégorie'}
              </button>
            </form>
          </div>

          {/* List of current categories */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Catégories de {activeTab === 'EXPENSE' ? 'dépenses' : 'revenus'} existantes ({currentCategories.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentCategories.map(cat => {
                const used = isCategoryUsed(cat.name);
                return (
                  <div
                    key={cat.id}
                    className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div
                      onClick={() => onSelectCategory && onSelectCategory(cat.name)}
                      className={`flex items-center gap-2.5 min-w-0 flex-1 ${
                        onSelectCategory ? 'cursor-pointer' : ''
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: cat.color || '#10b981' }}
                      >
                        <CategoryIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {cat.name}
                          </p>
                          {cat.isCustom && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Perso
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {used ? 'Utilisée dans vos données' : 'Non utilisée'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                        title="Modifier cette catégorie"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete button: disabled or warning if used */}
                      {confirmDeleteId === cat.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg"
                          >
                            Confirmer
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] rounded-lg"
                          >
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (used) {
                              setErrorMsg(
                                `Impossible de supprimer "${cat.name}" : cette catégorie est liée à vos transactions ou budgets.`
                              );
                              setTimeout(() => setErrorMsg(null), 4000);
                            } else {
                              setConfirmDeleteId(cat.id);
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            used
                              ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                          }`}
                          title={
                            used
                              ? 'Impossible de supprimer : catégorie en cours d’utilisation'
                              : 'Supprimer cette catégorie'
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
