import type { Dispatch, SetStateAction } from 'react';
import type { Category } from '../../../lib/types';
import type { CategoryDraftState, PendingCategoryState } from '../types';
import { CATEGORY_SECTIONS, PRESET_CATEGORY_OPTIONS } from '../constants';

interface CategoriesStepProps {
  categories: Category[];
  categoryDrafts: CategoryDraftState;
  setCategoryDrafts: Dispatch<SetStateAction<CategoryDraftState>>;
  pendingCategories: PendingCategoryState;
  recentCategoryIds: Record<Category['kind'], string[]>;
  onTogglePreset: (kind: Category['kind'], name: string) => void;
  onAddCustom: (kind: Category['kind'], value: string) => void;
  onRemovePending: (kind: Category['kind'], value: string) => void;
}

export function CategoriesStep({
  categories,
  categoryDrafts,
  setCategoryDrafts,
  pendingCategories,
  recentCategoryIds,
  onTogglePreset,
  onAddCustom,
  onRemovePending,
}: CategoriesStepProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <p className="text-lg font-semibold uppercase">
          Personalizá las categorías según tu estilo de vida.
        </p>
      </header>

      <div className="space-y-4">
        {CATEGORY_SECTIONS.map((section) => {
          const sectionCategories = categories
            .filter((category) => category.kind === section.kind)
            .sort((a, b) => {
              const order = recentCategoryIds[section.kind] ?? [];
              const aIndex = order.indexOf(a.id);
              const bIndex = order.indexOf(b.id);
              if (aIndex !== -1 || bIndex !== -1) {
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
              }
              return a.name.localeCompare(b.name);
            });
          const pendingList = pendingCategories[section.kind];
          const customPending = pendingList.filter((item) => item.source === 'custom');

          const isOptionSelected = (option: string) => {
            const lower = option.toLowerCase();
            return (
              sectionCategories.some((cat) => cat.name.toLowerCase() === lower) ||
              pendingList.some((item) => item.name.toLowerCase() === lower)
            );
          };

          const isOptionSaved = (option: string) =>
            sectionCategories.some((cat) => cat.name.toLowerCase() === option.toLowerCase());

          return (
            <div
              key={section.kind}
              className="rounded-[28px] bg-slate-200/70 px-5 py-4 text-left"
            >
              <div className="space-y-1">
                <p className="text-lg font-semibold uppercase">{section.title}</p>
                <p className="text-xs uppercase text-gray-600">{section.description}</p>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Seleccioná</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_CATEGORY_OPTIONS[section.kind].map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={isOptionSaved(option)}
                      onClick={() => onTogglePreset(section.kind, option)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase transition ${
                        isOptionSelected(option)
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 bg-white text-gray-700'
                      } ${isOptionSaved(option) ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Agregar manual</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={categoryDrafts[section.kind]}
                    onChange={(event) =>
                      setCategoryDrafts((prev) => ({ ...prev, [section.kind]: event.target.value }))
                    }
                    placeholder="Nombre de categoría"
                    className="flex-1 rounded-2xl border border-gray-300 bg-white px-4 py-2 text-xs uppercase outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onAddCustom(section.kind, categoryDrafts[section.kind])}
                    className="rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase text-white"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Tus categorías</p>
                <div className="flex flex-wrap gap-2">
                  {sectionCategories.map((cat) => (
                    <span
                      key={cat.id}
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                        (recentCategoryIds[section.kind] ?? []).includes(cat.id)
                          ? 'bg-black text-white'
                          : 'bg-white text-gray-700'
                      }`}
                    >
                      {cat.name}
                    </span>
                  ))}
                  {customPending.map((item) => (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => onRemovePending(section.kind, item.name)}
                      className="rounded-full border border-gray-400 bg-white px-3 py-1 text-xs font-semibold uppercase text-gray-700"
                      title="Eliminar antes de guardar"
                    >
                      {item.name} ✕
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-center uppercase text-gray-500">
        La IA se encargará de clasificar tus gastos. No te preocupes, podés dejarlo así.
      </p>
    </div>
  );
}
