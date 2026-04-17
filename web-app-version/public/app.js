const API = "http://localhost:3000";
const FLOORS = 15;
const STEP_DELAY = 500;

const NAMES = [
  "Alice","Bob","Carol","Dave","Eve","Frank","Grace","Hank",
  "Iris","Jack","Karen","Leo","Mia","Nate","Olivia","Pete",
  "Quinn","Rose","Sam","Tara","Uma","Vince","Wendy","Xander","Yara","Zoe",
];
let nameIndex = 0;

const floorsGrid = document.getElementById("floors-grid");
const elevatorCar = document.getElementById("elevator-car");
const carRiders = document.getElementById("car-riders");
const statFloor = document.getElementById("stats-floor");
const statStops = document.getElementById("stats-stops");
const statTraversed = document.getElementById("stats-traversed");
const statRequests = document.getElementById("stats-requests");
const btnAdd = document.getElementById("btn-add");
const btnDispatch = document.getElementById("btn-dispatch");
const btnReset = document.getElementById("btn-reset");

function init() {
  buildFloors();
  syncState();
}

function buildFloors() {
  floorsGrid.innerHTML = "";
  for (let f = FLOORS - 1; f >= 0; f--) {
    const row = document.createElement("div");
    row.className = "flex items-center h-8 border-b gap-2 py-1";
    row.id = `floor-${f}`;

    const num = document.createElement("div");
    num.className = "w-6 text-right text-xs";
    num.textContent = f;

    const persons = document.createElement("div");
    persons.className = "flex flex-wrap gap-1 flex-1";
    persons.id = `floor-persons-${f}`;

    row.appendChild(num);
    row.appendChild(persons);
    floorsGrid.appendChild(row);
  }
}

function positionCar(floor) {
  elevatorCar.style.top = (FLOORS - 1 - floor) * 32 + "px";
}

function renderStats(s) {
  statFloor.textContent = s.currentFloor;
  statStops.textContent = s.stops;
  statTraversed.textContent = s.floorsTraversed;
  statRequests.textContent = s.requests.length;
}

function renderPersons(requests, riders, delivered = [], deletable = false) {
  for (let f = 0; f < FLOORS; f++) {
    document.getElementById(`floor-persons-${f}`).innerHTML = "";
  }
  carRiders.innerHTML = "";

  requests.forEach((p) => {
    const el = document.getElementById(`floor-persons-${p.currentFloor}`);
    if (el) el.appendChild(requestBadge(p, deletable));
  });

  riders.forEach((p) => {
    carRiders.appendChild(badge(p.name, `→${p.dropOffFloor}`));
  });

  delivered.forEach((d) => {
    const el = document.getElementById(`floor-persons-${d.floor}`);
    if (el) el.appendChild(deliveredBadge(d.name, d.pickupFloor, d.floor));
  });
}

function requestBadge(p, deletable) {
  const wrap = document.createElement("span");
  wrap.className = "text-xs border px-1 rounded flex items-center gap-1";

  const label = document.createElement("span");
  label.textContent = `${p.name}(→${p.dropOffFloor})`;
  wrap.appendChild(label);

  if (deletable) {
    const x = document.createElement("button");
    x.textContent = "x";
    x.className = "leading-none hover:text-red-500";
    x.addEventListener("click", async () => {
      await fetch(`${API}/requests/${encodeURIComponent(p.name)}`, { method: "DELETE" });
      await syncState();
    });
    wrap.appendChild(x);
  }

  return wrap;
}

function badge(name, sub) {
  const span = document.createElement("span");
  span.className = "text-xs border px-1 rounded";
  span.textContent = `${name}(${sub})`;
  return span;
}

function deliveredBadge(name, pickupFloor, dropoffFloor) {
  const span = document.createElement("span");
  span.className = "text-xs border px-1 rounded line-through opacity-50";
  span.textContent = `${name}(${pickupFloor}→${dropoffFloor})`;
  return span;
}

async function syncState() {
  const [state, requests, riders] = await Promise.all([
    fetch(`${API}/state`).then((r) => r.json()),
    fetch(`${API}/requests`).then((r) => r.json()),
    fetch(`${API}/riders`).then((r) => r.json()),
  ]);
  positionCar(state.currentFloor);
  renderStats({ ...state, requests });
  renderPersons(requests, riders, [], true);
}

btnAdd.addEventListener("click", async () => {
  const name = NAMES[nameIndex % NAMES.length];
  nameIndex++;
  const pickup = Math.floor(Math.random() * (FLOORS - 1)) + 1;
  let dropoff;
  do { dropoff = Math.floor(Math.random() * FLOORS); } while (dropoff === pickup);

  await fetch(`${API}/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, currentFloor: pickup, dropOffFloor: dropoff }),
  });
  await syncState();
});

btnDispatch.addEventListener("click", async () => {
  btnAdd.disabled = true;
  btnDispatch.disabled = true;

  const res = await fetch(`${API}/dispatch`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json();
    alert(err.error);
    btnAdd.disabled = false;
    btnDispatch.disabled = false;
    return;
  }
  const { steps, finalState } = await res.json();

  let i = 0;
  const deliveries = [];
  const timer = setInterval(() => {
    if (i >= steps.length) {
      clearInterval(timer);
      renderStats(finalState);
      renderPersons([], [], deliveries);
      btnAdd.disabled = false;
      btnDispatch.disabled = false;
      return;
    }
    const step = steps[i];
    const prevRiders = i > 0 ? steps[i - 1].riders : [];
    prevRiders
      .filter((pr) => !step.riders.some((cr) => cr.name === pr.name))
      .forEach((p) => deliveries.push({ name: p.name, pickupFloor: p.currentFloor, floor: step.floor }));
    i++;
    positionCar(step.floor);
    renderPersons(step.requests, step.riders, deliveries);
    renderStats({ currentFloor: step.floor, stops: step.stops, floorsTraversed: step.floorsTraversed, requests: step.requests });
  }, STEP_DELAY);
});

btnReset.addEventListener("click", async () => {
  nameIndex = 0;
  btnAdd.disabled = false;
  btnDispatch.disabled = false;
  await fetch(`${API}/reset`, { method: "POST" });
  buildFloors();
  await syncState();
});

init();
