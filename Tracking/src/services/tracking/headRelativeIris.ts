import type {
  HeadPose3D,
  HeadRelativeIris,
  IrisLandmarkSet,
  Point2D,
  Point3D,
} from "@/types/eye-tracking";
import type { HeadRelativeIrisResult } from "./types";

function subtract(a: Point3D, b: Point3D): Point3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/** Applies the transpose (inverse) of the head rotation matrix. */
function toHeadLocalSpace(
  point: Point3D,
  origin: Point3D,
  rotationMatrix: HeadPose3D["rotationMatrix"],
): Point3D {
  const relative = subtract(point, origin);
  const r = rotationMatrix;

  return {
    x:
      r[0][0] * relative.x +
      r[1][0] * relative.y +
      r[2][0] * relative.z,
    y:
      r[0][1] * relative.x +
      r[1][1] * relative.y +
      r[2][1] * relative.z,
    z:
      r[0][2] * relative.x +
      r[1][2] * relative.y +
      r[2][2] * relative.z,
  };
}

function toOffset2D(iris: Point3D, eyeCenter: Point3D): Point2D {
  return {
    x: iris.x - eyeCenter.x,
    y: iris.y - eyeCenter.y,
  };
}

function toHeadRelativeIris(
  iris: IrisLandmarkSet,
  headPose: HeadPose3D,
): HeadRelativeIris {
  const localCenter = toHeadLocalSpace(
    iris.center,
    headPose.translation,
    headPose.rotationMatrix,
  );
  const localEyeCenter = toHeadLocalSpace(
    iris.eyeRegionCenter,
    headPose.translation,
    headPose.rotationMatrix,
  );

  return {
    eye: iris.eye,
    localCenter,
    offsetFromEyeCenter: toOffset2D(localCenter, localEyeCenter),
  };
}

/**
 * Expresses iris centers in a head-oriented coordinate frame so gaze offsets
 * remain stable as the head rotates.
 */
export function computeHeadRelativeIris(
  irisLandmarks: { left: IrisLandmarkSet; right: IrisLandmarkSet },
  headPose: HeadPose3D,
): HeadRelativeIrisResult {
  return {
    left: toHeadRelativeIris(irisLandmarks.left, headPose),
    right: toHeadRelativeIris(irisLandmarks.right, headPose),
  };
}
