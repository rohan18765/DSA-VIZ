// Initialize Lucide Icons


// --- DOM Elements ---
const container = document.getElementById('visualization-container');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const updateBtn = document.getElementById('update-btn');
const arrayInput = document.getElementById('array-input');
const speedSlider = document.getElementById('speed-slider');
const explanationText = document.getElementById('explanation-text');

// --- State ---
let array = [];
let isSorting = false;
let animationSpeed = 500;

// --- Helpers ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const parseArrayInput = () => {
    const val = arrayInput.value.trim();
    if (!val) return [];
    return val.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
};

const generateRandomArray = (size = 15, max = 100) => {
    return Array.from({ length: size }, () => Math.floor(Math.random() * max) + 5);
};

const updateExplanation = (text) => {
    explanationText.textContent = text;
};

// --- Rendering ---
const initBars = (arr) => {
    container.innerHTML = '';
    if (arr.length === 0) return;
    const maxValue = Math.max(...arr, 1);

    arr.forEach(value => {
        const bar = document.createElement('div');
        bar.classList.add('bar');

        const widthPercent = (100 / arr.length);
        bar.style.width = `calc(${widthPercent}% - 4px)`;

        if (widthPercent > 5) bar.classList.add('wide-bar');

        const heightPercent = (value / maxValue) * 95;
        bar.style.height = `${heightPercent}%`;
        bar.textContent = value;

        container.appendChild(bar);
    });
};

const updateBars = (arr, states = {}) => {
    const bars = container.children;
    const maxValue = Math.max(...arr, 1);

    for (let i = 0; i < arr.length; i++) {
        const bar = bars[i];
        const value = arr[i];

        const heightPercent = (value / maxValue) * 95;
        bar.style.height = `${heightPercent}%`;
        bar.textContent = value;

        bar.className = 'bar';
        const widthPercent = (100 / arr.length);
        if (widthPercent > 5) bar.classList.add('wide-bar');
        bar.style.width = `calc(${widthPercent}% - 4px)`;

        if (states.sortedIndices && states.sortedIndices.includes(i)) {
            bar.classList.add('sorted');
        } else if (states.swappingIndices && states.swappingIndices.includes(i)) {
            bar.classList.add('swapping');
        } else if (states.comparingIndices && states.comparingIndices.includes(i)) {
            bar.classList.add('comparing');
        }
    }
};

// --- Core Algorithm ---
async function bubbleSort() {
    if (isSorting) return;
    isSorting = true;
    toggleControls(false);

    array = parseArrayInput();
    if (array.length === 0) {
        array = generateRandomArray();
        arrayInput.value = array.join(', ');
        initBars(array);
    }

    let n = array.length;
    let swapped;
    let sortedCount = 0;

    try {
        for (let i = 0; i < n - 1; i++) {
            swapped = false;
            for (let j = 0; j < n - i - 1; j++) {
                if (!isSorting) throw new Error("Stopped");

                updateBars(array, { comparingIndices: [j, j + 1], sortedIndices: getSortedIndices(n, sortedCount) });
                updateExplanation(`Comparing ${array[j]} and ${array[j + 1]}`);
                await sleep(animationSpeed);

                if (array[j] > array[j + 1]) {
                    updateBars(array, { swappingIndices: [j, j + 1], sortedIndices: getSortedIndices(n, sortedCount) });
                    updateExplanation(`Swapping ${array[j]} and ${array[j + 1]}`);
                    await sleep(animationSpeed);

                    [array[j], array[j + 1]] = [array[j + 1], array[j]];
                    swapped = true;

                    updateBars(array, { swappingIndices: [j, j + 1], sortedIndices: getSortedIndices(n, sortedCount) });
                    await sleep(animationSpeed);
                }
            }
            sortedCount++;
            updateBars(array, { sortedIndices: getSortedIndices(n, sortedCount) });
            if (!swapped) break;
        }

        updateBars(array, { sortedIndices: [...Array(n).keys()] });
        updateExplanation("Array is sorted!");
    } catch (e) {
        // Stopped logic
    } finally {
        isSorting = false;
        toggleControls(true);
    }
}

function getSortedIndices(n, count) {
    return Array.from({ length: count }, (_, k) => n - 1 - k);
}

// --- UI Logic ---
const toggleControls = (enable) => {
    startBtn.disabled = !enable;
    updateBtn.disabled = !enable;
    arrayInput.disabled = !enable;

    const method = enable ? 'remove' : 'add';
    startBtn.classList[method]('opacity-50', 'cursor-not-allowed');
    updateBtn.classList[method]('opacity-50', 'cursor-not-allowed');
};

const handleReset = () => {
    isSorting = false;
    setTimeout(() => {
        array = parseArrayInput();
        if (array.length === 0) array = [29, 10, 14, 37, 13, 5, 25, 45];
        initBars(array);
        updateExplanation("Visualization reset.");
        toggleControls(true);
    }, 100);
};

const handleUpdate = () => {
    if (isSorting) return;
    array = parseArrayInput();
    if (array.length === 0) {
        updateExplanation("Please enter numbers separated by commas.");
        return;
    }
    initBars(array);
    updateExplanation("Custom array loaded.");
};

// --- Events ---
startBtn.addEventListener('click', bubbleSort);
resetBtn.addEventListener('click', handleReset);
updateBtn.addEventListener('click', handleUpdate);

arrayInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUpdate();
});

speedSlider.addEventListener('input', (e) => {
    animationSpeed = 1010 - e.target.value;
});

// --- Updated Initialization Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Icons safely now that the library is loaded
    lucide.createIcons();
    
    // 2. Set the initial speed based on the slider's position
    animationSpeed = 1010 - speedSlider.value;
    
    // 3. Get the array from the input field
    array = parseArrayInput();
    
    // 4. If the input is empty, provide a default array so the screen isn't blank
    if (array.length === 0) {
        array = [29, 10, 14, 37, 13, 5, 25, 45];
        arrayInput.value = "29, 10, 14, 37, 13, 5, 25, 45";
    }
    
    // 5. Draw the initial blue bars on the screen
    initBars(array);
    
    console.log("Visualizer initialized successfully!");
});