
/**
 * Stack Visualizer Script
 */

// --- Configuration ---
const MAX_SIZE = 8; // Max blocks that fit in the container
const BLOCK_HEIGHT = 50; // Height of visual block in px
const BLOCK_MARGIN = 4; // Margin bottom

// --- State ---
let stackData = [];

// --- DOM Elements ---
const container = document.getElementById('stack-container');
const topPointer = document.getElementById('top-pointer');
const input = document.getElementById('stack-input');
const logContainer = document.getElementById('log-container');
const topValDisplay = document.getElementById('top-value');
const sizeDisplay = document.getElementById('stack-size');

// --- Helper: Sleep ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Helper: Logger ---
function log(message, type = 'info') {
    const entry = document.createElement('div');
    const colorClass = type === 'error' ? 'border-rose-500 text-rose-600' : 
                       type === 'success' ? 'border-green-500 text-green-600' : 
                       'border-violet-500 text-gray-600';
    
    entry.className = `p-2 border-l-4 ${colorClass} bg-white shadow-sm rounded text-xs animate-fade-in`;
    entry.innerText = `> ${message}`;
    logContainer.prepend(entry);
}

// --- Helper: Update UI Stats ---
function updateStats() {
    sizeDisplay.innerText = stackData.length;
    topValDisplay.innerText = stackData.length > 0 ? stackData[stackData.length - 1] : '-';
    
    // Update Pointer Position
    if (stackData.length === 0) {
        topPointer.style.opacity = '0';
        topPointer.style.top = '500px'; // Reset to bottom
    } else {
        topPointer.style.opacity = '1';
        // Calculate position: Container Height - (Item Count * Item Total Height)
        // 500px (Container) - (N * 54px)
        const offsetFromTop = 500 - (stackData.length * (BLOCK_HEIGHT + BLOCK_MARGIN)) - 20; // -20 to center arrow on block
        topPointer.style.top = `${offsetFromTop}px`;
    }
}

// --- Operations ---

async function push() {
    const val = input.value;
    if (val === '') return log('Enter a number', 'error');
    if (stackData.length >= MAX_SIZE) return log('Stack Overflow! Max size reached.', 'error');

    // 1. Logic
    stackData.push(val);
    input.value = '';

    // 2. Create Block Visual
    const block = document.createElement('div');
    block.className = "w-32 h-[50px] bg-violet-100 border-2 border-violet-500 rounded-lg flex items-center justify-center font-bold text-violet-800 shadow-sm mb-1 transition-all duration-500 transform";
    block.innerText = val;
    block.id = `stack-item-${stackData.length - 1}`; // ID for tracking
    
    // Animation Start State (Hovering above)
    block.style.opacity = '0';
    block.style.transform = 'translateY(-100px)';

    container.appendChild(block);

    // 3. Animate In (Drop Effect)
    // Small delay to let browser render the initial 'translateY(-100px)' state
    await sleep(50); 
    block.style.opacity = '1';
    block.style.transform = 'translateY(0)';
    
    log(`Pushed ${val}`, 'success');
    updateStats();
}

async function pop() {
    if (stackData.length === 0) return log('Stack Underflow! Is empty.', 'error');

    // 1. Identify Top Element
    const topBlock = container.lastElementChild; // Because of flex-col-reverse, last child is top
    
    // 2. Highlight for removal
    topBlock.classList.remove('bg-violet-100', 'border-violet-500');
    topBlock.classList.add('bg-rose-100', 'border-rose-500', 'text-rose-600');
    log('Popping top element...');
    
    await sleep(400);

    // 3. Animate Out (Fly Up)
    topBlock.style.transform = 'translateY(-150px)';
    topBlock.style.opacity = '0';
    
    await sleep(400);

    // 4. Remove from DOM & Data
    const poppedVal = stackData.pop();
    topBlock.remove();
    
    log(`Popped ${poppedVal}`, 'success');
    updateStats();
}

async function peek() {
    if (stackData.length === 0) return log('Stack is empty', 'error');

    const topBlock = container.lastElementChild;
    
    // Flash Yellow
    const originalClass = topBlock.className;
    topBlock.className = "w-32 h-[50px] bg-yellow-100 border-2 border-yellow-500 rounded-lg flex items-center justify-center font-bold text-yellow-800 shadow-md mb-1 transition-all duration-300 scale-105";
    
    log(`Peeked: Top is ${stackData[stackData.length-1]}`, 'success');

    await sleep(800);
    
    // Reset
    topBlock.className = originalClass;
}

function clearStack() {
    stackData = [];
    container.innerHTML = '';
    log('Stack cleared.');
    updateStats();
}

// Init
updateStats();