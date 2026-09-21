import React, { useState } from 'react';
import { Category } from '../types.ts';
import { Tags, PlusCircle, Edit2, Trash2, ArrowDownRight, ArrowUpRight, X } from 'lucide-react';

interface CategoriesViewProps {
  categories: Category[];
  onCreateCategory: (data: {
    name: string;
    type: 'despesa' | 'receita';
    description?: string;
    color?: string;
  }) => Promise<void>;
  onUpdateCategory: (id: number, data: any) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'despesa' | 'receita'>('despesa');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<'despesa' | 'receita'>('despesa');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#1677FF');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setType(activeTab);
    setDescription('');
    setColor(activeTab === 'despesa' ? '#EF4444' : '#22C55E');
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setDescription(cat.description || '');
    setColor(cat.color || '#1677FF');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome da categoria é obrigatório.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, {
          name: name.trim(),
          type,
          description: description.trim() || null,
          color,
        });
      } else {
        await onCreateCategory({
          name: name.trim(),
          type,
          description: description.trim() || undefined,
          color,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar categoria.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (confirm(`Deseja excluir a categoria "${cat.name}"?`)) {
      try {
        await onDeleteCategory(cat.id);
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir categoria.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111821] p-4 rounded-2xl border border-[#1E293B]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Categorias Financeiras</h1>
          <p className="text-xs text-[#8B98A8]">
            Segregação estrita de categorias para despesas e receitas
          </p>
        </div>

        <button
          type="button"
          id="btn-add-category"
          onClick={handleOpenCreate}
          className="h-10 px-4 rounded-xl bg-[#1677FF] hover:bg-[#0D5ED7] text-white text-xs font-semibold transition-all shadow-md shadow-[#1677FF]/25 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ NOVA CATEGORIA</span>
        </button>
      </div>

      {/* Tabs Despesas vs Receitas */}
      <div className="flex border-b border-[#1E293B] gap-4">
        <button
          type="button"
          id="tab-cat-despesas"
          onClick={() => setActiveTab('despesa')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'despesa'
              ? 'text-white border-b-2 border-[#EF4444]'
              : 'text-[#8B98A8] hover:text-white'
          }`}
        >
          <ArrowDownRight className="w-4 h-4 text-[#EF4444]" />
          <span>Categorias de Despesa ({categories.filter((c) => c.type === 'despesa').length})</span>
        </button>

        <button
          type="button"
          id="tab-cat-receitas"
          onClick={() => setActiveTab('receita')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'receita'
              ? 'text-white border-b-2 border-[#22C55E]'
              : 'text-[#8B98A8] hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-[#22C55E]" />
          <span>Categorias de Receita ({categories.filter((c) => c.type === 'receita').length})</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className="bg-[#111821] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between hover:border-[#2D3A4F] transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{
                  backgroundColor: cat.color || (cat.type === 'despesa' ? '#EF4444' : '#22C55E'),
                }}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{cat.name}</p>
                {cat.description && (
                  <p className="text-[10px] text-[#8B98A8] truncate">{cat.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => handleOpenEdit(cat)}
                className="p-1.5 rounded-lg text-[#8B98A8] hover:text-white hover:bg-[#1A2332] transition-colors"
                title="Editar categoria"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(cat)}
                className="p-1.5 rounded-lg text-[#8B98A8] hover:text-[#EF4444] hover:bg-red-500/10 transition-colors"
                title="Excluir categoria"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#111821] border border-[#1E293B] rounded-2xl p-6 shadow-2xl relative text-white">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-[#8B98A8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#1677FF]/10 text-[#1677FF] flex items-center justify-center">
                <Tags className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {editingCategory ? 'EDITAR CATEGORIA' : 'NOVA CATEGORIA'}
                </h2>
                <p className="text-xs text-[#8B98A8]">
                  Classificação financeira para relatórios e controles
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8B98A8] mb-1.5">
                  Tipo da Categoria
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('despesa')}
                    className={`h-10 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 ${
                      type === 'despesa'
                        ? 'bg-[#EF4444]/15 border-[#EF4444] text-[#EF4444]'
                        : 'bg-[#0B0F14] border-[#1E293B] text-[#8B98A8]'
                    }`}
                  >
                    <span>Despesa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('receita')}
                    className={`h-10 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 ${
                      type === 'receita'
                        ? 'bg-[#22C55E]/15 border-[#22C55E] text-[#22C55E]'
                        : 'bg-[#0B0F14] border-[#1E293B] text-[#8B98A8]'
                    }`}
                  >
                    <span>Receita</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8B98A8] mb-1.5" htmlFor="cat-name-input">
                  Nome da Categoria *
                </label>
                <input
                  id="cat-name-input"
                  type="text"
                  required
                  placeholder="Ex: Fornecedores, Salários, Vendas de Software..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8B98A8] mb-1.5" htmlFor="cat-desc-input">
                  Descrição (Opcional)
                </label>
                <input
                  id="cat-desc-input"
                  type="text"
                  placeholder="Finalidade ou detalhes da categoria"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 h-11 rounded-xl text-xs text-[#8B98A8] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 h-11 rounded-xl bg-[#1677FF] hover:bg-[#0D5ED7] text-white text-xs font-semibold shadow-md shadow-[#1677FF]/25 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
