import React from 'react';
import { Keyboard, X, Zap, MousePointer, Hand, Ruler, Trash2, Square, DoorOpen, AppWindow, Tag, Droplet, Armchair, Grid, Eye, Undo2, Redo2, RotateCw } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  label: string;
  description: string;
  icon?: React.ReactNode;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const sections: { title: string; color: string; items: ShortcutItem[] }[] = [
    {
      title: 'Navegación y Edición General',
      color: 'text-indigo-400',
      items: [
        { keys: ['Shift'], label: 'Muros Rectos 90° (Ortogonal)', description: 'Mantiene pulsado para trazar muros perfectamente rectos en 0°, 90°, 180° o 270°', icon: <Square className="w-4 h-4 text-emerald-400" /> },
        { keys: ['Alt'], label: 'Colocación Libre Milimétrica', description: 'Mantiene pulsado para ignorar el imán y colocar objetos o muros con precisión libre (1 cm)', icon: <Ruler className="w-4 h-4 text-amber-400" /> },
        { keys: ['V', '1'], label: 'Herramienta Elegir / Seleccionar', description: 'Seleccionar, mover o inspeccionar elementos en el plano', icon: <MousePointer className="w-4 h-4 text-indigo-400" /> },
        { keys: ['H', 'Espacio'], label: 'Desplazar Lienzo (Pan)', description: 'Arrastrar el plano con el ratón sin modificar elementos', icon: <Hand className="w-4 h-4 text-indigo-400" /> },
        { keys: ['M'], label: 'Regla de Medición Libre', description: 'Medir distancias en metros de punto A a punto B', icon: <Ruler className="w-4 h-4 text-indigo-400" /> },
        { keys: ['R'], label: 'Rotar Mueble / Objeto', description: 'Gira 15° el mueble o artefacto seleccionado (15° horario, Shift+R antihorario)', icon: <RotateCw className="w-4 h-4 text-emerald-400" /> },
        { keys: ['R (Sin Selección)'], label: 'Girar Todo el Plano 90°', description: 'Gira todo el proyecto 90° para trabajar más cómodo en orientación vertical u horizontal', icon: <RotateCw className="w-4 h-4 text-amber-400" /> },
        { keys: ['Supr', 'X'], label: 'Eliminar Elemento', description: 'Borra el muro, tubería, cable o mueble seleccionado', icon: <Trash2 className="w-4 h-4 text-red-400" /> },
      ],
    },
    {
      title: 'Arquitectura 2D (Capa 1)',
      color: 'text-indigo-300',
      items: [
        { keys: ['W'], label: 'Muro Arquitectónico', description: 'Activa la herramienta de trazado de muros en metros', icon: <Square className="w-4 h-4 text-indigo-300" /> },
        { keys: ['D'], label: 'Puerta de Acceso', description: 'Coloca una puerta de 0.80 - 0.90m sobre un muro', icon: <DoorOpen className="w-4 h-4 text-indigo-300" /> },
        { keys: ['N'], label: 'Ventana / Ventanal', description: 'Coloca una ventana de iluminación sobre un muro', icon: <AppWindow className="w-4 h-4 text-indigo-300" /> },
        { keys: ['L'], label: 'Etiqueta de Habitación', description: 'Añadir nombre de estancia y cálculo de superficie (m²)', icon: <Tag className="w-4 h-4 text-indigo-300" /> },
      ],
    },
    {
      title: 'Fontanería, Electricidad y Muebles',
      color: 'text-amber-400',
      items: [
        { keys: ['P'], label: 'Tubería Agua Fría', description: 'Activa el trazado de tuberías azules PPR en metros', icon: <Droplet className="w-4 h-4 text-blue-400" /> },
        { keys: ['E'], label: 'Cableado Eléctrico', description: 'Conecta interruptores y lámparas de techo', icon: <Zap className="w-4 h-4 text-amber-400" /> },
        { keys: ['O'], label: 'Tomacorriente 110V/220V', description: 'Inserta un enchufe o tomacorriente eléctrico', icon: <Zap className="w-4 h-4 text-amber-300" /> },
        { keys: ['S'], label: 'Interruptor Sencillo/Doble', description: 'Coloca un interruptor de iluminación en pared', icon: <Zap className="w-4 h-4 text-amber-300" /> },
        { keys: ['F'], label: 'Insertar Mobiliario', description: 'Activa el último mueble seleccionado en el catálogo', icon: <Armchair className="w-4 h-4 text-purple-400" /> },
      ],
    },
    {
      title: 'Visualización e Historial',
      color: 'text-emerald-400',
      items: [
        { keys: ['G'], label: 'Alternar Cuadrícula (0.5m)', description: 'Muestra u oculta la rejilla calibrada en metros', icon: <Grid className="w-4 h-4 text-emerald-400" /> },
        { keys: ['U'], label: 'Alternar Cotas / Medidas', description: 'Muestra u oculta las cotas de muros en metros', icon: <Eye className="w-4 h-4 text-emerald-400" /> },
        { keys: ['Ctrl + Z'], label: 'Deshacer Acción', description: 'Revierte el último cambio realizado en el proyecto', icon: <Undo2 className="w-4 h-4 text-slate-300" /> },
        { keys: ['Ctrl + Y'], label: 'Rehacer Acción', description: 'Restaura el cambio revertido', icon: <Redo2 className="w-4 h-4 text-slate-300" /> },
        { keys: ['?', 'K'], label: 'Ver Atajos de Teclado', description: 'Abre esta guía rápida de velocidad para arquitectos', icon: <Keyboard className="w-4 h-4 text-purple-300" /> },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Atajos de Teclado para Arquitectos</span>
                <span className="text-[11px] font-semibold bg-indigo-600/30 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  ⚡ Velocidad Profesional
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Presiona estas teclas rápidas sin necesidad de mover el ratón hacia la caja de herramientas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - 2 Column grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm"
            >
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${section.color}`}>
                {section.title}
              </h3>
              <div className="space-y-2.5">
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-start justify-between gap-3 p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800/60 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5">{item.icon}</div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200 leading-tight">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, keyIdx) => (
                        <kbd
                          key={keyIdx}
                          className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono font-bold shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">💡 Consejo de Productividad:</span>
            <span>
              Selecciona un objeto en el plano y presiona <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-200">R</kbd> para rotarlo 90° al instante.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
