import React, { useState } from 'react';
import { X, Sparkles, Send, Loader2, Lightbulb, CheckCircle } from 'lucide-react';
import { CADProject } from '../types/cad';
import { GoogleGenAI } from '@google/genai';
import { runTechnicalAudit } from '../utils/validation';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CADProject;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [prompt, setPrompt] = useState(
    'Por favor analiza mi plano arquitectónico, tuberías y electricidad, y sugéreme mejoras ergonómicas o técnicas en metros.'
  );
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    setLoading(true);
    setResponse(null);

    try {
      // Check for Gemini API key
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const summary = {
          name: project.name,
          wallsCount: project.walls.length,
          roomsCount: project.rooms.length,
          plumbingFixtures: project.plumbingFixtures.map((f) => f.label),
          electricalItems: project.electricalItems.map((e) => e.label),
          furnitureItems: project.furniture.map((f) => f.name),
        };

        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Eres un arquitecto e ingeniero civil experto en normas internacionales y diseño CAD 2D en metros.
Analiza este proyecto en formato JSON resumido:
${JSON.stringify(summary, null, 2)}
Pregunta o solicitud del usuario: "${prompt}"

Responde en español con una evaluación clara, estructurada con viñetas:
1. Evaluación general del plano y circulaciones en metros.
2. Comentarios sobre la instalación de Fontanería / Tuberías.
3. Comentarios sobre la Red Eléctrica y circuitos.
4. Recomendación sobre la ergonomía y medidas de los muebles.`
        });
        setResponse(res.text || 'Análisis completado.');
      } else {
        // Fallback intelligent deterministic analysis
        const issues = runTechnicalAudit(project);
        let text = `### 📐 Análisis Técnico Arquitectónico para "${project.name}"\n\n`;
        text += `**1. Distribución y Superficie (en metros):**\n`;
        text += `- Tienes **${project.walls.length} muros** trazados y **${project.rooms.length} estancias** etiquetadas.\n`;
        text += `- La grilla está configurada en pasos de **0.50 m** para garantizar alineación ortogonal.\n\n`;

        text += `**2. Red de Fontanería (Agua y Drenaje):**\n`;
        if (project.plumbingFixtures.length === 0) {
          text += `- *Aún no has insertado artefactos sanitarios.* Te recomendamos ir al Paso 2 para colocar el inodoro, lavamanos y ducha con sus tuberías de 110mm y 20mm.\n\n`;
        } else {
          text += `- Cuentas con **${project.plumbingFixtures.length} artefactos** instalados. Asegúrate de conectar siempre la tubería azul (Agua fría PPR) y naranja (Drenaje 110mm para WC).\n\n`;
        }

        text += `**3. Red Eléctrica:**\n`;
        if (project.electricalItems.length === 0) {
          text += `- *Falta ubicar el Tablero General y los puntos de luz.* Ve al Paso 3 para insertar lámparas LED y tomacorrientes a 110V/220V.\n\n`;
        } else {
          text += `- Tienes **${project.electricalItems.length} elementos eléctricos**. Recuerda que en cocina se sugieren mínimo 3 tomacorrientes sobre encimera.\n\n`;
        }

        text += `**4. Observaciones de Auditoría Técnica:**\n`;
        if (issues.length === 0) {
          text += `- **¡Excelente!** Tu plano cumple con las normas básicas de accesibilidad y fontanería.\n`;
        } else {
          issues.forEach((iss, idx) => {
            text += `${idx + 1}. **${iss.title}**: ${iss.description} → *${iss.recommendation}*\n`;
          });
        }
        setResponse(text);
      }
    } catch {
      // Fallback message if network fails
      const issues = runTechnicalAudit(project);
      let text = `### 📐 Resumen Técnico para "${project.name}"\n\n`;
      text += `Tu proyecto cuenta con **${project.walls.length} muros** y **${project.furniture.length} muebles** con medidas reales.\n\n`;
      text += `**Puntos destacados de tu plano:**\n`;
      if (issues.length === 0) {
        text += `- Todas las habitaciones y circuitos están correctamente planteados.\n`;
      } else {
        issues.forEach((iss, idx) => {
          text += `- **${iss.title}**: ${iss.recommendation}\n`;
        });
      }
      setResponse(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl flex flex-col max-h-[85vh] text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/30 text-purple-300 flex items-center justify-center border border-purple-500/30 font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-white">
                Asistente IA Arquitectónico
              </h2>
              <p className="text-xs text-slate-400">
                Revisión técnica de medidas en metros y recomendaciones
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

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Consulta o solicitud para el Asistente:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full bg-slate-800 text-xs text-slate-100 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analizando plano y normativa en metros...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analizar Proyecto Arquitectónico</span>
              </>
            )}
          </button>

          {response && (
            <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/70 text-xs text-slate-200 leading-relaxed space-y-2 whitespace-pre-wrap">
              {response}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
