
/**
 * Queue Visualizer Script (FIFO)
 */

// --- Configuration ---
const MAX_SIZE = 7; // Max items visible in the pipe
const ANIMATION_MS = 500;

// --- State ---
let queueData = [];

// --- DOM Elements ---
const container = document.getElementById('queue-container');
const input = document.getElementById('queue-input');
const logContainer = document.getElementById('log-container');
const emptyMsg = document.getElementById('empty-message');
const frontIndicator = document.getElementById('front-indicator');
const rearIndicator = document.getElementById('rear-indicator');

// Stats Display
const frontValDisp = document.getElementById('front-val');
const rearValDisp = document.getElementById('rear-val');
const sizeDisp = document.getElementById('queue-size');

// --- Helper: Sleep ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Helper: Logger ---
function log(message, type = 'info') {
    const entry = document.createElement('div');
    const colorClass = type === 'error' ? 'border-rose-500 text-rose-600' : 
                       type === 'success' ? 'border-green-500 text-green-600' : 
                       'border-orange-500 text-gray-600';
    
    entry.className = `p-2 border-l-4 ${colorClass} bg-white shadow-sm rounded text-xs animate-fade-in`;
    entry.innerText = `> ${message}`;
    logContainer.prepend(entry);
}

// --- Helper: Update UI Stats ---
function updateStats() {
    sizeDisp.innerText = queueData.length;
    
    if (queueData.length === 0) {
        frontValDisp.innerText = '-';
        rearValDisp.innerText = '-';
        emptyMsg.style.display = 'block';
        frontIndicator.style.opacity = '0';
        rearIndicator.style.opacity = '0';
    } else {
        frontValDisp.innerText = queueData[0]; // First item
        rearValDisp.innerText = queueData[queueData.length - 1]; // Last item
        emptyMsg.style.display = 'none';
        frontIndicator.style.opacity = '1';
        rearIndicator.style.opacity = '1';
    }
}

// --- Operations ---

async function enqueue() {
    const val = input.value;
    if (val === '') return log('Enter a number', 'error');
    if (queueData.length >= MAX_SIZE) return log('Queue Full (Overflow)!', 'error');

    // 1. Logic
    queueData.push(val);
    input.value = '';

    // 2. Create Node
    const node = document.createElement('div');
    node.className = "w-16 h-16 bg-orange-100 border-2 border-orange-500 rounded-2xl flex items-center justify-center text-xl font-bold text-orange-800 shadow-md animate-slide-in shrink-0";
    node.innerText = val;

    // 3. Add to DOM (Appends to the END of the flex container)
    // Note: We hide the empty message first
    emptyMsg.style.display = 'none';
    container.appendChild(node);
    
    log(`Enqueued ${val}`, 'success');
    updateStats();
}

async function dequeue() {
    if (queueData.length === 0) return log('Queue Empty (Underflow)!', 'error');

    // 1. Identify Front Node (First child of container)
    // Be careful to ignore the "empty message" paragraph if it's there, 
    // but logic handles that via queueData check.
    // The "empty-message" is a child, but if queueData > 0 it's hidden. 
    // Best way: get all div children.
    const nodes = container.querySelectorAll('div');
    const frontNode = nodes[0];

    if (!frontNode) return;

    // 2. Highlight for removal (Red)
    log('Dequeueing front element...');
    frontNode.classList.remove('bg-orange-100', 'border-orange-500');
    frontNode.classList.add('bg-rose-100', 'border-rose-500', 'text-rose-600');

    await sleep(ANIMATION_MS);

    // 3. Animate Exit (Slide Left and Fade)
    frontNode.style.transition = 'all 0.4s ease';
    frontNode.style.transform = 'translateX(-50px)';
    frontNode.style.opacity = '0';

    await sleep(400);

    // 4. Remove from Data & DOM
    const removedVal = queueData.shift(); // Remove first element
    frontNode.remove();

    log(`Dequeued ${removedVal}`, 'success');
    updateStats();
}

async function peek() {
    if (queueData.length === 0) return log('Queue is empty', 'error');

    const nodes = container.querySelectorAll('div');
    const frontNode = nodes[0];

    // Flash Yellow
    const oldClass = frontNode.className;
    frontNode.className = "w-16 h-16 bg-yellow-100 border-2 border-yellow-500 rounded-2xl flex items-center justify-center text-xl font-bold text-yellow-800 shadow-lg scale-110 transition-all duration-300 shrink-0";
    
    log(`Peek: Front is ${queueData[0]}`, 'success');
    
    await sleep(800);
    
    // Reset
    frontNode.className = oldClass;
}

function clearQueue() {
    queueData = [];
    // Remove all DIVs, keep the empty message P tag
    const nodes = container.querySelectorAll('div');
    nodes.forEach(n => n.remove());
    
    log('Queue cleared.');
    updateStats();
}

// Init
updateStats();