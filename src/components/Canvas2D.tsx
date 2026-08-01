import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  CADProject, 
  CADLayer, 
  ToolType, 
  Point2D, 
  Wall, 
  WallOpening, 
  PipeSegment, 
  PlumbingFixture, 
  ElectricalItem, 
  ElectricalWire, 
  FurnitureItem, 
  RoomLabel, 
  PlumbingFixtureType, 
  ElectricalItemType 
} from '../types/cad';
import { 
  distance, 
  formatMeters, 
  snapToGridPoint, 
  getWallPolygon, 
  distanceToSegment, 
  isPointInRotatedRect, 
  getOpeningPosition 
} from '../utils/geometry';
import { FURNITURE_CATALOG } from '../data/catalog';
import { ZoomIn, ZoomOut, Maximize, Compass, Ruler, Magnet } from 'lucide-react';

interface Canvas2DProps {
  project: CADProject;
  activeLayer: CADLayer;
  visibleLayers?: {
    arch: boolean;
    plumbing: boolean;
    electrical: boolean;
    furniture: boolean;
  };
  activeTool: ToolType;
  selectedId: string | null;
  selectedType: 'wall' | 'plumbing' | 'pipe' | 'electrical' | 'furniture' | 'room' | null;
  onSelectObject: (id: string | null, type: 'wall' | 'plumbing' | 'pipe' | 'electrical' | 'furniture' | 'room' | null) => void;
  onAddWall: (wall: Wall) => void;
  onAddOpening: (opening: WallOpening) => void;
  onAddPipe: (pipe: PipeSegment) => void;
  onAddPlumbingFixture: (fixture: PlumbingFixture) => void;
  onAddElectricalItem: (item: ElectricalItem) => void;
  onAddElectricalWire: (wire: ElectricalWire) => void;
  onAddFurniture: (furniture: FurnitureItem) => void;
  onAddRoomLabel: (room: RoomLabel) => void;
  onUpdateWall: (wall: Wall) => void;
  onUpdateFurniture: (furniture: FurnitureItem) => void;
  onUpdatePlumbingFixture: (fixture: PlumbingFixture) => void;
  onUpdateElectricalItem: (item: ElectricalItem) => void;
  onUpdatePipe?: (pipe: PipeSegment) => void;
  onUpdateRoom?: (room: RoomLabel) => void;
  onDeleteById: (id: string) => void;
  selectedFurnitureId: string;
  selectedPlumbingType: PlumbingFixtureType;
  selectedElectricalType: ElectricalItemType;
  onToggleMeasureLine?: () => void;
}

export const Canvas2D: React.FC<Canvas2DProps> = ({
  project,
  activeLayer,
  visibleLayers,
  activeTool,
  selectedId,
  selectedType,
  onSelectObject,
  onAddWall,
  onAddOpening,
  onAddPipe,
  onAddPlumbingFixture,
  onAddElectricalItem,
  onAddElectricalWire,
  onAddFurniture,
  onAddRoomLabel,
  onUpdateWall,
  onUpdateFurniture,
  onUpdatePlumbingFixture,
  onUpdateElectricalItem,
  onUpdatePipe,
  onUpdateRoom,
  onDeleteById,
  selectedFurnitureId,
  selectedPlumbingType,
  selectedElectricalType,
  onToggleMeasureLine,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Layer visibility state calculation
  const vis = visibleLayers || project.visibleLayers || {
    arch: true,
    plumbing: true,
    electrical: true,
    furniture: true,
  };
  const showArch = vis.arch;
  const showPlumbing = vis.plumbing;
  const showElectrical = vis.electrical;
  const showFurniture = vis.furniture;

  // Viewport transforms
  const [scale, setScale] = useState<number>(60); // pixels per meter (default 60px = 1.00m)
  const [offset, setOffset] = useState<Point2D>({ x: 50, y: 50 }); // origin padding in pixels
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point2D>({ x: 0, y: 0 });

  // Drawing state
  const [drawStartPt, setDrawStartPt] = useState<Point2D | null>(null);
  const [currentMousePt, setCurrentMousePt] = useState<Point2D>({ x: 0, y: 0 });
  const [isDraggingObj, setIsDraggingObj] = useState(false);
  const [dragOffset, setDragOffset] = useState<Point2D>({ x: 0, y: 0 });
  const [dragWallHandle, setDragWallHandle] = useState<'start' | 'end' | 'body' | null>(null);

  // Measure tool state
  const [measureStartPt, setMeasureStartPt] = useState<Point2D | null>(null);

  // Wire connect start id
  const [wireStartId, setWireStartId] = useState<string | null>(null);

  // Screen to world meters
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point2D => {
      return {
        x: (screenX - offset.x) / scale,
        y: (screenY - offset.y) / scale,
      };
    },
    [offset, scale]
  );

  // World meters to screen pixels
  const worldToScreen = useCallback(
    (worldX: number, worldY: number): Point2D => {
      return {
        x: worldX * scale + offset.x,
        y: worldY * scale + offset.y,
      };
    },
    [offset, scale]
  );

  // Handle Zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newScale = Math.max(15, Math.min(250, scale * zoomFactor));

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldPt = screenToWorld(mouseX, mouseY);
    const newOffsetX = mouseX - worldPt.x * newScale;
    const newOffsetY = mouseY - worldPt.y * newScale;

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  // Find wall under mouse
  const findWallAt = (worldPt: Point2D): Wall | null => {
    for (const w of project.walls) {
      if (distanceToSegment(worldPt, w.start, w.end) < Math.max(0.15, w.thickness / 2)) {
        return w;
      }
    }
    return null;
  };

  // Find furniture under mouse
  const findFurnitureAt = (worldPt: Point2D): FurnitureItem | null => {
    for (let i = project.furniture.length - 1; i >= 0; i--) {
      const item = project.furniture[i];
      if (isPointInRotatedRect(worldPt, item.position, item.width, item.depth, item.rotation)) {
        return item;
      }
    }
    return null;
  };

  // Find plumbing fixture under mouse
  const findPlumbingAt = (worldPt: Point2D): PlumbingFixture | null => {
    for (let i = project.plumbingFixtures.length - 1; i >= 0; i--) {
      const fix = project.plumbingFixtures[i];
      if (isPointInRotatedRect(worldPt, fix.position, fix.width, fix.depth, fix.rotation)) {
        return fix;
      }
    }
    return null;
  };

  // Find electrical item under mouse
  const findElectricalAt = (worldPt: Point2D): ElectricalItem | null => {
    for (const item of project.electricalItems) {
      if (distance(worldPt, item.position) < 0.35) {
        return item;
      }
    }
    return null;
  };

  // Find pipe segment under mouse
  const findPipeAt = (worldPt: Point2D): PipeSegment | null => {
    for (const p of project.pipes) {
      if (distanceToSegment(worldPt, p.start, p.end) < 0.20) {
        return p;
      }
    }
    return null;
  };

  // Find room label under mouse
  const findRoomAt = (worldPt: Point2D): RoomLabel | null => {
    for (const r of project.rooms) {
      if (distance(worldPt, r.position) < 0.60) {
        return r;
      }
    }
    return null;
  };

  // Mouse Down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const rawWorld = screenToWorld(screenX, screenY);
    const snapEnabled = project.snapToGrid && !e.altKey;
    let worldPt = snapToGridPoint(rawWorld, project.gridSizeMeters, snapEnabled);

    if (e.shiftKey && drawStartPt && (activeTool === 'wall' || activeTool === 'pipe_cold' || activeTool === 'pipe_hot' || activeTool === 'pipe_drain')) {
      const dx = Math.abs(worldPt.x - drawStartPt.x);
      const dy = Math.abs(worldPt.y - drawStartPt.y);
      if (dx > dy) {
        worldPt = { x: worldPt.x, y: drawStartPt.y };
      } else {
        worldPt = { x: drawStartPt.x, y: worldPt.y };
      }
    }

    // Pan with middle mouse button or when 'pan' tool is active
    if (e.button === 1 || activeTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: screenX - offset.x, y: screenY - offset.y });
      return;
    }

    if (e.button !== 0) return; // Left click only

    // Eraser Tool
    if (activeTool === 'eraser') {
      if (showFurniture) { const furn = findFurnitureAt(worldPt); if (furn) { onDeleteById(furn.id); return; } }
      if (showPlumbing) { const fix = findPlumbingAt(worldPt); if (fix) { onDeleteById(fix.id); return; } }
      if (showElectrical) { const elec = findElectricalAt(worldPt); if (elec) { onDeleteById(elec.id); return; } }
      if (showPlumbing) { const pipe = findPipeAt(worldPt); if (pipe) { onDeleteById(pipe.id); return; } }
      if (showArch) { const w = findWallAt(worldPt); if (w) { onDeleteById(w.id); return; } }
      if (showArch) { const room = findRoomAt(worldPt); if (room) { onDeleteById(room.id); return; } }
      return;
    }

    // Select or Move Tool
    if (activeTool === 'select' || activeTool === 'move') {
      if (showFurniture) {
        const furn = findFurnitureAt(worldPt);
        if (furn) {
          onSelectObject(furn.id, 'furniture');
          setIsDraggingObj(true);
          setDragOffset({ x: worldPt.x - furn.position.x, y: worldPt.y - furn.position.y });
          setDragWallHandle(null);
          return;
        }
      }
      if (showPlumbing) {
        const fix = findPlumbingAt(worldPt);
        if (fix) {
          onSelectObject(fix.id, 'plumbing');
          setIsDraggingObj(true);
          setDragOffset({ x: worldPt.x - fix.position.x, y: worldPt.y - fix.position.y });
          setDragWallHandle(null);
          return;
        }
      }
      if (showElectrical) {
        const elec = findElectricalAt(worldPt);
        if (elec) {
          onSelectObject(elec.id, 'electrical');
          setIsDraggingObj(true);
          setDragOffset({ x: worldPt.x - elec.position.x, y: worldPt.y - elec.position.y });
          setDragWallHandle(null);
          return;
        }
      }
      if (showArch) {
        const room = findRoomAt(worldPt);
        if (room) {
          onSelectObject(room.id, 'room');
          setIsDraggingObj(true);
          setDragOffset({ x: worldPt.x - room.position.x, y: worldPt.y - room.position.y });
          setDragWallHandle(null);
          return;
        }
      }
      if (showPlumbing) {
        const pipe = findPipeAt(worldPt);
        if (pipe) {
          onSelectObject(pipe.id, 'pipe');
          setIsDraggingObj(true);
          setDragOffset({ x: worldPt.x - pipe.start.x, y: worldPt.y - pipe.start.y });
          setDragWallHandle('body');
          return;
        }
      }
      if (showArch) {
        const w = findWallAt(worldPt);
        if (w) {
          onSelectObject(w.id, 'wall');
          setIsDraggingObj(true);
          const distStart = distance(worldPt, w.start);
          const distEnd = distance(worldPt, w.end);
          if (distStart <= 0.50 && distStart <= distEnd) {
            setDragWallHandle('start');
            setDragOffset({ x: worldPt.x - w.start.x, y: worldPt.y - w.start.y });
          } else if (distEnd <= 0.50 && distEnd < distStart) {
            setDragWallHandle('end');
            setDragOffset({ x: worldPt.x - w.end.x, y: worldPt.y - w.end.y });
          } else {
            setDragWallHandle('body');
            setDragOffset({ x: worldPt.x - w.start.x, y: worldPt.y - w.start.y });
          }
          return;
        }
      }
      onSelectObject(null, null);
      setIsDraggingObj(false);
      setDragWallHandle(null);
      return;
    }

    // Measure Tool
    if (activeTool === 'measure') {
      if (!measureStartPt) {
        setMeasureStartPt(worldPt);
      } else {
        setMeasureStartPt(null);
      }
      return;
    }

    // Wall Tool
    if (activeTool === 'wall') {
      if (!drawStartPt) {
        setDrawStartPt(worldPt);
      } else {
        if (distance(drawStartPt, worldPt) > 0.1) {
          onAddWall({
            id: `wall-${Date.now()}`,
            start: drawStartPt,
            end: worldPt,
            thickness: 0.15,
            type: 'interior',
          });
        }
        if (project.showMeasureLine === false) {
          setDrawStartPt(null);
        } else {
          setDrawStartPt(worldPt); // allow continuous wall drawing chain
        }
      }
      return;
    }

    // Door Tool
    if (activeTool === 'door') {
      const w = findWallAt(worldPt);
      if (w) {
        const offsetDist = distance(w.start, worldPt);
        onAddOpening({
          id: `door-${Date.now()}`,
          wallId: w.id,
          offset: offsetDist,
          width: 0.85,
          type: 'door',
          swing: 'in',
        });
      }
      return;
    }

    // Window Tool
    if (activeTool === 'window') {
      const w = findWallAt(worldPt);
      if (w) {
        const offsetDist = distance(w.start, worldPt);
        onAddOpening({
          id: `win-${Date.now()}`,
          wallId: w.id,
          offset: offsetDist,
          width: 1.40,
          type: 'window',
        });
      }
      return;
    }

    // Room Label Tool
    if (activeTool === 'room_label') {
      const name = prompt('Nombre de la habitación:', 'Dormitorio / Sala / Baño');
      if (name) {
        onAddRoomLabel({
          id: `room-${Date.now()}`,
          position: worldPt,
          name,
          areaM2: 12.0,
        });
      }
      return;
    }

    // Pipe tools
    if (activeTool === 'pipe_cold' || activeTool === 'pipe_hot' || activeTool === 'pipe_drain') {
      if (!drawStartPt) {
        setDrawStartPt(worldPt);
      } else {
        if (distance(drawStartPt, worldPt) > 0.1) {
          const pipeType =
            activeTool === 'pipe_cold'
              ? 'cold_water'
              : activeTool === 'pipe_hot'
              ? 'hot_water'
              : 'drainage';
          const diameter = activeTool === 'pipe_drain' ? 110 : 20;
          const mat = activeTool === 'pipe_cold' ? 'PPR' : activeTool === 'pipe_hot' ? 'CPVC' : 'PVC';
          onAddPipe({
            id: `pipe-${Date.now()}`,
            start: drawStartPt,
            end: worldPt,
            pipeType,
            diameterMm: diameter,
            material: mat,
          });
        }
        if (project.showMeasureLine === false) {
          setDrawStartPt(null);
        } else {
          setDrawStartPt(worldPt);
        }
      }
      return;
    }

    // Plumbing Fixture
    if (activeTool === 'plumbing_fixture') {
      let width = 0.50;
      let depth = 0.50;
      let label = 'Artefacto';
      if (selectedPlumbingType === 'toilet') {
        width = 0.50; depth = 0.70; label = 'Inodoro WC';
      } else if (selectedPlumbingType === 'sink') {
        width = 0.55; depth = 0.45; label = 'Lavamanos';
      } else if (selectedPlumbingType === 'shower') {
        width = 0.90; depth = 0.90; label = 'Plato de Ducha';
      } else if (selectedPlumbingType === 'kitchen_sink') {
        width = 0.80; depth = 0.50; label = 'Fregadero Cocina';
      } else if (selectedPlumbingType === 'water_heater') {
        width = 0.45; depth = 0.45; label = 'Calentador / Boiler';
      }

      onAddPlumbingFixture({
        id: `pf-${Date.now()}`,
        position: worldPt,
        type: selectedPlumbingType,
        rotation: 0,
        width,
        depth,
        label,
      });
      return;
    }

    // Electrical item
    if (
      activeTool === 'elec_panel' ||
      activeTool === 'elec_outlet' ||
      activeTool === 'elec_switch' ||
      activeTool === 'elec_light'
    ) {
      let label = 'Punto Eléctrico';
      let circuit = 'C1-Iluminación';
      if (selectedElectricalType === 'panel') {
        label = 'Tablero General (Centro de Carga)';
        circuit = 'Principal';
      } else if (selectedElectricalType.includes('outlet')) {
        label = selectedElectricalType === 'outlet_220v' ? 'Tomacorriente 220V' : 'Tomacorriente 110V';
        circuit = 'C2-Tomacorrientes';
      } else if (selectedElectricalType.includes('switch')) {
        label = selectedElectricalType === 'switch_double' ? 'Interruptor Doble' : 'Interruptor Sencillo';
      } else if (selectedElectricalType === 'light_ceiling') {
        label = 'Plafón LED Techo';
      }

      onAddElectricalItem({
        id: `elec-${Date.now()}`,
        position: worldPt,
        type: selectedElectricalType,
        rotation: 0,
        label,
        circuit,
      });
      return;
    }

    // Electrical Wire
    if (activeTool === 'elec_wire') {
      const elec = findElectricalAt(worldPt);
      if (elec) {
        if (!wireStartId) {
          setWireStartId(elec.id);
        } else if (wireStartId !== elec.id) {
          onAddElectricalWire({
            id: `ew-${Date.now()}`,
            fromId: wireStartId,
            toId: elec.id,
            circuit: elec.circuit || 'C1-Iluminación',
            wireGauge: '14 AWG',
          });
          setWireStartId(null);
        }
      }
      return;
    }

    // Furniture Item
    if (activeTool === 'furniture_item') {
      const template = FURNITURE_CATALOG.find((item) => item.id === selectedFurnitureId);
      if (template) {
        onAddFurniture({
          id: `furn-${Date.now()}`,
          category: template.category,
          name: template.name,
          position: worldPt,
          width: template.width,
          depth: template.depth,
          rotation: 0,
          color: template.color,
          iconSymbol: template.iconSymbol,
        });
      }
      return;
    }
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (isPanning) {
      setOffset({
        x: screenX - panStart.x,
        y: screenY - panStart.y,
      });
      return;
    }

    const rawWorld = screenToWorld(screenX, screenY);
    const snapEnabled = project.snapToGrid && !e.altKey;
    let worldPt = snapToGridPoint(rawWorld, project.gridSizeMeters, snapEnabled);

    if (e.shiftKey && drawStartPt && (activeTool === 'wall' || activeTool === 'pipe_cold' || activeTool === 'pipe_hot' || activeTool === 'pipe_drain')) {
      const dx = Math.abs(worldPt.x - drawStartPt.x);
      const dy = Math.abs(worldPt.y - drawStartPt.y);
      if (dx > dy) {
        worldPt = { x: worldPt.x, y: drawStartPt.y };
      } else {
        worldPt = { x: drawStartPt.x, y: worldPt.y };
      }
    }

    setCurrentMousePt(worldPt);

    // Dragging selected object
    if (isDraggingObj && selectedId && selectedType) {
      const newPos = { x: worldPt.x - dragOffset.x, y: worldPt.y - dragOffset.y };
      const snappedPos = snapToGridPoint(newPos, project.gridSizeMeters, snapEnabled);

      if (selectedType === 'furniture') {
        const f = project.furniture.find((item) => item.id === selectedId);
        if (f) onUpdateFurniture({ ...f, position: snappedPos });
      } else if (selectedType === 'plumbing') {
        const pf = project.plumbingFixtures.find((fix) => fix.id === selectedId);
        if (pf) onUpdatePlumbingFixture({ ...pf, position: snappedPos });
      } else if (selectedType === 'electrical') {
        const el = project.electricalItems.find((item) => item.id === selectedId);
        if (el) onUpdateElectricalItem({ ...el, position: snappedPos });
      } else if (selectedType === 'room') {
        const r = project.rooms.find((item) => item.id === selectedId);
        if (r && onUpdateRoom) onUpdateRoom({ ...r, position: snappedPos });
      } else if (selectedType === 'pipe') {
        const p = project.pipes.find((item) => item.id === selectedId);
        if (p) {
          const dx = snappedPos.x - p.start.x;
          const dy = snappedPos.y - p.start.y;
          onUpdatePipe({
            ...p,
            start: { x: p.start.x + dx, y: p.start.y + dy },
            end: { x: p.end.x + dx, y: p.end.y + dy },
          });
        }
      } else if (selectedType === 'wall') {
        const w = project.walls.find((item) => item.id === selectedId);
        if (w) {
          if (dragWallHandle === 'start') {
            onUpdateWall({ ...w, start: snappedPos });
          } else if (dragWallHandle === 'end') {
            onUpdateWall({ ...w, end: snappedPos });
          } else {
            // 'body' - traslada la pared entera conservando longitud y orientación
            const dx = snappedPos.x - w.start.x;
            const dy = snappedPos.y - w.start.y;
            onUpdateWall({
              ...w,
              start: { x: w.start.x + dx, y: w.start.y + dy },
              end: { x: w.end.x + dx, y: w.end.y + dy },
            });
          }
        }
      }
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingObj(false);
    setDragWallHandle(null);
  };

  // Cancel draw on right click or escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawStartPt(null);
        setMeasureStartPt(null);
        setWireStartId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clear stuck drawing/measuring line when showMeasureLine is false
  useEffect(() => {
    if (project.showMeasureLine === false) {
      setDrawStartPt(null);
      setMeasureStartPt(null);
      setWireStartId(null);
    }
  }, [project.showMeasureLine]);

  // Clear stuck drawing/measuring line when switching active tools
  useEffect(() => {
    setDrawStartPt(null);
    setMeasureStartPt(null);
    setWireStartId(null);
  }, [activeTool]);

  // DRAWING LOOP ON CANVAS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI screen resolution
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // 1. Clear Canvas (Sleek dark engineering CAD blueprint theme #070B14 with subtle gradient background)
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#090D18');
    bgGradient.addColorStop(1, '#050810');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. High-Precision Professional CAD Metric Grid
    if (project.showGrid) {
      const minWorld = screenToWorld(0, 0);
      const maxWorld = screenToWorld(width, height);

      const baseStep = project.gridSizeMeters || 0.05; // Base snap grid (e.g., 5cm)
      const pxPerBaseStep = baseStep * scale;

      // Adaptive level of detail: if sub-grid step is too small in pixels, scale it up so grid remains ultra-crisp
      let renderStep = baseStep;
      if (pxPerBaseStep < 8) {
        if (baseStep * 2 * scale >= 8) renderStep = baseStep * 2;
        else if (baseStep * 5 * scale >= 8) renderStep = baseStep * 5;
        else if (baseStep * 10 * scale >= 8) renderStep = baseStep * 10;
        else renderStep = 1.0; // 1m default if zoomed far out
      }

      const startX = Math.floor(minWorld.x / renderStep) * renderStep;
      const endX = Math.ceil(maxWorld.x / renderStep) * renderStep;
      const startY = Math.floor(minWorld.y / renderStep) * renderStep;
      const endY = Math.ceil(maxWorld.y / renderStep) * renderStep;

      // Draw Grid Lines (Verticals X)
      for (let x = startX; x <= endX; x += renderStep) {
        const roundedX = Math.round(x * 100) / 100;
        const isAxis = Math.abs(roundedX) < 0.001;
        const isSuperMajor = Math.abs(roundedX % 5.0) < 0.001;
        const isMajor1m = Math.abs(roundedX % 1.0) < 0.001;
        const isHalfM = Math.abs(roundedX % 0.5) < 0.001;

        const p1 = worldToScreen(roundedX, minWorld.y);
        const p2 = worldToScreen(roundedX, maxWorld.y);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        if (isAxis) {
          // Y-Axis line (X = 0) in Emerald Green
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 2;
        } else if (isSuperMajor) {
          // 5 Meter Major Line
          ctx.strokeStyle = 'rgba(129, 140, 248, 0.45)';
          ctx.lineWidth = 1.5;
        } else if (isMajor1m) {
          // 1 Meter Line
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
          ctx.lineWidth = 1;
        } else if (isHalfM) {
          // 0.5m Line
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
          ctx.lineWidth = 0.8;
        } else {
          // Fine Sub-Grid Line
          ctx.strokeStyle = 'rgba(30, 41, 59, 0.25)';
          ctx.lineWidth = 0.5;
        }
        ctx.stroke();

        // 1m and 5m Metric Labels
        if (isMajor1m && !isAxis && scale > 25) {
          ctx.fillStyle = isSuperMajor ? '#A5B4FC' : '#64748B';
          ctx.font = isSuperMajor ? 'bold 10px monospace' : '9px monospace';
          ctx.fillText(`${roundedX.toFixed(0)}m`, p1.x + 4, 34);
        }
      }

      // Draw Grid Lines (Horizontals Y)
      for (let y = startY; y <= endY; y += renderStep) {
        const roundedY = Math.round(y * 100) / 100;
        const isAxis = Math.abs(roundedY) < 0.001;
        const isSuperMajor = Math.abs(roundedY % 5.0) < 0.001;
        const isMajor1m = Math.abs(roundedY % 1.0) < 0.001;
        const isHalfM = Math.abs(roundedY % 0.5) < 0.001;

        const p1 = worldToScreen(minWorld.x, roundedY);
        const p2 = worldToScreen(maxWorld.x, roundedY);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        if (isAxis) {
          // X-Axis line (Y = 0) in Rose Red
          ctx.strokeStyle = '#F43F5E';
          ctx.lineWidth = 2;
        } else if (isSuperMajor) {
          ctx.strokeStyle = 'rgba(129, 140, 248, 0.45)';
          ctx.lineWidth = 1.5;
        } else if (isMajor1m) {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
          ctx.lineWidth = 1;
        } else if (isHalfM) {
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
          ctx.lineWidth = 0.8;
        } else {
          ctx.strokeStyle = 'rgba(30, 41, 59, 0.25)';
          ctx.lineWidth = 0.5;
        }
        ctx.stroke();

        if (isMajor1m && !isAxis && scale > 25) {
          ctx.fillStyle = isSuperMajor ? '#A5B4FC' : '#64748B';
          ctx.font = isSuperMajor ? 'bold 10px monospace' : '9px monospace';
          ctx.fillText(`${roundedY.toFixed(0)}m`, 28, p1.y - 3);
        }
      }

      // Draw Major Intersection Crosshairs (+) for authentic CAD blueprint feel
      if (scale > 35) {
        const tickStep = 1.0; // Every 1 meter
        const tickStartX = Math.floor(minWorld.x / tickStep) * tickStep;
        const tickEndX = Math.ceil(maxWorld.x / tickStep) * tickStep;
        const tickStartY = Math.floor(minWorld.y / tickStep) * tickStep;
        const tickEndY = Math.ceil(maxWorld.y / tickStep) * tickStep;

        ctx.strokeStyle = 'rgba(129, 140, 248, 0.45)';
        ctx.lineWidth = 1;
        for (let tx = tickStartX; tx <= tickEndX; tx += tickStep) {
          for (let ty = tickStartY; ty <= tickEndY; ty += tickStep) {
            const sp = worldToScreen(tx, ty);
            ctx.beginPath();
            ctx.moveTo(sp.x - 3, sp.y);
            ctx.lineTo(sp.x + 3, sp.y);
            ctx.moveTo(sp.x, sp.y - 3);
            ctx.lineTo(sp.x, sp.y + 3);
            ctx.stroke();
          }
        }
      }

      // Draw Origin Target Badge at (0.00, 0.00)
      const originPt = worldToScreen(0, 0);
      if (originPt.x >= -50 && originPt.x <= width + 50 && originPt.y >= -50 && originPt.y <= height + 50) {
        ctx.beginPath();
        ctx.arc(originPt.x, originPt.y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(originPt.x, originPt.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#A5B4FC';
        ctx.fill();

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(originPt.x + 8, originPt.y + 8, 72, 18, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#818CF8';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('Origen (0,0)', originPt.x + 12, originPt.y + 20);
      }
    }

    // 3. LAYER: ARCHITECTURE (Walls, Openings, Rooms)
    if (showArch) {
      // Draw Rooms area highlight
      project.rooms.forEach((room) => {
        const p = worldToScreen(room.position.x, room.position.y);
        ctx.fillStyle = '#1E293B80';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#F8FAFC';
        ctx.fillText(room.name, p.x, p.y - 6);
        if (room.areaM2) {
          ctx.fillStyle = '#818CF8';
          ctx.font = '11px sans-serif';
          ctx.fillText(`${room.areaM2.toFixed(1)} m²`, p.x, p.y + 10);
        }
        ctx.textAlign = 'left';
      });

      // Draw Walls with real thickness
      project.walls.forEach((wall) => {
        const poly = getWallPolygon(wall);
        const isSelected = selectedId === wall.id;

        // Wall fill (exterior walls slightly darker/solid, interior slightly lighter)
        ctx.fillStyle = wall.type === 'exterior' ? '#334155' : '#475569';
        if (isSelected) ctx.fillStyle = '#4F46E5';

        ctx.beginPath();
        poly.forEach((c, idx) => {
          const sc = worldToScreen(c.x, c.y);
          if (idx === 0) ctx.moveTo(sc.x, sc.y);
          else ctx.lineTo(sc.x, sc.y);
        });
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#A5B4FC' : '#64748B';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        // Wall Dimension Label (if showDimensions is enabled)
        if (project.showDimensions) {
          const midX = (wall.start.x + wall.end.x) / 2;
          const midY = (wall.start.y + wall.end.y) / 2;
          const len = distance(wall.start, wall.end);
          const sc = worldToScreen(midX, midY);

          ctx.fillStyle = '#38BDF8';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(formatMeters(len), sc.x, sc.y - 6);
          ctx.textAlign = 'left';
        }
      });

      // Draw Openings (Doors & Windows)
      project.openings.forEach((op) => {
        const wall = project.walls.find((w) => w.id === op.wallId);
        if (!wall) return;
        const pos = getOpeningPosition(wall, op);
        const sc = worldToScreen(pos.x, pos.y);
        const ang = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);

        ctx.save();
        ctx.translate(sc.x, sc.y);
        ctx.rotate(ang);

        const wPx = op.width * scale;

        if (op.type === 'door') {
          // Architectural door symbol: yellow/amber door leaf + 90 degree swing arc
          ctx.strokeStyle = '#FBBF24';
          ctx.lineWidth = 2;
          // door leaf
          ctx.beginPath();
          ctx.moveTo(-wPx / 2, 0);
          ctx.lineTo(-wPx / 2, -wPx);
          ctx.stroke();

          // swing arc
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(-wPx / 2, 0, wPx, -Math.PI / 2, 0);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // Architectural window: cyan double line
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-wPx / 2, 0);
          ctx.lineTo(wPx / 2, 0);
          ctx.stroke();

          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-wPx / 2, -3);
          ctx.lineTo(wPx / 2, -3);
          ctx.stroke();
        }

        ctx.restore();
      });
    }

    // 4. LAYER: PLUMBING ("Tuberías / Fontanería")
    if (showPlumbing) {
      // Draw Pipes
      project.pipes.forEach((pipe) => {
        const isSelected = selectedId === pipe.id;
        const p1 = worldToScreen(pipe.start.x, pipe.start.y);
        const p2 = worldToScreen(pipe.end.x, pipe.end.y);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        if (pipe.pipeType === 'cold_water') {
          ctx.strokeStyle = isSelected ? '#93C5FD' : '#3B82F6';
          ctx.lineWidth = isSelected ? 4 : 3;
        } else if (pipe.pipeType === 'hot_water') {
          ctx.strokeStyle = isSelected ? '#FCA5A5' : '#EF4444';
          ctx.lineWidth = isSelected ? 4 : 3;
        } else {
          // Drainage 110mm (thick orange/gray sewer line)
          ctx.strokeStyle = isSelected ? '#FDE047' : '#F59E0B';
          ctx.lineWidth = isSelected ? 6 : 5;
        }
        ctx.stroke();

        // Length badge
        if (project.showDimensions && scale > 35) {
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const len = distance(pipe.start, pipe.end);
          ctx.fillStyle = pipe.pipeType === 'cold_water' ? '#60A5FA' : pipe.pipeType === 'hot_water' ? '#F87171' : '#FBBF24';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${len.toFixed(2)}m (${pipe.diameterMm}mm)`, midX, midY - 6);
          ctx.textAlign = 'left';
        }
      });

      // Draw Plumbing Fixtures
      project.plumbingFixtures.forEach((fix) => {
        const isSelected = selectedId === fix.id;
        const sc = worldToScreen(fix.position.x, fix.position.y);
        const wPx = fix.width * scale;
        const dPx = fix.depth * scale;

        ctx.save();
        ctx.translate(sc.x, sc.y);
        ctx.rotate((fix.rotation * Math.PI) / 180);

        ctx.fillStyle = isSelected ? '#0891B2' : '#0E7490';
        ctx.strokeStyle = isSelected ? '#A5F3FC' : '#06B6D4';
        ctx.lineWidth = 2;

        if (fix.type === 'toilet') {
          // Toilet WC symbol
          ctx.fillRect(-wPx / 2, -dPx / 2, wPx, dPx * 0.4);
          ctx.strokeRect(-wPx / 2, -dPx / 2, wPx, dPx * 0.4);
          ctx.beginPath();
          ctx.ellipse(0, dPx * 0.1, wPx * 0.4, dPx * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (fix.type === 'shower') {
          // Shower basin with X drain lines
          ctx.fillRect(-wPx / 2, -dPx / 2, wPx, dPx);
          ctx.strokeRect(-wPx / 2, -dPx / 2, wPx, dPx);
          ctx.beginPath();
          ctx.moveTo(-wPx / 2, -dPx / 2);
          ctx.lineTo(wPx / 2, dPx / 2);
          ctx.moveTo(wPx / 2, -dPx / 2);
          ctx.lineTo(-wPx / 2, dPx / 2);
          ctx.strokeStyle = '#22D3EE80';
          ctx.stroke();
        } else {
          // Sink / Kitchen Sink / Heater
          ctx.fillRect(-wPx / 2, -dPx / 2, wPx, dPx);
          ctx.strokeRect(-wPx / 2, -dPx / 2, wPx, dPx);
          ctx.beginPath();
          ctx.arc(0, 0, Math.min(wPx, dPx) * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = '#164E63';
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();

        // Label
        if (scale > 40) {
          ctx.fillStyle = '#A5F3FC';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(fix.label, sc.x, sc.y + (dPx / 2) + 12);
          ctx.textAlign = 'left';
        }
      });
    }

    // 5. LAYER: ELECTRICAL ("Electricidad & Cableado")
    if (showElectrical) {
      // Draw Wires (curved dotted arcs connecting switch to light)
      project.electricalWires.forEach((wire) => {
        const fromItem = project.electricalItems.find((e) => e.id === wire.fromId);
        const toItem = project.electricalItems.find((e) => e.id === wire.toId);
        if (!fromItem || !toItem) return;

        const p1 = worldToScreen(fromItem.position.x, fromItem.position.y);
        const p2 = worldToScreen(toItem.position.x, toItem.position.y);

        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        // Control point for smooth architectural wiring arc
        const midX = (p1.x + p2.x) / 2 + 20;
        const midY = (p1.y + p2.y) / 2 - 20;
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw Electrical Items
      project.electricalItems.forEach((item) => {
        const isSelected = selectedId === item.id;
        const sc = worldToScreen(item.position.x, item.position.y);

        ctx.save();
        ctx.translate(sc.x, sc.y);
        ctx.rotate((item.rotation * Math.PI) / 180);

        if (item.type === 'panel') {
          // Main panel box
          ctx.fillStyle = isSelected ? '#D97706' : '#B45309';
          ctx.strokeStyle = '#FBBF24';
          ctx.lineWidth = 2;
          ctx.fillRect(-18, -12, 36, 24);
          ctx.strokeRect(-18, -12, 36, 24);
        } else if (item.type === 'light_ceiling') {
          // Ceiling light circle with cross
          ctx.fillStyle = isSelected ? '#FDE047' : '#F59E0B';
          ctx.strokeStyle = '#FEF08A';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // cross hairs
          ctx.beginPath();
          ctx.moveTo(-14, 0);
          ctx.lineTo(14, 0);
          ctx.moveTo(0, -14);
          ctx.lineTo(0, 14);
          ctx.stroke();
        } else if (item.type.includes('switch')) {
          // Switch symbol
          ctx.fillStyle = '#1E293B';
          ctx.strokeStyle = isSelected ? '#FEF08A' : '#FBBF24';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.font = 'bold 10px sans-serif';
          ctx.fillStyle = '#FBBF24';
          ctx.textAlign = 'center';
          ctx.fillText(item.type === 'switch_double' ? 'S2' : 'S', 0, 3);
        } else {
          // Outlet 110V/220V
          ctx.fillStyle = isSelected ? '#B45309' : '#1E293B';
          ctx.strokeStyle = isSelected ? '#FEF08A' : '#FBBF24';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // outlet prongs
          ctx.beginPath();
          ctx.moveTo(-3, -3);
          ctx.lineTo(-3, 3);
          ctx.moveTo(3, -3);
          ctx.lineTo(3, 3);
          ctx.stroke();
        }

        ctx.restore();

        // Label
        if (scale > 40) {
          ctx.fillStyle = '#FEF08A';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(item.label, sc.x, sc.y + 22);
          ctx.textAlign = 'left';
        }
      });
    }

    // 6. LAYER: FURNITURE ("Mobiliario Realista en Metros")
    if (showFurniture) {
      project.furniture.forEach((furn) => {
        const isSelected = selectedId === furn.id;
        const sc = worldToScreen(furn.position.x, furn.position.y);
        const wPx = furn.width * scale;
        const dPx = furn.depth * scale;

        ctx.save();
        ctx.translate(sc.x, sc.y);
        ctx.rotate((furn.rotation * Math.PI) / 180);

        // Furniture box background with realistic rounded architectural feel
        ctx.fillStyle = isSelected ? '#7C3AEDC0' : (furn.color || '#6D28D9') + 'A0';
        ctx.strokeStyle = isSelected ? '#C4B5FD' : '#8B5CF6';
        ctx.lineWidth = isSelected ? 3 : 1.5;

        ctx.beginPath();
        ctx.roundRect(-wPx / 2, -dPx / 2, wPx, dPx, 6);
        ctx.fill();
        ctx.stroke();

        // Draw architectural internal details based on furniture type
        if (furn.iconSymbol?.includes('bed')) {
          // Draw pillows at top of bed
          ctx.fillStyle = '#DDD6FE';
          const pillowW = wPx * 0.35;
          const pillowH = dPx * 0.18;
          ctx.fillRect(-wPx / 2 + 8, -dPx / 2 + 8, pillowW, pillowH);
          ctx.fillRect(wPx / 2 - pillowW - 8, -dPx / 2 + 8, pillowW, pillowH);
          // Blanket line
          ctx.strokeStyle = '#DDD6FE';
          ctx.beginPath();
          ctx.moveTo(-wPx / 2, -dPx / 2 + pillowH + 16);
          ctx.lineTo(wPx / 2, -dPx / 2 + pillowH + 16);
          ctx.stroke();
        } else if (furn.iconSymbol === 'sofa') {
          // Sofa backrest & cushions
          ctx.fillStyle = '#4C1D9580';
          ctx.fillRect(-wPx / 2, -dPx / 2, wPx, dPx * 0.25);
        } else if (furn.iconSymbol === 'circle') {
          // Dining table round
          ctx.beginPath();
          ctx.arc(0, 0, Math.min(wPx, dPx) / 2 - 4, 0, Math.PI * 2);
          ctx.strokeStyle = '#10B981';
          ctx.stroke();
        }

        // Furniture Name and Dimensions in Meters
        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(furn.name.split(' (')[0], 0, -3);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#DDD6FE';
        ctx.fillText(`${furn.width.toFixed(2)}m × ${furn.depth.toFixed(2)}m`, 0, 11);

        ctx.restore();
      });
    }

    // 7. DRAWING PREVIEWS (live mouse preview when drawing wall, pipe, wire, or inserting furniture/fixture)
    const activeStartPt = drawStartPt || measureStartPt;
    if (activeStartPt && project.showMeasureLine !== false) {
      const p1 = worldToScreen(activeStartPt.x, activeStartPt.y);
      const p2 = worldToScreen(currentMousePt.x, currentMousePt.y);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle =
        activeTool === 'wall'
          ? '#A5B4FC'
          : activeTool === 'pipe_cold'
          ? '#60A5FA'
          : activeTool === 'pipe_hot'
          ? '#F87171'
          : activeTool === 'measure'
          ? '#38BDF8'
          : '#FBBF24';
      ctx.lineWidth = activeTool === 'measure' ? 2.5 : 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Preview length and angle tooltip in meters & degrees
      const len = distance(activeStartPt, currentMousePt);
      const angleRad = Math.atan2(currentMousePt.y - activeStartPt.y, currentMousePt.x - activeStartPt.x);
      let angleDeg = Math.round((angleRad * 180) / Math.PI);
      if (angleDeg < 0) angleDeg += 360;

      const labelText = `${formatMeters(len)} • ${angleDeg}°`;
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      ctx.save();
      ctx.font = 'bold 11px monospace';
      const tw = ctx.measureText(labelText).width;
      const boxW = tw + 16;
      const boxH = 22;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle =
        activeTool === 'wall'
          ? '#818CF8'
          : activeTool === 'pipe_cold'
          ? '#60A5FA'
          : activeTool === 'pipe_hot'
          ? '#F87171'
          : '#38BDF8';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(midX - boxW / 2, midY - 26, boxW, boxH, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38BDF8';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, midX, midY - 11);
      ctx.restore();
    }

    // Preview furniture or plumbing item under cursor when placement tool is selected
    if (activeTool === 'furniture_item' && selectedFurnitureId) {
      const temp = FURNITURE_CATALOG.find((item) => item.id === selectedFurnitureId);
      if (temp) {
        const sc = worldToScreen(currentMousePt.x, currentMousePt.y);
        const wPx = temp.width * scale;
        const dPx = temp.depth * scale;
        ctx.save();
        ctx.translate(sc.x, sc.y);
        ctx.fillStyle = '#8B5CF640';
        ctx.strokeStyle = '#C4B5FD';
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(-wPx / 2, -dPx / 2, wPx, dPx);
        ctx.fillRect(-wPx / 2, -dPx / 2, wPx, dPx);
        ctx.restore();
      }
    }

    // 8. CAD VIEWPORT RULERS (Top & Left Edge Metric HUD)
    if (project.showGrid) {
      const rulerSize = 22; // Height of top ruler & width of left ruler
      const minW = screenToWorld(0, 0);
      const maxW = screenToWorld(width, height);

      // Top Ruler Bar
      ctx.fillStyle = '#060A12';
      ctx.fillRect(0, 0, width, rulerSize);
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, rulerSize);
      ctx.lineTo(width, rulerSize);
      ctx.stroke();

      // Left Ruler Bar
      ctx.fillRect(0, 0, rulerSize, height);
      ctx.beginPath();
      ctx.moveTo(rulerSize, 0);
      ctx.lineTo(rulerSize, height);
      ctx.stroke();

      // Top-Left Corner Box
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, rulerSize, rulerSize);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(0, 0, rulerSize, rulerSize);

      ctx.fillStyle = '#818CF8';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('m', rulerSize / 2, 14);
      ctx.textAlign = 'left';

      // Top Ruler Tick Marks & Metric Numbers (X)
      const rStep = scale > 120 ? 0.25 : scale > 50 ? 0.50 : 1.0;
      const rStartX = Math.floor(minW.x / rStep) * rStep;
      const rEndX = Math.ceil(maxW.x / rStep) * rStep;

      for (let rx = rStartX; rx <= rEndX; rx += rStep) {
        const rxRound = Math.round(rx * 100) / 100;
        const sp = worldToScreen(rxRound, 0);
        if (sp.x >= rulerSize && sp.x <= width) {
          const is1m = Math.abs(rxRound % 1.0) < 0.001;
          const tickH = is1m ? 10 : 5;

          ctx.strokeStyle = is1m ? '#818CF8' : '#475569';
          ctx.beginPath();
          ctx.moveTo(sp.x, rulerSize - tickH);
          ctx.lineTo(sp.x, rulerSize);
          ctx.stroke();

          if (is1m && scale > 20) {
            ctx.fillStyle = '#94A3B8';
            ctx.font = '9px monospace';
            ctx.fillText(`${rxRound.toFixed(0)}m`, sp.x + 2, 12);
          }
        }
      }

      // Left Ruler Tick Marks & Metric Numbers (Y)
      const rStartY = Math.floor(minW.y / rStep) * rStep;
      const rEndY = Math.ceil(maxW.y / rStep) * rStep;

      for (let ry = rStartY; ry <= rEndY; ry += rStep) {
        const ryRound = Math.round(ry * 100) / 100;
        const sp = worldToScreen(0, ryRound);
        if (sp.y >= rulerSize && sp.y <= height) {
          const is1m = Math.abs(ryRound % 1.0) < 0.001;
          const tickW = is1m ? 10 : 5;

          ctx.strokeStyle = is1m ? '#818CF8' : '#475569';
          ctx.beginPath();
          ctx.moveTo(rulerSize - tickW, sp.y);
          ctx.lineTo(rulerSize, sp.y);
          ctx.stroke();

          if (is1m && scale > 20) {
            ctx.save();
            ctx.translate(11, sp.y - 2);
            ctx.fillStyle = '#94A3B8';
            ctx.font = '9px monospace';
            ctx.fillText(`${ryRound.toFixed(0)}m`, 0, 0);
            ctx.restore();
          }
        }
      }

      // Active Cursor Position Projection Indicators on Rulers
      const mouseScr = worldToScreen(currentMousePt.x, currentMousePt.y);
      if (mouseScr.x >= rulerSize) {
        ctx.fillStyle = '#10B981'; // X axis position indicator
        ctx.beginPath();
        ctx.moveTo(mouseScr.x - 3, 0);
        ctx.lineTo(mouseScr.x + 3, 0);
        ctx.lineTo(mouseScr.x, rulerSize);
        ctx.closePath();
        ctx.fill();
      }
      if (mouseScr.y >= rulerSize) {
        ctx.fillStyle = '#F43F5E'; // Y axis position indicator
        ctx.beginPath();
        ctx.moveTo(0, mouseScr.y - 3);
        ctx.lineTo(0, mouseScr.y + 3);
        ctx.lineTo(rulerSize, mouseScr.y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }, [
    project,
    activeLayer,
    activeTool,
    selectedId,
    scale,
    offset,
    drawStartPt,
    currentMousePt,
    screenToWorld,
    worldToScreen,
    selectedFurnitureId,
  ]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="flex-1 h-full bg-slate-950 relative overflow-hidden select-none cursor-crosshair"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => {
          e.preventDefault();
          setDrawStartPt(null);
          setMeasureStartPt(null);
          setWireStartId(null);
        }}
        className="w-full h-full block"
      />

      {/* Floating Canvas Controls (Zoom, Reset View) */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 shadow-xl z-20">
        <button
          onClick={() => setScale((s) => Math.min(250, s * 1.2))}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          title="Acercar (Zoom In)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <span className="text-xs font-bold px-2 text-slate-300">
          {Math.round((scale / 60) * 100)}%
        </span>

        <button
          onClick={() => setScale((s) => Math.max(15, s * 0.8))}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          title="Alejar (Zoom Out)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setScale(60);
            setOffset({ x: 50, y: 50 });
          }}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border-l border-slate-800 ml-1"
          title="Restablecer Vista (1.00m = 60px)"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Live mouse cursor metric display coordinates overlay */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-slate-300 shadow-lg z-20 flex items-center gap-3">
        <div className="flex items-center gap-1 text-indigo-400">
          <Compass className="w-3.5 h-3.5" />
          <span>Posición:</span>
        </div>
        <div>
          X: <strong className="text-white">{currentMousePt.x.toFixed(2)}m</strong> | Y:{' '}
          <strong className="text-white">{currentMousePt.y.toFixed(2)}m</strong>
        </div>
        <div className="border-l border-slate-700 pl-2 text-emerald-400 font-bold flex items-center gap-1">
          <Magnet className="w-3 h-3" />
          <span>
            {project.snapToGrid
              ? `Precisión: ${Math.round((project.gridSizeMeters || 0.05) * 100)} cm`
              : 'Precisión: Libre (1 cm)'}
          </span>
        </div>
        {activeTool !== 'select' && (
          <div className="text-amber-400 font-bold border-l border-slate-700 pl-2">
            Herramienta: {activeTool.toUpperCase()}
          </div>
        )}
        {onToggleMeasureLine && (
          <button
            onClick={onToggleMeasureLine}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors font-bold ${
              project.showMeasureLine
                ? 'bg-amber-600/20 text-amber-300 border-amber-500/50 hover:bg-amber-600/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
            }`}
            title="Activar o desactivar línea de metro / guía continua de medición en metros (Tecla: T)"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Línea de Metro:</span>
            <span className={project.showMeasureLine ? 'text-amber-300' : 'text-slate-400'}>
              {project.showMeasureLine ? 'ACTIVA' : 'OFF'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
