/*
 * @fileoverview GSAP Fabric.js Plugin inspired by iongion's code.
 * @see https://gsap.com/community/forums/topic/8295-fabricjs-plugin/
 */

import * as fabric from 'fabric';
import { gsap } from 'gsap';

// --- Type Definitions ---

/**
 * Interface defining the structure of the FabricJSPlugin object.
 * It extends the base GSAP Plugin interface.
 */
interface FabricJSPluginInterface extends gsap.Plugin {
  version: string;
  name: string;
  // `init` signature matches gsap.Plugin, using 'any' for broader compatibility.
  // Specific types are used within the implementation.
  init(
    this: gsap.PluginScope,
    /* tslint:disable-next-line:no-any */
    target: any,
    value: gsap.TweenVars,
    tween: gsap.core.Tween,
    index: number,
    /* tslint:disable-next-line:no-any */
    targets: any[]
  ): void;
  // Method to explicitly register the GSAP instance.
  register(core: typeof gsap): void;
  // Method to explicitly register the Fabric.js instance.
  registerFabricJS(fabricjs: typeof fabric): void;
}

// --- Module State ---

let registeredGSAP: typeof gsap | undefined;
let registeredFabric: typeof fabric | undefined;
let isCoreInitialized = false;

// --- Helper Functions ---

/** Checks if the code is running in a browser environment. */
function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

/** Logs a warning message specific to the FabricJSPlugin. */
function logWarning(message: string): void {
  console.warn(`FabricJSPlugin: ${message}`);
}

/**
 * Attempts to retrieve the GSAP instance, either from a registered one or from
 * the global window object.
 */
function getGSAPInstance(): typeof gsap | undefined {
  if (registeredGSAP) {
    return registeredGSAP;
  }
  if (hasWindow()) {
    const globalGSAP = (window as unknown as { gsap: typeof gsap }).gsap;

    // Check if global GSAP exists and has the registerPlugin method.
    if (globalGSAP && typeof globalGSAP.registerPlugin === 'function') {
      registeredGSAP = globalGSAP;
      return registeredGSAP;
    }
  }
  return undefined;
}
/**
 * Initializes the plugin's core dependencies, primarily GSAP, and ensures it
 * only runs once.
 * @param core An optional GSAP instance to register directly.
 */
function initializeCore(core?: typeof gsap): void {
  if (isCoreInitialized) {
    return;
  }

  registeredGSAP = core || getGSAPInstance();

  if (registeredGSAP) {
    isCoreInitialized = true;
  } else if (!core) {
    // Only warn if initialization was attempted without providing a core and
    // the global lookup failed.
    logWarning(
      'GSAP core not found. Please ensure GSAP is loaded or pass it to FabricJSPlugin.register().'
    );
  }
}
/**
 * Checks if a property value on a Fabric object is suitable for tweening.
 * @param target The Fabric object (to check for presence of 'set' method).
 * @param value The current value of the property.
 * @return True if the property can likely be tweened, false otherwise.
 */
/* tslint:disable-next-line:no-any */
function isTweenableFabricProperty(
  target: fabric.FabricObject,
  /* tslint:disable-next-line:no-any */
  value: any
): boolean {
  return (
    value !== undefined &&
    value !== null &&
    typeof value !== 'function' && // Don't tween methods.
    typeof target.set === 'function' // Ensure the object has a 'set' method.
  );
}

// --- FabricJSPlugin Implementation ---

/**
 * FabricJSPlugin implementation.
 *
 * This object is exported as the default, so users can import it directly.
 */
export const FabricJSPlugin: FabricJSPluginInterface = {
  version: '0.9.0',
  name: 'fabric',

  /**
   * GSAP Plugin Initialization Method.
   * Called by GSAP for each target being tweened.
   */
  init(
    this: gsap.PluginScope, // Provides 'this.add' etc.
    target: fabric.FabricObject, // Use specific type within the implementation.
    value: gsap.TweenVars, // The properties being tweened e.g. `{left: 100, opacity: 0.5}`.
    tween: gsap.core.Tween,
    index: number,
    targets: fabric.FabricObject[] // All targets in the tween.
  ) {
    // --- 1. Safety Checks & Initialization ---

    if (!(target instanceof fabric.FabricObject)) {
      logWarning(
        `Target at index ${index} is not a valid fabric.FabricObject instance.`
      );
      return;
    }

    if (!isCoreInitialized) {
      initializeCore();
      if (!isCoreInitialized) {
        logWarning('Cannot initialize plugin - GSAP core missing.');
        return;
      }
    }

    if (!registeredFabric && target.canvas && (target.canvas as any).fabric) {
      registeredFabric = (target.canvas as any).fabric;
    }

    // --- 2. Proxy Setup for Property Interception ---

    const proxiedTarget = new Proxy(target, {
      /* tslint:disable-next-line:no-any */
      get(obj: fabric.FabricObject, key: string | symbol): any {
        if (typeof key === 'string' && typeof obj.get === 'function') {
          return obj.get(key);
        }
        return Reflect.get(obj, key);
      },
      /* tslint:disable-next-line:no-any */
      set(obj: fabric.FabricObject, key: string | symbol, val: any): boolean {
        if (typeof key === 'string' && typeof obj.set === 'function') {
          // Ensure key is string for `obj.set`.
          obj.set(key as string, val);
          if (obj.canvas) {
            obj.canvas.requestRenderAll();
          }
          return true;
        }
        return Reflect.set(obj, key, val);
      },
    });

    // --- 3. Register Properties with GSAP ---

    for (const propertyName in value) {
      if (Object.prototype.hasOwnProperty.call(value, propertyName)) {
        const endValue = value[propertyName];

        try {
          const startValue = target.get(propertyName);

          // Check if this property is suitable for tweening.
          if (isTweenableFabricProperty(target, startValue)) {
            this.add(proxiedTarget, propertyName, startValue, endValue);
          } else {
            // Log warnings for properties that will be skipped.
            if (typeof startValue === 'function') {
              logWarning(
                `Skipping property '${propertyName}' because it is a function.`
              );
            } else if (startValue === undefined || startValue === null) {
              logWarning(
                `Property '${propertyName}' not found or is null/undefined on the target object.`
              );
            } else if (typeof target.set !== 'function') {
              logWarning(
                `Target object does not have a 'set' method, cannot tween property '${propertyName}'.`
              );
            }
          }
          /* tslint:disable-next-line:no-any */
        } catch (error: any) {
          logWarning(
            `Error accessing property '${propertyName}' on target: ${
              error?.message || error
            }`
          );
        }
      }
    }
  },

  /**
   * Public method to explicitly register the GSAP instance.
   */
  register(core: typeof gsap): void {
    if (!core) {
      logWarning('Attempted to register an invalid GSAP instance.');
      return;
    }
    initializeCore(core);
  },

  /**
   * Public method to explicitly register the Fabric.js instance.
   */
  registerFabricJS(fabricjs: typeof fabric): void {
    if (!fabricjs) {
      logWarning('Attempted to register an invalid Fabric.js instance.');
      return;
    }
    registeredFabric = fabricjs;
  },
};

// --- Auto-registration with Global GSAP ---

const globalGSAPInstance = getGSAPInstance();
if (globalGSAPInstance) {
  if (!isCoreInitialized) {
    initializeCore(globalGSAPInstance);
  }
  // Ensure core is initialized before registering.
  if (registeredGSAP) {
    registeredGSAP.registerPlugin(FabricJSPlugin);
  }
}

// --- Export ---
export { FabricJSPlugin as default };
