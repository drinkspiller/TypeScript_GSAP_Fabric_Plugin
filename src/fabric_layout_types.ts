import * as fabric from 'fabric';

/**
 * Interface for a `FabricLayoutObject` constructor.
 *
 * This interface is used to ensure that the `customProperties` property is
 * defined on the constructor.
 */
export declare interface FabricLayoutObjectConstructor {
  customProperties: string[];
}

/**
 * Custom properties for `FabricLayoutObject` and `FabricLayoutGroup`.
 */
export declare interface FabricLayoutBaseProps {
  classList?: string[];
  flexGrow?: number | null;
  margin?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  marginTop?: number;
  name?: string;
}

/**
 * Interface for `FabricLayoutObject`.
 */
export declare interface FabricLayoutObjectInterface
  extends fabric.FabricObject,
    FabricLayoutBaseProps {}

/**
 * Interface for `FabricLayoutGroup`.
 */
export declare interface FabricLayoutGroupInterface
  extends fabric.Group,
    FabricLayoutBaseProps {
  alignItems: FabricFlexAlignItems;
  findChildByName: Function;
  flexDirection: FabricFlexDirection;
}

/** Flex Direction options. */
export enum FabricFlexDirection {
  COLUMN = 'column',
  ROW = 'row',
}

/** Flex alignItems options. */
export enum FabricFlexAlignItems {
  NORMAL = 'normal',
  STRETCH = 'stretch',
}
