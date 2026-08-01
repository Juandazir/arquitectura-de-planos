import React, { useState } from 'react';
import { 
  MousePointer, 
  Hand, 
  Ruler, 
  Move,
  Square, 
  DoorOpen, 
  AppWindow, 
  Tag, 
  Droplet, 
  Zap, 
  Armchair, 
  Trash2, 
  Plus, 
  ChevronDown,
  BedDouble,
  Sofa,
  Utensils,
  LayoutGrid,
  Laptop,
  Box
} from 'lucide-react';
import { 
  CADLayer, 
  ToolType, 
  PlumbingFixtureType, 
  ElectricalItemType 
} from '../types/cad';
import { FURNITURE_CATALOG } from '../data/catalog';

interface ToolboxProps {
  activeLayer: CADLayer;
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  selectedFurnitureId: string;
  onSelectFurnitureId: (id: string) => void;
  selectedPlumbingType: PlumbingFixtureType;
  onSelectPlumbingType: (type: PlumbingFixtureType) => void;
  selectedElectricalType: ElectricalItemType;
  onSelectElectricalType: (type: ElectricalItemType) => void;
}

export const Toolbox: React.FC<ToolboxProps> = ({
  activeLayer,
  activeTool,
  onSelectTool,
  selectedFurnitureId,
  onSelectFurnitureId,
  selectedPlumbingType,
  onSelectPlumbingType,
  selectedElectricalType,
  onSelectElectricalType,
}) => {
  const [furnitureCategory, setFurnitureCategory] = useState<string>('all');

  const filteredFurniture = FURNITURE_CATALOG.filter(
    (item) => furnitureCategory === 'all' || item.category === furnitureCategory
  );

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col h-full select-none overflow-y-auto z-10 shadow-lg">
      {/* General controls */}
      <div className="p-3 border-b border-slate-800">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Herramientas Básicas
        </h3>
        <div className="grid grid-cols-5 gap-1">
          <button
            onClick={() => onSelectTool('select')}
            className={`p-1.5 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all ${
              activeTool === 'select'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
            title="Seleccionar / Inspeccionar (Teclas: V o 1)"
          >
            <MousePointer className="w-4 h-4 mb-1" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px]">Elegir</span>
              <kbd className="text-[9px] bg-slate-950/70 px-1 py-0.5 rounded text-indigo-300 font-mono font-bold">V</kbd>
            </div>
          </button>

          <button
            onClick={() => onSelectTool('move')}
            className={`p-1.5 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all ${
              activeTool === 'move'
                ? 'bg-indigo-600 text-white shadow-sm font-bold ring-1 ring-indigo-400'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
            title="Mover objeto existente en el plano (Muro, Mueble, Tubería - Tecla: M)"
          >
            <Move className="w-4 h-4 mb-1 text-cyan-400" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px]">Mover</span>
              <kbd className="text-[9px] bg-slate-950/70 px-1 py-0.5 rounded text-cyan-300 font-mono font-bold">M</kbd>
            </div>
          </button>

          <button
            onClick={() => onSelectTool('pan')}
            className={`p-1.5 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all ${
              activeTool === 'pan'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
            title="Desplazar plano / Mover vista (Teclas: H o Espacio)"
          >
            <Hand className="w-4 h-4 mb-1" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px]">Pan</span>
              <kbd className="text-[9px] bg-slate-950/70 px-1 py-0.5 rounded text-indigo-300 font-mono font-bold">H</kbd>
            </div>
          </button>

          <button
            onClick={() => onSelectTool('measure')}
            className={`p-2 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all ${
              activeTool === 'measure'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
            title="Regla / Medición libre de metros (Tecla: M)"
          >
            <Ruler className="w-4 h-4 mb-1" />
            <div className="flex items-center gap-1">
              <span className="text-[10px]">Medir</span>
              <kbd className="text-[9px] bg-slate-950/70 px-1 py-0.5 rounded text-indigo-300 font-mono font-bold">M</kbd>
            </div>
          </button>

          <button
            onClick={() => onSelectTool('eraser')}
            className={`p-2 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all ${
              activeTool === 'eraser'
                ? 'bg-red-600 text-white shadow-sm font-bold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
            title="Borrador / Eliminar elemento (Teclas: X o Supr)"
          >
            <Trash2 className="w-4 h-4 mb-1" />
            <div className="flex items-center gap-1">
              <span className="text-[10px]">Borrar</span>
              <kbd className="text-[9px] bg-slate-950/70 px-1 py-0.5 rounded text-red-300 font-mono font-bold">X</kbd>
            </div>
          </button>
        </div>
      </div>

      {/* Layer specific tools */}
      <div className="p-3 flex-1 overflow-y-auto">
        {/* ARCHITECTURE LAYER */}
        {(activeLayer === 'arch' || activeLayer === 'all') && (
          <div className="mb-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-2 flex items-center justify-between">
              <span>1. Arquitectura 2D (m)</span>
              <span className="text-[10px] font-mono text-slate-500">Atajos</span>
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => onSelectTool('wall')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all ${
                  activeTool === 'wall'
                    ? 'bg-indigo-600 text-white shadow-md font-bold'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center">
                    <Square className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold">Muro Arquitectónico</div>
                    <div className="text-[10px] text-slate-400">
                      Clic inicio y fin (Espesor 15/20cm)
                    </div>
                  </div>
                </div>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-indigo-300 font-mono text-[10px] font-bold">W</kbd>
              </button>

              <button
                onClick={() => onSelectTool('door')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all ${
                  activeTool === 'door'
                    ? 'bg-indigo-600 text-white shadow-md font-bold'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center">
                    <DoorOpen className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold">Puerta de Acceso</div>
                    <div className="text-[10px] text-slate-400">
                      0.80 - 0.90m con ángulo de apertura
                    </div>
                  </div>
                </div>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-indigo-300 font-mono text-[10px] font-bold">D</kbd>
              </button>

              <button
                onClick={() => onSelectTool('window')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all ${
                  activeTool === 'window'
                    ? 'bg-indigo-600 text-white shadow-md font-bold'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center">
                    <AppWindow className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold">Ventana / Ventanal</div>
                    <div className="text-[10px] text-slate-400">
                      Iluminación y ventilación en muro
                    </div>
                  </div>
                </div>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-indigo-300 font-mono text-[10px] font-bold">N</kbd>
              </button>

              <button
                onClick={() => onSelectTool('room_label')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all ${
                  activeTool === 'room_label'
                    ? 'bg-indigo-600 text-white shadow-md font-bold'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold">Etiqueta de Habitación</div>
                    <div className="text-[10px] text-slate-400">
                      Asignar nombre y m² al espacio
                    </div>
                  </div>
                </div>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-indigo-300 font-mono text-[10px] font-bold">L</kbd>
              </button>
            </div>
          </div>
        )}

        {/* PLUMBING LAYER */}
        {(activeLayer === 'plumbing' || activeLayer === 'all') && (
          <div className="mb-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
              <span>2. Fontanería / Tuberías</span>
            </h3>

            {/* Pipe drawing tools */}
            <div className="space-y-1.5 mb-3">
              <button
                onClick={() => onSelectTool('pipe_cold')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all ${
                  activeTool === 'pipe_cold'
                    ? 'bg-blue-600 text-white shadow-md font-bold'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border-l-4 border-blue-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                  <div className="text-left">
                    <div className="text-xs font-semibold">Tubería Agua Fría</div>
                    <div className="text-[10px] text-slate-400">
                      Línea azul PPR / PVC (20 mm)
                    </div>
                  </div>
                </div>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-cyan-300 font-mono text-[10px] font-bold">P</kbd>
              </button>

              <button
                onClick={() => onSelectTool('pipe_hot')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all ${
                  activeTool === 'pipe_hot'
                    ? 'bg-red-600 text-white shadow-md font-bold'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border-l-4 border-red-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                  <div className="text-left">
                    <div className="text-xs font-semibold">Tubería Agua Caliente</div>
                    <div className="text-[10px] text-slate-400">
                      Línea roja CPVC / Cobre (20 mm)
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onSelectTool('pipe_drain')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all ${
                  activeTool === 'pipe_drain'
                    ? 'bg-amber-600 text-white shadow-md font-bold'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border-l-4 border-amber-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                  <div className="text-left">
                    <div className="text-xs font-semibold">Drenaje / Desagüe</div>
                    <div className="text-[10px] text-slate-400">
                      Línea naranja sanitaria (110 mm)
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Plumbing fixtures picker */}
            <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
              <div className="text-[11px] font-bold text-slate-300 mb-2">
                Artefactos Sanitarios (m)
              </div>
              <div className="space-y-1">
                {[
                  { type: 'toilet' as PlumbingFixtureType, label: 'Inodoro (WC)', dim: '0.50 x 0.70m' },
                  { type: 'sink' as PlumbingFixtureType, label: 'Lavamanos Baño', dim: '0.55 x 0.45m' },
                  { type: 'shower' as PlumbingFixtureType, label: 'Plato de Ducha', dim: '0.90 x 0.90m' },
                  { type: 'kitchen_sink' as PlumbingFixtureType, label: 'Fregadero Cocina', dim: '0.80 x 0.50m' },
                  { type: 'water_heater' as PlumbingFixtureType, label: 'Calentador / Boiler', dim: '0.45 x 0.45m' },
                ].map((fix) => (
                  <button
                    key={fix.type}
                    onClick={() => {
                      onSelectPlumbingType(fix.type);
                      onSelectTool('plumbing_fixture');
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between text-xs transition-all ${
                      activeTool === 'plumbing_fixture' && selectedPlumbingType === fix.type
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{fix.label}</span>
                    <span className="text-[10px] text-slate-400">{fix.dim}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ELECTRICAL LAYER */}
        {(activeLayer === 'electrical' || activeLayer === 'all') && (
          <div className="mb-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
              <span>3. Electricidad & Cableado</span>
            </h3>

            {/* Wiring tool */}
            <div className="mb-3">
              <button
                onClick={() => onSelectTool('elec_wire')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all ${
                  activeTool === 'elec_wire'
                    ? 'bg-amber-600 text-white shadow-md font-bold'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border-l-4 border-amber-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <div className="text-left">
                    <div className="text-xs font-semibold">Cableado (Conector)</div>
                    <div className="text-[10px] text-slate-400">
                      Conecta interruptor con su lámpara
                    </div>
                  </div>
                </div>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-amber-300 font-mono text-[10px] font-bold">E</kbd>
              </button>
            </div>

            {/* Electrical items picker */}
            <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
              <div className="text-[11px] font-bold text-slate-300 mb-2">
                Puntos Eléctricos y Tablero
              </div>
              <div className="space-y-1">
                {[
                  { type: 'panel' as ElectricalItemType, label: 'Tablero General', desc: 'Centro de carga' },
                  { type: 'light_ceiling' as ElectricalItemType, label: 'Plafón LED Techo', desc: 'Iluminación central' },
                  { type: 'switch_single' as ElectricalItemType, label: 'Interruptor Sencillo', desc: '1 Control' },
                  { type: 'switch_double' as ElectricalItemType, label: 'Interruptor Doble', desc: '2 Controles' },
                  { type: 'outlet_110v' as ElectricalItemType, label: 'Enchufe 110V', desc: 'Tomacorriente' },
                  { type: 'outlet_220v' as ElectricalItemType, label: 'Enchufe 220V', desc: 'Alta potencia' },
                ].map((elec) => (
                  <button
                    key={elec.type}
                    onClick={() => {
                      onSelectElectricalType(elec.type);
                      onSelectTool(
                        elec.type === 'panel'
                          ? 'elec_panel'
                          : elec.type.includes('outlet')
                          ? 'elec_outlet'
                          : elec.type.includes('switch')
                          ? 'elec_switch'
                          : 'elec_light'
                      );
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between text-xs transition-all ${
                      (activeTool === 'elec_panel' || activeTool === 'elec_outlet' || activeTool === 'elec_switch' || activeTool === 'elec_light') &&
                      selectedElectricalType === elec.type
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{elec.label}</span>
                    <span className="text-[10px] text-slate-400">{elec.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FURNITURE LAYER */}
        {(activeLayer === 'furniture' || activeLayer === 'all') && (
          <div className="mb-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-purple-400 mb-2 flex items-center justify-between">
              <span>4. Catálogo con Medidas (m)</span>
              <span className="text-[10px] font-mono text-slate-500">Tecla F</span>
            </h3>

            {/* Category filter */}
            <div className="flex flex-wrap gap-1 mb-2.5">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'bedroom', label: 'Dormitorio' },
                { id: 'living', label: 'Sala' },
                { id: 'dining', label: 'Comedor' },
                { id: 'kitchen', label: 'Cocina' },
                { id: 'office', label: 'Estudio' },
                { id: 'bathroom', label: 'Baño/Lav.' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFurnitureCategory(cat.id)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                    furnitureCategory === cat.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Furniture list */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {filteredFurniture.map((item) => {
                const isSelected =
                  activeTool === 'furniture_item' && selectedFurnitureId === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectFurnitureId(item.id);
                      onSelectTool('furniture_item');
                    }}
                    className={`w-full p-2.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-600/90 text-white border-purple-400 shadow-md'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold leading-tight">{item.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.width.toFixed(2)}m × {item.depth.toFixed(2)}m
                      </div>
                    </div>
                    <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900/80 text-purple-300">
                      + Insertar
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer tips */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="font-semibold text-slate-300 mb-1">💡 Consejo Técnico:</div>
        <div>
          Las medidas son en <strong>metros (m)</strong>. Haz clic en el lienzo para colocar objetos o trazar tubería.
        </div>
      </div>
    </aside>
  );
};
