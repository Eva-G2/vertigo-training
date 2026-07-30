/**
 * Scalar Kalman filter for smoothing a 1D measurement stream.
 */
export class ScalarKalmanFilter {
  private estimate = 0;
  private errorCovariance: number;
  private initialized = false;

  constructor(
    private readonly processNoise = 1e-3,
    private readonly measurementNoise = 2e-2,
    initialErrorCovariance = 1,
  ) {
    this.errorCovariance = initialErrorCovariance;
  }

  reset(): void {
    this.estimate = 0;
    this.errorCovariance = 1;
    this.initialized = false;
  }

  /** Returns the filtered estimate for the given measurement. */
  filter(measurement: number): number {
    if (!Number.isFinite(measurement)) {
      return this.initialized ? this.estimate : Number.NaN;
    }

    if (!this.initialized) {
      this.estimate = measurement;
      this.initialized = true;
      return this.estimate;
    }

    // Predict
    this.errorCovariance += this.processNoise;

    // Update
    const kalmanGain =
      this.errorCovariance / (this.errorCovariance + this.measurementNoise);
    this.estimate += kalmanGain * (measurement - this.estimate);
    this.errorCovariance *= 1 - kalmanGain;

    return this.estimate;
  }
}

/**
 * 1D constant-velocity Kalman filter (state: position, velocity).
 * Used to smooth nasal-root landmark coordinates before velocity estimation.
 */
export class ConstantVelocityKalman1D {
  private position = 0;
  private velocity = 0;
  private p00 = 1;
  private p01 = 0;
  private p10 = 0;
  private p11 = 1;
  private initialized = false;

  constructor(
    private readonly processNoise = 1e-4,
    private readonly measurementNoise = 5e-4,
  ) {}

  reset(): void {
    this.position = 0;
    this.velocity = 0;
    this.p00 = 1;
    this.p01 = 0;
    this.p10 = 0;
    this.p11 = 1;
    this.initialized = false;
  }

  update(
    measurement: number,
    dtSec: number,
  ): { position: number; velocity: number } {
    if (!Number.isFinite(measurement)) {
      return { position: this.position, velocity: this.velocity };
    }

    if (!this.initialized) {
      this.position = measurement;
      this.velocity = 0;
      this.initialized = true;
      return { position: this.position, velocity: this.velocity };
    }

    const dt = Math.max(dtSec, 1e-4);
    const q = this.processNoise;
    const r = this.measurementNoise;

    // Predict
    const predictedPosition = this.position + this.velocity * dt;
    const predictedVelocity = this.velocity;

    const dt2 = dt * dt;
    const dt3 = dt2 * dt;
    const dt4 = dt2 * dt2;
    const q00 = q * dt4 * 0.25;
    const q01 = q * dt3 * 0.5;
    const q11 = q * dt2;

    const pp00 = this.p00 + dt * (this.p10 + this.p01) + dt2 * this.p11 + q00;
    const pp01 = this.p01 + dt * this.p11 + q01;
    const pp10 = this.p10 + dt * this.p11 + q01;
    const pp11 = this.p11 + q11;

    // Update
    const innovation = measurement - predictedPosition;
    const s = pp00 + r;
    const k0 = pp00 / s;
    const k1 = pp10 / s;

    this.position = predictedPosition + k0 * innovation;
    this.velocity = predictedVelocity + k1 * innovation;

    this.p00 = (1 - k0) * pp00;
    this.p01 = (1 - k0) * pp01;
    this.p10 = pp10 - k1 * pp00;
    this.p11 = pp11 - k1 * pp01;

    return { position: this.position, velocity: this.velocity };
  }
}
