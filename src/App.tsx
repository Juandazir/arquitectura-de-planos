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

      // Rotate selected item (furniture, plumbing, electrical) by 15 deg (or -15 with shift)
      if (e.key.toLowerCase() === 'r' && selectedId) {
        e.preventDefault();
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
        />

        <Canvas2D
          project={project}
          activeLayer={activeLayer}
          visibleLayers={visibleLayers}
          activeTool={activeTool}
          selectedId={selectedId}
          selectedType={selectedType}
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

