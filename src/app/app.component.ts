import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import * as fabric from 'fabric';
import { FormsModule } from '@angular/forms';
import { ReplaySubject, debounceTime, fromEvent, takeUntil } from 'rxjs';
import { gsap } from 'gsap';
import FabricJSPlugin from '../gsap_fabric_plugin';

// Setting the default origin of all `fabric.FabricObject`s to 'center' as
// advised by the deprecation message
fabric.FabricObject.ownDefaults.originX = 'center';
fabric.FabricObject.ownDefaults.originY = 'center';

const COMMON_CONTROLS: Partial<fabric.FabricObject> = {
  borderColor: '#4966ff',
  cornerColor: '#fff',
  cornerSize: 8,
  cornerStrokeColor: '#4966ff',
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styles: [],
})
export class AppComponent implements AfterViewInit, OnDestroy {
  private canvas!: fabric.Canvas;

  private readonly destroyed$ = new ReplaySubject<void>(1);

  private blueRect = new fabric.Rect({
    fill: 'blue',
    height: 100,
    left: 100,
    objectCaching: false,
    top: 100,
    width: 100,
    ...COMMON_CONTROLS,
  });

  private redRect = new fabric.Rect({
    fill: 'red',
    hasBorders: true,
    hasControls: false,
    height: 100,
    left: 210,
    objectCaching: false,
    top: 100,
    width: 100,
    ...COMMON_CONTROLS,
  });

  private textbox = new fabric.Textbox(
    `START Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla sem massa, suscipit non elit vel, viverra luctus quam. Suspendisse aliquet pellentesque ligula, vel mattis risus sagittis ut. Cras lacinia odio sed neque aliquam, id faucibus nisi volutpat. Aenean vel risus eget eros sodales vestibulum. Vivamus et elit convallis, auctor ipsum sit amet, accumsan ante. Vivamus scelerisque nisi sed nisi faucibus accumsan at ac est. Vivamus vel scelerisque orci, sit amet vulputate nulla. Praesent tempus mauris ut metus congue, quis aliquam lacus congue. Maecenas ut accumsan felis, et varius justo. Donec at purus eget mauris elementum rutrum a vitae diam. Nulla commodo eros vel urna ornare, in convallis eros egestas. Proin aliquet tincidunt dui sed auctor. Nulla facilisi. Fusce a gravida metus, in efficitur diam. END `,
    {
      editable: true,
      evented: true,
      fontFamily: 'Google Sans',
      fontSize: 16,
      fontWeight: 'normal',
      hasBorders: false,
      hasControls: false,
      hoverCursor: 'text',
      interactive: true,
      left: 200,
      lockMovementX: true,
      lockMovementY: true,
      noScaleCache: false,
      objectCaching: false,
      statefullCache: true,
      top: 420,
      width: 300,
    }
  );

  ngAfterViewInit() {
    this.canvas = new fabric.Canvas('canvas', {
      backgroundColor: '#e3e3e3',
      height: window.innerHeight,
      transparentCorners: false,
      width: window.innerWidth,
    });

    this.canvas.add(this.blueRect, this.redRect, this.textbox);

    gsap.registerPlugin(FabricJSPlugin);

    gsap.to(this.blueRect, { left: 200 });

    this.configureWindowResizeEventListeners();
    this.renderLoop(this.canvas);
  }

  private renderLoop(canvas: fabric.Canvas) {
    canvas.renderAll();

    fabric.util.requestAnimFrame(() => {
      this.renderLoop(canvas);
    });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  private configureWindowResizeEventListeners() {
    fromEvent(window, 'resize')
      .pipe(
        // Debounce window resizes to avoid expensive redraws.
        debounceTime(10),
        takeUntil(this.destroyed$)
      )
      .subscribe((event) => {
        this.updateCanvasSize();
      });
  }

  /**
   * Updates the width and height attributes of the template's canvas element
   * to ensure correct sizing. Note the width and height attributes on the
   * element are needed, CSS width/height are insufficient for correct sizing.
   */
  private updateCanvasSize() {
    if (this.canvas) {
      this.canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
  }
}
