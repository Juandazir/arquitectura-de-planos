import React from 'react';
import { 
  Sliders, 
  RotateCw, 
  Trash2, 
  Tag, 
  Ruler, 
  Layers, 
  Zap, 
  Droplet, 
  Armchair,
  Check
} from 'lucide-react';
import { 
  CADProject, 
  Wall, 
  PlumbingFixture, 
  PipeSegment, 
  ElectricalItem, 
  FurnitureItem, 
  RoomLabel, 
  WallOpening 
} from '../types/cad';
import { distance, formatMeters } from '../utils/geometry';

const RotationControl: React.FC<{
  rotation: number;
  onChangeRotation: (deg: number) => void;
  colorClass?: string;
}> = ({ rotation, onChangeRotation, colorClass = 'purple' }) => {
  const normDeg = ((rotation % 360) + 360) % 360;
  const bgClass =
    colorClass === 'purple'
      ? 'bg-purple-600'
      : colorClass === 'cyan'
      ? 'bg-cyan-600'
      : 'bg-amber-600';

  return (
    <div className="space-y-2.5 bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 shadow-inner">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200">
          Rotación libre en planta:
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={360}
            value={normDeg}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 0;
              onChangeRotation(((val % 360) + 360) % 360);
            }}
            className="w-14 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-xs font-bold text-center text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          <span className="text-xs text-slate-400 font-bold">°</span>
        </div>
      </div>

      {/* 0 to 360 Slider */}
      <input
        type="range"
        min={0}
        max={360}
        step={1}
        value={normDeg}
        onChange={(e) => {
          onChangeRotation(parseInt(e.target.value, 10));
        }}
        className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-900 rounded-lg"
      />

      {/* Quick increments: -45, -15, +15, +45 */}
      <div className="grid grid-cols-4 gap-1">
        {[
          { label: '-45°', delta: -45 },
          { label: '-15°', delta: -15 },
          { label: '+15°', delta: 15 },
          { label: '+45°', delta: 45 },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={() => onChangeRotation(((normDeg + btn.delta) % 360 + 360) % 360)}
            className="py-1 bg-slate-900/80 hover:bg-slate-700 border border-slate-700/80 rounded text-[10px] font-bold text-slate-300 transition-colors"
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Standard 90-deg snaps */}
      <div className="grid grid-cols-4 gap-1">
        {[0, 90, 180, 270].map((deg) => (
          <button
            key={deg}
            onClick={() => onChangeRotation(deg)}
            className={`py-1 rounded text-[10px] font-bold transition-all ${
              normDeg === deg
                ? `${bgClass} text-white shadow-sm ring-1 ring-white/20`
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {deg}°
          </button>
        ))}
      </div>
      <div className="text-[10px] text-slate-400 text-center pt-0.5">
        💡 Teclas: presiona <kbd className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 font-mono font-bold border border-slate-700">R</kbd> para rotar 15°
      </div>
    </div>
  );
};

interface PropertiesPanelProps {
  project: CADProject;
  selectedId: string | null;
  selectedType: 'wall' | 'plumbing' | 'pipe' | 'electrical' | 'furniture' | 'room' | null;
  onUpdateWall: (updated: Wall) => void;
  onUpdatePlumbingFixture: (updated: PlumbingFixture) => void;
  onUpdatePipe: (updated: PipeSegment) => void;
  onUpdateElectricalItem: (updated: ElectricalItem) => void;
  onUpdateFurniture: (updated: FurnitureItem) => void;
  onUpdateRoom: (updated: RoomLabel) => void;
  onDeleteSelected: () => void;
  onAddOpeningToWall: (wallId: string, type: 'door' | 'window') => void;
  onDeleteOpening: (openingId: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  project,
  selectedId,
  selectedType,
  onUpdateWall,
  onUpdatePlumbingFixture,
  onUpdatePipe,
  onUpdateElectricalItem,
  onUpdateFurniture,
  onUpdateRoom,
  onDeleteSelected,
  onAddOpeningToWall,
  onDeleteOpening,
}) => {
  if (!selectedId || !selectedType) {
    return (
      <aside className="w-72 bg-slate-900 border-l border-slate-800 p-4 text-slate-300 flex flex-col justify-between select-none shadow-lg z-10">
        <div>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-slate-400 font-bold text-xs uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>Propiedades del Objeto</span>
          </div>
          <div className="py-12 text-center text-slate-500 text-xs">
            Haz clic en un muro, tubería, enchufe o mueble en el lienzo para ver y editar sus medidas y propiedades.
          </div>
        </div>

        {/* Global info summary */}
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 text-xs space-y-1.5">
          <div className="text-slate-300 font-semibold mb-1">Unidades Internacionales:</div>
          <div className="flex justify-between text-slate-400">
            <span>Sistema:</span>
            <span className="font-semibold text-slate-200">Metros (m) / Centímetros (cm)</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Rejilla (Grid):</span>
            <span className="font-semibold text-slate-200">0.50 m</span>
          </div>
        </div>
      </aside>
    );
  }

  // --- WALL INSPECTOR ---
  if (selectedType === 'wall') {
    const wall = project.walls.find((w) => w.id === selectedId);
    if (!wall) return null;
    const lenMeters = distance(wall.start, wall.end);
    const wallOpenings = project.openings.filter((o) => o.wallId === wall.id);

    return (
      <aside className="w-72 bg-slate-900 border-l border-slate-800 p-4 text-slate-200 flex flex-col justify-between select-none shadow-lg z-10 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-400">
              <Sliders className="w-4 h-4" />
              <span>Muro Arquitectónico</span>
            </div>
            <button
              onClick={onDeleteSelected}
              className="p-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
              title="Eliminar muro"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 space-y-2.5">
            <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-700/50">
              <span className="text-slate-400 font-semibold">Longitud del muro:</span>
              <span className="font-bold text-indigo-300 text-sm">{formatMeters(lenMeters)}</span>
            </div>

            <div className="text-[11px] font-bold text-slate-300">Coordenadas Exactas (m):</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400">Inicio X (m):</label>
                <input
                  type="number"
                  step={0.01}
                  value={wall.start.x}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onUpdateWall({ ...wall, start: { ...wall.start, x: val } });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400">Inicio Y (m):</label>
                <input
                  type="number"
                  step={0.01}
                  value={wall.start.y}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onUpdateWall({ ...wall, start: { ...wall.start, y: val } });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400">Fin X (m):</label>
                <input
                  type="number"
                  step={0.01}
                  value={wall.end.x}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onUpdateWall({ ...wall, end: { ...wall.end, x: val } });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400">Fin Y (m):</label>
                <input
                  type="number"
                  step={0.01}
                  value={wall.end.y}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onUpdateWall({ ...wall, end: { ...wall.end, y: val } });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Wall Thickness */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Espesor de Muro (Metros):
            </label>
            <select
              value={wall.thickness}
              onChange={(e) =>
                onUpdateWall({ ...wall, thickness: parseFloat(e.target.value) })
              }
              className="w-full bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value={0.10}>0.10 m (10 cm - Tabique liviano)</option>
              <option value={0.15}>0.15 m (15 cm - Muro interior estándar)</option>
              <option value={0.20}>0.20 m (20 cm - Muro exterior perimetral)</option>
              <option value={0.30}>0.30 m (30 cm - Muro estructural doble)</option>
            </select>
          </div>

          {/* Wall Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tipo estructural:
            </label>
            <select
              value={wall.type}
              onChange={(e) =>
                onUpdateWall({ ...wall, type: e.target.value as Wall['type'] })
              }
              className="w-full bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="exterior">Exterior Perimetral</option>
              <option value="interior">Interior Carga / División</option>
              <option value="partition">Tabiquería</option>
            </select>
          </div>

          {/* Openings (doors & windows on this wall) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                Puertas & Ventanas en este muro:
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-3">
              <button
                onClick={() => onAddOpeningToWall(wall.id, 'door')}
                className="px-2 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-semibold"
              >
                + Añadir Puerta (0.8m)
              </button>
              <button
                onClick={() => onAddOpeningToWall(wall.id, 'window')}
                className="px-2 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-semibold"
              >
                + Añadir Ventana (1.2m)
              </button>
            </div>

            {wallOpenings.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic">
                Sin puertas o ventanas insertadas
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {wallOpenings.map((op) => (
                  <div
                    key={op.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/70 border border-slate-700 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">
                        {op.type === 'door' ? 'Puerta' : 'Ventana'}
                      </span>
                      <span className="text-slate-400 ml-1">
                        ({op.width.toFixed(2)} m de ancho)
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteOpening(op.id)}
                      className="text-red-400 hover:text-red-300"
                      title="Eliminar apertura"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onDeleteSelected}
          className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md mt-4"
        >
          <Trash2 className="w-4 h-4" />
          <span>Eliminar Muro</span>
        </button>
      </aside>
    );
  }

  // --- FURNITURE INSPECTOR ---
  if (selectedType === 'furniture') {
    const item = project.furniture.find((f) => f.id === selectedId);
    if (!item) return null;

    return (
      <aside className="w-72 bg-slate-900 border-l border-slate-800 p-4 text-slate-200 flex flex-col justify-between select-none shadow-lg z-10 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-purple-400">
              <Armchair className="w-4 h-4" />
              <span>Mobiliario Realista</span>
            </div>
            <button
              onClick={onDeleteSelected}
              className="p-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
              title="Eliminar mueble"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre de Mueble:
            </label>
            <input
              type="text"
              value={item.name}
              onChange={(e) =>
                onUpdateFurniture({ ...item, name: e.target.value })
              }
              className="w-full bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 space-y-2 text-xs">
            <div className="font-bold text-purple-300 pb-1 border-b border-slate-700/50">
              Dimensiones y Ubicación Exacta (m):
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400">Ancho X (m):</label>
                <input
                  type="number"
                  step={0.01}
                  min={0.1}
                  value={item.width}
                  onChange={(e) => {
                    const val = Math.max(0.1, parseFloat(e.target.value) || 0.1);
                    onUpdateFurniture({ ...item, width: val });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400">Fondo Y (m):</label>
                <input
                  type="number"
                  step={0.01}
                  min={0.1}
                  value={item.depth}
                  onChange={(e) => {
                    const val = Math.max(0.1, parseFloat(e.target.value) || 0.1);
                    onUpdateFurniture({ ...item, depth: val });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400">Centro X (m):</label>
                <input
                  type="number"
                  step={0.01}
                  value={item.position.x}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onUpdateFurniture({ ...item, position: { ...item.position, x: val } });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400">Centro Y (m):</label>
                <input
                  type="number"
                  step={0.01}
                  value={item.position.y}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onUpdateFurniture({ ...item, position: { ...item.position, y: val } });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Rotation controls */}
          <RotationControl
            rotation={item.rotation}
            onChangeRotation={(deg) => onUpdateFurniture({ ...item, rotation: deg })}
            colorClass="purple"
          />

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas / Especificación:
            </label>
            <textarea
              value={item.notes || ''}
              onChange={(e) =>
                onUpdateFurniture({ ...item, notes: e.target.value })
              }
              rows={3}
              placeholder="Ej: Cabecero con luces LED, espacio para cajón..."
              className="w-full bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
        </div>

        <button
          onClick={onDeleteSelected}
          className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md mt-4"
        >
          <Trash2 className="w-4 h-4" />
          <span>Eliminar Mueble</span>
        </button>
      </aside>
    );
  }

  // --- PLUMBING FIXTURE INSPECTOR ---
  if (selectedType === 'plumbing') {
    const fixture = project.plumbingFixtures.find((f) => f.id === selectedId);
    if (!fixture) return null;

    return (
      <aside className="w-72 bg-slate-900 border-l border-slate-800 p-4 text-slate-200 flex flex-col justify-between select-none shadow-lg z-10 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-cyan-400">
              <Droplet className="w-4 h-4" />
              <span>Artefacto Sanitario</span>
            </div>
            <button
              onClick={onDeleteSelected}
              className="p-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Etiqueta de Artefacto:
            </label>
            <input
              type="text"
              value={fixture.label}
              onChange={(e) =>
                onUpdatePlumbingFixture({ ...fixture, label: e.target.value })
              }
              className="w-full bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Tipo:</span>
              <span className="font-bold text-cyan-300 uppercase">{fixture.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Dimensiones (m):</span>
              <span className="text-slate-300">
                {fixture.width}m × {fixture.depth}m
              </span>
            </div>
          </div>

          {/* Rotation controls */}
          <RotationControl
            rotation={fixture.rotation}
            onChangeRotation={(deg) =>
              onUpdatePlumbingFixture({ ...fixture, rotation: deg })
            }
            colorClass="cyan"
          />
        </div>

        <button
          onClick={onDeleteSelected}
          className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md mt-4"
        >
          <Trash2 className="w-4 h-4" />
          <span>Eliminar Artefacto</span>
        </button>
      </aside>
    );
  }

  // --- PIPE INSPECTOR ---
  if (selectedType === 'pipe') {
    const pipe = project.pipes.find((p) => p.id === selectedId);
    if (!pipe) return null;
    const lenMeters = distance(pipe.start, pipe.end);

    return (
      <aside className="w-72 bg-slate-900 border-l border-slate-800 p-4 text-slate-200 flex flex-col justify-between select-none shadow-lg z-10 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-cyan-400">
              <Droplet className="w-4 h-4" />
              <span>Tubería de Fontanería</span>
            </div>
            <button
              onClick={onDeleteSelected}
              className="p-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Longitud del tramo:</span>
              <span className="font-bold text-cyan-300">{formatMeters(lenMeters)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Servicio:</span>
              <span className="font-bold text-slate-200">
                {pipe.pipeType === 'cold_water'
                  ? 'Agua Fría (Azul)'
                  : pipe.pipeType === 'hot_water'
                  ? 'Agua Caliente (Roja)'
                  : 'Drenaje / Desagüe (110mm)'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Diámetro Nominal (mm):
            </label>
            <select
              value={pipe.diameterMm}
              onChange={(e) =>
                onUpdatePipe({ ...pipe, diameterMm: parseInt(e.target.value, 10) })
              }
              className="w-full bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-3 py-2"
            >
              <option value={20}>20 mm (1/2" estándar para grifo)</option>
              <option value={25}>25 mm (3/4" línea principal)</option>
              <option value={50}>50 mm (Drenaje de lavamanos/ducha)</option>
              <option value={110}>110 mm (4" descarga de Inodoro WC)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Material de Tubería:
            </label>
            <select
              value={pipe.material}
              onChange={(e) =>
                onUpdatePipe({
                  ...pipe,
                  material: e.target.value as PipeSegment['material'],
                })
              }
              className="w-full bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-3 py-2"
            >
              <option value="PPR">PPR (Polipropileno Termofusión)</option>
              <option value="PVC">PVC Sanitario</option>
              <option value="CPVC">CPVC (Agua Caliente)</option>
              <option value="Cobre">Cobre</option>
            </select>
          </div>
        </div>

        <button
          onClick={onDeleteSelected}
          className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md mt-4"
        >
          <Trash2 className="w-4 h-4" />
          <span>Eliminar Tramo</span>
        </button>
      </aside>
    );
  }

  // --- ELECTRICAL ITEM INSPECTOR ---
  if (selectedType === 'electrical') {
    const item = project.electricalItems.find((e) => e.id === selectedId);
    if (!item) return null;

    return (
      <aside className="w-72 bg-slate-900 border-l border-slate-800 p-4 text-slate-200 flex flex-col justify-between select-none shadow-lg z-10 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-400">
              <Zap className="w-4 h-4" />
              <span>Elemento Eléctrico</span>
            </div>
            <button
              onClick={onDeleteSelected}
              className="p-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Etiqueta de Punto:
            </label>
            <input
              type="text"
              value={item.label}
              onChange={(e) =>
                onUpdateElectricalItem({ ...item, label: e.target.value })
              }
              className="w-full bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Circuito Eléctrico:
            </label>
            <select
              value={item.circuit || 'C1-Iluminación'}
              onChange={(e) =>
                onUpdateElectricalItem({ ...item, circuit: e.target.value })
              }
              className="w-full bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-3 py-2"
            >
              <option value="Principal">Principal (Tablero)</option>
              <option value="C1-Iluminación">C1 - Iluminación (14 AWG)</option>
              <option value="C2-Tomacorrientes">C2 - Tomacorrientes (12 AWG)</option>
              <option value="C3-Alta Potencia">C3 - Alta Potencia (Nevera/A.A.)</option>
            </select>
          </div>

          {/* Rotation controls */}
          <RotationControl
            rotation={item.rotation}
            onChangeRotation={(deg) =>
              onUpdateElectricalItem({ ...item, rotation: deg })
            }
            colorClass="amber"
          />
        </div>

        <button
          onClick={onDeleteSelected}
          className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md mt-4"
        >
          <Trash2 className="w-4 h-4" />
          <span>Eliminar Elemento</span>
        </button>
      </aside>
    );
  }

  // --- ROOM LABEL INSPECTOR ---
  if (selectedType === 'room') {
    const room = project.rooms.find((r) => r.id === selectedId);
    if (!room) return null;

    return (
      <aside className="w-72 bg-slate-900 border-l border-slate-800 p-4 text-slate-200 flex flex-col justify-between select-none shadow-lg z-10 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-400">
              <Tag className="w-4 h-4" />
              <span>Etiqueta de Habitación</span>
            </div>
            <button
              onClick={onDeleteSelected}
              className="p-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre del Espacio:
            </label>
            <input
              type="text"
              value={room.name}
              onChange={(e) =>
                onUpdateRoom({ ...room, name: e.target.value })
              }
              className="w-full bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Área Construida Estimada (m²):
            </label>
            <input
              type="number"
              step="1"
              value={room.areaM2 || 12}
              onChange={(e) =>
                onUpdateRoom({
                  ...room,
                  areaM2: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <button
          onClick={onDeleteSelected}
          className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md mt-4"
        >
          <Trash2 className="w-4 h-4" />
          <span>Eliminar Etiqueta</span>
        </button>
      </aside>
    );
  }

  return null;
};
