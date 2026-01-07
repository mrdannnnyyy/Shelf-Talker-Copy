
export type LayerType = 'text' | 'shape' | 'image' | 'group';

export interface LayerStyle {
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'bolder' | number | string;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  textAlign?: 'left' | 'center' | 'right';
  textDecoration?: 'none' | 'line-through';
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
  borderRadius?: number;
  border?: string;
  width?: number;
  height?: number;
  maxWidth?: number; // For Smart Text
  maxHeight?: number; // For Smart Text
  opacity?: number;
  padding?: string;
  display?: string;
  alignItems?: string;
  justifyContent?: string;
  letterSpacing?: string | number;
  lineHeight?: string | number;
  clipPath?: string;
  zIndex?: number;
  boxShadow?: string;
  pointerEvents?: string;
}

export interface Layer {
  id: string;
  type: LayerType;
  name: string;
  content?: string;
  x: number;
  y: number;
  style: LayerStyle;
  children?: Layer[];
  className?: string; 
  locked?: boolean; // To prevent moving specific background elements if needed
}

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundTop: string; 
  backgroundBottom: string;
  splitRatio: number; // New: 0.0 to 1.0 (default 0.6)
}

export interface Template {
  id: string;
  name: string;
  layers: Layer[];
  config: CanvasConfig;
}

export type Product = Record<string, string>;

export interface ColumnMapping {
  [layerId: string]: string; 
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  productName: string;
  templateName: string;
  printDate: string;
  layers: Layer[]; // Snapshot of the design
  layerMapping: Record<string, string>; // Snapshot of the bindings
  config?: CanvasConfig; // Snapshot of canvas settings
}
