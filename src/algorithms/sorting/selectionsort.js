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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Parses the comma-separated string from the input field into a number array.
 */
const parseArrayInput = () => {
    const val = arrayInput.value.trim();
    if (!val) return [];
    return val.split(',')
              .map(x => parseInt(x.trim()))
              .filter(x => !isNaN(x));
};

const updateExplanation = (text) => {
    explanationText.textContent = text;
};

// --- Rendering Logic ---
const initBars = (arr) => {
    container.innerHTML = '';
    if (arr.length === 0) return;
    const maxValue = Math.max(...arr, 1);

    arr.forEach(value => {
        const bar = document.createElement('div');
        bar.classList.add('bar');
        const widthPercent = (100 / arr.length);
        bar.style.width = `calc(${widthPercent}% - 4px)`;
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
        bar.style.height = `${(arr[i] / maxValue) * 95}%`;
        bar.textContent = arr[i];
        bar.className = 'bar';

        if (states.sortedIndices && states.sortedIndices.includes(i)) bar.classList.add('sorted');
        else if (states.minIdx === i) bar.classList.add('swapping'); 
        else if (states.comparingIdx === i) bar.classList.add('comparing'); 
    }
};

// --- Selection Sort Algorithm ---
async function selectionSort() {
    if (isSorting) return;
    isSorting = true;
    toggleControls(false);

    let n = array.length;
    let sortedIndices = [];

    try {
        for (let i = 0; i < n - 1; i++) {
            let min_idx = i;
            updateExplanation(`Step ${i + 1}: Assuming ${array[i]} is the minimum.`);
            
            for (let j = i + 1; j < n; j++) {
                if (!isSorting) throw new Error("Sorted Interrupted");
                
                updateBars(array, { sortedIndices, minIdx: min_idx, comparingIdx: j });
                await sleep(animationSpeed);

                if (array[j] < array[min_idx]) {
                    min_idx = j;
                    updateExplanation(`New minimum found: ${array[min_idx]}`);
                    updateBars(array, { sortedIndices, minIdx: min_idx });
                    await sleep(animationSpeed);
                }
            }

            if (min_idx !== i) {
                updateExplanation(`Swapping ${array[i]} and ${array[min_idx]}`);
                [array[i], array[min_idx]] = [array[min_idx], array[i]];
                updateBars(array, { sortedIndices, minIdx: i, comparingIdx: min_idx });
                await sleep(animationSpeed);
            }
            sortedIndices.push(i);
        }
        
        sortedIndices.push(n - 1);
        updateBars(array, { sortedIndices });
        updateExplanation("Array is fully sorted!");
    } catch (e) {
        console.log(e.message);
    } finally {
        isSorting = false;
        toggleControls(true);
    }
}

// --- UI Control Logic ---
const toggleControls = (enable) => {
    startBtn.disabled = !enable;
    updateBtn.disabled = !enable;
    arrayInput.disabled = !enable;
    
    const method = enable ? 'remove' : 'add';
    startBtn.classList[method]('opacity-50', 'cursor-not-allowed');
    updateBtn.classList[method]('opacity-50', 'cursor-not-allowed');
};

/**
 * The logic that handles the "Update" button click.
 */
const handleUpdate = () => {
    if (isSorting) {
        alert("Please reset or wait for the sorting to finish before updating.");
        return;
    }
    const newArray = parseArrayInput();
    if (newArray.length === 0) {
        updateExplanation("Invalid input. Please enter numbers separated by commas.");
        return;
    }
    array = newArray;
    initBars(array);
    updateExplanation("Custom array loaded. Ready to start.");
};

// --- Events ---
updateBtn.addEventListener('click', handleUpdate);

arrayInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent page refresh if inside a form
        handleUpdate();
    }
});


startBtn.addEventListener('click', selectionSort);

speedSlider.addEventListener('input', (e) => {
    animationSpeed = 1010 - e.target.value;
});

// Allow updating when the "Enter" key is pressed in the input field

resetBtn.addEventListener('click', () => {
    isSorting = false; // This triggers the 'catch' in the async function
    setTimeout(() => {
        array = parseArrayInput();
        if (array.length === 0) array = [64, 25, 12, 22, 11];
        initBars(array);
        updateExplanation("Visualization reset.");
        toggleControls(true);
    }, 50);
});

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    array = parseArrayInput();
    initBars(array);
});