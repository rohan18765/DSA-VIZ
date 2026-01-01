/**
 * Binary Search Tree Visualizer (Final Enhanced Version)
 * Features: SVG connections, dynamic node positioning, and visual traversal history.
 */

// --- Configuration ---
const ANIMATION_SPEED_MS = 600;
const NODE_RADIUS = 25; 

// --- State Management ---
let root = null;
let visitedSet = new Set(); // Tracks nodes visited during traversal

// --- DOM Elements ---
const container = document.getElementById('tree-container');
const svgLayer = document.getElementById('tree-svg');
const logContainer = document.getElementById('log-container');
const valueInput = document.getElementById('node-value');
const emptyMsg = document.getElementById('empty-msg');
const traversalResultBox = document.getElementById('traversal-result');

// --- Helper: Sleep ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Helper: Logger ---
function log(message, type = 'info') {
    const entry = document.createElement('div');
    const colorClass = type === 'error' ? 'border-rose-500 text-rose-600' : 
                       type === 'success' ? 'border-lime-600 text-lime-700' : 
                       'border-gray-400 text-gray-600';
    
    entry.className = `p-2 border-l-4 ${colorClass} bg-white shadow-sm rounded text-xs animate-fade-in`;
    entry.innerText = `> ${message}`;
    
    if (logContainer) {
        logContainer.prepend(entry);
        if (logContainer.children.length > 50) logContainer.removeChild(logContainer.lastChild);
    }
}

// --- Helper: Update Traversal Output Box ---
function addToOutput(value) {
    if (!traversalResultBox) return;
    
    // Clear placeholder text if it exists
    if (traversalResultBox.innerText.includes('No traversal')) {
        traversalResultBox.innerHTML = ''; 
    }
    
    // Add separator if not first item
    if (traversalResultBox.children.length > 0) {
        const arrow = document.createElement('span');
        arrow.className = "text-gray-400 mx-1";
        arrow.innerHTML = "&rarr;";
        traversalResultBox.appendChild(arrow);
    }

    // Create the number badge
    const span = document.createElement('span');
    span.className = "inline-block bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold animate-pulse shadow-sm border border-purple-200";
    span.innerText = value;
    
    traversalResultBox.appendChild(span);
    // Auto-scroll to right if overflow
    traversalResultBox.scrollLeft = traversalResultBox.scrollWidth;
}

// --- Data Structure ---
class TreeNode {
    constructor(value) {
        this.value = parseInt(value);
        this.left = null;
        this.right = null;
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = 0;
        this.y = 0;
    }
}

// --- Drawing Logic ---

// 1. Calculate positions (Recursive)
function updateNodePositions(node, depth, x, availableWidth) {
    if (!node) return;
    
    // Vertical spacing: 80px per level
    node.y = depth * 80 + 50; 
    node.x = x;

    // As we go deeper, reduce the spread
    const offset = availableWidth / 2;
    updateNodePositions(node.left, depth + 1, x - offset, offset);
    updateNodePositions(node.right, depth + 1, x + offset, offset);
}

// 2. Draw SVG Line
function drawLine(x1, y1, x2, y2) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', '#cbd5e1'); // gray-300
    line.setAttribute('stroke-width', '2');
    svgLayer.appendChild(line);
}

// 3. Draw Node (Recursive)
function drawNodeRecursive(node, activeNodeId, highlightColor) {
    if (!node) return;

    // Draw Lines first (behind nodes)
    if (node.left) drawLine(node.x, node.y, node.left.x, node.left.y);
    if (node.right) drawLine(node.x, node.y, node.right.x, node.right.y);

    // Recursively draw children
    drawNodeRecursive(node.left, activeNodeId, highlightColor);
    drawNodeRecursive(node.right, activeNodeId, highlightColor);

    // Create Node Element
    const nodeEl = document.createElement('div');
    
    // Base styles
    let classes = "absolute w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold shadow-md transition-all duration-300 z-20 ";
    
    // Determine Color State
    if (node.id === activeNodeId) {
        // STATE 1: Active (Current Processing)
        classes += `${highlightColor} scale-110 z-30`; 
    } else if (visitedSet.has(node.id)) {
        // STATE 2: Visited (History) -> Light Purple
        classes += "bg-purple-50 border-purple-300 text-purple-600"; 
    } else {
        // STATE 3: Default -> White & Lime
        classes += "bg-white border-lime-600 text-gray-700";
    }

    nodeEl.className = classes;
    nodeEl.style.left = `${node.x - NODE_RADIUS}px`;
    nodeEl.style.top = `${node.y - NODE_RADIUS}px`;
    nodeEl.innerText = node.value;

    container.appendChild(nodeEl);
}

// 4. Main Draw Function
function drawTree(activeNodeId = null, highlightColor = 'border-yellow-500 bg-yellow-100 text-yellow-800') {
    if (!container || !svgLayer) return;

    container.innerHTML = '';
    svgLayer.innerHTML = '';

    if (!root) {
        if(emptyMsg) container.appendChild(emptyMsg);
        return;
    }

    // Robust Width Calculation (Fallback if hidden)
    let width = container.clientWidth;
    if (width === 0) width = 1000;

    // Calculate & Draw
    updateNodePositions(root, 0, width / 2, width / 4);
    drawNodeRecursive(root, activeNodeId, highlightColor);
}

// --- Operations ---

async function insertNode() {
    const val = parseInt(valueInput.value);
    if (isNaN(val)) return log("Enter a number", "error");

    const newNode = new TreeNode(val);

    if (!root) {
        root = newNode;
        log(`Inserted Root: ${val}`, "success");
        drawTree();
        valueInput.value = '';
        return;
    }

    let current = root;
    
    // Visualize searching for spot
    while (true) {
        drawTree(current.id); 
        await sleep(ANIMATION_SPEED_MS);

        if (val === current.value) {
            log(`Value ${val} already exists.`, "error");
            drawTree();
            return;
        }

        if (val < current.value) {
            if (!current.left) {
                current.left = newNode;
                break;
            }
            current = current.left;
        } else {
            if (!current.right) {
                current.right = newNode;
                break;
            }
            current = current.right;
        }
    }

    // Finalize insertion
    drawTree(newNode.id, 'border-green-500 bg-green-100 text-green-800');
    log(`Inserted ${val}`, "success");
    await sleep(500);
    drawTree();
    valueInput.value = '';
}

async function searchNode() {
    const val = parseInt(valueInput.value);
    if (isNaN(val)) return log("Enter a number", "error");
    if (!root) return log("Tree is empty", "error");

    let current = root;
    log(`Searching for ${val}...`);

    while (current) {
        drawTree(current.id); 
        await sleep(ANIMATION_SPEED_MS);

        if (current.value === val) {
            log(`Found ${val}!`, "success");
            drawTree(current.id, 'border-lime-600 bg-lime-300 text-lime-900');
            return;
        }

        if (val < current.value) current = current.left;
        else current = current.right;
    }

    log(`${val} not found.`, "error");
    drawTree();
}

// --- Traversals ---

async function traverse(type) {
    if (!root) return log("Tree is empty", "error");
    
    // Reset visuals
    visitedSet.clear();
    if(traversalResultBox) {
        traversalResultBox.innerHTML = '<span class="text-gray-400 italic">Starting...</span>';
    }
    
    log(`Starting ${type} traversal...`);
    
    if (type === 'inorder') await inorder(root);
    if (type === 'preorder') await preorder(root);
    if (type === 'postorder') await postorder(root);
    
    log("Traversal complete.", "success");
    
    // Keep highlights for 2 seconds then clear
    await sleep(2000);
    visitedSet.clear();
    drawTree();
}

// In-Order: Left -> Root -> Right
async function inorder(node) {
    if (!node) return;
    await inorder(node.left);
    
    visitedSet.add(node.id);
    addToOutput(node.value);
    drawTree(node.id, 'border-purple-600 bg-purple-300 text-purple-900');
    await sleep(ANIMATION_SPEED_MS);
    
    await inorder(node.right);
}

// Pre-Order: Root -> Left -> Right
async function preorder(node) {
    if (!node) return;
    
    visitedSet.add(node.id);
    addToOutput(node.value);
    drawTree(node.id, 'border-purple-600 bg-purple-300 text-purple-900');
    await sleep(ANIMATION_SPEED_MS);
    
    await preorder(node.left);
    await preorder(node.right);
}

// Post-Order: Left -> Right -> Root
async function postorder(node) {
    if (!node) return;
    
    await postorder(node.left);
    await postorder(node.right);
    
    visitedSet.add(node.id);
    addToOutput(node.value);
    drawTree(node.id, 'border-purple-600 bg-purple-300 text-purple-900');
    await sleep(ANIMATION_SPEED_MS);
}

function clearTree() {
    root = null;
    visitedSet.clear();
    if(traversalResultBox) traversalResultBox.innerHTML = '<span class="text-gray-400 italic">Tree cleared.</span>';
    drawTree();
    log("Tree cleared.");
}

// --- Init ---
window.addEventListener('resize', () => { if(root) drawTree(); });
drawTree();