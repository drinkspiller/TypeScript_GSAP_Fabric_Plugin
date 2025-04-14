export const animatedGradientShader = `
  precision highp float;

  uniform float uRotationSpeed;
  uniform float uTimeSpeedX;
  uniform float uTimeSpeedY;
  uniform float uTurbulenceAmount;
  uniform float uTurbulenceSize; 
  uniform float uBlurSize;
  uniform vec2 uResolution;
  uniform float uTime;

  varying vec2 vTexCoord;

  void main() {
    // Use rotation speed from uniform
    float rotationAngle = uTime * uRotationSpeed;
    mat2 rotationMatrix = mat2(cos(rotationAngle), -sin(rotationAngle),
                              sin(rotationAngle), cos(rotationAngle));
    
    // Adjust coordinates to match ShaderToy's approach
    vec2 centeredUV = (vTexCoord - 0.5) * 2.0;
    vec2 rotatedUV = rotationMatrix * centeredUV;
    vec2 uv = rotatedUV * 0.5 + 0.5;
    
    // Use uniform values for animation speeds
    vec2 timeOffset = vec2(uTime * uTimeSpeedX, uTime * uTimeSpeedY);
    
    // Initialize displacement with uniform values
    vec2 turbulentDisplacement = vec2(0.0);
    float noiseScale = uTurbulenceSize;
    float noiseWeight = 1.0;
    
    // Simplified octave count - matches ShaderToy's turbulenceComplexity
    const int turbulenceOctaves = 2;
    
    for(int i = 0; i < turbulenceOctaves; i++) {
      vec2 noiseCoordinates = noiseScale * uv + timeOffset;
      vec2 integerPart = floor(noiseCoordinates);
      vec2 fractionalPart = fract(noiseCoordinates);
      vec2 smoothStepValue = fractionalPart * fractionalPart * (3.0 - 2.0 * fractionalPart);
      
      // Same hash function as ShaderToy
      float a = fract(sin(dot(integerPart, vec2(12.9898, 78.233))) * 43758.5453);
      float b = fract(sin(dot(integerPart + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
      float c = fract(sin(dot(integerPart + vec2(0.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
      float d = fract(sin(dot(integerPart + vec2(1.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
      turbulentDisplacement.x += mix(mix(a, b, smoothStepValue.x), mix(c, d, smoothStepValue.x), smoothStepValue.y) * noiseWeight;
      
      // Different hash seed for Y, matching ShaderToy
      a = fract(sin(dot(integerPart, vec2(26.6542, 18.8254))) * 43758.5453);
      b = fract(sin(dot(integerPart + vec2(1.0, 0.0), vec2(26.6542, 18.8254))) * 43758.5453);
      c = fract(sin(dot(integerPart + vec2(0.0, 1.0), vec2(26.6542, 18.8254))) * 43758.5453);
      d = fract(sin(dot(integerPart + vec2(1.0, 1.0), vec2(26.6542, 18.8254))) * 43758.5453);
      turbulentDisplacement.y += mix(mix(a, b, smoothStepValue.x), mix(c, d, smoothStepValue.x), smoothStepValue.y) * noiseWeight;
      
      noiseScale *= 2.0;
      noiseWeight *= 0.5;
    }
    
    // Scale and normalize displacement
    turbulentDisplacement = (turbulentDisplacement - 0.5) * 2.0 * uTurbulenceAmount;
    
    // Apply displacement
    vec2 displacedUV = uv + turbulentDisplacement;
    
    // Define colors exactly as in ShaderToy
    vec3 color1 = vec3(0.7, 0.4, 1.0); // Light Purple
    vec3 color2 = vec3(1.0, 1.0, 1.0); // White
    vec3 color3 = vec3(0.0, 0.5, 1.0); // Light Blue
    
    float gradientPosition1 = 0.0;
    float gradientPosition2 = 0.5;
    float gradientPosition3 = 1.0;
    
    // Calculate gradient color
    vec3 gradientColor;
    if (displacedUV.x < gradientPosition2) {
      gradientColor = mix(color1, color2, (displacedUV.x - gradientPosition1) / (gradientPosition2 - gradientPosition1));
    } else {
      gradientColor = mix(color2, color3, (displacedUV.x - gradientPosition2) / (gradientPosition3 - gradientPosition2));
    }
    
    // Apply blur with a smaller kernel for better performance
    const int blurKernelSize = 5; // Reduced from 9 in ShaderToy
    vec3 blurredColor = vec3(0.0);
    
    for (int i = -blurKernelSize / 2; i <= blurKernelSize / 2; i++) {
      for (int j = -blurKernelSize / 2; j <= blurKernelSize / 2; j++) {
        vec2 blurOffset = vec2(float(i), float(j)) * uBlurSize / float(blurKernelSize);
        
        // Apply rotation to offset UVs
        vec2 centeredOffsetUV = (uv + blurOffset - 0.5) * 2.0;
        vec2 rotatedOffsetUV = rotationMatrix * centeredOffsetUV;
        rotatedOffsetUV = rotatedOffsetUV * 0.5 + 0.5;
        
        // Calculate turbulence for this offset
        vec2 offsetTurbulentDisplacement = vec2(0.0);
        float offsetNoiseScale = uTurbulenceSize;
        float offsetNoiseWeight = 1.0;
        
        for(int k = 0; k < turbulenceOctaves; k++) {
          vec2 noiseCoordinates = offsetNoiseScale * rotatedOffsetUV + timeOffset;
          vec2 integerPart = floor(noiseCoordinates);
          vec2 fractionalPart = fract(noiseCoordinates);
          vec2 smoothStepValue = fractionalPart * fractionalPart * (3.0 - 2.0 * fractionalPart);
          
          float a = fract(sin(dot(integerPart, vec2(12.9898, 78.233))) * 43758.5453);
          float b = fract(sin(dot(integerPart + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
          float c = fract(sin(dot(integerPart + vec2(0.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
          float d = fract(sin(dot(integerPart + vec2(1.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
          offsetTurbulentDisplacement.x += mix(mix(a, b, smoothStepValue.x), mix(c, d, smoothStepValue.x), smoothStepValue.y) * offsetNoiseWeight;
          
          a = fract(sin(dot(integerPart, vec2(26.6542, 18.8254))) * 43758.5453);
          b = fract(sin(dot(integerPart + vec2(1.0, 0.0), vec2(26.6542, 18.8254))) * 43758.5453);
          c = fract(sin(dot(integerPart + vec2(0.0, 1.0), vec2(26.6542, 18.8254))) * 43758.5453);
          d = fract(sin(dot(integerPart + vec2(1.0, 1.0), vec2(26.6542, 18.8254))) * 43758.5453);
          offsetTurbulentDisplacement.y += mix(mix(a, b, smoothStepValue.x), mix(c, d, smoothStepValue.x), smoothStepValue.y) * offsetNoiseWeight;
          
          offsetNoiseScale *= 2.0;
          offsetNoiseWeight *= 0.5;
        }
        
        offsetTurbulentDisplacement = (offsetTurbulentDisplacement - 0.5) * 2.0 * uTurbulenceAmount;
        vec2 offsetDisplacedUV = rotatedOffsetUV + offsetTurbulentDisplacement;
        
        // Calculate gradient color for this sample
        vec3 offsetGradientColor;
        if (offsetDisplacedUV.x < gradientPosition2) {
          offsetGradientColor = mix(color1, color2, (offsetDisplacedUV.x - gradientPosition1) / (gradientPosition2 - gradientPosition1));
        } else {
          offsetGradientColor = mix(color2, color3, (offsetDisplacedUV.x - gradientPosition2) / (gradientPosition3 - gradientPosition2));
        }
        
        blurredColor += offsetGradientColor;
      }
    }
    
    // Average the blur samples
    blurredColor /= float(blurKernelSize * blurKernelSize);
    
    gl_FragColor = vec4(blurredColor, 1.0);
  }`;
