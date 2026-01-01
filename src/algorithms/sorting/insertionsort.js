// --- DOM Elements ---
const container = document.getElementById('visualization-container');
const stepCounter = document.getElementById('step-counter');
const stepDescription = document.getElementById('step-description');
const updateBtn = document.getElementById('update-btn');
const arrayInput = document.getElementById('array-input');
const btnFirst = document.getElementById('btn-first');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnLast = document.getElementById('btn-last');

// --- State ---
let recordedSteps = [];
let currentStepIndex = -1;
let totalSteps = 0;

// --- 1. Recorder Logic ---
class InsertionSortRecorder {
    constructor() { this.steps = []; }

    // Added 'keyValue' parameter to force visual clarity during swaps
    record(array, description, keyIndex = -1, compareIndex = -1, sortedUpTo = -1, keyValue = null) {
        this.steps.push({
            array: [...array],
            description,
            keyIndex,      // The target position for the key (Rose box)
            compareIndex,  // The element being compared (Amber box)
            sortedUpTo,    // Green boundary
            keyValue       // The actual value of the key (to fix the duplicate visual glitch)
        });
    }

    sort(arr) {
        let n = arr.length;
        // Initial state
        this.record(arr, "Start: The first element is considered sorted.", -1, -1, 0);

        for (let i = 1; i < n; i++) {
            let key = arr[i];
            let j = i - 1;

            // Select Key
            this.record(arr, `Selected ${key} as the Key.`, i, -1, i-1, key);

            while (j >= 0 && arr[j] > key) {
                // Comparison state
                // keyIndex is j+1 (the current hole)
                this.record(arr, `Compare Key (${key}) with ${arr[j]}. ${arr[j]} > ${key}, so we shift.`, j+1, j, i-1, key);
                
                arr[j + 1] = arr[j]; // Shift
                
                j = j - 1;
                
                // Shift state: We track the new hole (j+1)
                // We pass 'key' so the visualizer shows the Key value in the Rose box, not the shifted duplicate
                this.record(arr, `Shifted ${arr[j+1]} to the right. Checking next...`, j+1, j, i-1, key); 
            }
            arr[j + 1] = key;
            
            // Final Insertion for this pass
            this.record(arr, `Inserted Key (${key}) at correct position.`, j+1, -1, i, key);
        }
        
        this.record(arr, "Array is fully sorted.", -1, -1, n-1);
    }
}

// --- 2. DOM Builder ---
function renderStep(step) {
    container.innerHTML = '';
    
    // Main Wrapper
    const rowWrapper = document.createElement('div');
    rowWrapper.className = "flex flex-col items-center animate-in fade-in zoom-in duration-300";

    // Box Container
    const boxRow = document.createElement('div');
    boxRow.className = "node-box flex shadow-md"; // Matches style.css

    // Index Labels
    const indexRow = document.createElement('div');
    indexRow.className = "index-row flex w-full justify-around mt-2";

    step.array.forEach((val, idx) => {
        const cell = document.createElement('div');
        // Default Style
        cell.className = "node-cell w-12 h-12 flex items-center justify-center border-r border-slate-200 text-lg font-bold transition-all duration-300";
        cell.textContent = val;

        // --- Styles based on state ---
        
        // 1. Sorted Portion (Greenish)
        if (idx <= step.sortedUpTo) {
            cell.classList.add('bg-emerald-50', 'text-emerald-600'); 
        }

        // 2. Comparison (Amber)
        if (idx === step.compareIndex) {
            cell.classList.remove('bg-emerald-50', 'text-emerald-600');
            cell.classList.add('bg-amber-100', 'text-amber-700');
        }

        // 3. The Key (Rose/Pink) - High Priority
        if (idx === step.keyIndex && step.keyIndex !== -1) {
            cell.classList.remove('bg-emerald-50', 'bg-amber-100', 'text-emerald-600');
            cell.classList.add('bg-rose-500', 'text-white', 'shadow-lg', 'scale-110', 'rounded-md', 'z-10');
            cell.style.border = 'none';
            
            // VISUAL FIX: If we provided a floating keyValue, display it here.
            // This prevents the user from seeing the underlying duplicate number during a shift.
            if (step.keyValue !== null) {
                cell.textContent = step.keyValue;
            }
        }

        boxRow.appendChild(cell);

        // Index Label
        const idxLabel = document.createElement('div');
        idxLabel.className = "text-xs text-slate-400 font-mono w-12 text-center";
        idxLabel.textContent = idx;
        indexRow.appendChild(idxLabel);
    });

    rowWrapper.appendChild(boxRow);
    rowWrapper.appendChild(indexRow);
    container.appendChild(rowWrapper);
}

// --- 3. Playback Controller ---
function showStep(index) {
    if (index < 0 || index >= totalSteps) return;
    
    const step = recordedSteps[index];
    stepCounter.textContent = `${index + 1} / ${totalSteps}`;
    stepDescription.textContent = step.description;

    renderStep(step);
    updateButtons();
}

function updateButtons() {
    btnFirst.disabled = currentStepIndex <= 0;
    btnPrev.disabled = currentStepIndex <= 0;
    btnNext.disabled = currentStepIndex >= totalSteps - 1;
    btnLast.disabled = currentStepIndex >= totalSteps - 1;
}

function handleNav(action) {
    if (action === 'next' && currentStepIndex < totalSteps - 1) {
        currentStepIndex++;
        showStep(currentStepIndex);
    } 
    else if (action === 'prev' && currentStepIndex > 0) {
        currentStepIndex--;
        showStep(currentStepIndex);
    } 
    else if (action === 'first') {
        currentStepIndex = 0;
        showStep(currentStepIndex);
    }
    else if (action === 'last') {
        currentStepIndex = totalSteps - 1;
        showStep(currentStepIndex);
    }
}

function initVisualization() {
    const raw = arrayInput.value.trim();
    if (!raw) return;
    const arr = raw.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    if (arr.length === 0) return;

    const recorder = new InsertionSortRecorder();
    recorder.sort([...arr]); // Pass copy
    
    recordedSteps = recorder.steps;
    totalSteps = recordedSteps.length;
    currentStepIndex = 0;

    showStep(0);
}

// Bind Events
updateBtn.addEventListener('click', initVisualization);
btnNext.addEventListener('click', () => handleNav('next'));
btnPrev.addEventListener('click', () => handleNav('prev'));
btnFirst.addEventListener('click', () => handleNav('first'));
btnLast.addEventListener('click', () => handleNav('last'));

document.addEventListener('DOMContentLoaded', initVisualization);