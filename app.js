const BAR_WEIGHT = 45;
const PLATES = [45, 35, 25, 15, 10, 5, 2.5, 1, 0.75, 0.5, 0.25];
const FRACTION_LABELS = {
  0.75: "3/4",
  0.5: "1/2",
  0.25: "1/4",
};

const form = document.getElementById("calculator");
const input = document.getElementById("totalWeight");
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

const renderResult = (plates, perSide, total) => {
  const plateRows = plates
    .map(
      ({ plate, count }) =>
        `<li class="result-item"><span>${formatPlateLabel(plate)}</span><span>x ${count} per side</span></li>`
    )
    .join("");

  result.innerHTML = `
    <h2>Plates to load</h2>
    <ul class="result-list">${plateRows}</ul>
    <div class="result-meta">
      <span>Bar: ${BAR_WEIGHT} lb</span>
      <span>Per side: ${formatWeight(perSide)} lb</span>
      <span>Total: ${formatWeight(total)} lb</span>
    </div>
  `;
};

const calculatePlates = (total) => {
  if (Number.isNaN(total)) {
    return { error: "Enter a valid number." };
  }

  if (total < BAR_WEIGHT) {
    return { error: `Total must be at least ${BAR_WEIGHT} lb.` };
  }

  const delta = total - BAR_WEIGHT;
  const roundedDelta = Math.round(delta * 2) / 2;
  if (Math.abs(delta - roundedDelta) > 1e-6) {
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
  const { plates, perSide, error } = calculatePlates(total);

  if (error) {
    renderError(error);
    return;
  }

  if (!plates.length) {
    result.innerHTML = `
      <h2>Plates to load</h2>
      <p class="result-placeholder">Just the 45 lb bar.</p>
    `;
    return;
  }

  renderResult(plates, perSide, total);
});
