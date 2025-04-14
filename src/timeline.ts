/**
 * @fileoverview fabric.js Timeline Animation Class**
 *
 * Provides a way to orchestrate animations on fabric.js objects using an API similar (but not identical) to GSAP's Timeline.
 * @see https://gsap.com/docs/v3/GSAP/Timeline/
 * It allows for creation of complex animation sequences with precise control over timing, easing, and repetition.
 *
 *
 * KEY FEATURES
 * - Chain animations to play one after another, or start animations at specific times, creating parallel effects.
 * - Use relative positions (e.g., `'+=0.5'`) to start animations a certain duration after the previous animation ends.
 * - Define labels to mark specific points in the timeline, allowing you to easily reference these points when adding animations or seeking to specific times.
 * - Repeat and Yoyo for looping and yoyo (reverse-and-repeat) behavior.
 * - Execute custom functions at various stages of the timeline, such as onComplete, onUpdate, onRepeat, and onReverseComplete.
 * - Provides methods to play, pause, reverse, seek, and control the progress of the timeline.
 *
 * @example
 *
 * ```javascript
 * import { Timeline } from './timeline';
 *
 * const canvas = new fabric.Canvas('canvas');
 * const rect = new fabric.Rect({ width: 50, height: 50, fill: 'red', left: 100, top: 100 });
 * canvas.add(rect);
 *
 * const timeline = new Timeline({
 *   onComplete: () => { console.log('Timeline finished!'); }
 * });
 *
 * timeline.to(rect, { left: 300 }, 1) // Animate 'left' property to 300 over 1 second
 *         .to(rect, { top: 200 }, 0.5, '+=0.2') // Animate 'top' property to 200, starting 0.2s after the previous animation
 *         .play(); // Start the timeline
 * ```
 *
 * This example creates a timeline that first moves a red rectangle horizontally and then vertically, with a small delay between the animations.
 */
import * as fabric from 'fabric';

type AnimationOptions = {
  duration?: number; // in milliseconds
  easing?: (t: number, b: number, c: number, d: number) => number;
  endValue?: number | number[];
  onChange?: (value: number | number[]) => void;
  onComplete?: () => void;
  startValue?: number | number[];
};

type Callback = () => void;

class Timeline {
  private animations: {
    animationFunction: (options: AnimationOptions) => void;
    options: AnimationOptions;
    // Absolute time, relative time, or label.
    position?: number | string;
  }[] = [];
  private labels: { [label: string]: number } = {};
  private currentTime: number = 0;
  private duration: number = 0;
  private isPlayingInternal: boolean = false;
  private playDirection: 'forward' | 'backward' = 'forward';
  private startTime: number | null = null;
  private isPausedInternal: boolean = false;
  private repeat: number = 0;
  private repeatDelay: number = 0;
  private repeatCount: number = 0;
  private shouldYoyo: boolean = false;
  private onCompleteCallback?: Callback;
  private onUpdateCallback?: Callback;
  private onRepeatCallback?: Callback;
  private onReverseCompleteCallback?: Callback;
  private animationFrameId: number | null = null;

  constructor(
    options: {
      onComplete?: Callback;
      onUpdate?: Callback;
      onRepeat?: Callback;
      onReverseComplete?: Callback;
      repeat?: number;
      repeatDelay?: number;
      yoyo?: boolean;
    } = {}
  ) {
    this.onCompleteCallback = options.onComplete;
    this.onUpdateCallback = options.onUpdate;
    this.onRepeatCallback = options.onRepeat;
    this.onReverseCompleteCallback = options.onReverseComplete;
    this.repeat = options.repeat ?? 0;
    this.repeatDelay = options.repeatDelay ?? 0;
    this.yoyo(options.yoyo ?? false);
  }

  /**
   * Adds a custom animation function to the timeline.
   */
  private add(
    animationFunction: (options: AnimationOptions) => void,
    options: AnimationOptions,
    position?: number | string
  ): this {
    let resolvedPosition: number | undefined;

    const previousAnimation = this.animations[this.animations.length - 1];
    const previousAnimationStartTime = previousAnimation
      ? typeof previousAnimation.position === 'number'
        ? previousAnimation.position
        : 0
      : 0;
    const previousAnimationDuration = previousAnimation
      ? previousAnimation.options.duration ?? 0
      : 0;

    if (position === undefined || position === '>') {
      // Treat `undefined` and '>' as the end of the previous animation.
      resolvedPosition = previousAnimationStartTime + previousAnimationDuration;
    } else if (position === '<') {
      // Treat '<' as the start of the previous animation.
      resolvedPosition = previousAnimationStartTime;
    } else if (typeof position === 'string') {
      const relativeMatch = position.match(/^([<>])([=]?)([-+]?\d*\.?\d+)/);
      if (relativeMatch) {
        // Handle '<' or '>' prefixes with optional '=' and time value.
        const prefix = relativeMatch[1];
        const hasEquals = relativeMatch[2] === '='; // Not used in this simplified logic, but kept for potential future extensions.
        const timeValue = Number(relativeMatch[3]);

        if (prefix === '<') {
          resolvedPosition = previousAnimationStartTime + timeValue * 1000;
        } else if (prefix === '>') {
          resolvedPosition =
            previousAnimationStartTime +
            previousAnimationDuration +
            timeValue * 1000;
        }
      } else if (
        (position.startsWith('+') || position.startsWith('-')) &&
        position.includes('=')
      ) {
        // Handle '+=' or '-=' prefixes.
        const operator = position.substring(0, 2);
        const relativeTime = Number(position.substring(2));
        if (operator === '+=') {
          resolvedPosition = this.duration + relativeTime * 1000;
        } else if (operator === '-=') {
          resolvedPosition = Math.max(0, this.duration + relativeTime * 1000);
        }
      } else if (this.labels[position]) {
        // Handle labels.
        resolvedPosition = this.labels[position];
      }
    } else if (typeof position === 'number') {
      resolvedPosition = position * 1000; //Keep existing number behavior
    }

    this.animations.push({
      animationFunction,
      options,
      position: resolvedPosition,
    });
    this.calculateDuration();
    return this;
  }

  /**
   * Adds a label to the timeline at a specific position. Labels can be used to reference points in time when adding animations or seeking.
   * @param label - The name of the label.
   * @param position - The position to place the label. Can be a number (absolute time in seconds) or if undefined, defaults to the current duration of the timeline (end).
   */
  addLabel(label: string, position?: number | string): this {
    if (typeof position === 'number') {
      this.labels[label] = position * 1000;
    } else {
      //If no explicit position, add to the end.
      this.labels[label] = this.duration;
    }
    return this;
  }

  /**
   * Calculates the total duration of the timeline based on the animations and their positions.
   */
  private calculateDuration() {
    let calculatedDuration = 0;
    for (const animation of this.animations) {
      let animDuration = animation.options.duration || 0;
      let insertPosition: number;

      if (typeof animation.position === 'number') {
        insertPosition = animation.position;
      } else {
        // Default to end of timeline (consistent with undefined, '>', and unresolvable labels).
        insertPosition = calculatedDuration;
      }

      calculatedDuration = Math.max(
        calculatedDuration,
        insertPosition + animDuration
      );
    }
    this.duration = calculatedDuration;
  }

  /**
   * Getter for `isPausedInternal`
   */
  get isPaused(): boolean {
    return this.isPausedInternal;
  }

  /**
   * Getter for `isPlayingInternal`.
   */
  get isPlaying(): boolean {
    return this.isPlayingInternal;
  }

  /**
   * Pauses the timeline playback.
   */
  pause(): this {
    this.isPlayingInternal = false;
    this.isPausedInternal = true;
    if (this.animationFrameId !== null) {
      fabric.util.cancelAnimFrame(this.animationFrameId);

      // Reset the ID
      this.animationFrameId = null;
    }
    return this;
  }

  /**
   * Starts or resumes playing the timeline from the beginning or a specified position.
   * @param from - Optional start time in seconds or a label name to start playing from. If undefined, playback resumes from the current time, or starts from the beginning if not yet played.
   */
  play(from?: number | string): this {
    if (this.isPlaying) {
      return this;
    }

    this.isPlayingInternal = true;
    this.isPausedInternal = false;
    this.playDirection = 'forward';

    if (from === undefined) {
      // If resuming (no 'from' provided).
      if (!this.isPlaying && this.currentTime >= this.duration) {
        // If the animation has completed, reset currentTime.
        this.currentTime = 0;
      }
      this.startTime = performance.now() - this.currentTime;
    } else {
      // If starting from a specific time or label.
      this.startTime = null; // Reset startTime to recalculate.
      this.repeatCount = 0;
      if (typeof from === 'number') {
        this.currentTime = from * 1000;
      } else if (typeof from === 'string' && this.labels[from] !== undefined) {
        this.currentTime = this.labels[from];
      } else {
        this.currentTime = 0;
      }
    }

    // Start the animation loop, and store the request ID.
    this.animationFrameId = fabric.util.requestAnimFrame(
      this.runAnimations.bind(this)
    );
    return this;
  }

  /**
   * Sets the timeline progress to a value between 0 and 1. Equivalent to seeking to a percentage of the total duration.
   */
  progress(value: number): this {
    if (value < 0 || value > 1) {
      console.warn('Progress value should be between 0 and 1');
      return this;
    }
    this.seek((this.duration * value) / 1000);
    return this;
  }

  /**
   * Reverses the timeline playback direction. If not already playing, it starts playing in reverse from the current time.
   */
  reverse(): this {
    this.playDirection = 'backward';

    // If not already playing, start playing in reverse.
    if (!this.isPlaying) {
      this.isPlayingInternal = true;
      this.isPausedInternal = false;
      // If at the end, reset `currentTime` to the end.
      if (this.currentTime >= this.duration) {
        this.currentTime = this.duration;
      }

      this.startTime = performance.now() - (this.duration - this.currentTime);
      // Start the animation loop, and store the request ID.
      this.animationFrameId = fabric.util.requestAnimFrame(
        this.runAnimations.bind(this)
      );
    } else {
      // Recalculate `startTime` when reversing during playback.
      this.startTime = performance.now() - (this.duration - this.currentTime);
    }
    return this;
  }

  /**
   * Internal method to run animations based on the current time. Called in each animation frame.
   * @private
   * @param time - The current time from requestAnimationFrame.
   */
  private runAnimations(time: number): void {
    if (!this.startTime) {
      this.startTime = time;
    }

    this.calculateCurrentTime(time);
    this.processAnimations();
    this.handleTimelineUpdate();
    this.handleTimelineCompletion(time);
    this.requestNextFrame();
  }

  /**
   * Calculates the current time, taking into account repeats and yoyo.
   * @param time - The current time from requestAnimationFrame.
   */
  private calculateCurrentTime(time: number): void {
    const elapsedTime = time - this.startTime!; // startTime is ensured to be set in runAnimations
    let currentEffectiveTime = elapsedTime;

    if (this.repeat !== 0) {
      const cycleDuration = this.duration + this.repeatDelay * 1000;
      let cycleTime = currentEffectiveTime % cycleDuration;

      if (this.shouldYoyo) {
        const cycleNumber = Math.floor(currentEffectiveTime / cycleDuration);
        if (cycleNumber % 2 === 1) {
          cycleTime = cycleDuration - cycleTime;
        }
      }
      currentEffectiveTime = cycleTime;
    }

    this.currentTime =
      this.playDirection === 'forward'
        ? currentEffectiveTime
        : Math.max(0, this.duration - currentEffectiveTime);
  }

  /**
   * Processes each animation in the timeline, triggering `onChange` if the current time is within the animation's duration.
   */
  private processAnimations(): void {
    for (const animation of this.animations) {
      const animationStart = this.resolveAnimationStartTime(animation);
      const animationEnd = animationStart + (animation.options.duration || 0);

      if (
        this.currentTime >= animationStart &&
        this.currentTime <= animationEnd
      ) {
        const animationElapsedTime = Math.max(
          0,
          this.currentTime - animationStart
        );
        animation.options.onChange &&
          animation.options.onChange(animationElapsedTime);
      }
    }
  }

  /**
   * Resolves the start time of an animation based on its position property (number, string label, or undefined).
   * @param animation - The animation object.
   * @return The start time of the animation **in milliseconds**.
   */
  private resolveAnimationStartTime(animation: {
    position?: number | string;
    options: AnimationOptions;
  }): number {
    return typeof animation.position === 'number' ? animation.position : 0;
  }

  /**
   * Handles the timeline update callback.
   */
  private handleTimelineUpdate(): void {
    this.onUpdateCallback && this.onUpdateCallback();
  }

  /**
   * Handles timeline completion and repeat logic.
   */
  private handleTimelineCompletion(time: number): void {
    if (this.playDirection === 'forward') {
      const totalDuration = this.duration + this.repeatDelay * 1000;
      if (this.currentTime >= totalDuration) {
        if (this.shouldRepeat()) {
          this.handleRepeatForward(time, totalDuration);
        } else {
          this.pause();
          this.onCompleteCallback && this.onCompleteCallback();
        }
      }
    } else if (this.playDirection === 'backward') {
      if (this.currentTime <= 0) {
        if (this.shouldRepeat()) {
          this.handleRepeatBackward(time);
        } else {
          this.pause();
          this.onReverseCompleteCallback && this.onReverseCompleteCallback();
        }
      }
    }
  }

  /**
   * Checks if the timeline should repeat based on repeatCount and repeat settings.
   */
  private shouldRepeat(): boolean {
    return this.repeatCount < this.repeat || this.repeat === -1;
  }

  /**
   * Handles repeat logic when playing forward.
   */
  private handleRepeatForward(time: number, totalDuration: number): void {
    this.repeatCount++;

    if (this.shouldYoyo) {
      this.playDirection = 'backward';
    }

    this.onRepeatCallback && this.onRepeatCallback();
    this.startTime = time - (this.currentTime - totalDuration);
  }

  /**
   * Handles repeat logic when playing backward (yoyo).
   */
  private handleRepeatBackward(time: number): void {
    this.repeatCount++;

    this.playDirection = 'forward';
    this.onRepeatCallback && this.onRepeatCallback();
    this.startTime = time + this.currentTime;
  }

  /**
   * Requests the next animation frame if the timeline is playing.
   */
  private requestNextFrame(): void {
    if (this.isPlaying) {
      this.animationFrameId = fabric.util.requestAnimFrame(
        this.runAnimations.bind(this)
      );
    }
  }

  /**
   * Seeks the timeline to a specific time. Updates the state of all animated objects to reflect the timeline at that point.
   * @param time - The time to seek to **in seconds**.
   */
  seek(time: number): this {
    this.currentTime = time * 1000;

    for (const animation of this.animations) {
      let animationStart: number;
      if (animation.position === undefined) {
        animationStart = 0;
      } else if (typeof animation.position === 'number') {
        animationStart = animation.position;
      } else if (
        typeof animation.position === 'string' &&
        this.labels[animation.position] !== undefined
      ) {
        animationStart = this.labels[animation.position];
      } else {
        animationStart = 0;
      }
      if (typeof animation.position !== 'number') {
        // Convert animation start time to milliseconds for internal timeline
        // use. The API accepts time in seconds for convenience, but internally
        // the timeline operates in milliseconds
        animationStart *= 1000;
      }

      const animationEnd = animationStart + (animation.options.duration ?? 0);

      if (
        this.currentTime >= animationStart &&
        this.currentTime <= animationEnd
      ) {
        const animElapsedTime = Math.max(0, this.currentTime - animationStart);
        animation.options.onChange &&
          animation.options.onChange(animElapsedTime);
      } else if (this.currentTime < animationStart) {
        animation.options.onChange && animation.options.onChange(0);
      } else {
        animation.options.onChange &&
          animation.options.onChange(animation.options.duration ?? 0);
      }
    }
    return this;
  }

  /**
   * Adds an animation to the timeline, animating properties of a
   * `fabric.FabricObject` using`fabric.util.animate` for the underlying
   * animation.
   * @see https://fabricjs.com/api/namespaces/util/functions/animate/
   */
  to(
    object: fabric.Object,
    // tslint:disable-next-line:no-any
    properties: { [key: string]: any },
    duration: number,
    position?: number | string,
    easing?: (t: number, b: number, c: number, d: number) => number
  ): this {
    const animationOptions: AnimationOptions = {
      duration: duration * 1000, // Convert seconds to milliseconds
      easing: easing ?? fabric.util.ease.defaultEasing,
      startValue: undefined,
      endValue: undefined,
    };

    const startValues: { [key: string]: number } = {};
    const endValues: { [key: string]: number } = {};

    for (const key in properties) {
      if (properties.hasOwnProperty(key)) {
        // tslint:disable-next-line:no-any
        startValues[key] = (object as any)[key];
        let propertyValue = properties[key];

        if (typeof propertyValue === 'string') {
          const relativeMatch = propertyValue.match(/^([+-]=)([-]?\d*\.?\d+)$/);
          if (relativeMatch) {
            const operator = relativeMatch[1];
            const relativeValue = parseFloat(relativeMatch[2]);
            if (operator === '+=') {
              endValues[key] = startValues[key] + relativeValue;
            } else if (operator === '-=') {
              endValues[key] = startValues[key] - relativeValue;
            }
          } else {
            endValues[key] = parseFloat(propertyValue); // Try to parse as number if not relative
          }
        } else {
          endValues[key] = propertyValue; // Assume number if not string or relative value
        }
      }
    }

    animationOptions.onChange = (currentTime) => {
      for (const key in endValues) {
        if (endValues.hasOwnProperty(key)) {
          const startVal = startValues[key];
          const endVal = endValues[key];
          // Ensure `startVal` and `endVal` are numbers before using them in easing.
          if (typeof startVal === 'number' && typeof endVal === 'number') {
            const currentValue = animationOptions.easing!(
              Number(currentTime),
              startVal,
              endVal - startVal,
              animationOptions.duration || 0
            );
            (object as any).set({ [key]: currentValue });
          }
        }
      }
      object.canvas?.requestRenderAll();
    };

    animationOptions.onComplete = () => {};

    this.add(fabric.util.animate, animationOptions, position);
    return this;
  }

  /**
   * Toggles the play/pause state of the timeline.
   */
  togglePlayPause(): this {
    if (this.isPlaying) {
      this.pause();
    } else {
      if (this.playDirection === 'forward') {
        this.play();
      } else {
        // Resume backward playback.
        this.reverse();
      }
    }
    return this;
  }

  /**
   * Gets or sets the yoyo behavior of the timeline.
   * When yoyo is enabled, the timeline will play forward and then in reverse repeatedly on each repeat cycle.
   */
  yoyo(value?: boolean): boolean | this {
    if (value === undefined) {
      return this.shouldYoyo;
    }
    this.shouldYoyo = value;
    return this;
  }
}

export { Timeline };
