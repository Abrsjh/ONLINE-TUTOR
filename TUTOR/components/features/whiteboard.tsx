'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Pencil, 
  Eraser, 
  Square, 
  Circle, 
  Type, 
  Undo, 
  Redo, 
  Trash2, 
  Download, 
  Upload,
  Palette,
  Minus,
  Triangle
} from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface DrawingElement {
  id: string;
  type: 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'triangle' | 'text';
  points: Point[];
  color: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
  timestamp: number;
}

interface WhiteboardProps {
  sessionId?: string;
  onElementsChange?: (elements: DrawingElement[]) => void;
  readOnly?: boolean;
  className?: string;
}

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'triangle' | 'text';

const COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'
];

const STROKE_WIDTHS = [1, 2, 4, 6, 8, 12, 16];

export default function Whiteboard({ 
  sessionId, 
  onElementsChange, 
  readOnly = false, 
  className = '' 
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [undoStack, setUndoStack] = useState<DrawingElement[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawingElement[][]>([]);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState<Point>({ x: 0, y: 0 });
  const [fontSize, setFontSize] = useState(16);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      context.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      // Redraw all elements
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    contextRef.current = context;

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Redraw canvas with all elements
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set white background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all elements
    elements.forEach(element => {
      drawElement(context, element);
    });

    // Draw current element if drawing
    if (currentElement) {
      drawElement(context, currentElement);
    }
  }, [elements, currentElement]);

  // Draw individual element
  const drawElement = useCallback((context: CanvasRenderingContext2D, element: DrawingElement) => {
    if (element.points.length === 0) return;

    context.strokeStyle = element.color;
    context.lineWidth = element.strokeWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    switch (element.type) {
      case 'pen':
        context.globalCompositeOperation = 'source-over';
        context.beginPath();
        context.moveTo(element.points[0].x, element.points[0].y);
        element.points.forEach(point => {
          context.lineTo(point.x, point.y);
        });
        context.stroke();
        break;

      case 'eraser':
        context.globalCompositeOperation = 'destination-out';
        context.beginPath();
        context.moveTo(element.points[0].x, element.points[0].y);
        element.points.forEach(point => {
          context.lineTo(point.x, point.y);
        });
        context.stroke();
        context.globalCompositeOperation = 'source-over';
        break;

      case 'rectangle':
        if (element.points.length >= 2) {
          const start = element.points[0];
          const end = element.points[element.points.length - 1];
          context.strokeRect(
            start.x,
            start.y,
            end.x - start.x,
            end.y - start.y
          );
        }
        break;

      case 'circle':
        if (element.points.length >= 2) {
          const start = element.points[0];
          const end = element.points[element.points.length - 1];
          const radius = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
          );
          context.beginPath();
          context.arc(start.x, start.y, radius, 0, 2 * Math.PI);
          context.stroke();
        }
        break;

      case 'line':
        if (element.points.length >= 2) {
          const start = element.points[0];
          const end = element.points[element.points.length - 1];
          context.beginPath();
          context.moveTo(start.x, start.y);
          context.lineTo(end.x, end.y);
          context.stroke();
        }
        break;

      case 'triangle':
        if (element.points.length >= 2) {
          const start = element.points[0];
          const end = element.points[element.points.length - 1];
          const width = end.x - start.x;
          const height = end.y - start.y;
          context.beginPath();
          context.moveTo(start.x + width / 2, start.y);
          context.lineTo(start.x, end.y);
          context.lineTo(end.x, end.y);
          context.closePath();
          context.stroke();
        }
        break;

      case 'text':
        if (element.text && element.points.length > 0) {
          context.font = `${element.fontSize || 16}px Arial`;
          context.fillStyle = element.color;
          context.fillText(element.text, element.points[0].x, element.points[0].y);
        }
        break;
    }
  }, []);

  // Get point from event (mouse or touch)
  const getPointFromEvent = useCallback((event: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in event) {
      const touch = event.touches[0] || event.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  // Start drawing
  const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;

    event.preventDefault();
    const point = getPointFromEvent(event);

    if (currentTool === 'text') {
      setTextPosition(point);
      setShowTextInput(true);
      return;
    }

    setIsDrawing(true);
    setStartPoint(point);

    const newElement: DrawingElement = {
      id: `${Date.now()}-${Math.random()}`,
      type: currentTool,
      points: [point],
      color: currentColor,
      strokeWidth: strokeWidth,
      timestamp: Date.now()
    };

    setCurrentElement(newElement);
  }, [readOnly, currentTool, currentColor, strokeWidth, getPointFromEvent]);

  // Continue drawing
  const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentElement || readOnly) return;

    event.preventDefault();
    const point = getPointFromEvent(event);

    if (currentTool === 'pen' || currentTool === 'eraser') {
      setCurrentElement(prev => prev ? {
        ...prev,
        points: [...prev.points, point]
      } : null);
    } else {
      // For shapes, only update the end point
      setCurrentElement(prev => prev ? {
        ...prev,
        points: [prev.points[0], point]
      } : null);
    }
  }, [isDrawing, currentElement, currentTool, readOnly, getPointFromEvent]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing || !currentElement) return;

    setIsDrawing(false);
    
    // Add to undo stack
    setUndoStack(prev => [...prev, elements]);
    setRedoStack([]);

    // Add element to elements
    setElements(prev => [...prev, currentElement]);
    setCurrentElement(null);
    setStartPoint(null);
  }, [isDrawing, currentElement, elements]);

  // Add text
  const addText = useCallback(() => {
    if (!textInput.trim()) {
      setShowTextInput(false);
      setTextInput('');
      return;
    }

    const textElement: DrawingElement = {
      id: `${Date.now()}-${Math.random()}`,
      type: 'text',
      points: [textPosition],
      color: currentColor,
      strokeWidth: strokeWidth,
      text: textInput,
      fontSize: fontSize,
      timestamp: Date.now()
    };

    setUndoStack(prev => [...prev, elements]);
    setRedoStack([]);
    setElements(prev => [...prev, textElement]);
    setShowTextInput(false);
    setTextInput('');
  }, [textInput, textPosition, currentColor, strokeWidth, fontSize, elements]);

  // Undo
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, elements]);
    setElements(previousState);
    setUndoStack(prev => prev.slice(0, -1));
  }, [undoStack, elements]);

  // Redo
  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, elements]);
    setElements(nextState);
    setRedoStack(prev => prev.slice(0, -1));
  }, [redoStack, elements]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    setUndoStack(prev => [...prev, elements]);
    setRedoStack([]);
    setElements([]);
  }, [elements]);

  // Export canvas
  const exportCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, []);

  // Import image
  const importImage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (!canvas || !context) return;

        context.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  // Redraw when elements change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Notify parent of changes
  useEffect(() => {
    onElementsChange?.(elements);
  }, [elements, onElementsChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            event.preventDefault();
            redo();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const toolButtons = useMemo(() => [
    { tool: 'pen' as Tool, icon: Pencil, label: 'Pen' },
    { tool: 'eraser' as Tool, icon: Eraser, label: 'Eraser' },
    { tool: 'rectangle' as Tool, icon: Square, label: 'Rectangle' },
    { tool: 'circle' as Tool, icon: Circle, label: 'Circle' },
    { tool: 'line' as Tool, icon: Minus, label: 'Line' },
    { tool: 'triangle' as Tool, icon: Triangle, label: 'Triangle' },
    { tool: 'text' as Tool, icon: Type, label: 'Text' },
  ], []);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tools */}
          <div className="flex gap-1">
            {toolButtons.map(({ tool, icon: Icon, label }) => (
              <Button
                key={tool}
                variant={currentTool === tool ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool(tool)}
                disabled={readOnly}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </Button>
            ))}
          </div>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Color picker */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              disabled={readOnly}
              title="Color"
            >
              <Palette className="w-4 h-4 mr-1" />
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: currentColor }}
              />
            </Button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded-lg shadow-lg z-10">
                <div className="grid grid-cols-5 gap-1">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                      style={{ 
                        backgroundColor: color,
                        borderColor: currentColor === color ? '#000' : '#ccc'
                      }}
                      onClick={() => {
                        setCurrentColor(color);
                        setShowColorPicker(false);
                      }}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={currentColor}
                  onChange={(e) => setCurrentColor(e.target.value)}
                  className="w-full mt-2 h-8"
                />
              </div>
            )}
          </div>

          {/* Stroke width */}
          <div className="flex items-center gap-2">
            <span className="text-sm">Size:</span>
            <select
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              disabled={readOnly}
              className="px-2 py-1 border rounded text-sm"
            >
              {STROKE_WIDTHS.map(width => (
                <option key={width} value={width}>{width}px</option>
              ))}
            </select>
          </div>

          {/* Font size for text */}
          {currentTool === 'text' && (
            <div className="flex items-center gap-2">
              <span className="text-sm">Font:</span>
              <Input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                min="8"
                max="72"
                className="w-16 h-8"
                disabled={readOnly}
              />
            </div>
          )}

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={undoStack.length === 0 || readOnly}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={redoStack.length === 0 || readOnly}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            disabled={elements.length === 0 || readOnly}
            title="Clear All"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCanvas}
            title="Export as PNG"
          >
            <Download className="w-4 h-4" />
          </Button>

          <label className="cursor-pointer">
            <Button
              variant="outline"
              size="sm"
              disabled={readOnly}
              title="Import Image"
              asChild
            >
              <span>
                <Upload className="w-4 h-4" />
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={importImage}
              className="hidden"
              disabled={readOnly}
            />
          </label>
        </div>
      </Card>

      {/* Canvas Container */}
      <div className="flex-1 relative border rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ 
            cursor: currentTool === 'eraser' ? 'grab' : 
                   currentTool === 'text' ? 'text' : 'crosshair'
          }}
        />

        {/* Text Input Overlay */}
        {showTextInput && (
          <div
            className="absolute bg-white border rounded p-2 shadow-lg z-10"
            style={{
              left: textPosition.x,
              top: textPosition.y,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              className="mb-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addText();
                } else if (e.key === 'Escape') {
                  setShowTextInput(false);
                  setTextInput('');
                }
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={addText}>Add</Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setShowTextInput(false);
                  setTextInput('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="mt-2 text-sm text-gray-500 flex justify-between items-center">
        <span>
          Tool: {currentTool} | Color: {currentColor} | Size: {strokeWidth}px
        </span>
        <span>
          Elements: {elements.length} | 
          Can Undo: {undoStack.length} | 
          Can Redo: {redoStack.length}
        </span>
      </div>
    </div>
  );
}