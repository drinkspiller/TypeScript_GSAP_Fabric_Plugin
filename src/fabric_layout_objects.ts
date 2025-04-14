/**
 * @fileoverview
 * "Inline" layout capable version of `fabric.FabricObject` subclasses.
 */

import * as fabric from 'fabric';

import { fabricLayoutCommonMixin } from './fabric_layout_mixin';
import {
  FabricFlexAlignItems,
  FabricFlexDirection,
  FabricLayoutGroupInterface,
  FabricLayoutObjectInterface,
} from './fabric_layout_types';
import { FabricLayoutFlexStrategy } from './fabric_layout_flex_strategy';

// tslint:disable:enforce-name-casing
const DynamicallyExtendedFabricLayoutObject = fabricLayoutCommonMixin(
  fabric.FabricObject
);
const DynamicallyExtendedFabricLayoutGroup = fabricLayoutCommonMixin(
  fabric.Group
);
const DynamicallyExtendedFabricLayoutRect = fabricLayoutCommonMixin(
  fabric.Rect
);
const DynamicallyExtendedFabricLayoutCircle = fabricLayoutCommonMixin(
  fabric.Circle
);
const DynamicallyExtendedFabricLayoutEllipse = fabricLayoutCommonMixin(
  fabric.Ellipse
);
const DynamicallyExtendedFabricLayoutIText = fabricLayoutCommonMixin(
  fabric.IText
);
const DynamicallyExtendedFabricLayoutLine = fabricLayoutCommonMixin(
  fabric.Line
);
const DynamicallyExtendedFabricLayoutPolyline = fabricLayoutCommonMixin(
  fabric.Polyline
);
const DynamicallyExtendedFabricLayoutTriangle = fabricLayoutCommonMixin(
  fabric.Triangle
);
const DynamicallyExtendedFabricLayoutPolygon = fabricLayoutCommonMixin(
  fabric.Polygon
);
const DynamicallyExtendedFabricLayoutTextbox = fabricLayoutCommonMixin(
  fabric.Textbox
);
// tslint:enable:enforce-name-casing

/**
 * Base class for all `FabricLayoutObject` instances.
 */
export class FabricLayoutObject extends DynamicallyExtendedFabricLayoutObject {
  constructor(
    options?: Partial<fabric.FabricObjectProps> &
      Partial<FabricLayoutObjectInterface>
  ) {
    super(options ?? {});
  }
}

/**
 * "Inline" layout capable version of `fabric.Group`.
 */
export class FabricLayoutGroup
  extends DynamicallyExtendedFabricLayoutGroup
  implements FabricLayoutGroupInterface
{
  static override type = 'FabricLayoutGroup';

  // Assure TypeScript that `findChildByName` is defined on the subclass.
  declare findChildByName: Function;

  // Properties common to all `FabricLayoutGroup` instances:
  alignItems = FabricFlexAlignItems.NORMAL;
  flexDirection = FabricFlexDirection.ROW;

  constructor(
    children: FabricLayoutObject[],
    options: Partial<FabricLayoutObject> & Partial<FabricLayoutGroupInterface>
  ) {
    super(children, {
      ...(options ?? {}),
      layoutManager:
        options.layoutManager ??
        new fabric.LayoutManager(new FabricLayoutFlexStrategy()),
    });

    this.alignItems = options.alignItems ?? this.alignItems;
    this.flexDirection = options.flexDirection ?? this.flexDirection;
  }

  // Adds `FabricLayoutGroup` properties to existing `customProperties`.
  static override get customProperties() {
    const baseCustomProperties = super.customProperties;
    return [...baseCustomProperties, 'gap', 'layoutDirection'];
  }
}

/**
 * "Inline" layout capable version of `fabric.Rect`.
 */
export class FabricLayoutRect extends DynamicallyExtendedFabricLayoutRect {
  constructor(
    options?: Partial<fabric.RectProps> & Partial<FabricLayoutObject>
  ) {
    super(options ?? {});
  }
}

/**
 * "Inline" layout capable version of `fabric.Circle`.
 */
export class FabricLayoutCircle extends DynamicallyExtendedFabricLayoutCircle {
  constructor(
    options?: Partial<fabric.CircleProps> & Partial<FabricLayoutObject>
  ) {
    super(options ?? {});
  }
}

/**
 * "Inline" layout capable version of `fabric.Ellipse`.
 */
export class FabricLayoutEllipse extends DynamicallyExtendedFabricLayoutEllipse {
  constructor(
    options?: Partial<fabric.EllipseProps> & Partial<FabricLayoutObject>
  ) {
    super(options ?? {});
  }
}

/**
 * "Inline" layout capable version of `fabric.Line`.
 */
export class FabricLayoutLine extends DynamicallyExtendedFabricLayoutLine {
  constructor(
    points: [number, number, number, number],
    options?: Partial<FabricLayoutObject>
  ) {
    super(points, options ?? {});
  }
}

/**
 * "Inline" layout capable version of `fabric.Polyline`.
 */
export class FabricLayoutPolyline extends DynamicallyExtendedFabricLayoutPolyline {
  constructor(points: fabric.XY[], options?: Partial<FabricLayoutObject>) {
    super(points, options ?? {});
  }
}

/**
 * "Inline" layout capable version of `fabric.Triangle`.
 */
export class FabricLayoutTriangle extends DynamicallyExtendedFabricLayoutTriangle {
  constructor(options?: Partial<FabricLayoutObject>) {
    super(options ?? {});
  }
}

/**
 * "Inline" layout capable version of `fabric.Polygon`.
 */
export class FabricLayoutPolygon extends DynamicallyExtendedFabricLayoutPolygon {
  constructor(points: fabric.XY[], options?: Partial<FabricLayoutObject>) {
    super(points, options ?? {});
  }
}

/**
 * "Inline" layout capable version of `fabric.Textbox`.
 */
export class FabricLayoutTextbox extends DynamicallyExtendedFabricLayoutTextbox {
  constructor(
    text = '',
    options?: Partial<fabric.TextboxProps> & Partial<FabricLayoutObject>
  ) {
    super(text, options ?? {});
  }
}

/**
 * "Inline" layout capable version of `fabric.IText`.
 */
export class FabricLayoutIText extends DynamicallyExtendedFabricLayoutIText {
  constructor(
    text = '',
    options?: Partial<fabric.ITextProps> & Partial<FabricLayoutObject>
  ) {
    super(text, options ?? {});
  }
}

fabric.classRegistry.setClass(FabricLayoutCircle);
fabric.classRegistry.setClass(FabricLayoutEllipse);
fabric.classRegistry.setClass(FabricLayoutGroup);
fabric.classRegistry.setClass(FabricLayoutIText);
fabric.classRegistry.setClass(FabricLayoutLine);
fabric.classRegistry.setClass(FabricLayoutPolygon);
fabric.classRegistry.setClass(FabricLayoutPolyline);
fabric.classRegistry.setClass(FabricLayoutRect);
fabric.classRegistry.setClass(FabricLayoutTriangle);
fabric.classRegistry.setClass(FabricLayoutTextbox);
