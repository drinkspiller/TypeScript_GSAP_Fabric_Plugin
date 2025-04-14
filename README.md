# TypeScript GSAP Fabric Plugin

A [GSAP](https://gsap.com/) / [Fabric.js](https://fabricjs.com/) Plugin inspired by iongion's code @ https://gsap.com/community/forums/topic/8295-fabricjs-plugin/ and Angular usage demo.


[Runnable Demo](https://tlym5y-4200.csb.app/) and [Plugin Source](https://codesandbox.io/p/devbox/red-water-tlym5y?file=%2Fsrc%2Fgsap_fabric_plugin.ts%3A214%2C39) on Codesandbox (usage example is in [app.component.ts](https://codesandbox.io/p/devbox/red-water-tlym5y)


## Usage

1. Copy src/gsap_fabric_plugin.ts to a location of your choosing
2. 
   ```typescript
    import { gsap } from 'gsap';
    import FabricJSPlugin from '../gsap_fabric_plugin'; // Update to reflect your path to plugin.
    
    gsap.registerPlugin(FabricJSPlugin);
    
    const blueRect = new fabric.Rect({
        fill: 'blue',
        height: 100,
        left: 100,
        objectCaching: false,
        top: 100,
        width: 100,
      });
    
    
     gsap.to(this.blueRect, { left: 200 });
   ```
