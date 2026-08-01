import React from 'react';
import { 
  X, 
  CheckCircle2, 
  ChevronRight, 
  Lightbulb, 
  ArrowRight, 
  BookOpen, 
  Ruler, 
  Droplet, 
  Zap, 
  Armchair, 
  Layers 
} from 'lucide-react';
import { STEP_BY_STEP_GUIDES } from '../data/catalog';
import { CADLayer } from '../types/cad';

interface StepByStepGuideProps {
  isOpen: boolean;
  onClose: () => void;
  activeStep: number;
  onSelectStep: (step: number, layer: CADLayer) => void;
}

export const StepByStepGuide: React.FC<StepByStepGuideProps> = ({
  isOpen,
  onClose,
  activeStep,
  onSelectStep,
}) => {
  if (!isOpen) return null;

  const currentGuide =
    STEP_BY_STEP_GUIDES.find((g) => g.stepNumber === activeStep) ||
    STEP_BY_STEP_GUIDES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg h-full bg-slate-900 border-l border-slate-800 flex flex-col text-slate-100 shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center border border-indigo-500/30 font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-white">
                Guía Paso a Paso • Arquitectura & Sistemas
              </h2>
              <p className="text-xs text-slate-400">
                Aprende a estructurar planos realistas con medidas internacionales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator pills */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-1 overflow-x-auto">
          {STEP_BY_STEP_GUIDES.map((guide) => {
            const isSelected = guide.stepNumber === activeStep;
            return (
              <button
                key={guide.stepNumber}
                onClick={() => onSelectStep(guide.stepNumber, guide.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <span>Paso {guide.stepNumber}</span>
              </button>
            );
          })}
        </div>

        {/* Content body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Paso {currentGuide.stepNumber} de 5</span>
            </div>
            <h3 className="text-xl font-extrabold text-white">
              {currentGuide.title}
            </h3>
            <p className="text-sm font-semibold text-indigo-300 mt-0.5">
              {currentGuide.subtitle}
            </p>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {currentGuide.description}
            </p>
          </div>

          {/* Checkpoints */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/70 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Puntos clave de esta etapa:</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-200">
              {currentGuide.checkpoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Technical tips */}
          <div className="bg-indigo-950/40 rounded-xl p-4 border border-indigo-500/30 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Consejo de norma internacional:</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-indigo-200">
              {currentGuide.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              const prevStep = Math.max(1, activeStep - 1);
              const g = STEP_BY_STEP_GUIDES.find((s) => s.stepNumber === prevStep);
              if (g) onSelectStep(prevStep, g.id);
            }}
            disabled={activeStep === 1}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeStep === 1
                ? 'text-slate-600 cursor-not-allowed'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            ← Paso anterior
          </button>

          <button
            onClick={() => {
              if (activeStep < 5) {
                const nextStep = activeStep + 1;
                const g = STEP_BY_STEP_GUIDES.find((s) => s.stepNumber === nextStep);
                if (g) onSelectStep(nextStep, g.id);
              } else {
                onClose();
              }
            }}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
          >
            <span>{activeStep < 5 ? 'Siguiente paso' : 'Comenzar a diseñar'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
