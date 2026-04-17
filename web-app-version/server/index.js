import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import Person from "../../person.js";
import Elevator from "../../elevator.js";

const FILENAME = fileURLToPath(import.meta.url);
const DIRNAME = path.dirname(FILENAME);

const app = express();
const elevator = new Elevator();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(DIRNAME, "../public")));

/**
 * GET /state
 * Returns full elevator state.
 */
app.get("/state", (req, res) => {
  res.json(elevator.getState());
});

/**
 * GET /requests
 * Returns all pending pickup requests
 */
app.get("/requests", (req, res) => {
  res.json(elevator.requests);
});

/**
 * POST /requests
 * Add a person to the requests.
 * Body: { name, currentFloor, dropOffFloor }
 */
app.post("/requests", (req, res) => {
  const { name, currentFloor, dropOffFloor } = req.body;

  if (!name || currentFloor === undefined || dropOffFloor === undefined) {
    return res
      .status(400)
      .json({ error: "name, currentFloor and dropOffFloor are required" });
  }
  if (currentFloor == dropOffFloor) {
    return res
      .status(400)
      .json({ error: "currentFloor and dropOffFloor cannot be the same" });
  }

  const person = new Person(name, currentFloor, dropOffFloor);
  elevator.requests.push(person);
  res.status(201).json(person);
});

/**
 * DELETE /requests/:name
 * Remove a request by person name.
 */
app.delete("/requests/:name", (req, res) => {
  elevator.requests = elevator.requests.filter(
    (r) => r.name !== req.params.name,
  );
  res.json({ message: `Request for ${req.params.name} removed` });
});

/**
 * GET /riders
 * Returns current riders inside the elevator.
 */
app.get("/riders", (req, res) => {
  res.json(elevator.riders);
});

/**
 * POST /dispatch
 * Run the algorithm.
 */
app.post("/dispatch", (req, res) => {
  if (elevator.requests.length === 0 && elevator.riders.length === 0) {
    return res.status(400).json({ error: "No requests to dispatch" });
  }
  elevator.dispatch();
  res.json({ steps: elevator._stepLog, finalState: elevator.getState() });
});

/**
 * POST /reset
 * Reset the elevator back to initial state
 */
app.post("/reset", (req, res) => {
  elevator.reset();
  res.json({ message: "Elevator reset", state: elevator.getState() });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
