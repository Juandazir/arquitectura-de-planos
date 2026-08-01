import { CADProject } from '../types/cad';
import { distance } from './geometry';

export interface AuditIssue {
  id: string;
  category: 'arch' | 'plumbing' | 'electrical' | 'furniture';
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation: string;
}

export function runTechnicalAudit(project: CADProject): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // --- 1. Architectural Checks ---
  if (project.walls.length === 0) {
    issues.push({
      id: 'arch-no-walls',
      category: 'arch',
      severity: 'error',
      title: 'Proyecto sin muros perimetrales',
      description: 'El plano aún no cuenta con estructura de muros trazada.',
      recommendation: 'Selecciona la herramienta "Muro" en el Paso 1 para diseñar el contorno.'
    });
  } else {
    const totalWallMeters = project.walls.reduce(
      (sum, w) => sum + distance(w.start, w.end),
      0
    );
    if (totalWallMeters < 10) {
      issues.push({
        id: 'arch-small-area',
        category: 'arch',
        severity: 'warning',
        title: 'Superficie construida pequeña',
        description: `El total lineal de muros es de solo ${totalWallMeters.toFixed(1)} m.`,
        recommendation: 'Verifica las cotas en metros para asegurarte de que representen una vivienda o estudio de medidas reales.'
      });
    }

    const doors = project.openings.filter(o => o.type === 'door');
    if (doors.length === 0) {
      issues.push({
        id: 'arch-no-doors',
        category: 'arch',
        severity: 'error',
        title: 'Faltan puertas de acceso',
        description: 'No se detectaron puertas en los muros de la vivienda.',
        recommendation: 'Inserta al menos una puerta de acceso principal (ancho recomendado 0.90 m).'
      });
    } else {
      const narrowDoors = doors.filter(d => d.width < 0.75);
      if (narrowDoors.length > 0) {
        issues.push({
          id: 'arch-narrow-doors',
          category: 'arch',
          severity: 'warning',
          title: 'Puerta con ancho inferior al estándar internacional',
          description: `Se detectaron ${narrowDoors.length} puerta(s) con ancho menor a 0.75 m.`,
          recommendation: 'Se recomienda que las puertas interiores tengan entre 0.80 m y 0.90 m para accesibilidad.'
        });
      }
    }

    const windows = project.openings.filter(o => o.type === 'window');
    if (windows.length === 0 && project.rooms.length > 0) {
      issues.push({
        id: 'arch-no-windows',
        category: 'arch',
        severity: 'warning',
        title: 'Ausencia de ventanas para iluminación natural',
        description: 'No se encontraron ventanas en el perímetro exterior.',
        recommendation: 'Agrega ventanas orientadas hacia áreas libres o fachadas para ventilar los dormitorios y estancias.'
      });
    }
  }

  // --- 2. Plumbing Checks (Fontanería) ---
  const fixtures = project.plumbingFixtures;
  if (fixtures.length > 0) {
    const hasWC = fixtures.some(f => f.type === 'toilet');
    const hasSink = fixtures.some(f => f.type === 'sink');
    if (hasWC && !hasSink) {
      issues.push({
        id: 'plumb-wc-no-sink',
        category: 'plumbing',
        severity: 'warning',
        title: 'Inodoro instalado sin lavamanos cercano',
        description: 'Todo baño o aseo con inodoro requiere un lavamanos por normas sanitarias.',
        recommendation: 'Agrega un "Lavamanos" cerca del inodoro en la capa de Fontanería.'
      });
    }

    const coldPipes = project.pipes.filter(p => p.pipeType === 'cold_water');
    if (coldPipes.length === 0) {
      issues.push({
        id: 'plumb-no-cold-water',
        category: 'plumbing',
        severity: 'error',
        title: 'Artefactos sanitarios sin red de Agua Fría',
        description: 'Tienes artefactos instalados pero no has trazado la tubería azul de agua fría.',
        recommendation: 'Traza tubería de agua fría (PPR 20mm) hacia el inodoro, lavamanos y ducha.'
      });
    }

    const drains = project.pipes.filter(p => p.pipeType === 'drainage');
    if (drains.length === 0) {
      issues.push({
        id: 'plumb-no-drain',
        category: 'plumbing',
        severity: 'error',
        title: 'Falta red de Drenaje / Desagüe Sanitario',
        description: 'Los artefactos sanitarios requieren evacuación cloacal o tubería pluvial.',
        recommendation: 'Conecta tubería de drenaje de 110mm para el WC y 50mm para lavamanos/ducha.'
      });
    }
  }

  // --- 3. Electrical Checks (Electricidad) ---
  const electricals = project.electricalItems;
  if (project.walls.length > 0) {
    const panels = electricals.filter(e => e.type === 'panel');
    if (panels.length === 0) {
      issues.push({
        id: 'elec-no-panel',
        category: 'electrical',
        severity: 'warning',
        title: 'Tablero General no ubicado en el plano',
        description: 'Toda vivienda necesita un tablero de distribución (Centro de Carga).',
        recommendation: 'Agrega un Tablero General en un pasillo o zona accesible desde el Paso 3 (Electricidad).'
      });
    }

    const lights = electricals.filter(e => e.type === 'light_ceiling' || e.type === 'light_wall');
    if (lights.length === 0 && project.rooms.length > 0) {
      issues.push({
        id: 'elec-no-lights',
        category: 'electrical',
        severity: 'warning',
        title: 'Estancias sin iluminación eléctrica definida',
        description: 'Hay habitaciones en el proyecto sin lámparas de techo o de pared.',
        recommendation: 'Inserta al menos 1 Plafón LED en el centro de cada habitación.'
      });
    }

    const outlets = electricals.filter(e => e.type === 'outlet_110v' || e.type === 'outlet_220v');
    if (outlets.length < 2 && project.rooms.length > 0) {
      issues.push({
        id: 'elec-few-outlets',
        category: 'electrical',
        severity: 'info',
        title: 'Número bajo de enchufes / tomacorrientes',
        description: `Solo tienes ${outlets.length} tomacorriente(s) proyectado(s).`,
        recommendation: 'La norma recomienda mínimo 3 enchufes en cocina y 2 en cada dormitorio.'
      });
    }
  }

  // --- 4. Furniture Checks (Mobiliario) ---
  if (project.furniture.length === 0 && project.walls.length > 0) {
    issues.push({
      id: 'furn-empty',
      category: 'furniture',
      severity: 'info',
      title: 'Plano sin muebles para verificar circulación',
      description: 'El mobiliario con medidas reales te permite validar si las habitaciones son confortables.',
      recommendation: 'Agrega camas, mesa o sofá en el Paso 4 para verificar paso y ergonomía.'
    });
  }

  return issues;
}

export function computeMaterialTakeoff(project: CADProject) {
  // Walls total meters
  const totalWallLength = project.walls.reduce(
    (acc, w) => acc + distance(w.start, w.end),
    0
  );

  const exteriorWallMeters = project.walls
    .filter(w => w.type === 'exterior')
    .reduce((acc, w) => acc + distance(w.start, w.end), 0);

  const interiorWallMeters = project.walls
    .filter(w => w.type === 'interior' || w.type === 'partition')
    .reduce((acc, w) => acc + distance(w.start, w.end), 0);

  // Pipes total meters by type
  const coldWaterMeters = project.pipes
    .filter(p => p.pipeType === 'cold_water')
    .reduce((acc, p) => acc + distance(p.start, p.end), 0);

  const hotWaterMeters = project.pipes
    .filter(p => p.pipeType === 'hot_water')
    .reduce((acc, p) => acc + distance(p.start, p.end), 0);

  const drainMeters = project.pipes
    .filter(p => p.pipeType === 'drainage')
    .reduce((acc, p) => acc + distance(p.start, p.end), 0);

  // Counts
  const doorCount = project.openings.filter(o => o.type === 'door').length;
  const windowCount = project.openings.filter(o => o.type === 'window').length;

  const plumbingCount = project.plumbingFixtures.length;
  const lightCount = project.electricalItems.filter(e => e.type.includes('light')).length;
  const switchCount = project.electricalItems.filter(e => e.type.includes('switch')).length;
  const outletCount = project.electricalItems.filter(e => e.type.includes('outlet')).length;

  const totalAreaM2 = project.rooms.reduce((acc, r) => acc + (r.areaM2 || 0), 0);

  return {
    totalWallLength,
    exteriorWallMeters,
    interiorWallMeters,
    coldWaterMeters,
    hotWaterMeters,
    drainMeters,
    doorCount,
    windowCount,
    plumbingCount,
    lightCount,
    switchCount,
    outletCount,
    totalAreaM2,
    furnitureCount: project.furniture.length,
    roomCount: project.rooms.length,
  };
}
