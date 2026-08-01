/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useCallback, useEffect } from 'react';
import { 
  CADProject, 
  CADLayer, 
  ToolType, 
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
} from './types/cad';
import { SAMPLE_TEMPLATES } from './data/catalog';
import { Navbar } from './components/Navbar';
import { LayerTabs } from './components/LayerTabs';
import { Toolbox } from './components/Toolbox';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Canvas2D } from './components/Canvas2D';
import { StepByStepGuide } from './components/StepByStepGuide';
import { BillOfMaterialsModal } from './components/BillOfMaterialsModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';

export default function App() {
  // Load default template (Departamento 54 m² with complete walls, plumbing, electrical, and furniture)
  const [project, setProject] = useState<CADProject>(() =>
    JSON.parse(JSON.stringify(SAMPLE_TEMPLATES.modern_apartment))
  );

  // Undo / Redo history
  const [history, setHistory] = useState<CADProject[]>([]);
  const [future, setFuture] = useState<CADProject[]>([]);

  // Selection & UI state
  const [activeLayer, setActiveLayer] = useState<CADLayer>('arch');
  const [visibleLayers, setVisibleLayers] = useState<{
    arch: boolean;
    plumbing: boolean;
    electrical: boolean;
    furniture: boolean;
  }>({
    arch: true,
    plumbing: false,
    electrical: false,
    furniture: false,
  });

  const handleToggleLayerVisibility = (
    layer: 'arch' | 'plumbing' | 'electrical' | 'furniture'
  ) => {
    setVisibleLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  const handleToggleArchitecture = () => {
    setVisibleLayers((prev) => ({
      ...prev,
      arch: !prev.arch,
    }));
  };

  const handleLayerChange = (layer: CADLayer) => {
    if (layer === 'all') {
      setActiveLayer('all');
      setVisibleLayers({
        arch: true,
        plumbing: true,
        electrical: true,
        furniture: true,
      });
      return;
    }

    if (activeLayer === layer) {
      // Toggle visibility if already active layer clicked again
      setVisibleLayers((prev) => ({
        ...prev,
        [layer]: !prev[layer as keyof typeof prev],
      }));
    } else {
      setActiveLayer(layer);
      // Keep architecture/walls layer visible by default on all tabs as background context
      setVisibleLayers((prev) => ({
        ...prev,
        arch: true,
        [layer]: true,
      }));
    }

    if (layer === 'arch') setActiveTool('select');
    if (layer === 'plumbing') setActiveTool('pipe_cold');
    if (layer === 'electrical') setActiveTool('elec_wire');
    if (layer === 'furniture') setActiveTool('furniture_item');
  };
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<
    'wall' | 'plumbing' | 'pipe' | 'electrical' | 'furniture' | 'room' | null
  >(null);

  // Picker selections for tools
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string>('bed-queen');
  const [selectedPlumbingType, setSelectedPlumbingType] = useState<PlumbingFixtureType>('toilet');
  const [selectedElectricalType, setSelectedElectricalType] = useState<ElectricalItemType>('outlet_110v');

  // Architectural active configuration
  const [activeWallThickness, setActiveWallThickness] = useState<number>(0.15);
  const [activeDoorWidth, setActiveDoorWidth] = useState<number>(0.85);
  const [activeWindowWidth, setActiveWindowWidth] = useState<number>(1.40);

  // Modal states
  const [isStepGuideOpen, setIsStepGuideOpen] = useState(false);
  const [activeStepNumber, setActiveStepNumber] = useState(1);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Helper to push to undo stack
  const updateProjectWithHistory = useCallback(
    (newProject: CADProject) => {
      setHistory((prev) => [...prev.slice(-25), project]);
      setFuture([]);
      setProject(newProject);
    },
    [project]
  );

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture((prev) => [project, ...prev]);
    setHistory((prev) => prev.slice(0, -1));
    setProject(previous);
    setSelectedId(null);
    setSelectedType(null);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((prev) => [...prev, project]);
    setFuture((prev) => prev.slice(1));
    setProject(next);
    setSelectedId(null);
    setSelectedType(null);
  };

  // Add handlers
  const handleAddWall = (wall: Wall) => {
    const next = { ...project, walls: [...project.walls, wall] };
    updateProjectWithHistory(next);
  };

  const handleAddOpening = (op: WallOpening) => {
    const next = { ...project, openings: [...project.openings, op] };
    updateProjectWithHistory(next);
  };

  const handleAddPipe = (pipe: PipeSegment) => {
    const next = { ...project, pipes: [...project.pipes, pipe] };
    updateProjectWithHistory(next);
  };

  const handleAddPlumbingFixture = (fixture: PlumbingFixture) => {
    const next = {
      ...project,
      plumbingFixtures: [...project.plumbingFixtures, fixture],
    };
    updateProjectWithHistory(next);
    setSelectedId(fixture.id);
    setSelectedType('plumbing');
    setActiveTool('select');
  };

  const handleAddElectricalItem = (item: ElectricalItem) => {
    const next = {
      ...project,
      electricalItems: [...project.electricalItems, item],
    };
    updateProjectWithHistory(next);
    setSelectedId(item.id);
    setSelectedType('electrical');
    setActiveTool('select');
  };

  const handleAddElectricalWire = (wire: ElectricalWire) => {
    const next = {
      ...project,
      electricalWires: [...project.electricalWires, wire],
    };
    updateProjectWithHistory(next);
  };

  const handleAddFurniture = (furniture: FurnitureItem) => {
    const next = {
      ...project,
      furniture: [...project.furniture, furniture],
    };
    updateProjectWithHistory(next);
    setSelectedId(furniture.id);
    setSelectedType('furniture');
    setActiveTool('select');
  };

  const handleAddRoomLabel = (room: RoomLabel) => {
    const next = {
      ...project,
      rooms: [...project.rooms, room],
    };
    updateProjectWithHistory(next);
    setSelectedId(room.id);
    setSelectedType('room');
    setActiveTool('select');
  };

  const handleQuickAddRoomTag = (tagName: string) => {
    let px = 3, py = 3;
    if (project.rooms.length > 0) {
      const last = project.rooms[project.rooms.length - 1];
      px = Math.round((last.position.x + 2.5) * 10) / 10;
      py = last.position.y;
    } else if (project.walls.length > 0) {
      px = Math.round(((project.walls[0].start.x + project.walls[0].end.x) / 2) * 10) / 10;
      py = Math.round(((project.walls[0].start.y + project.walls[0].end.y) / 2) * 10) / 10;
    }
    const newRoom: RoomLabel = {
      id: `room-${Date.now()}`,
      position: { x: px, y: py },
      name: tagName,
      areaM2: 12.0,
    };
    handleAddRoomLabel(newRoom);
  };

  const handleQuickInsertPrefabRoom = (roomType: 'bedroom' | 'bathroom' | 'kitchen' | 'living' | 'office' | 'studio') => {
    let maxX = 0, minY = 1;
    if (project.walls.length > 0) {
      maxX = Math.max(...project.walls.map(w => Math.max(w.start.x, w.end.x)));
      minY = Math.min(...project.walls.map(w => Math.min(w.start.y, w.end.y)));
    }

    const startX = project.walls.length > 0 ? Math.round((maxX + 1.5) * 10) / 10 : 1;
    const startY = project.walls.length > 0 ? Math.round(minY * 10) / 10 : 1;

    const now = Date.now();
    let width = 4, depth = 3;
    let roomName = 'Dormitorio Principal';
    let thick = 0.15;

    if (roomType === 'bathroom') { width = 2.5; depth = 1.8; roomName = 'Baño Completo'; }
    else if (roomType === 'kitchen') { width = 4.0; depth = 3.5; roomName = 'Cocina Abierta'; }
    else if (roomType === 'living') { width = 5.0; depth = 4.0; roomName = 'Sala de Estar'; thick = 0.20; }
    else if (roomType === 'office') { width = 3.5; depth = 3.0; roomName = 'Oficina / Estudio'; }
    else if (roomType === 'studio') { width = 6.0; depth = 4.5; roomName = 'Monoambiente Studio'; thick = 0.20; }

    const endX = Math.round((startX + width) * 10) / 10;
    const endY = Math.round((startY + depth) * 10) / 10;

    const wN: Wall = { id: `wall-${now}-1`, start: { x: startX, y: startY }, end: { x: endX, y: startY }, thickness: thick, type: thick >= 0.20 ? 'exterior' : 'interior', label: 'Muro Norte' };
    const wE: Wall = { id: `wall-${now}-2`, start: { x: endX, y: startY }, end: { x: endX, y: endY }, thickness: thick, type: thick >= 0.20 ? 'exterior' : 'interior', label: 'Muro Este' };
    const wS: Wall = { id: `wall-${now}-3`, start: { x: endX, y: endY }, end: { x: startX, y: endY }, thickness: thick, type: thick >= 0.20 ? 'exterior' : 'interior', label: 'Muro Sur' };
    const wW: Wall = { id: `wall-${now}-4`, start: { x: startX, y: endY }, end: { x: startX, y: startY }, thickness: thick, type: thick >= 0.20 ? 'exterior' : 'interior', label: 'Muro Oeste' };

    const doorOp: WallOpening = {
      id: `door-${now}`,
      wallId: wS.id,
      offset: 0.8,
      width: roomType === 'bathroom' ? 0.80 : 0.90,
      type: 'door',
      swing: 'in',
    };

    const winOp: WallOpening = {
      id: `win-${now}`,
      wallId: wN.id,
      offset: width / 2,
      width: roomType === 'bathroom' ? 0.60 : 1.40,
      type: 'window',
    };

    const newRoomLabel: RoomLabel = {
      id: `room-${now}`,
      position: { x: Math.round((startX + width / 2) * 10) / 10, y: Math.round((startY + depth / 2) * 10) / 10 },
      name: roomName,
      areaM2: Math.round(width * depth * 10) / 10,
    };

    const nextProject: CADProject = {
      ...project,
      walls: [...project.walls, wN, wE, wS, wW],
      openings: [...project.openings, doorOp, winOp],
      rooms: [...project.rooms, newRoomLabel],
    };

    updateProjectWithHistory(nextProject);
    setActiveLayer('arch');
    setActiveTool('select');
  };

  // Update handlers
  const handleUpdateWall = (updated: Wall) => {
    const next = {
      ...project,
      walls: project.walls.map((w) => (w.id === updated.id ? updated : w)),
    };
    setProject(next);
  };

  const handleUpdateFurniture = (updated: FurnitureItem) => {
    const next = {
      ...project,
      furniture: project.furniture.map((f) => (f.id === updated.id ? updated : f)),
    };
    setProject(next);
  };

  const handleUpdatePlumbingFixture = (updated: PlumbingFixture) => {
    const next = {
      ...project,
      plumbingFixtures: project.plumbingFixtures.map((pf) =>
        pf.id === updated.id ? updated : pf
      ),
    };
    setProject(next);
  };

  const handleUpdateElectricalItem = (updated: ElectricalItem) => {
    const next = {
      ...project,
      electricalItems: project.electricalItems.map((el) =>
        el.id === updated.id ? updated : el
      ),
    };
    setProject(next);
  };

  const handleUpdatePipe = (updated: PipeSegment) => {
    const next = {
      ...project,
      pipes: project.pipes.map((p) => (p.id === updated.id ? updated : p)),
    };
    setProject(next);
  };

  const handleUpdateRoom = (updated: RoomLabel) => {
    const next = {
      ...project,
      rooms: project.rooms.map((r) => (r.id === updated.id ? updated : r)),
    };
    setProject(next);
  };

  // Delete by ID
  const handleDeleteById = (id: string) => {
    const next = {
      ...project,
      walls: project.walls.filter((w) => w.id !== id),
      openings: project.openings.filter((o) => o.id !== id && o.wallId !== id),
      pipes: project.pipes.filter((p) => p.id !== id),
      plumbingFixtures: project.plumbingFixtures.filter((f) => f.id !== id),
      electricalItems: project.electricalItems.filter((e) => e.id !== id),
      electricalWires: project.electricalWires.filter(
        (w) => w.id !== id && w.fromId !== id && w.toId !== id
      ),
      furniture: project.furniture.filter((f) => f.id !== id),
      rooms: project.rooms.filter((r) => r.id !== id),
    };
    updateProjectWithHistory(next);
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedType(null);
    }
  };

  const handleAddOpeningToWall = (wallId: string, type: 'door' | 'window') => {
    const wall = project.walls.find((w) => w.id === wallId);
    if (!wall) return;
    const op: WallOpening = {
      id: `${type}-${Date.now()}`,
      wallId,
      offset: 1.5,
      width: type === 'door' ? 0.85 : 1.40,
      type,
      swing: type === 'door' ? 'in' : undefined,
    };
    handleAddOpening(op);
  };

  const handleDeleteOpening = (openingId: string) => {
    const next = {
      ...project,
      openings: project.openings.filter((o) => o.id !== openingId),
    };
    updateProjectWithHistory(next);
  };

  // Export PNG canvas image
  const handleExportPng = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${project.name.replace(/\s+/g, '_')}_Plano.png`;
    link.href = image;
    link.click();
  };

  // Rotate entire plan geometry by 90° CW, 90° CCW, or 180°
  const handleRotatePlan = useCallback(
    (direction: 'cw' | 'ccw' | 'flip') => {
      const angleDeg = direction === 'cw' ? 90 : direction === 'ccw' ? -90 : 180;

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const includePt = (pt: { x: number; y: number } | undefined) => {
        if (!pt) return;
        minX = Math.min(minX, pt.x);
        maxX = Math.max(maxX, pt.x);
        minY = Math.min(minY, pt.y);
        maxY = Math.max(maxY, pt.y);
      };

      project.walls.forEach((w) => { includePt(w.start); includePt(w.end); });
      project.furniture.forEach((f) => includePt(f.position));
      project.plumbingFixtures.forEach((p) => includePt(p.position));
      project.electricalItems.forEach((e) => includePt(e.position));
      project.pipes.forEach((p) => { includePt(p.start); includePt(p.end); });
      project.rooms.forEach((r) => includePt(r.position));

      if (minX === Infinity) {
        minX = -5; maxX = 5; minY = -5; maxY = 5;
      }

      const cx = Math.round(((minX + maxX) / 2) * 20) / 20;
      const cy = Math.round(((minY + maxY) / 2) * 20) / 20;

      const rad = (angleDeg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const rotatePt = (pt: { x: number; y: number }) => {
        const dx = pt.x - cx;
        const dy = pt.y - cy;
        return {
          x: Math.round((cx + (dx * cos - dy * sin)) * 100) / 100,
          y: Math.round((cy + (dx * sin + dy * cos)) * 100) / 100,
        };
      };

      const newProject: CADProject = {
        ...project,
        walls: project.walls.map((w) => ({
          ...w,
          start: rotatePt(w.start),
          end: rotatePt(w.end),
        })),
        furniture: project.furniture.map((f) => ({
          ...f,
          position: rotatePt(f.position),
          rotation: (f.rotation + angleDeg + 360) % 360,
        })),
        plumbingFixtures: project.plumbingFixtures.map((p) => ({
          ...p,
          position: rotatePt(p.position),
          rotation: (p.rotation + angleDeg + 360) % 360,
        })),
        electricalItems: project.electricalItems.map((e) => ({
          ...e,
          position: rotatePt(e.position),
          rotation: (e.rotation + angleDeg + 360) % 360,
        })),
        pipes: project.pipes.map((p) => ({
          ...p,
          start: rotatePt(p.start),
          end: rotatePt(p.end),
        })),
        rooms: project.rooms.map((r) => ({
          ...r,
          position: rotatePt(r.position),
        })),
        electricalWires: project.electricalWires.map((w) => ({
          ...w,
          path: w.path ? w.path.map(rotatePt) : undefined,
        })),
      };

      updateProjectWithHistory(newProject);
    },
    [project, updateProjectWithHistory]
  );

  // Global Keyboard Shortcuts for architect design speed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea or select
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Shortcuts modal (? or k)
      if (e.key === '?' || e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      // Grid / Dimensions / Measure line toggle
      if (e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setProject((prev) => ({ ...prev, showGrid: !prev.showGrid }));
        return;
      }
      if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        setProject((prev) => ({ ...prev, showDimensions: !prev.showDimensions }));
        return;
      }
      if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        setProject((prev) => ({ ...prev, showMeasureLine: !prev.showMeasureLine }));
        return;
      }

      // Escape key - clear selection or tool
      if (e.key === 'Escape') {
        if (selectedId) {
          setSelectedId(null);
          setSelectedType(null);
        } else if (activeTool !== 'select') {
          setActiveTool('select');
        }
        return;
      }

      // Delete item
      if (e.key === 'Delete' || e.key === 'Backspace' || e.key.toLowerCase() === 'x') {
        if (selectedId) {
          e.preventDefault();
          handleDeleteById(selectedId);
          return;
        } else if (e.key.toLowerCase() === 'x') {
          setActiveTool('eraser');
          return;
        }
      }

      // Rotate selected item by 15 deg, OR rotate entire plan by 90 deg if nothing selected
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (selectedId) {
          const delta = e.shiftKey ? -15 : 15;
          if (selectedType === 'furniture') {
            const f = project.furniture.find((item) => item.id === selectedId);
            if (f) {
              handleUpdateFurniture({
                ...f,
                rotation: ((f.rotation + delta) % 360 + 360) % 360,
              });
            }
          } else if (selectedType === 'plumbing') {
            const p = project.plumbingFixtures.find((item) => item.id === selectedId);
            if (p) {
              handleUpdatePlumbingFixture({
                ...p,
                rotation: ((p.rotation + delta) % 360 + 360) % 360,
              });
            }
          } else if (selectedType === 'electrical') {
            const el = project.electricalItems.find((item) => item.id === selectedId);
            if (el) {
              handleUpdateElectricalItem({
                ...el,
                rotation: ((el.rotation + delta) % 360 + 360) % 360,
              });
            }
          }
        } else {
          // No item selected: Rotate entire project plan by 90 deg!
          handleRotatePlan(e.shiftKey ? 'ccw' : 'cw');
        }
        return;
      }

      // Tool quick selection shortcuts
      switch (e.key.toLowerCase()) {
        case 'v':
        case '1':
          setActiveTool('select');
          break;
        case 'm':
          setActiveTool('move');
          break;
        case 'q':
          setActiveTool('measure');
          break;
        case 'h':
        case ' ': // spacebar for pan
          e.preventDefault();
          setActiveTool('pan');
          break;
        case 'w':
        case '2':
          setActiveLayer('arch');
          setActiveTool('wall');
          break;
        case 'd':
        case '3':
          setActiveLayer('arch');
          setActiveTool('door');
          break;
        case 'n':
        case '4':
          setActiveLayer('arch');
          setActiveTool('window');
          break;
        case 'l':
          setActiveLayer('arch');
          setActiveTool('room_label');
          break;
        case 'p':
        case '5':
          setActiveLayer('plumbing');
          setActiveTool('pipe_cold');
          break;
        case 'e':
        case '6':
          setActiveLayer('electrical');
          setActiveTool('elec_wire');
          break;
        case 'f':
        case '7':
          setActiveLayer('furniture');
          setActiveTool('furniture_item');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    project,
    selectedId,
    selectedType,
    activeTool,
    handleUndo,
    handleRedo,
    handleDeleteById,
  ]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Top Navbar */}
      <Navbar
        project={project}
        activeLayer={activeLayer}
        visibleLayers={visibleLayers}
        onToggleArchitecture={handleToggleArchitecture}
        onLoadProject={(loaded) => {
          updateProjectWithHistory(loaded);
          setSelectedId(null);
          setSelectedType(null);
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        onRotatePlan={handleRotatePlan}
        onOpenStepGuide={() => {
          setIsStepGuideOpen(true);
        }}
        onOpenAuditModal={() => {
          setIsAuditModalOpen(true);
        }}
        onOpenAIModal={() => {
          setIsAIModalOpen(true);
        }}
        onOpenShortcutsModal={() => {
          setIsShortcutsModalOpen(true);
        }}
        onExportPng={handleExportPng}
        onToggleGrid={() => {
          setProject((prev) => ({ ...prev, showGrid: !prev.showGrid }));
        }}
        onToggleSnap={() => {
          setProject((prev) => ({ ...prev, snapToGrid: !prev.snapToGrid }));
        }}
        onChangeGridSize={(size) => {
          setProject((prev) => ({
            ...prev,
            gridSizeMeters: size,
            snapToGrid: size > 0.01 ? true : false,
          }));
        }}
        onToggleDimensions={() => {
          setProject((prev) => ({ ...prev, showDimensions: !prev.showDimensions }));
        }}
        onToggleMeasureLine={() => {
          if (project.showMeasureLine && activeTool === 'measure') {
            setActiveTool('select');
          }
          setProject((prev) => ({ ...prev, showMeasureLine: !prev.showMeasureLine }));
        }}
      />

      {/* Second Row: Step-by-Step Layer switches */}
      <LayerTabs
        activeLayer={activeLayer}
        onChangeLayer={handleLayerChange}
        onToggleLayerVisibility={handleToggleLayerVisibility}
        visibleLayers={visibleLayers}
        onOpenStepGuide={(step) => {
          setActiveStepNumber(step);
          setIsStepGuideOpen(true);
        }}
        counts={{
          archCount: project.walls.length + project.openings.length,
          plumbingCount: project.pipes.length + project.plumbingFixtures.length,
          electricalCount: project.electricalItems.length + project.electricalWires.length,
          furnitureCount: project.furniture.length,
        }}
      />

      {/* Main Workspace: Toolbox + Canvas + Properties */}
      <div className="flex flex-1 overflow-hidden relative">
        <Toolbox
          activeLayer={activeLayer}
          activeTool={activeTool}
          onSelectTool={(t) => {
            setActiveTool(t);
          }}
          selectedFurnitureId={selectedFurnitureId}
          onSelectFurnitureId={(id) => {
            setSelectedFurnitureId(id);
            setActiveTool('furniture_item');
          }}
          selectedPlumbingType={selectedPlumbingType}
          onSelectPlumbingType={(t) => {
            setSelectedPlumbingType(t);
            setActiveTool('plumbing_fixture');
          }}
          selectedElectricalType={selectedElectricalType}
          onSelectElectricalType={(t) => {
            setSelectedElectricalType(t);
            setActiveTool(
              t === 'panel'
                ? 'elec_panel'
                : t.includes('outlet')
                ? 'elec_outlet'
                : t.includes('switch')
                ? 'elec_switch'
                : 'elec_light'
            );
          }}
          activeWallThickness={activeWallThickness}
          onSelectWallThickness={(thick) => {
            setActiveWallThickness(thick);
            setActiveTool('wall');
          }}
          activeDoorWidth={activeDoorWidth}
          onSelectDoorWidth={(width) => {
            setActiveDoorWidth(width);
            setActiveTool('door');
          }}
          activeWindowWidth={activeWindowWidth}
          onSelectWindowWidth={(width) => {
            setActiveWindowWidth(width);
            setActiveTool('window');
          }}
          onQuickAddRoomTag={handleQuickAddRoomTag}
          onQuickInsertPrefabRoom={handleQuickInsertPrefabRoom}
        />

        <Canvas2D
          project={project}
          activeLayer={activeLayer}
          visibleLayers={visibleLayers}
          activeTool={activeTool}
          selectedId={selectedId}
          selectedType={selectedType}
          activeWallThickness={activeWallThickness}
          activeDoorWidth={activeDoorWidth}
          activeWindowWidth={activeWindowWidth}
          onSelectObject={(id, type) => {
            setSelectedId(id);
            setSelectedType(type);
          }}
          onAddWall={handleAddWall}
          onAddOpening={handleAddOpening}
          onAddPipe={handleAddPipe}
          onAddPlumbingFixture={handleAddPlumbingFixture}
          onAddElectricalItem={handleAddElectricalItem}
          onAddElectricalWire={handleAddElectricalWire}
          onAddFurniture={handleAddFurniture}
          onAddRoomLabel={handleAddRoomLabel}
          onUpdateWall={handleUpdateWall}
          onUpdateFurniture={handleUpdateFurniture}
          onUpdatePlumbingFixture={handleUpdatePlumbingFixture}
          onUpdateElectricalItem={handleUpdateElectricalItem}
          onUpdatePipe={handleUpdatePipe}
          onUpdateRoom={handleUpdateRoom}
          onDeleteById={handleDeleteById}
          selectedFurnitureId={selectedFurnitureId}
          selectedPlumbingType={selectedPlumbingType}
          selectedElectricalType={selectedElectricalType}
          onRotatePlan={handleRotatePlan}
          onToggleMeasureLine={() => {
            if (project.showMeasureLine && activeTool === 'measure') {
              setActiveTool('select');
            }
            setProject((prev) => ({ ...prev, showMeasureLine: !prev.showMeasureLine }));
          }}
        />

        <PropertiesPanel
          project={project}
          selectedId={selectedId}
          selectedType={selectedType}
          onUpdateWall={handleUpdateWall}
          onUpdatePlumbingFixture={handleUpdatePlumbingFixture}
          onUpdatePipe={handleUpdatePipe}
          onUpdateElectricalItem={handleUpdateElectricalItem}
          onUpdateFurniture={handleUpdateFurniture}
          onUpdateRoom={handleUpdateRoom}
          onDeleteSelected={() => {
            if (selectedId) handleDeleteById(selectedId);
          }}
          onAddOpeningToWall={handleAddOpeningToWall}
          onDeleteOpening={handleDeleteOpening}
        />
      </div>

      {/* Modals */}
      <StepByStepGuide
        isOpen={isStepGuideOpen}
        onClose={() => setIsStepGuideOpen(false)}
        activeStep={activeStepNumber}
        onSelectStep={(step, layer) => {
          setActiveStepNumber(step);
          setActiveLayer(layer);
        }}
      />

      <BillOfMaterialsModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        project={project}
      />

      <AIAssistantModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        project={project}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}

