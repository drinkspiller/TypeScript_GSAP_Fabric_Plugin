import * as fabric from 'fabric';
import { animatedGradientShader } from './animated_gradient_shader';

type AnimatedGradientFilterOwnProps = {
  rotationSpeed: number;
  timeSpeedX: number;
  timeSpeedY: number;
  turbulenceAmount: number;
  turbulenceSize: number;
  blurSize: number;
};

const animatedGradientDefaultValues: AnimatedGradientFilterOwnProps = {
  rotationSpeed: 0.05,
  timeSpeedX: 0.75,
  timeSpeedY: 0.225,
  turbulenceAmount: 0.25,
  turbulenceSize: 1.5,
  blurSize: 0.2,
};

class AnimatedGradientFilter extends fabric.filters.BaseFilter<
  'AnimatedGradientFilter',
  AnimatedGradientFilterOwnProps
> {
  static override type = 'AnimatedGradientFilter';
  static override defaults = animatedGradientDefaultValues;
  static override uniformLocations = [
    'uRotationSpeed',
    'uTimeSpeedX',
    'uTimeSpeedY',
    'uTurbulenceAmount',
    'uTurbulenceSize',
    'uBlurSize',
    'uResolution',
    'uTime',
  ];

  rotationSpeed = animatedGradientDefaultValues.rotationSpeed;
  timeSpeedX = animatedGradientDefaultValues.timeSpeedX;
  timeSpeedY = animatedGradientDefaultValues.timeSpeedY;
  turbulenceAmount = animatedGradientDefaultValues.turbulenceAmount;
  turbulenceSize = animatedGradientDefaultValues.turbulenceSize;
  blurSize = animatedGradientDefaultValues.blurSize;
  width: number = 0; // Initialize width
  height: number = 0; // Initialize height
  time = 0;

  // In your AnimatedGradientFilter class, update the getFragmentSource method:

  override getFragmentSource(): string {
    return animatedGradientShader;
  }

  override applyTo2d(options: fabric.T2DPipelineState) {
    const imageData = options.imageData;
    options.ctx.putImageData(imageData, 0, 0);
    this.time = performance.now() / 1000;
  }

  override applyTo(
    options: fabric.TWebGLPipelineState | fabric.T2DPipelineState
  ) {
    if ('sourceWidth' in options && 'pass' in options) {
      // Check for both properties
      this.width = options.sourceWidth;
      this.height = options.sourceHeight;
      this.time = options.pass === 0 ? performance.now() / 1000 : this.time;
    }
    super.applyTo(options);
  }

  override sendUniformData(
    gl: WebGLRenderingContext,
    uniformLocations: fabric.TWebGLUniformLocationMap
  ) {
    gl.uniform1f(uniformLocations['uRotationSpeed'], this.rotationSpeed);
    gl.uniform1f(uniformLocations['uTimeSpeedX'], this.timeSpeedX);
    gl.uniform1f(uniformLocations['uTimeSpeedY'], this.timeSpeedY);
    gl.uniform1f(uniformLocations['uTurbulenceAmount'], this.turbulenceAmount);
    gl.uniform1f(uniformLocations['uTurbulenceSize'], this.turbulenceSize);
    gl.uniform1f(uniformLocations['uBlurSize'], this.blurSize);
    gl.uniform2fv(uniformLocations['uResolution'], [this.width, this.height]);
    gl.uniform1f(uniformLocations['uTime'], this.time);
  }

  override isNeutralState(): boolean {
    return this.turbulenceAmount === 0 && this.blurSize === 0;
  }
}

fabric.classRegistry.setClass(AnimatedGradientFilter);
export { AnimatedGradientFilter };
