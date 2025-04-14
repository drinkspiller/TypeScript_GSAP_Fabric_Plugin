import * as fabric from 'fabric';
import {
  FabricFlexAlignItems,
  FabricFlexDirection,
  FabricLayoutGroupInterface,
  FabricLayoutObjectInterface,
} from './fabric_layout_types';

const LAYOUT_TYPE_IMPERATIVE = 'imperative';

/**
 * Custom layout strategy for `FabricLayoutGroup` objects that implements a
 * very simple "flex" layout system.
 */
export class FabricLayoutFlexStrategy extends fabric.FixedLayout {
  /**
   * Overrides the superclass's `calcLayoutResult` to implement custom layout
   * logic for `FabricLayoutGroup` objects.
   *
   * @param context The layout context, containing information about the target
   *     object.
   * @param children The array of child objects to be laid out.
   * @return The layout result calculated by the superclass after applying
   *     custom layout logic.
   */
  override calcLayoutResult(
    context: fabric.StrictLayoutContext,
    children: fabric.FabricObject[]
  ) {
    // Skip layout during initialization.
    // @see https://github.com/fabricjs/fabric.js/blob/master/src/LayoutManager/README.md#type-initialization
    if (context.type !== LAYOUT_TYPE_IMPERATIVE) return;

    const group = context.target as FabricLayoutGroupInterface;

    if (group.width === 0 || group.height === 0) {
      console.warn(
        `Group using the FabricLayoutFlexStrategy has the dimensions of ` +
          `width ${group.width} and height of ${group.width}. Was a non-zero ` +
          `dimension intended?`
      );
    }

    this.recursiveGroupLayout(group, children);
    return super.calcLayoutResult(context, children);
  }

  /**
   * Recursively lays out the children of a `FabricLayoutGroup` based on their
   * layout direction (horizontal or vertical) and dimensions.
   *
   * @param group The `FabricLayoutGroup` whose children are to be laid out.
   * @param children The array of child objects to be laid out within the group.
   */
  private recursiveGroupLayout(
    group: FabricLayoutGroupInterface,
    children: FabricLayoutObjectInterface[]
  ) {
    let xOffset = 0;
    let yOffset = 0;
    let totalFlex = 0;
    let usedSpace = 0;

    // Calculate total flex and used space by iterating through the children to
    // calculate the total space already occupied by elements that use fixed
    // dimensions instead of `flexGrow`.
    for (const child of children) {
      const margin = this.getMargin(child);
      totalFlex += child.flexGrow ?? 0;
      if (group.flexDirection === FabricFlexDirection.COLUMN) {
        usedSpace += (child.height ?? 0) + margin.top + margin.bottom;
      } else {
        usedSpace += (child.width ?? 0) + margin.left + margin.right;
      }
    }

    const remainingSpace =
      group.flexDirection === FabricFlexDirection.COLUMN
        ? group.height - usedSpace
        : group.width - usedSpace;

    for (const child of children) {
      const margin = this.getMargin(child);

      let itemWidth = child.width;
      let itemHeight = child.height;

      let warn = false;
      let dimensionName = '';
      let solution = '';

      if (group.flexDirection === FabricFlexDirection.COLUMN) {
        // Check for unexpected (but non-fatal) configuration (e.g. no
        // size instruction while likely results in invisible objects).
        if (
          itemWidth === 0 &&
          group.alignItems !== FabricFlexAlignItems.STRETCH
        ) {
          warn = true;
          dimensionName = 'width';
          solution = '`alignItems: STRETCH`';
        } else if (itemHeight === 0 && child.flexGrow === null) {
          warn = true;
          dimensionName = 'height';
          solution = '`flexGrow`';
        }

        if (!!child.flexGrow) {
          itemHeight = (remainingSpace * child.flexGrow) / totalFlex;
        }

        child.set({
          height: itemHeight,
          width:
            group.alignItems === FabricFlexAlignItems.STRETCH
              ? group.width - (margin.left + margin.right)
              : itemWidth,
        });

        // Adjust child's position relative to the parent.
        child.setRelativeXY(
          new fabric.Point(
            xOffset + margin.left - group.width / 2,
            yOffset + margin.top - group.height / 2
          )
        );

        yOffset += itemHeight + margin.top + margin.bottom;
      }
      // Default to row layout direction.
      else {
        // Check for unexpected (but non-fatal) configuration (e.g. no
        // size instruction while likely results in invisible objects).
        if (
          itemHeight === 0 &&
          group.alignItems !== FabricFlexAlignItems.STRETCH
        ) {
          warn = true;
          dimensionName = 'height';
          solution = '`alignItems: STRETCH`';
        } else if (itemWidth === 0 && child.flexGrow === null) {
          warn = true;
          dimensionName = 'width';
          solution = '`flexGrow`';
        }

        if (!!child.flexGrow) {
          itemWidth = (remainingSpace * child.flexGrow) / totalFlex;
        }

        child.set({
          height:
            group.alignItems === FabricFlexAlignItems.STRETCH
              ? group.height - (margin.top + margin.bottom)
              : itemHeight,
          width: itemWidth,
        });

        // Adjust child's position relative to the parent.
        child.setRelativeXY(
          new fabric.Point(
            xOffset + margin.left - group.width / 2,
            yOffset + margin.top - group.height / 2
          )
        );

        xOffset += itemWidth + margin.left + margin.right;
      }

      // Recursively render the children of the current child if it is a Group
      // itself.
      if (child.type === 'fabriclayoutgroup') {
        this.recursiveGroupLayout(
          child as FabricLayoutGroupInterface,
          (child as FabricLayoutGroupInterface).getObjects()
        );
      }

      // Log warning for unexpected (but non-fatal) configuration (e.g. no
      // size instruction while likely results in invisible objects).
      if (warn) {
        console.warn(
          `Child element '${child.name}' in ${
            group.flexDirection === FabricFlexDirection.COLUMN
              ? 'column'
              : 'row'
          } layout has insufficient size configuration. It likely needs ` +
            `either a non-zero ${dimensionName} or ${solution} to be ` +
            `properly displayed.`
        );
      }
    }
  }

  private getMargin(fabricObject: FabricLayoutObjectInterface): {
    top: number;
    bottom: number;
    left: number;
    right: number;
  } {
    const margin = fabricObject.margin ?? 0; // Get the base margin value

    return {
      top: fabricObject.marginTop ?? margin,
      bottom: fabricObject.marginBottom ?? margin,
      left: fabricObject.marginLeft ?? margin,
      right: fabricObject.marginRight ?? margin,
    };
  }
}

fabric.classRegistry.setClass(FabricLayoutFlexStrategy);
