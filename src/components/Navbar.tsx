import React, { useRef, useState, useEffect } from 'react';
import { 
  Ruler, 
  Download, 
  Upload, 
  Undo2, 
  Redo2, 
  HelpCircle, 
  FileSpreadsheet, 
  FolderOpen, 
  Sparkles,
  Grid,
  Eye,
  EyeOff,
  Keyboard,
  Building2,
  Magnet,
  ChevronDown,
  Plus,
  SlidersHorizontal,
  Image as ImageIcon
} from 'lucide-react';
import { CADProject, CADLayer } from '../types/cad';
import { SAMPLE_TEMPLATES } from '../data/catalog';

interface NavbarProps {
  project: CADProject;
  activeLayer?: CADLayer;
  visibleLayers?: {
    arch: boolean;
    plumbing: boolean;
    electrical: boolean;
    furniture: boolean;
  };
  onToggleArchitecture?: () => void;
  onLoadProject: (project: CADProject) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenStepGuide: () => void;
  onOpenAuditModal: () => void;
  onOpenAIModal?: () => void;
  onOpenShortcutsModal?: () => void;
  onExportPng: () => void;
  onToggleGrid: () => void;
  onToggleSnap?: () => void;
  onChangeGridSize?: (size: number) => void;
  onToggleDimensions: () => void;
  onToggleMeasureLine: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  visibleLayers,
  onToggleArchitecture,
  onLoadProject,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenStepGuide,
  onOpenAuditModal,
  onOpenAIModal,
  onOpenShortcutsModal,
  onExportPng,
  onToggleGrid,
  onToggleSnap,
  onChangeGridSize,
  onToggleDimensions,
  onToggleMeasureLine,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [activeMenu, setActiveMenu] = useState<'file' | 'view' | 'help' | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    if (key && SAMPLE_TEMPLATES[key]) {
      onLoadProject(JSON.parse(JSON.stringify(SAMPLE_TEMPLATES[key])));
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${project.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loaded = JSON.parse(event.target?.result as string);
        if (loaded && loaded.walls && Array.isArray(loaded.walls)) {
          onLoadProject(loaded);
        } else {
          alert('Archivo de proyecto no válido.');
        }
      } catch {
        alert('Error al procesar el archivo JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header ref={navRef} className="h-14 bg-slate-900 text-slate-100 border-b border-slate-800 px-3 md:px-5 flex items-center justify-between select-none shadow-md z-30 relative">
      {/* Undo/Redo */}
      <div className="flex items-center space-x-3">
        {/* Quick Undo / Redo */}
        <div className="flex items-center bg-slate-800/90 rounded-lg p-1 border border-slate-700/80 shadow-sm">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Deshacer (Ctrl+Z)"
            className={`p-1.5 rounded-md transition-all ${
              canUndo
                ? 'text-slate-200 hover:bg-slate-700 active:scale-95'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Rehacer (Ctrl+Y)"
            className={`p-1.5 rounded-md transition-all ${
              canRedo
                ? 'text-slate-200 hover:bg-slate-700 active:scale-95'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center/Right Dropdowns & Actions */}
      <div className="flex items-center space-x-2 md:space-x-2.5">
        
        {/* 1. PROYECTO & PLANTILLAS DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-1.5 border transition-all ${
              activeMenu === 'file'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400/30'
                : 'bg-slate-800 text-slate-200 border-slate-700/80 hover:bg-slate-750 hover:text-white'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Proyecto & Archivo</span>
            <span className="sm:hidden">Proyecto</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {activeMenu === 'file' && (
            <div className="absolute left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 py-2 text-xs text-slate-200 divide-y divide-slate-700/60 animate-in fade-in duration-150">
              {/* Plantillas */}
              <div className="px-3 py-2 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Cargar Plantillas
                </div>
                <select
                  onChange={(e) => {
                    handleTemplateChange(e);
                    setActiveMenu(null);
                  }}
                  defaultValue=""
                  className="w-full bg-slate-900 text-xs font-medium text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="" disabled>-- Seleccionar Plantilla --</option>
                  <option value="modern_apartment">Depto 2 Ambientes (54 m²)</option>
                  <option value="blank_project">Plano 100% en Blanco (0 m²)</option>
                </select>

                <button
                  onClick={() => {
                    onLoadProject(JSON.parse(JSON.stringify(SAMPLE_TEMPLATES.blank_project)));
                    setActiveMenu(null);
                  }}
                  className="w-full px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold rounded-lg border border-indigo-500/30 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Plano en Blanco</span>
                </button>
              </div>

              {/* Import / Export */}
              <div className="px-1.5 py-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    handleExportJson();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700/80 rounded-lg flex items-center gap-2.5 font-medium transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-slate-100">Guardar Proyecto (.json)</div>
                    <div className="text-[10px] text-slate-400">Descargar archivo para reabrir después</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700/80 rounded-lg flex items-center gap-2.5 font-medium transition-colors"
                >
                  <Upload className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="font-semibold text-slate-100">Abrir Proyecto (.json)</div>
                    <div className="text-[10px] text-slate-400">Cargar un archivo previo guardado</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onExportPng();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700/80 rounded-lg flex items-center gap-2.5 font-medium transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold text-slate-100">Exportar Imagen (.png)</div>
                    <div className="text-[10px] text-slate-400">Captura visual de alta definición</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. VISTA & PRECISIÓN DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-1.5 border transition-all ${
              activeMenu === 'view'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400/30'
                : 'bg-slate-800 text-slate-200 border-slate-700/80 hover:bg-slate-750 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:inline">Vista & Precisión</span>
            <span className="md:hidden">Vista</span>
            <span className="bg-slate-900 text-emerald-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 flex items-center gap-1 font-bold">
              <Magnet className="w-3 h-3" />
              {project.snapToGrid ? `${Math.round((project.gridSizeMeters || 0.05) * 100)}cm` : 'Libre'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {activeMenu === 'view' && (
            <div className="absolute right-0 sm:left-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 py-2 text-xs text-slate-200 divide-y divide-slate-700/60 animate-in fade-in duration-150">
              
              {/* Capas y Capa Arquitectura */}
              <div className="px-3 py-2 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Visibilidad de Capas y Cotas
                </div>

                {onToggleArchitecture && (
                  <button
                    onClick={onToggleArchitecture}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-400" />
                      <span>Capa Arquitectura / Paredes</span>
                    </div>
                    {visibleLayers?.arch ? (
                      <Eye className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                )}

                <button
                  onClick={onToggleDimensions}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-400" />
                    <span>Cotas & Medidas (U)</span>
                  </div>
                  {project.showDimensions ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">VISIBLES</span>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">OCULTAS</span>
                  )}
                </button>

                <button
                  onClick={onToggleMeasureLine}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-amber-400" />
                    <span>Regla Dinámica de Metro (T)</span>
                  </div>
                  {project.showMeasureLine ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">ACTIVA</span>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">OFF</span>
                  )}
                </button>

                <button
                  onClick={onToggleGrid}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-indigo-400" />
                    <span>Rejilla de Metros (G)</span>
                  </div>
                  {project.showGrid ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">VISIBLE</span>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">OCULTA</span>
                  )}
                </button>
              </div>

              {/* Ajustes de Imán y Rejilla */}
              <div className="px-3 py-2 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Ajuste por Imán y Exactitud
                </div>

                {onToggleSnap && (
                  <button
                    onClick={onToggleSnap}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg font-bold transition-all ${
                      project.snapToGrid
                        ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Magnet className="w-4 h-4" />
                      <span>Imán de Ajuste Automático</span>
                    </div>
                    <span>{project.snapToGrid ? 'ON' : 'LIBRE'}</span>
                  </button>
                )}

                {onChangeGridSize && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                      Paso de Rejilla / Exactitud:
                    </label>
                    <select
                      value={project.gridSizeMeters || 0.05}
                      onChange={(e) => {
                        onChangeGridSize(parseFloat(e.target.value));
                      }}
                      className="w-full bg-slate-900 text-xs font-bold text-slate-100 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value={0.01}>⚡ Libre / 1 cm (Ultra Fino)</option>
                      <option value={0.05}>🎯 5 cm (Precisión Recomendada)</option>
                      <option value={0.10}>📏 10 cm (Estándar)</option>
                      <option value={0.25}>📐 25 cm (Paso Medio)</option>
                      <option value={0.50}>🧱 50 cm (Estructura Muros)</option>
                      <option value={1.00}>🗺️ 1.0 m (Grid de 1 Metro)</option>
                    </select>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* 3. AUDITORÍA & COMPUTO METRICO (Póliza/Presupuesto) */}
        <button
          onClick={onOpenAuditModal}
          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs md:text-sm flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          title="Cómputo Métrico de Materiales y Presupuesto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span className="hidden lg:inline">Presupuesto</span>
        </button>

        {/* 4. ASISTENTE IA (Opcional) */}
        {onOpenAIModal && (
          <button
            onClick={onOpenAIModal}
            className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold text-xs md:text-sm flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Asistente IA Arquitectónico"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="hidden xl:inline">Asistente IA</span>
          </button>
        )}

        {/* 5. AYUDA & ATAJOS DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
            className={`px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-1.5 border transition-all ${
              activeMenu === 'help'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400/30'
                : 'bg-slate-800 text-slate-200 border-slate-700/80 hover:bg-slate-750 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span className="hidden lg:inline">Ayuda</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {activeMenu === 'help' && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 py-1.5 text-xs text-slate-200 divide-y divide-slate-700/60 animate-in fade-in duration-150">
              <div className="px-1 py-1 space-y-0.5">
                <button
                  onClick={() => {
                    onOpenStepGuide();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700/80 rounded-lg flex items-center gap-2.5 font-semibold text-slate-200 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  <span>Guía Paso a Paso</span>
                </button>

                {onOpenShortcutsModal && (
                  <button
                    onClick={() => {
                      onOpenShortcutsModal();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700/80 rounded-lg flex items-center justify-between font-semibold text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Keyboard className="w-4 h-4 text-indigo-400" />
                      <span>Atajos de Teclado</span>
                    </div>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-indigo-300 border border-slate-700 font-bold">
                      K
                    </kbd>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJson}
        accept=".json"
        className="hidden"
      />
    </header>
  );
};

