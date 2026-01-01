// --- DOM Elements ---
const treeContainer = document.getElementById('visualization-container');
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

// --- 1. Step Recording Logic ---
class MergeSortRecorder {
    constructor() {
        this.steps = [];
    }

    // Records a single step of the algorithm for playback later
    record(type, nodeId, depth, array, description, mergeResult = null) {
        this.steps.push({
            type, // 'appear' (split) or 'merge' (update)
            nodeId,
            depth,
            array: [...array],
            description,
            mergeResult: mergeResult ? [...mergeResult] : null
        });
    }

    // Recursive Merge Sort Algorithm
    sort(arr, depth = 0, parentId = 'root', side = 'center') {
        const nodeId = `node-${depth}-${parentId}-${side}`;
        
        // Description text based on the current state
        let desc = depth === 0 ? "Start with the initial array." : 
                   (arr.length === 1 ? "Base case reached (single element)." : `Split array into ${arr.length === 2 ? "two single elements" : "halves"}.`);
        
        // Record the "Split" step
        this.record('appear', nodeId, depth, arr, desc);

        if (arr.length <= 1) return arr;

        const mid = Math.floor(arr.length / 2);
        const leftArr = arr.slice(0, mid);
        const rightArr = arr.slice(mid);

        const sortedLeft = this.sort(leftArr, depth + 1, nodeId, 'left');
        const sortedRight = this.sort(rightArr, depth + 1, nodeId, 'right');

        // Merge Logic
        const merged = [];
        let l = 0, r = 0;
        while (l < sortedLeft.length && r < sortedRight.length) {
            if (sortedLeft[l] < sortedRight[r]) merged.push(sortedLeft[l++]);
            else merged.push(sortedRight[r++]);
        }
        while (l < sortedLeft.length) merged.push(sortedLeft[l++]);
        while (r < sortedRight.length) merged.push(sortedRight[r++]);

        // Record the "Merge" step
        this.record('merge', nodeId, depth, arr, `Merging sorted sub-arrays: [${merged.join(', ')}]`, merged);

        return merged;
    }
}

// --- 2. DOM Generation ---
function createNodeDOM(step) {
    const nodeWrapper = document.createElement('div');
    nodeWrapper.id = step.nodeId;
    nodeWrapper.className = `array-node opacity-0 transition-all duration-500 transform translate-y-4`; // Start hidden

    const box = document.createElement('div');
    box.className = "node-box"; // Matches CSS in style.css

    const indexRow = document.createElement('div');
    indexRow.className = "index-row";

    step.array.forEach((val, idx) => {
        const cell = document.createElement('div');
        cell.className = "node-cell";
        cell.textContent = val;
        box.appendChild(cell);

        const indexLabel = document.createElement('div');
        indexLabel.className = "index-text";
        indexLabel.textContent = idx;
        indexRow.appendChild(indexLabel);
    });

    nodeWrapper.appendChild(box);
    nodeWrapper.appendChild(indexRow);
    return nodeWrapper;
}

function buildStaticTree(steps) {
    treeContainer.innerHTML = '';
    const levels = {};
    
    // Group nodes by depth so they appear in horizontal rows
    steps.forEach(step => {
        if (step.type === 'appear') {
            if (!levels[step.depth]) {
                levels[step.depth] = document.createElement('div');
                levels[step.depth].className = "tree-level"; // Matches CSS
            }
            const node = createNodeDOM(step);
            levels[step.depth].appendChild(node);
        }
    });

    // Append rows to the main container
    Object.keys(levels).forEach(d => {
        treeContainer.appendChild(levels[d]);
    });
}

// --- 3. Playback Controller ---
function showStep(index) {
    if (index < 0 || index >= totalSteps) return;
    
    const step = recordedSteps[index];
    stepCounter.textContent = `${index + 1} / ${totalSteps}`;
    stepDescription.textContent = step.description;

    const node = document.getElementById(step.nodeId);
    if (!node) return;

    if (step.type === 'appear') {
        // Reveal the node
        node.classList.remove('opacity-0', 'translate-y-4');
        node.classList.add('opacity-100', 'translate-y-0');
        // Clear previous merge highlights if moving backward
        const cells = node.querySelectorAll('.node-cell');
        cells.forEach(c => c.classList.remove('merged'));
    } 
    else if (step.type === 'merge') {
        // Update values to sorted state and add green color
        const cells = node.querySelectorAll('.node-cell');
        step.mergeResult.forEach((val, i) => {
            cells[i].textContent = val;
            cells[i].classList.add('merged'); 
        });
    }
    
    // Auto-scroll to keep the active node in view
    node.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    updateButtons();
}

function updateButtons() {
    btnFirst.disabled = currentStepIndex <= 0;
    btnPrev.disabled = currentStepIndex <= 0;
    btnNext.disabled = currentStepIndex >= totalSteps - 1;
    btnLast.disabled = currentStepIndex >= totalSteps - 1;
}

function handleNavigation(action) {
    if (action === 'next' && currentStepIndex < totalSteps - 1) {
        currentStepIndex++;
        showStep(currentStepIndex);
    } 
    else if (action === 'prev' && currentStepIndex > 0) {
        const currentStep = recordedSteps[currentStepIndex];
        const node = document.getElementById(currentStep.nodeId);
        
        // Reverse the visual effects
        if (currentStep.type === 'merge') {
            const cells = node.querySelectorAll('.node-cell');
            currentStep.array.forEach((val, i) => {
                cells[i].textContent = val;
                cells[i].classList.remove('merged');
            });
        } else if (currentStep.type === 'appear') {
            node.classList.add('opacity-0', 'translate-y-4');
            node.classList.remove('opacity-100', 'translate-y-0');
        }

        currentStepIndex--;
        if (currentStepIndex >= 0) {
            showStep(currentStepIndex); 
        } else {
            stepCounter.textContent = `0 / ${totalSteps}`;
            stepDescription.textContent = "Ready to start.";
        }
        updateButtons();
    } 
    else if (action === 'first') {
        currentStepIndex = -1;
        buildStaticTree(recordedSteps); // Hard reset to clear all visuals
        stepCounter.textContent = `0 / ${totalSteps}`;
        stepDescription.textContent = "Ready to start.";
        updateButtons();
    } 
    else if (action === 'last') {
        while(currentStepIndex < totalSteps - 1) {
            currentStepIndex++;
            showStep(currentStepIndex);
        }
    }
}

// --- Initialization ---
function initVisualization() {
    const rawInput = arrayInput.value.trim();
    if (!rawInput) {
        alert("Please enter numbers separated by commas.");
        return;
    }

    const arr = rawInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    if (arr.length === 0) {
        alert("Invalid input. Please enter valid numbers.");
        return;
    }

    const recorder = new MergeSortRecorder();
    recorder.sort(arr);
    
    recordedSteps = recorder.steps;
    totalSteps = recordedSteps.length;
    currentStepIndex = -1;

    buildStaticTree(recordedSteps);
    
    stepCounter.textContent = `0 / ${totalSteps}`;
    stepDescription.textContent = "Ready to start. Click Next (⟩) to begin.";
    updateButtons();
}

// Bind Events
updateBtn.addEventListener('click', initVisualization);
btnNext.addEventListener('click', () => handleNavigation('next'));
btnPrev.addEventListener('click', () => handleNavigation('prev'));
btnFirst.addEventListener('click', () => handleNavigation('first'));
btnLast.addEventListener('click', () => handleNavigation('last'));

// Initialize on Load
document.addEventListener('DOMContentLoaded', initVisualization);