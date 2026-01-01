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

// --- 1. Recorder Logic ---
class QuickSortRecorder {
    constructor() {
        this.steps = [];
    }

    // Records a detailed state for playback
    record(type, nodeId, depth, array, description, state = {}) {
        this.steps.push({
            type, // 'appear', 'partition', 'pivot-set'
            nodeId,
            depth,
            array: [...array],
            description,
            // State objects for highlighting specific indices
            pivotIdx: state.pivotIdx ?? -1,
            iIdx: state.iIdx ?? -1,     // The 'i' pointer (smaller element boundary)
            jIdx: state.jIdx ?? -1,     // The 'j' pointer (current scanner)
            swapA: state.swapA ?? -1,   // Element being swapped
            swapB: state.swapB ?? -1,   // Element being swapped
            finalIdx: state.finalIdx ?? -1, // Locked sorted position
            rangeLow: state.rangeLow ?? -1, // Current recursion bounds
            rangeHigh: state.rangeHigh ?? -1
        });
    }

    partition(arr, low, high, depth, nodeId) {
        let pivot = arr[high]; 
        let i = low - 1;

        // 1. Start Partitioning
        this.record('appear', nodeId, depth, arr, `Partitioning range [${low} ... ${high}]. Pivot is ${pivot}.`, {
            rangeLow: low, rangeHigh: high, pivotIdx: high, iIdx: i
        });

        for (let j = low; j <= high - 1; j++) {
            // 2. Compare State
            this.record('appear', nodeId, depth, arr, `Compare: Is ${arr[j]} < Pivot (${pivot})?`, {
                rangeLow: low, rangeHigh: high, pivotIdx: high, iIdx: i, jIdx: j
            });

            if (arr[j] < pivot) {
                i++;
                
                // 3. Increment I State (Prepare to swap)
                this.record('appear', nodeId, depth, arr, `Yes (${arr[j]} < ${pivot}). Increment i to ${i}.`, {
                    rangeLow: low, rangeHigh: high, pivotIdx: high, iIdx: i, jIdx: j
                });

                // Swap
                [arr[i], arr[j]] = [arr[j], arr[i]]; 

                // 4. Swap State
                this.record('appear', nodeId, depth, arr, `Swap ${arr[i]} and ${arr[j]}.`, {
                    rangeLow: low, rangeHigh: high, pivotIdx: high, iIdx: i, jIdx: j, swapA: i, swapB: j
                });
            } else {
                 // 2b. No Swap State
                 this.record('appear', nodeId, depth, arr, `No (${arr[j]} >= ${pivot}). Move to next element.`, {
                    rangeLow: low, rangeHigh: high, pivotIdx: high, iIdx: i, jIdx: j
                });
            }
        }
        
        // 5. Final Pivot Placement
        this.record('appear', nodeId, depth, arr, `Loop finished. Place Pivot (${pivot}) at correct sorted position (i+1).`, {
            rangeLow: low, rangeHigh: high, pivotIdx: high, iIdx: i, swapA: i+1, swapB: high
        });

        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]]; 
        let pi = i + 1;

        // 6. Pivot Locked
        this.record('pivot-set', nodeId, depth, arr, `Pivot ${arr[pi]} is now sorted at index ${pi}.`, {
            rangeLow: low, rangeHigh: high, finalIdx: pi
        });
        
        return pi;
    }

    sort(arr, low, high, depth = 0, parentId = 'root', side = 'center') {
        const nodeId = `node-${depth}-${parentId}-${side}`;
        
        if (low > high) return;
        
        // Base case: Single element
        if (low === high) {
            this.record('pivot-set', nodeId, depth, arr, `Base case: Single element ${arr[low]} is sorted.`, {
                rangeLow: low, rangeHigh: high, finalIdx: low
            });
            return;
        }

        let pi = this.partition(arr, low, high, depth, nodeId);

        this.sort(arr, low, pi - 1, depth + 1, nodeId, 'left');
        this.sort(arr, pi + 1, high, depth + 1, nodeId, 'right');
    }
}

// --- 2. DOM Generation ---
function createNodeDOM(step) {
    const nodeWrapper = document.createElement('div');
    nodeWrapper.id = step.nodeId;
    nodeWrapper.className = `array-node opacity-0 transition-all duration-500 transform translate-y-4`; 

    const box = document.createElement('div');
    box.className = "node-box"; 

    const indexRow = document.createElement('div');
    indexRow.className = "index-row";

    step.array.forEach((val, idx) => {
        const cell = document.createElement('div');
        // Base classes matching style.css
        cell.className = "node-cell transition-colors duration-200"; 
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
    const uniqueNodes = new Set();

    steps.forEach(step => {
        if (!uniqueNodes.has(step.nodeId)) {
            uniqueNodes.add(step.nodeId);
            if (!levels[step.depth]) {
                levels[step.depth] = document.createElement('div');
                levels[step.depth].className = "tree-level";
            }
            const node = createNodeDOM(step);
            levels[step.depth].appendChild(node);
        }
    });

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

    // 1. Reveal Node
    node.classList.remove('opacity-0', 'translate-y-4');
    node.classList.add('opacity-100', 'translate-y-0');

    // 2. Update Array Values & Visuals
    const cells = node.querySelectorAll('.node-cell');
    
    step.array.forEach((val, i) => {
        cells[i].textContent = val;
        
        // --- CRITICAL FIX: Reset Styles ---
        // We must clear inline styles (like transform) and reset classes every step
        cells[i].style.transform = ''; 
        cells[i].className = "node-cell transition-colors duration-200"; 
        
        // --- VISUAL LOGIC ---

        // 0. Dim elements outside active recursion range
        if (step.rangeLow !== -1 && (i < step.rangeLow || i > step.rangeHigh)) {
            cells[i].classList.add('opacity-30', 'bg-slate-100');
        }

        // 1. Pivot (Purple)
        if (i === step.pivotIdx) {
            cells[i].classList.add('bg-purple-500', 'text-white', 'font-bold');
        }

        // 2. Scanner 'j' (Yellow/Amber) - The one being compared
        if (i === step.jIdx) {
             cells[i].classList.add('bg-amber-300', 'text-amber-900');
             cells[i].style.transform = "scale(1.1)"; // Slightly larger for emphasis
        }

        // 3. Boundary 'i' (Blue) - Where smaller elements go
        if (i === step.iIdx) {
            cells[i].classList.add('border-b-4', 'border-blue-500');
        }

        // 4. Swapping Elements (Indigo)
        if (i === step.swapA || i === step.swapB) {
            cells[i].classList.add('bg-indigo-200', 'text-indigo-800', 'font-bold');
        }

        // 5. Final Sorted Position (Emerald Green)
        if (i === step.finalIdx) {
             cells[i].classList.add('merged'); // style.css (.merged { @apply bg-emerald-500 text-white })
             cells[i].classList.remove('opacity-30'); // Ensure sorted elements are always bright
        }
    });
    
    // Smooth scroll to active node
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
    const rawInput = arrayInput.value.trim();
    if (!rawInput) return;
    const arr = rawInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    if (arr.length === 0) return;

    const recorder = new QuickSortRecorder();
    recorder.sort([...arr], 0, arr.length - 1);
    
    recordedSteps = recorder.steps;
    totalSteps = recordedSteps.length;
    currentStepIndex = -1;

    buildStaticTree(recordedSteps);
    
    if (totalSteps > 0) {
        currentStepIndex = 0;
        showStep(0);
    }
    
    updateButtons();
}

// Bind Events
updateBtn.addEventListener('click', initVisualization);
btnNext.addEventListener('click', () => handleNavigation('next'));
btnPrev.addEventListener('click', () => handleNavigation('prev'));
btnFirst.addEventListener('click', () => handleNavigation('first'));
btnLast.addEventListener('click', () => handleNavigation('last'));

document.addEventListener('DOMContentLoaded', initVisualization);