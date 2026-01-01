/**
 * Linked List Visualizer Script (Singly & Doubly Support)
 */

// --- Configuration ---
const ANIMATION_SPEED_MS = 600;

// --- State Management ---
let head = null;
let listSize = 0;
let isDoubly = false; // Default to singly

// --- DOM Elements ---
const board = document.getElementById('visualizer-board');
const logContainer = document.getElementById('log-container');
const valueInput = document.getElementById('node-value');
const listTypeSelect = document.getElementById('list-type');
const headerTitle = document.querySelector('h1');

// --- Helper: Sleep ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Helper: Logger ---
function log(message, type = 'info') {
    const entry = document.createElement('div');
    const colorClass = type === 'error' ? 'border-rose-500 text-rose-600' : 
                       type === 'success' ? 'border-green-500 text-green-600' : 
                       'border-cyan-500 text-gray-600';
    
    entry.className = `p-2 border-l-4 ${colorClass} bg-white shadow-sm rounded text-xs animate-fade-in`;
    entry.innerText = `> ${message}`;
    logContainer.prepend(entry);
    if (logContainer.children.length > 50) logContainer.removeChild(logContainer.lastChild);
}

// --- Core Data Structure Logic ---
class Node {
    constructor(value) {
        this.value = value;
        this.next = null;
        this.prev = null; // New: For Doubly Linked List
        this.id = Math.random().toString(36).substr(2, 9);
    }
}

// --- Toggle Mode ---
function toggleListType() {
    isDoubly = listTypeSelect.value === 'doubly';
    
    // Clear list when switching modes to avoid confusion
    head = null;
    listSize = 0;
    
    // Update Header Text
    headerTitle.innerText = isDoubly ? "Doubly Linked List" : "Singly Linked List";
    
    log(`Switched to ${isDoubly ? 'Doubly' : 'Singly'} Linked List. Board cleared.`, 'success');
    redrawList();
}

// --- Visualization Logic ---
function redrawList(activeNodeId = null, foundNodeId = null) {
    board.innerHTML = ''; 

    if (!head) {
        board.innerHTML = '<p class="text-gray-400 text-lg">List is empty. Add a node!</p>';
        return;
    }

    let current = head;
    while (current) {
        // 1. Node Container
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'flex flex-col items-center gap-1 min-w-[80px] transition-all duration-300';
        nodeDiv.id = `node-${current.id}`;

        // Color Logic
        let bgClass = 'bg-white border-cyan-500';
        if (current.id === activeNodeId) bgClass = 'bg-yellow-100 border-yellow-500 scale-110 shadow-lg';
        else if (current.id === foundNodeId) bgClass = 'bg-green-100 border-green-500 scale-110 shadow-lg';

        // The Circle
        const circle = document.createElement('div');
        circle.className = `w-16 h-16 ${bgClass} border-2 rounded-full flex items-center justify-center text-xl font-bold shadow-md relative z-10 transition-colors duration-300`;
        circle.innerText = current.value;
        
        // Pointers Label (Visualizing Nulls)
        const label = document.createElement('div');
        label.className = 'text-[10px] text-gray-400 font-mono flex flex-col items-center leading-tight';
        
        if (isDoubly) {
            // Show prev/next status for Doubly
            let prevText = current.prev ? '← prev' : 'prev: null';
            let nextText = current.next ? 'next →' : 'next: null';
            label.innerHTML = `<span>${prevText}</span><span>${nextText}</span>`;
        } else {
            // Show next status for Singly
            label.innerText = current.next ? 'next ➝' : 'next: null';
        }

        nodeDiv.appendChild(circle);
        nodeDiv.appendChild(label);
        board.appendChild(nodeDiv);

        // 2. Arrows
        if (current.next) {
            const arrowContainer = document.createElement('div');
            arrowContainer.className = 'flex flex-col items-center justify-center mx-1 -mt-6 select-none';
            
            // Forward Arrow
            const forwardArrow = document.createElement('div');
            forwardArrow.className = 'text-gray-300 text-3xl font-light';
            forwardArrow.innerHTML = '&rarr;';
            arrowContainer.appendChild(forwardArrow);

            // Backward Arrow (Only for Doubly)
            if (isDoubly) {
                const backArrow = document.createElement('div');
                backArrow.className = 'text-gray-300 text-3xl font-light -mt-4'; // Overlap slightly
                backArrow.innerHTML = '&larr;';
                arrowContainer.appendChild(backArrow);
            }

            board.appendChild(arrowContainer);
        }

        current = current.next;
    }
}

// --- Operations ---

async function appendNode() {
    const value = valueInput.value;
    if (value === '') return log('Please enter a value', 'error');

    const newNode = new Node(value);
    
    if (!head) {
        head = newNode;
        log(`Created Head Node: ${value}`, 'success');
    } else {
        let current = head;
        while (current.next) {
            redrawList(current.id);
            await sleep(ANIMATION_SPEED_MS / 2);
            current = current.next;
        }
        redrawList(current.id);
        await sleep(ANIMATION_SPEED_MS / 2);

        // Link Forward
        current.next = newNode;
        
        // Link Backward (If Doubly)
        if (isDoubly) {
            newNode.prev = current;
            log(`Linked ${current.value} <-> ${newNode.value}`);
        }
        
        log(`Appended ${value} to the end`, 'success');
    }

    listSize++;
    valueInput.value = '';
    redrawList();
}

async function prependNode() {
    const value = valueInput.value;
    if (value === '') return log('Please enter a value', 'error');

    const newNode = new Node(value);
    
    if (head) {
        newNode.next = head;
        if (isDoubly) {
            head.prev = newNode; // Link back
        }
    }
    
    head = newNode;
    listSize++;
    
    log(`Prepended ${value} to the head`, 'success');
    valueInput.value = '';
    redrawList();
}

async function removeValue() {
    const value = valueInput.value;
    if (value === '') return log('Enter value to delete', 'error');
    if (!head) return log('List is empty', 'error');

    // Case 1: Head removal
    if (head.value === value) {
        redrawList(head.id, head.id);
        await sleep(ANIMATION_SPEED_MS);
        
        head = head.next;
        if (head && isDoubly) {
            head.prev = null; // Clear prev pointer of new head
        }
        
        listSize--;
        log(`Deleted Head node ${value}`, 'success');
        redrawList();
        return;
    }

    // Case 2: Search and remove
    let current = head;
    let found = false;

    while (current) {
        redrawList(current.id);
        await sleep(ANIMATION_SPEED_MS);

        if (current.value === value) {
            found = true;
            redrawList(null, current.id);
            await sleep(ANIMATION_SPEED_MS);

            // Logic to remove node
            if (current.next) {
                current.next.prev = current.prev; // Link next back to prev
            }
            if (current.prev) {
                current.prev.next = current.next; // Link prev forward to next
            }
            // (Note: For singly linked, we technically needed a 'prev' var in the loop, 
            // but this generic logic covers both if we track prev manually for singly. 
            // Simplified here: reusing the doubly logic for both or relying on JS logic)
            
            // Re-implementing specific Singly Logic fallback for safety:
            if (!isDoubly) {
                 // Re-find prev for singly list (since we don't have .prev)
                 let temp = head;
                 while(temp.next !== current) temp = temp.next;
                 temp.next = current.next;
            }

            listSize--;
            log(`Removed node ${value}`, 'success');
            break;
        }
        current = current.next;
    }

    if (!found) log(`Value ${value} not found.`, 'error');
    redrawList();
}

async function searchNode() {
    // (Same as before, logic doesn't change for search)
    const value = valueInput.value;
    if (value === '') return log('Enter value to search', 'error');
    if (!head) return log('List is empty', 'error');

    let current = head;
    let index = 0;
    while (current) {
        redrawList(current.id);
        await sleep(ANIMATION_SPEED_MS);
        if (current.value === value) {
            log(`Found ${value} at index ${index}`, 'success');
            redrawList(null, current.id);
            return;
        }
        current = current.next;
        index++;
    }
    log(`Not found`, 'error');
    redrawList();
}

// Init
redrawList();