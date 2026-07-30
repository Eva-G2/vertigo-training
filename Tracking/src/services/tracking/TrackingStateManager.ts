/**
 * Global gate for head/eye tracking. Only {@link TrackingService.startTracking}
 * and {@link TrackingService.stopTracking} may change this state.
 */
class TrackingStateManagerImpl {
  private isTrackingActive = false;

  get isActive(): boolean {
    return this.isTrackingActive;
  }

  /** @internal */
  setActive(active: boolean): void {
    this.isTrackingActive = active;
  }
}

export const TrackingStateManager = new TrackingStateManagerImpl();
