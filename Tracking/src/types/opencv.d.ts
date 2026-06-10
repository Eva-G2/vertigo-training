export {};

declare global {
  interface OpenCVModule {
    Mat: new () => OpenCVMat;
    matFromImageData(imageData: ImageData): OpenCVMat;
    cvtColor(
      src: OpenCVMat,
      dst: OpenCVMat,
      code: number,
      dstCn?: number,
    ): void;
    equalizeHist(src: OpenCVMat, dst: OpenCVMat): void;
    imshow(canvas: HTMLCanvasElement, mat: OpenCVMat): void;
    COLOR_RGBA2GRAY: number;
    COLOR_GRAY2RGBA: number;
    onRuntimeInitialized: () => void;
  }

  interface OpenCVMat {
    delete(): void;
    rows: number;
    cols: number;
    data: Uint8Array;
  }

  interface Window {
    cv?: OpenCVModule;
  }
}
