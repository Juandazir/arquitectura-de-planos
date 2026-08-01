export type CADLayer = 'arch' | 'plumbing' | 'electrical' | 'furniture' | 'all';

export type ToolType = 
  // Selection & Nav
  | 'select'
  | 'move'
  | 'pan'
  | 'measure'
  // Arch tools
  | 'wall'
  | 'door'
  | 'window'
  | 'room_label'
  // Plumbing tools
  | 'pipe_cold'
  | 'pipe_hot'
  | 'pipe_drain'
  | 'plumbing_fixture'
  // Electrical tools
  | 'elec_outlet'
  | 'elec_switch'
  | 'elec_light'
  | 'elec_panel'
  | 'elec_wire'
  // Furniture tools
  | 'furniture_item'
  // Delete
  | 'eraser';

export interface Point2D {
  x: number; // in meters
  y: number; // in meters
}

export interface Wall {
  id: string;
  start: Point2D;
  end: Point2D;
  thickness: number; // in meters, default 0.15m (15 cm)
  type: 'exterior' | 'interior' | 'partition';
  label?: string;
}

export interface WallOpening {
  id: string;
  wallId: string;
  offset: number; // normalized position along wall 0.0 to 1.0, or distance in meters from start
  width: number;  // in meters (e.g. 0.80m for door, 1.20m for window)
  type: 'door' | 'window' | 'arch';
  swing?: 'left' | 'right' | 'in' | 'out'; // for doors
  openAngle?: number;
}

export type PipeType = 'cold_water' | 'hot_water' | 'drainage' | 'gas';

export interface PipeSegment {
  id: string;
  start: Point2D;
  end: Point2D;
  pipeType: PipeType;
  diameterMm: number; // e.g. 20 (1/2"), 25 (3/4"), 110 (drainage)
  material: 'PVC' | 'CPVC' | 'Cobre' | 'PPR' | 'Acero';
  label?: string;
}

export type PlumbingFixtureType = 
  | 'sink'        // Lavamanos
  | 'toilet'      // Inodoro / WC
  | 'shower'      // Plato de ducha (0.9 x 0.9m)
  | 'kitchen_sink'// Fregadero de cocina
  | 'water_heater'// Calentador / Boiler
  | 'washing_machine_hookup' // Toma lavadora
  | 'valve';      // Llave de paso / Válvula

export interface PlumbingFixture {
  id: string;
  position: Point2D;
  type: PlumbingFixtureType;
  rotation: number; // degrees
  width: number;  // meters
  depth: number;  // meters
  label: string;
  waterSupplyConnected?: boolean;
  drainConnected?: boolean;
}

export type ElectricalItemType = 
  | 'panel'         // Tablero General / Centro de carga
  | 'outlet_110v'   // Tomacorriente simple 110V
  | 'outlet_220v'   // Tomacorriente alta potencia 220V (nevera/a.a.)
  | 'switch_single' // Interruptor sencillo
  | 'switch_double' // Interruptor doble/conmutador
  | 'light_ceiling' // Lámpara de techo / Plafón LED
  | 'light_wall';   // Aplique de pared

export interface ElectricalItem {
  id: string;
  position: Point2D;
  type: ElectricalItemType;
  rotation: number; // degrees
  label: string;
  circuit?: string; // e.g. "C1-Iluminación", "C2-Tomacorrientes"
  powerWatts?: number;
}

export interface ElectricalWire {
  id: string;
  fromId: string; // switch or panel id
  toId: string;   // light or outlet id
  circuit: string;
  wireGauge: string; // e.g. "12 AWG", "14 AWG"
  path?: Point2D[];  // optional intermediate control points for curved wiring arc
}

export interface FurnitureItem {
  id: string;
  category: 'bedroom' | 'living' | 'dining' | 'kitchen' | 'office' | 'storage' | 'bathroom' | 'outdoor';
  name: string;      // Display name in Spanish
  position: Point2D; // Center position in meters
  width: number;     // Width in meters (X axis before rotation)
  depth: number;     // Depth in meters (Y axis before rotation)
  rotation: number;  // in degrees (0, 90, 180, 270)
  color?: string;
  iconSymbol?: string;
  notes?: string;
}

export interface RoomLabel {
  id: string;
  position: Point2D;
  name: string; // e.g. "Dormitorio Principal", "Sala de Estar", "Baño"
  areaM2?: number;
}

export interface CADProject {
  id: string;
  name: string;
  description: string;
  gridSizeMeters: number; // default 0.5m
  snapToGrid: boolean;
  showDimensions: boolean;
  showGrid: boolean;
  showMeasureLine?: boolean;
  activeLayer: CADLayer;
  visibleLayers?: {
    arch: boolean;
    plumbing: boolean;
    electrical: boolean;
    furniture: boolean;
  };
  // Architecture
  walls: Wall[];
  openings: WallOpening[];
  rooms: RoomLabel[];
  // Plumbing
  pipes: PipeSegment[];
  plumbingFixtures: PlumbingFixture[];
  // Electrical
  electricalItems: ElectricalItem[];
  electricalWires: ElectricalWire[];
  // Furniture
  furniture: FurnitureItem[];
}

export interface CatalogFurnitureTemplate {
  id: string;
  category: 'bedroom' | 'living' | 'dining' | 'kitchen' | 'office' | 'storage' | 'bathroom' | 'outdoor';
  name: string;
  width: number; // meters
  depth: number; // meters
  description: string;
  color: string;
  iconSymbol: string;
}

export interface StepGuideItem {
  stepNumber: number;
  id: CADLayer;
  title: string;
  subtitle: string;
  description: string;
  checkpoints: string[];
  tips: string[];
}
