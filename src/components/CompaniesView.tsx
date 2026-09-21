import React, { useState } from 'react';
import { Company } from '../types.ts';
import {
  Building2,
  PlusCircle,
  Edit2,
  Archive,
  CheckCircle2,
  AlertCircle,
  X,
  Palette,
  FileText,
} from 'lucide-react';

interface CompaniesViewProps {
  companies: Company[];
  onCreateCompany: (data: {
    name: string;
    cnpj?: string;
    description?: string;
    color?: string;
  }) => Promise<void>;
  onUpdateCompany: (id: number, data: any) => Promise<void>;
  onArchiveCompany: (id: number) => Promise<void>;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({
  companies,
  onCreateCompany,
  onUpdateCompany,
  onArchiveCompany,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#1677FF');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);

  const colorOptions = [
    '#1677FF',
    '#22C55E',
    '#EF4444',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#64748B',
  ];

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setName('');
    setCnpj('');
    setDescription('');
    setColor('#1677FF');
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp: Company) => {
    setEditingCompany(comp);
    setName(comp.name);
    setCnpj(comp.cnpj || '');
    setDescription(comp.description || '');
    setColor(comp.color || '#1677FF');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome da empresa é obrigatório.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (editingCompany) {
        await onUpdateCompany(editingCompany.id, {
          name: name.trim(),
          cnpj: cnpj.trim() || null,
          description: description.trim() || null,
          color,
        });
      } else {
        await onCreateCompany({
          name: name.trim(),
          cnpj: cnpj.trim() || undefined,
          description: description.trim() || undefined,
          color,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar empresa.');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (comp: Company) => {
    if (
      confirm(
        `Deseja arquivar a empresa "${comp.name}"? As contas financeiras históricas serão preservadas no banco de dados.`
      )
    ) {
      try {
        await onArchiveCompany(comp.id);
      } catch (err: any) {
        alert(err.message || 'Erro ao arquivar empresa.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111821] p-4 rounded-2xl border border-[#1E293B]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Minhas Empresas</h1>
          <p className="text-xs text-[#8B98A8]">
            Cadastre e gerencie suas pessoas jurídicas e negócios com dados segregados
          </p>
        </div>

        <button
          type="button"
          id="btn-add-company"
          onClick={handleOpenCreate}
          className="h-10 px-4 rounded-xl bg-[#1677FF] hover:bg-[#0D5ED7] text-white text-xs font-semibold transition-all shadow-md shadow-[#1677FF]/25 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ ADICIONAR EMPRESA</span>
        </button>
      </div>

      {/* List of Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((comp) => {
          return (
            <div
              key={comp.id}
              className="bg-[#111821] border border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between hover:border-[#2D3A4F] transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                      style={{ backgroundColor: comp.color || '#1677FF' }}
                    >
                      {comp.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{comp.name}</h3>
                      <p className="text-[11px] text-[#8B98A8]">
                        {comp.cnpj ? `CNPJ: ${comp.cnpj}` : 'Sem CNPJ informado'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      !comp.isArchived
                        ? 'bg-[#22C55E]/15 text-[#22C55E]'
                        : 'bg-[#8B98A8]/15 text-[#8B98A8]'
                    }`}
                  >
                    {!comp.isArchived ? 'Ativa' : 'Arquivada'}
                  </span>
                </div>

                {comp.description && (
                  <p className="text-xs text-[#8B98A8] mt-2 line-clamp-2">
                    {comp.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(comp)}
                  className="px-3 h-8 rounded-lg bg-[#1A2332] hover:bg-[#253349] text-xs text-white font-medium transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>

                {!comp.isArchived && (
                  <button
                    type="button"
                    onClick={() => handleArchive(comp)}
                    className="p-2 rounded-lg bg-[#1A2332] hover:bg-red-500/20 text-[#8B98A8] hover:text-[#EF4444] transition-colors"
                    title="Arquivar empresa (exclusão lógica segura)"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {companies.length === 0 && (
          <div className="col-span-full py-16 text-center text-[#8B98A8] bg-[#111821] rounded-2xl border border-[#1E293B]">
            <Building2 className="w-10 h-10 mx-auto opacity-20 mb-3" />
            <p className="text-sm font-semibold text-white">Nenhuma empresa cadastrada</p>
            <p className="text-xs text-[#8B98A8] mt-1 max-w-sm mx-auto">
              Cadastre suas empresas ou projetos para segregar despesas e receitas comerciais da sua conta pessoal.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 px-4 h-9 rounded-xl bg-[#1677FF] text-white text-xs font-semibold"
            >
              + Adicionar Minha Primeira Empresa
            </button>
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
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
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: color }}
              >
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {editingCompany ? 'EDITAR EMPRESA' : 'NOVA EMPRESA'}
                </h2>
                <p className="text-xs text-[#8B98A8]">Identificação para controle financeiro PJ</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8B98A8] mb-1.5" htmlFor="comp-name">
                  Nome da Empresa / Razão Social *
                </label>
                <input
                  id="comp-name"
                  type="text"
                  required
                  placeholder="Ex: Minha Empresa Ltda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8B98A8] mb-1.5" htmlFor="comp-cnpj">
                  CNPJ (Opcional)
                </label>
                <input
                  id="comp-cnpj"
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8B98A8] mb-1.5" htmlFor="comp-desc">
                  Ramo de Atuação / Descrição
                </label>
                <input
                  id="comp-desc"
                  type="text"
                  placeholder="Ex: Consultoria de TI, Comércio..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-11 px-3.5 bg-[#0B0F14] border border-[#2D3A4F] focus:border-[#1677FF] rounded-xl text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8B98A8] mb-1.5">
                  Cor de Identificação
                </label>
                <div className="flex items-center gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#111821]' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
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
                  {loading ? 'Salvando...' : editingCompany ? 'Salvar Alterações' : 'Cadastrar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
