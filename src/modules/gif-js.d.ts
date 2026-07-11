declare module "gif.js.optimized" {
  interface GIFOptions {
    workers?: number
    quality?: number
    width?: number
    height?: number
    workerScript?: string
    repeat?: number
    background?: string
    transparent?: string | null
    dither?: boolean | string
  }
  interface AddFrameOptions {
    delay?: number
    copy?: boolean
    dispose?: number
  }
  export default class GIF {
    constructor(options?: GIFOptions)
    addFrame(image: CanvasImageSource | CanvasRenderingContext2D | ImageData, options?: AddFrameOptions): void
    on(event: "finished", cb: (blob: Blob) => void): void
    on(event: "progress", cb: (p: number) => void): void
    on(event: string, cb: (...args: unknown[]) => void): void
    render(): void
    abort(): void
  }
}
