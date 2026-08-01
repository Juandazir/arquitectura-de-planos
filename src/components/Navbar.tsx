import React, { useRef } from 'react';
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
  Building2
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
  onToggleDimensions: () => void;
  onToggleMeasureLine: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  activeLayer,
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
  onToggleDimensions,
  onToggleMeasureLine,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <header className="h-14 bg-slate-900 text-slate-100 border-b border-slate-800 px-4 flex items-center justify-between select-none shadow-md z-30">
      {/* Left branding */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold shadow-sm">
          <Ruler className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-sm leading-tight tracking-tight text-white">
            Arch2D Studio
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">
            Planos 2D • Tubería • Electricidad • Metros (m)
          </p>
        </div>
      </div>

      {/* Center project selector & templates */}
      <div className="hidden md:flex items-center space-x-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
        <FolderOpen className="w-4 h-4 text-slate-400" />
        <span className="text-xs text-slate-400 font-medium">Plantillas:</span>
        <select
          onChange={handleTemplateChange}
          defaultValue=""
          className="bg-slate-900 text-xs font-semibold text-slate-200 border border-slate-700 rounded px-2.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="" disabled>
            -- Seleccionar Ejemplo o Blank --
          </option>
          <option value="modern_apartment">Depto 2 Ambientes (54 m² - Completo)</option>
          <option value="blank_project">Plano 100% en Blanco (Sin Nada - 0 m²)</option>
        </select>
        <button
          onClick={() => onLoadProject(JSON.parse(JSON.stringify(SAMPLE_TEMPLATES.blank_project)))}
          title="Crear un lienzo 100% en blanco para diseñar desde cero"
          className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-100 rounded border border-slate-600 transition-colors whitespace-nowrap"
        >
          + Plano en Blanco
        </button>
      </div>

      {/* Right control buttons */}
      <div className="flex items-center space-x-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700/80 shadow-sm">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Deshacer (Ctrl+Z)"
            className={`p-2 rounded-md transition-all ${
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
            className={`p-2 rounded-md transition-all ${
              canRedo
                ? 'text-slate-200 hover:bg-slate-700 active:scale-95'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* View toggles */}
        <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700/80 shadow-sm">
          {onToggleArchitecture && (
            <button
              onClick={onToggleArchitecture}
              title={
                visibleLayers?.arch
                  ? "Ocultar Capa de Arquitectura / Paredes"
                  : "Mostrar Capa de Arquitectura / Paredes"
              }
              className={`px-3 py-2 rounded-md text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                visibleLayers?.arch
                  ? 'bg-blue-600 text-white shadow ring-2 ring-blue-400/50'
                  : 'bg-slate-700/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              <Building2 className={`w-4 h-4 ${visibleLayers?.arch ? 'text-blue-200' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Capa Arquitectura</span>
              {visibleLayers?.arch ? (
                <Eye className="w-3.5 h-3.5 text-blue-200 ml-0.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              )}
            </button>
          )}
          <button
            onClick={onToggleGrid}
            title="Alternar Cuadrícula de Metros (Tecla: G)"
            className={`px-3 py-2 rounded-md text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-all ${
              project.showGrid
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span className="hidden sm:inline">Rejilla 0.5m</span>
          </button>
          <button
            onClick={onToggleMeasureLine}
            title="Activar o desactivar línea de metro dinámica / cota continua (Tecla: T)"
            className={`px-3 py-2 rounded-md text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-all ${
              project.showMeasureLine
                ? 'bg-amber-600 text-white shadow font-bold'
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <Ruler className="w-4 h-4" />
            <span className="hidden sm:inline">Línea Metro</span>
          </button>
          <button
            onClick={onToggleDimensions}
            title="Alternar Cotas / Medidas Internacionales (Tecla: U)"
            className={`px-3 py-2 rounded-md text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-all ${
              project.showDimensions
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Medidas</span>
          </button>
        </div>

        {/* Keyboard Shortcuts Button (NEW for architects speed) */}
        {onOpenShortcutsModal && (
          <button
            onClick={onOpenShortcutsModal}
            className="px-3.5 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-semibold text-xs md:text-sm flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Atajos de Teclado para Velocidad de Diseño (Tecla: ? o K)"
          >
            <Keyboard className="w-4 h-4 text-indigo-400" />
            <span className="hidden lg:inline">Atajos</span>
            <kbd className="hidden xl:inline-block px-1.5 py-0.5 rounded bg-slate-900/80 text-[10px] font-mono font-bold text-indigo-300 border border-indigo-500/30">
              K
            </kbd>
          </button>
        )}

        {/* Step Guide Button */}
        <button
          onClick={onOpenStepGuide}
          className="px-3.5 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs md:text-sm flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          title="Guía interactiva paso a paso"
        >
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <span className="hidden lg:inline">Paso a Paso</span>
        </button>

        {/* Audit & Takeoff */}
        <button
          onClick={onOpenAuditModal}
          className="px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs md:text-sm flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          title="Cómputo Métrico de Materiales y Auditoría Técnica"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">Presupuesto & Auditoría</span>
        </button>

        {/* Optional AI Assistant */}
        {onOpenAIModal && (
          <button
            onClick={onOpenAIModal}
            className="px-3.5 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold text-xs md:text-sm flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Asistente IA Arquitectónico"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="hidden xl:inline">Asistente IA</span>
          </button>
        )}

        {/* Export image / project */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onExportPng}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Exportar plano en imagen PNG"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">PNG</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Guardar archivo .JSON del proyecto"
          >
            <Download className="w-4 h-4" />
            <span className="hidden xl:inline">JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Cargar archivo .JSON guardado"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden xl:inline">Abrir</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJson}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>
    </header>
  );
};
