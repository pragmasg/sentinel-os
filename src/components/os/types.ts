import type { ComponentType } from "react";

export type WidgetSize = { w: number; h: number };

export type WidgetDefinition = {
  id: string;
  title: string;
  component: ComponentType<any>;
  defaultSize: WidgetSize;
  minSize?: WidgetSize;
};
