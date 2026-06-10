export type CameraStatus = "idle" | "starting" | "active" | "denied" | "error";

export type CameraConstraints = {
  facingMode?: "user" | "environment";
  width?: number;
  height?: number;
};

export type CameraInitResult = {
  stream: MediaStream;
  video: HTMLVideoElement;
};
