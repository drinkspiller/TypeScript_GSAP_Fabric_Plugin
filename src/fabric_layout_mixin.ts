import * as fabric from 'fabric';

import {
  FabricLayoutGroupInterface,
  FabricLayoutObjectConstructor,
  FabricLayoutObjectInterface,
} from './fabric_layout_types';

// Type alias for the mixin return type.
declare type FabricLayoutCommonMixin<
  TBase extends fabric.Constructor<fabric.FabricObject>
> = TBase &
  fabric.Constructor<FabricLayoutObjectInterface> &
  FabricLayoutObjectConstructor;

/**
 * Mixin function to extend FabricLayout objects with common properties.
 * @see https://www.typescriptlang.org/docs/handbook/mixins.html
 *
 * This function takes a base class (any subclass of fabric.Object (e.g
 * `fabric.Circle`)) and returns a new class that extends the base class and
 * includes common custom properties and logic for the layout-capable versions
 * of each.
 *
 * @return  A constructor function that creates objects with both base class and
 * FabricLayoutObject custom configuration.
 */
export function fabricLayoutCommonMixin<
  TBase extends fabric.Constructor<fabric.Object>
>(
  // Generic type parameter representing the supplied base class constructor.
  // tslint:disable-next-line:enforce-name-casing
  Base: TBase
): FabricLayoutCommonMixin<TBase> {
  // Use the type alias here
  return class FabricLayoutObjectMixin
    extends Base
    implements FabricLayoutObjectInterface
  {
    // Assure TypeScript that `getObjects` is defined on the subclass.
    declare getObjects: Function;

    // Properties common to all `FabricLayoutObject`s:
    classList: string[] = [];
    flexGrow: number | null = null;
    margin: number | undefined = 0;
    marginBottom: number | undefined = undefined;
    marginLeft: number | undefined = undefined;
    marginRight: number | undefined = undefined;
    marginTop: number | undefined = undefined;
    name = '';

    override centeredScaling = true;

    // A mixin class must have a constructor with a single rest parameter of
    // type 'any[]'.
    // tslint:disable-next-line:no-any
    constructor(...args: any[]) {
      super(...args);

      // Identify the options argument because although options will typically
      // be the first argument, in some constructors (e.g. fabric.Group,
      // FabricLayoutPolyline) it is the second.
      let options: Partial<fabric.FabricObjectProps> &
        Partial<FabricLayoutObjectInterface> = {};
      if (typeof args[0] === 'object' && !Array.isArray(args[0])) {
        // Options is the first argument.
        options = args[0];
      } else if (typeof args[1] === 'object' && !Array.isArray(args[1])) {
        // Options is the second argument.
        options = args[1];
      }

      // Initialize properties with default values from `options` if supplied.
      // default values
      this.classList = options.classList ?? this.classList;
      this.flexGrow = options.flexGrow ?? this.flexGrow;
      this.margin = options.margin ?? this.margin;
      this.marginBottom = options.marginBottom ?? this.marginBottom;
      this.marginLeft = options.marginLeft ?? this.marginLeft;
      this.marginRight = options.marginRight ?? this.marginRight;
      this.marginTop = options.marginTop ?? this.marginTop;
      this.name = options.name ?? this.name;

      // Ensure the object's coordinates are set and immediately available after
      // applying styles.
      super.setCoords();
    }

    findChildByName(name: string): FabricLayoutObjectInterface | null {
      if (!this.getObjects()) {
        console.warn(`Child '${name}'not found.`);

        return null;
      }

      return this.getObjects().find(
        (child: FabricLayoutGroupInterface) => child?.name === name
      ) as FabricLayoutObjectInterface;
    }

    // Ensure subclass properties are serialized when `.toObject()` is invoked
    // during serialization.
    // @see https://fabricjs.github.io/api/classes/fabricobject/#customproperties
    static customProperties: string[] = [
      'alignItems',
      'classList',
      'flexDirection',
      'flexGrow',
      'margin',
      'marginBottom',
      'marginLeft',
      'marginRight',
      'marginTop',
      'name',
    ];
  };
}
