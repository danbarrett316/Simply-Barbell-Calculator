const BAR_WEIGHT = 45;
const PLATES = [45, 35, 25, 15, 10, 5, 2.5, 1, 0.75, 0.5, 0.25];
const FRACTION_LABELS = {
  0.75: "3/4",
  0.5: "1/2",
  0.25: "1/4",
};

const form = document.getElementById("calculator");
const input = document.getElementById("totalWeight");
const startInput = document.getElementById("startWeight");
const result = document.getElementById("result");

const formatWeight = (value) => {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
};

const formatPlateLabel = (plate) => {
  const fraction = FRACTION_LABELS[plate];
  return fraction ? `${fraction} lb` : `${formatWeight(plate)} lb`;
};

const renderError = (message) => {
  result.innerHTML = `<p class="note">${message}</p>`;
};

const roundToIncrement = (value, increment) => Math.round(value / increment) * increment;
const roundDownToIncrement = (value, increment) => Math.floor(value / increment) * increment;

const renderPlateRows = (plates) =>
  plates
    .map(
      ({ plate, count }) =>
        `<li class="result-item"><span>${formatPlateLabel(plate)}</span><span>x ${count} per side</span></li>`
    )
    .join("");

const renderPlateSummary = (plates, perSide, total, showBar) => {
  if (!plates.length) {
    return `<p class="result-placeholder">Just the ${BAR_WEIGHT} lb bar.</p>`;
  }

  return `
    <ul class="result-list">${renderPlateRows(plates)}</ul>
    <div class="result-meta">
      ${showBar ? `<span>Bar: ${BAR_WEIGHT} lb</span>` : ""}
      <span>Per side: ${formatWeight(perSide)} lb</span>
      <span>Total: ${formatWeight(total)} lb</span>
    </div>
  `;
};

const renderWarmups = (warmups) =>
  warmups
    .map(
      (warmup, index) => `
        <article class="warmup-card">
          <h3>Set ${index + 1} - ${formatWeight(warmup.total)} lb</h3>
          ${renderPlateSummary(warmup.plates, warmup.perSide, warmup.total, false)}
        </article>
      `
    )
    .join("");

const renderResult = (warmups, workingSet) => {
  result.innerHTML = `
    <div class="result-section">
      <h2>Warmup sets</h2>
      <div class="warmup-grid">${renderWarmups(warmups)}</div>
    </div>
    <div class="result-section">
      <h2>Working set</h2>
      ${renderPlateSummary(workingSet.plates, workingSet.perSide, workingSet.total, true)}
    </div>
  `;
};

const isValidIncrement = (value) => Math.abs(value - Math.round(value * 2) / 2) <= 1e-6;

const buildWarmupWeights = (start, total, count) => {
  if (count <= 1) {
    return [start];
  }

  const step = (total - start) / count;
  const maxWarmup = total - 0.5;
  const weights = Array.from({ length: count }, (_, index) => {
    if (index === 0) {
      return start;
    }

    const raw = start + step * index;
    const floored = roundDownToIncrement(raw, 0.5);
    return Math.max(start, Math.min(floored, maxWarmup));
  });
  weights[0] = start;
  return weights;
};

const calculatePlates = (total) => {
  if (Number.isNaN(total)) {
    return { error: "Enter a valid number." };
  }

  if (total < BAR_WEIGHT) {
    return { error: `Total must be at least ${BAR_WEIGHT} lb.` };
  }

  const delta = total - BAR_WEIGHT;
  if (!isValidIncrement(delta)) {
    return { error: "Total must be in 0.5 lb increments (0.25 per side)." };
  }

  const perSide = delta / 2;
  let remaining = perSide;
  const picks = [];

  PLATES.forEach((plate) => {
    const count = remaining + 1e-6 >= plate ? 1 : 0;
    if (count > 0) {
      picks.push({ plate, count });
      remaining -= count * plate;
    }
  });

  if (remaining > 0.001) {
    return { error: "That weight cannot be matched with one pair of each plate." };
  }

  return { plates: picks, perSide };
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const total = Number.parseFloat(input.value);
  const start = Number.parseFloat(startInput.value);

  if (Number.isNaN(start)) {
    renderError("Enter a valid starting weight.");
    return;
  }

  if (start < BAR_WEIGHT) {
    renderError(`Starting weight must be at least ${BAR_WEIGHT} lb.`);
    return;
  }

  if (!isValidIncrement(start)) {
    renderError("Starting weight must be in 0.5 lb increments (0.25 per side).");
    return;
  }

  if (Number.isNaN(total)) {
    renderError("Enter a valid working weight.");
    return;
  }

  if (start >= total) {
    renderError("Starting weight must be below the working weight.");
    return;
  }

  const workingSet = calculatePlates(total);

  if (workingSet.error) {
    renderError(workingSet.error);
    return;
  }

  const warmupWeights = buildWarmupWeights(start, total, 4);
  const warmups = [];

  for (let index = 0; index < warmupWeights.length; index += 1) {
    const weight = warmupWeights[index];
    const warmupSet = calculatePlates(weight);

    if (warmupSet.error) {
      renderError(`Warmup set ${index + 1}: ${warmupSet.error}`);
      return;
    }

    warmups.push({ total: weight, plates: warmupSet.plates, perSide: warmupSet.perSide });
  }

  renderResult(warmups, { ...workingSet, total });
});
