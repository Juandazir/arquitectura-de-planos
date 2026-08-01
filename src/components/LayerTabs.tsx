import React from 'react';
import { 
  Home, 
  Droplet, 
  Zap, 
  Armchair, 
  Layers, 
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { CADLayer } from '../types/cad';

interface LayerTabsProps {
  activeLayer: CADLayer;
  onChangeLayer: (layer: CADLayer) => void;
  onOpenStepGuide: (stepNumber: number) => void;
  onToggleLayerVisibility?: (layer: 'arch' | 'plumbing' | 'electrical' | 'furniture') => void;
  visibleLayers?: {
    arch: boolean;
    plumbing: boolean;
    electrical: boolean;
    furniture: boolean;
  };
  counts: {
    archCount: number;
    plumbingCount: number;
    electricalCount: number;
    furnitureCount: number;
  };
}

export const LayerTabs: React.FC<LayerTabsProps> = ({
  activeLayer,
  onChangeLayer,
  onOpenStepGuide,
  onToggleLayerVisibility,
  visibleLayers,
  counts,
}) => {
  const tabs = [
    {
      id: 'arch' as CADLayer,
      step: 1,
      title: '1. Arquitectura',
      subtitle: 'Muros & Accesos',
      icon: Home,
      color: 'from-blue-600 to-indigo-600',
      badge: counts.archCount,
    },
    {
      id: 'plumbing' as CADLayer,
      step: 2,
      title: '2. Tuberías / Fontanería',
      subtitle: 'Agua & Drenaje',
      icon: Droplet,
      color: 'from-cyan-600 to-blue-600',
      badge: counts.plumbingCount,
    },
    {
      id: 'electrical' as CADLayer,
      step: 3,
      title: '3. Electricidad',
      subtitle: 'Circuitos & Luz',
      icon: Zap,
      color: 'from-amber-600 to-orange-600',
      badge: counts.electricalCount,
    },
    {
      id: 'furniture' as CADLayer,
      step: 4,
      title: '4. Mobiliario Realista',
      subtitle: 'Muebles (m)',
      icon: Armchair,
      color: 'from-purple-600 to-pink-600',
      badge: counts.furnitureCount,
    },
    {
      id: 'all' as CADLayer,
      step: 5,
      title: '5. Vista Integral',
      subtitle: 'Inspección total',
      icon: Layers,
      color: 'from-emerald-600 to-teal-600',
      badge: null,
    },
  ];

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between overflow-x-auto select-none shadow-sm z-20">
      <div className="flex items-center space-x-1 sm:space-x-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeLayer === tab.id;
          const isVisible = tab.id === 'all'
            ? Object.values(visibleLayers || {}).some(Boolean)
            : (visibleLayers ? visibleLayers[tab.id as keyof typeof visibleLayers] : true);

          return (
            <button
              key={tab.id}
              onClick={() => onChangeLayer(tab.id)}
              className={`group relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium'
              } ${!isVisible ? 'opacity-70' : ''}`}
            >
              {/* Step indicator pill */}
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                }`}
              >
                {tab.step}
              </span>

              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-indigo-400' : 'text-slate-400'
                    }`}
                  />
                  <span className={`text-xs tracking-tight ${!isVisible ? 'text-slate-500 line-through decoration-slate-600' : ''}`}>
                    {tab.title}
                  </span>
                  {tab.badge !== null && tab.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-slate-700 text-slate-300 rounded-full font-semibold">
                      {tab.badge}
                    </span>
                  )}
                  {tab.id !== 'all' && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLayerVisibility?.(tab.id as 'arch' | 'plumbing' | 'electrical' | 'furniture');
                      }}
                      title={isVisible ? `Desactivar visibilidad de ${tab.title}` : `Activar visibilidad de ${tab.title}`}
                      className={`ml-1 p-1 rounded-md transition-all cursor-pointer border ${
                        isVisible
                          ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600 hover:text-white'
                          : 'bg-slate-800/80 text-slate-500 border-slate-700/60 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {isVisible ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 -mt-0.5 hidden md:block">
                  {tab.subtitle}
                </span>
              </div>

              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-400">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span>Haz clic en la capa para activarla o en el ojo (👁️) para ocultarla o mostrarla</span>
      </div>
    </div>
  );
};
