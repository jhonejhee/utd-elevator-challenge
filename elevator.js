import Person from "./person.js";

export default class Elevator {
  constructor() {
    this.currentFloor = 0;
    this.stops = 0;
    this.floorsTraversed = 0;
    this.requests = [];
    this.riders = [];
    this._stepLog = [];
  }

  getState() {
    return {
      currentFloor: this.currentFloor,
      stops: this.stops,
      floorsTraversed: this.floorsTraversed,
      requests: this.requests,
      riders: this.riders,
    };
  }

  /**
   * Checks if the elevator has requests above
   */
  _hasRequestsAbove() {
    const pickupsAbove = this.requests.some(
      (req) => req.currentFloor > this.currentFloor,
    );
    const dropOffsAbove = this.riders.some(
      (rider) => rider.dropOffFloor > this.currentFloor,
    );
    return pickupsAbove || dropOffsAbove;
  }

  /**
   * Checks if the elevator has requests below
   */
  _hasRequestsBelow() {
    const pickupsBelow = this.requests.some(
      (req) => req.currentFloor < this.currentFloor,
    );
    const dropOffsBelow = this.riders.some(
      (rider) => rider.dropOffFloor < this.currentFloor,
    );
    return pickupsBelow || dropOffsBelow;
  }

  /**
   * ### LEVEL 4 & LEVEL 5 Solution
   * - Ability for multiple people to request drop off floors.
   * - Executes requests.
   */
  dispatch() {
    this._stepLog = [];
    const closestPickup = this.requests.reduce((closest, req) => {
      return Math.abs(req.currentFloor - this.currentFloor) <
        Math.abs(closest.currentFloor - this.currentFloor)
        ? req
        : closest;
    });
    let direction =
      closestPickup.currentFloor >= this.currentFloor ? "up" : "down";

    while (this.requests.length > 0 || this.riders.length > 0) {
      if (direction === "up") {
        if (this._hasRequestsAbove()) {
          this.moveUp();
        } else {
          direction = "down";
        }
      } else {
        if (this._hasRequestsBelow()) {
          this.moveDown();
        } else {
          direction = "up";
        }
      }
    }

    if (this.checkReturnToLobby()) {
      this.returnToLobby();
    }
  }

  /**
   * Continuously move up/down until the person's pick up / drop-off floor is reached.
   *
   * @param {Person} person - a request including the `name`, `currentFloor`, `dropOffFloor`.
   */
  goToFloor(person) {
    // go to person's floor
    while (this.currentFloor !== person.currentFloor) {
      this.currentFloor < person.currentFloor ? this.moveUp() : this.moveDown();
    }

    // drop off the person
    while (this.currentFloor !== person.dropOffFloor) {
      this.currentFloor < person.dropOffFloor ? this.moveUp() : this.moveDown();
    }

    if (this.requests.length === 0 && this.checkReturnToLobby()) {
      this.returnToLobby();
    }
  }

  /**
   * - Increments the elevator's `currentFloor` by 1.
   * - Increments the elevator's `floorTraversed` by 1.
   * - Pickup/Drop off any person in the new `currentFloor`.
   */
  moveUp() {
    this.currentFloor++;
    this.floorsTraversed++;
    this.hasPickup();
    this.hasDropoff();
    this._logStep();
  }

  /**
   * - Decrements the elevator's `currentFloor` by 1.
   * - Decrements the elevator's `floorTraversed` by 1.
   * - Pickup/Drop off any person in the new `currentFloor`.
   */
  moveDown() {
    if (this.currentFloor > 0) {
      this.currentFloor--;
      this.floorsTraversed++;
      this.hasPickup();
      this.hasDropoff();
      this._logStep();
    }
  }

  /**
   * Checks whether the elevator is supposed to stop on `currentFloor`.
   *
   * @returns {boolean}
   */
  hasStop() {
    const isPickup = this.requests.some(
      (req) => req.currentFloor === this.currentFloor,
    );
    const isDropOff = this.riders.some(
      (req) => req.dropOffFloor === this.currentFloor,
    );
    return isPickup || isDropOff;
  }

  /**
   * - Checks if there is a `Person` to pickup.
   * - Pickups multiple `Person`.
   */
  hasPickup() {
    const person = this.requests.find(
      (req) => req.currentFloor === this.currentFloor,
    );
    if (person) {
      this.stops++;
      this.requests = this.requests.filter((req) => req !== person);
      this.riders.push(person);
    }
  }

  /**
   * - Checks if there is a `Person` to drop-off.
   * - Drop-offs multiple `Person`.
   */
  hasDropoff() {
    const person = this.riders.find(
      (rider) => rider.dropOffFloor === this.currentFloor,
    );
    if (person) {
      this.stops++;
      this.riders = this.riders.filter((rider) => rider !== person);
      person._delivered = true;
    }
  }

  _logStep() {
    this._stepLog.push({
      floor: this.currentFloor,
      riders: this.riders.map((r) => Object.assign({}, r)),
      requests: this.requests.map((r) => Object.assign({}, r)),
      stops: this.stops,
      floorsTraversed: this.floorsTraversed,
    });
  }

  /**
   * ### LEVEL 6 Solution
   * Checks if the elevator should return to lobby if there are no riders and time is before 12 p.m.
   *
   * @returns {boolean}
   */
  checkReturnToLobby() {
    return new Date().getHours() < 12 && this.riders.length === 0;
  }

  /**
   * ### LEVEL 6 Solution
   * Move elevator down until it reaches the bottom floor.
   */
  returnToLobby() {
    while (this.currentFloor > 0) {
      this.moveDown();
    }
  }

  /**
   * Resets everything
   */
  reset() {
    this.currentFloor = 0;
    this.stops = 0;
    this.floorsTraversed = 0;
    this.requests = [];
    this.riders = [];
    this._stepLog = [];
  }
}
