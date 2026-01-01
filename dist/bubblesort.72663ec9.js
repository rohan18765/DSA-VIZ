// bubblesort.js
// --- DOM Elements ---
const arrayContainer = document.getElementById('array-container');
const generateBtn = document.getElementById('generate-btn');
const sortBtn = document.getElementById('sort-btn');
const speedSlider = document.getElementById('speed-slider');
// --- Configuration ---
let array = [];
let numBars = 30; // How many bars to show
// Delay determines speed. Lower value = faster. Read from slider initially.
// Slider value is reversed in HTML (left is fast/low delay, right is slow/high delay)
let delay = 600 - parseInt(speedSlider.value);
// --- Helper Functions ---
// 1. Function to generate a random integer within a range
function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
// 2. Sleep function to create pauses for animation
// This returns a Promise that resolves after 'ms' milliseconds.
function sleep(ms) {
    return new Promise((resolve)=>setTimeout(resolve, ms));
}
// 3. Function to generate a new random array and render it
function createNewArray() {
    array = [];
    // Clear previous bars from the UI
    arrayContainer.innerHTML = '';
    for(let i = 0; i < numBars; i++)// Generate random height between 20 and 400 px
    array.push(randomIntFromInterval(50, 400));
    renderArrayToDOM();
}
// 4. Function to draw the array as bars on the screen
function renderArrayToDOM() {
    arrayContainer.innerHTML = ''; // Clear current view
    for(let i = 0; i < array.length; i++){
        const bar = document.createElement('div');
        bar.style.height = `${array[i]}px`;
        // Tailwind classes for styling the bar
        bar.classList.add('bg-blue-500', 'w-4', 'rounded-t-md', 'bar-item');
        // Add data-value for potential future use or debugging
        bar.dataset.value = array[i];
        arrayContainer.appendChild(bar);
    }
}
// 5. Helper to enable/disable buttons during sorting
function setSortingState(isSorting) {
    generateBtn.disabled = isSorting;
    sortBtn.disabled = isSorting;
    // Add/remove opacity classes to visually indicate disabled state
    if (isSorting) {
        generateBtn.classList.add('opacity-50', 'cursor-not-allowed');
        sortBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        generateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        sortBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}
// --- The Core Bubble Sort Algorithm Visualization ---
async function runBubbleSort() {
    setSortingState(true); // Disable buttons
    const bars = document.getElementsByClassName('bar-item');
    let n = array.length;
    // Outer loop for passes
    for(let i = 0; i < n - 1; i++){
        // Inner loop for comparisons
        // Last i elements are already in place
        for(let j = 0; j < n - i - 1; j++){
            // Color used to highlight elements being compared (e.g., Red/Orange)
            const compareColor = 'bg-orange-500';
            // Color used to show default state (Blue)
            const defaultColor = 'bg-blue-500';
            // Color used to show sorted state (Green)
            const sortedColor = 'bg-green-500';
            // 1. Highlight elements being compared
            bars[j].classList.remove(defaultColor);
            bars[j].classList.add(compareColor);
            bars[j + 1].classList.remove(defaultColor);
            bars[j + 1].classList.add(compareColor);
            // Wait for animation frame
            await sleep(delay);
            // 2. Compare and Swap if necessary
            if (array[j] > array[j + 1]) {
                // Swap in JS array
                let temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
                // Swap their heights in the DOM visually
                bars[j].style.height = `${array[j]}px`;
                bars[j + 1].style.height = `${array[j + 1]}px`;
                // Wait extra moment to visualize swap before un-highlighting
                await sleep(delay / 2);
            }
            // 3. Un-highlight (change back to default color)
            bars[j].classList.remove(compareColor);
            bars[j].classList.add(defaultColor);
            bars[j + 1].classList.remove(compareColor);
            bars[j + 1].classList.add(defaultColor);
        }
        // Mark the element placed at the end of this pass as Sorted (Green)
        bars[n - i - 1].classList.remove('bg-blue-500');
        bars[n - i - 1].classList.add('bg-green-500');
    }
    // Mark the very first element as sorted at the end
    bars[0].classList.remove('bg-blue-500');
    bars[0].classList.add('bg-green-500');
    setSortingState(false); // Re-enable buttons
}
// --- Event Listeners ---
generateBtn.addEventListener('click', createNewArray);
sortBtn.addEventListener('click', runBubbleSort);
// Update speed dynamically when slider moves
speedSlider.addEventListener('input', (e)=>{
    // Invert slider value so higher slider value = lower delay (faster)
    // Slider is 10-500. Delay becomes 590 down to 100.
    delay = 600 - parseInt(e.target.value);
    console.log("Current delay:", delay + "ms");
});
// --- Initial Load ---
// Create an array immediately when the page loads
createNewArray();

//# sourceMappingURL=bubblesort.72663ec9.js.map
