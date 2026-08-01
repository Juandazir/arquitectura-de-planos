import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Ruler, 
  Droplet, 
  Zap, 
  Armchair, 
  Download,
  AlertCircle
} from 'lucide-react';
import { CADProject } from '../types/cad';
import { 
  computeMaterialTakeoff, 
  runTechnicalAudit, 
  AuditIssue 
} from '../utils/validation';
import { formatMeters, formatAreaM2 } from '../utils/geometry';

interface BillOfMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CADProject;
}

export const BillOfMaterialsModal: React.FC<BillOfMaterialsModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [activeTab, setActiveTab] = useState<'takeoff' | 'audit'>('takeoff');

  if (!isOpen) return null;

  const takeoff = computeMaterialTakeoff(project);
  const issues = runTechnicalAudit(project);

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  const handleExportCsv = () => {
    let csv = 'CATEGORIA;ELEMENTO;CANTIDAD / METROS;UNIDAD\n';
    csv += `Arquitectura;Muros Exteriores;${takeoff.exteriorWallMeters.toFixed(2)};m lineales\n`;
    csv += `Arquitectura;Muros Interiores;${takeoff.interiorWallMeters.toFixed(2)};m lineales\n`;
    csv += `Arquitectura;Puertas de Acceso;${takeoff.doorCount};unidad\n`;
    csv += `Arquitectura;Ventanas;${takeoff.windowCount};unidad\n`;
    csv += `Fontanería;Tubería Agua Fría (Azul);${takeoff.coldWaterMeters.toFixed(2)};m lineales\n`;
    csv += `Fontanería;Tubería Agua Caliente (Roja);${takeoff.hotWaterMeters.toFixed(2)};m lineales\n`;
    csv += `Fontanería;Drenaje Sanitario (110mm);${takeoff.drainMeters.toFixed(2)};m lineales\n`;
    csv += `Fontanería;Artefactos Sanitarios;${takeoff.plumbingCount};unidad\n`;
    csv += `Electricidad;Luminarias / Plafones LED;${takeoff.lightCount};unidad\n`;
    csv += `Electricidad;Interruptores;${takeoff.switchCount};unidad\n`;
    csv += `Electricidad;Tomacorrientes / Enchufes;${takeoff.outletCount};unidad\n`;
    csv += `Mobiliario;Muebles insertados;${takeoff.furnitureCount};unidad\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Computo_Metrico_${project.name.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl flex flex-col max-h-[88vh] text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/30 font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight text-white">
                Cómputo Métrico & Auditoría Arquitectónica
              </h2>
              <p className="text-xs text-slate-400">
                Proyecto: <span className="text-slate-200 font-semibold">{project.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
              title="Descargar presupuesto en Excel/CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/80 px-6 pt-2">
          <button
            onClick={() => setActiveTab('takeoff')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all ${
              activeTab === 'takeoff'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>1. Lista de Materiales y Cómputo (m / m²)</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all ${
              activeTab === 'audit'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-indigo-400" />
            <span>
              2. Auditoría Técnica ({issues.length} observaciones)
            </span>
            {errorCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold">
                {errorCount}
              </span>
            )}
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'takeoff' ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1">
                    <Ruler className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Muros Totales</span>
                  </div>
                  <div className="text-xl font-black text-white">
                    {formatMeters(takeoff.totalWallLength)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Ext: {takeoff.exteriorWallMeters.toFixed(1)}m | Int: {takeoff.interiorWallMeters.toFixed(1)}m
                  </div>
                </div>

                <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1">
                    <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Red Fontanería</span>
                  </div>
                  <div className="text-xl font-black text-white">
                    {(takeoff.coldWaterMeters + takeoff.hotWaterMeters + takeoff.drainMeters).toFixed(1)} m
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {takeoff.plumbingCount} artefacto(s) sanitario(s)
                  </div>
                </div>

                <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Puntos Eléctricos</span>
                  </div>
                  <div className="text-xl font-black text-white">
                    {takeoff.lightCount + takeoff.switchCount + takeoff.outletCount} pts
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {takeoff.outletCount} enchufes / {takeoff.lightCount} luces
                  </div>
                </div>

                <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1">
                    <Armchair className="w-3.5 h-3.5 text-purple-400" />
                    <span>Mobiliario</span>
                  </div>
                  <div className="text-xl font-black text-white">
                    {takeoff.furnitureCount} muebles
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Medidas realistas en metros
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Table */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/60 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Capa / Sistema</th>
                      <th className="py-3 px-4">Descripción del Elemento</th>
                      <th className="py-3 px-4">Unidad</th>
                      <th className="py-3 px-4 text-right">Cantidad o Metros Lineales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-bold text-indigo-400">1. Arquitectura</td>
                      <td className="py-2.5 px-4">Muros exteriores perimetrales</td>
                      <td className="py-2.5 px-4 text-slate-400">Metro lineal (m)</td>
                      <td className="py-2.5 px-4 text-right font-bold">{takeoff.exteriorWallMeters.toFixed(2)} m</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-bold text-indigo-400">1. Arquitectura</td>
                      <td className="py-2.5 px-4">Muros interiores / tabiquería</td>
                      <td className="py-2.5 px-4 text-slate-400">Metro lineal (m)</td>
                      <td className="py-2.5 px-4 text-right font-bold">{takeoff.interiorWallMeters.toFixed(2)} m</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-bold text-indigo-400">1. Arquitectura</td>
                      <td className="py-2.5 px-4">Puertas de acceso</td>
                      <td className="py-2.5 px-4 text-slate-400">Unidades</td>
                      <td className="py-2.5 px-4 text-right font-bold">{takeoff.doorCount}</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-bold text-indigo-400">1. Arquitectura</td>
                      <td className="py-2.5 px-4">Ventanas / Ventanales</td>
                      <td className="py-2.5 px-4 text-slate-400">Unidades</td>
                      <td className="py-2.5 px-4 text-right font-bold">{takeoff.windowCount}</td>
                    </tr>

                    {/* Plumbing */}
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-bold text-cyan-400">2. Fontanería</td>
                      <td className="py-2.5 px-4">Tubería Agua Fría (Azul - 20mm/25mm)</td>
                      <td className="py-2.5 px-4 text-slate-400">Metro lineal (m)</td>
                      <td className="py-2.5 px-4 text-right font-bold">{takeoff.coldWaterMeters.toFixed(2)} m</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-bold text-cyan-400">2. Fontanería</td>
                      <td className="py-2.5 px-4">Tubería Agua Caliente (Roja - CPVC)</td>
                      <td className="py-2.5 px-4 text-slate-400">Metro lineal (m)</td>
                      <td className="py-2.5 px-4 text-right font-bold">{takeoff.hotWaterMeters.toFixed(2)} m</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-bold text-cyan-400">2. Fontanería</td>
                      <td className="py-2.5 px-4">Drenaje Sanitario (Naranja - 110mm/50mm)</td>
                      <td className="py-2.5 px-4 text-slate-400">Metro lineal (m)</td>
                      <td className="py-2.5 px-4 text-right font-bold">{takeoff.drainMeters.toFixed(2)} m</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-bold text-cyan-400">2. Fontanería</td>
                      <td className="py-2.5 px-4">Artefactos (WC, Lavamanos, Ducha, Fregadero)</td>
                      <td className="py-2.5 px-4 text-slate-400">Unidades</td>
                      <td className="py-2.5 px-4 text-right font-bold">{takeoff.plumbingCount}</td>
                    </tr>

                    {/* Electrical */}
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-bold text-amber-400">3. Electricidad</td>
                      <td className="py-2.5 px-4">Luminarias de Techo / Pared</td>
                      <td className="py-2.5 px-4 text-slate-400">Puntos</td>
                      <td className="py-2.5 px-4 text-right font-bold">{takeoff.lightCount}</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-bold text-amber-400">3. Electricidad</td>
                      <td className="py-2.5 px-4">Interruptores sencillos / dobles</td>
                      <td className="py-2.5 px-4 text-slate-400">Puntos</td>
                      <td className="py-2.5 px-4 text-right font-bold">{takeoff.switchCount}</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-bold text-amber-400">3. Electricidad</td>
                      <td className="py-2.5 px-4">Tomacorrientes / Enchufes (110V/220V)</td>
                      <td className="py-2.5 px-4 text-slate-400">Puntos</td>
                      <td className="py-2.5 px-4 text-right font-bold">{takeoff.outletCount}</td>
                    </tr>

                    {/* Furniture */}
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-bold text-purple-400">4. Mobiliario</td>
                      <td className="py-2.5 px-4">Muebles con medidas internacionales</td>
                      <td className="py-2.5 px-4 text-slate-400">Unidades</td>
                      <td className="py-2.5 px-4 text-right font-bold">{takeoff.furnitureCount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.length === 0 ? (
                <div className="py-12 text-center bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-8">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-emerald-300">
                    ¡Proyecto con Auditoría Aprobada!
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                    Tus muros, accesos, redes de fontanería y circuitos eléctricos cumplen con las recomendaciones técnicas estándar.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {issues.map((iss) => (
                    <div
                      key={iss.id}
                      className={`p-4 rounded-xl border flex items-start gap-3 ${
                        iss.severity === 'error'
                          ? 'bg-red-950/30 border-red-500/40'
                          : iss.severity === 'warning'
                          ? 'bg-amber-950/30 border-amber-500/40'
                          : 'bg-indigo-950/30 border-indigo-500/40'
                      }`}
                    >
                      {iss.severity === 'error' ? (
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      ) : iss.severity === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-white">{iss.title}</h4>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {iss.category === 'arch'
                              ? 'Arquitectura'
                              : iss.category === 'plumbing'
                              ? 'Fontanería'
                              : iss.category === 'electrical'
                              ? 'Electricidad'
                              : 'Mobiliario'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{iss.description}</p>
                        <div className="mt-2 text-xs font-semibold text-emerald-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          💡 Recomendación: {iss.recommendation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Unidades de cálculo: <strong>Metros (m) / Metros Cuadrados (m²)</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
