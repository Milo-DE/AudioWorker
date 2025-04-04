// UI Elements
const uiElements = {
    // File upload elements
    uploadSection: document.getElementById('uploadSection'),
    fileInput: document.getElementById('fileInput'),
    uploadButton: document.getElementById('uploadButton'),
    fileInfo: document.getElementById('fileInfo'),
    
    // Visualization elements
    visualizationCanvas: document.getElementById('visualizationCanvas'),
    visualizationContext: document.getElementById('visualizationCanvas').getContext('2d'),
    toggleVisualization: document.getElementById('toggleVisualization'),
    toggleStyle: document.getElementById('toggleStyle'),
    
    // Control elements
    playButton: document.getElementById('playButton'),
    pauseButton: document.getElementById('pauseButton'),
    stopButton: document.getElementById('stopButton'),
    downloadButton: document.getElementById('downloadButton'),
    
    // Slider elements
    bassSlider: document.getElementById('bassSlider'),
    extremeBassSlider: document.getElementById('extremeBassSlider'),
    midSlider: document.getElementById('midSlider'),
    trebleSlider: document.getElementById('trebleSlider'),
    playbackSpeed: document.getElementById('playbackSpeed'),
    progressBar: document.getElementById('progressBar'),
    
    // Display elements
    bassValue: document.getElementById('bassValue'),
    extremeBassValue: document.getElementById('extremeBassValue'),
    midValue: document.getElementById('midValue'),
    trebleValue: document.getElementById('trebleValue'),
    playbackSpeedValue: document.getElementById('playbackSpeedValue'),
    timeDisplay: document.getElementById('timeDisplay'),
    
    // Theme elements
    themeSelector: document.getElementById('themeSelector'),
    themePreview: document.getElementById('themePreview'),
    themePreviewBody: document.getElementById('themePreviewBody'),
    themePreviewButton: document.getElementById('themePreviewButton'),
    
    // Other elements
    loading: document.getElementById('loading'),
    toast: document.getElementById('toast')
};

// Initialize UI elements
function initUIElements() {
    try {
        // Set up canvas size
        initCanvas();
        
        // Add event listeners
        window.addEventListener('resize', initCanvas);
        
        // File upload events
        uiElements.uploadButton.addEventListener('click', () => uiElements.fileInput.click());
        uiElements.fileInput.addEventListener('change', handleFileSelect);
        uiElements.uploadSection.addEventListener('dragover', handleDragOver);
        uiElements.uploadSection.addEventListener('drop', handleDrop);
        
        // Playback control events
        uiElements.playButton.addEventListener('click', playAudio);
        uiElements.pauseButton.addEventListener('click', pauseAudio);
        uiElements.stopButton.addEventListener('click', stopAudio);
        uiElements.downloadButton.addEventListener('click', downloadAudio);
        
        // Slider events
        uiElements.bassSlider.addEventListener('input', updateSliderValue);
        uiElements.extremeBassSlider.addEventListener('input', updateSliderValue);
        uiElements.midSlider.addEventListener('input', updateSliderValue);
        uiElements.trebleSlider.addEventListener('input', updateSliderValue);
        uiElements.playbackSpeed.addEventListener('input', updatePlaybackSpeed);
        uiElements.progressBar.addEventListener('input', handleProgressClick);
        
        // Visualization events
        uiElements.toggleVisualization.addEventListener('click', toggleVisualizationMode);
        uiElements.toggleStyle.addEventListener('click', toggleVisualizationStyle);
        
        // Theme events
        uiElements.themeSelector.addEventListener('change', handleThemeChange);
        uiElements.themePreviewButton.addEventListener('click', applyTheme);
        
        // Close theme preview when clicking outside
        document.addEventListener('click', (e) => {
            if (uiElements.themePreview.classList.contains('show') && 
                !uiElements.themePreview.contains(e.target) && 
                e.target !== uiElements.themeSelector) {
                uiElements.themePreview.classList.remove('show');
            }
        });
        
        // Initialize theme
        initTheme();
        
        // Set initial visualization style
        visualizationState.style = 'bars';
        if (uiElements.toggleStyle) {
            uiElements.toggleStyle.innerHTML = `
                <span class="icon">🎨</span>
                Style: bars
            `;
        }
        
        console.log('UI elements initialized successfully');
    } catch (error) {
        console.error('Error initializing UI elements:', error);
    }
}

// Handle file selection
function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    uiElements.uploadSection.classList.add('dragover');
}

// Handle drop
function handleDrop(e) {
    e.preventDefault();
    uiElements.uploadSection.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0]);
    }
}

// Update slider values
function updateSliderValue(e) {
    const slider = e.target;
    const type = slider.id.replace('Slider', '').toLowerCase();
    const value = parseFloat(slider.value);
    const displayElement = document.getElementById(`${type}Value`);
    
    if (displayElement) {
        displayElement.textContent = `${value} dB`;
    }

    // Update audio filters if audio context is running
    if (audioContext && audioContext.state === 'running') {
        updateAudioFilters();
    }
}

// Update playback speed
function updatePlaybackSpeed(e) {
    const speed = parseFloat(e.target.value);
    if (audioSource) {
        audioSource.playbackRate.value = speed;
    }
    uiElements.playbackSpeedValue.textContent = `${speed}x`;
}

// Handle theme change
function handleThemeChange(e) {
    const theme = e.target.value;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('selectedTheme', theme);
    updateVisualizationColors();
}

// Apply saved theme on load
function initTheme() {
    const savedTheme = localStorage.getItem('selectedTheme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    uiElements.themeSelector.value = savedTheme;
}

// Apply theme
function applyTheme() {
    const theme = uiElements.themeSelector.value;
    document.body.setAttribute('data-theme', theme);
    uiElements.themePreview.classList.remove('show');
    updateVisualizationColors();
}

// Initialize canvas
function initCanvas() {
    try {
        const canvas = uiElements.visualizationCanvas;
        const container = canvas.parentElement;
        
        // Set canvas size
        canvas.width = container.clientWidth;
        canvas.height = 300; // Fixed height for better visualization
        
        // Set high DPI if available
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        
        // Set canvas style dimensions
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        
        // Reinitialize visualization if needed
        if (visualizationState && visualizationState.isInitialized) {
            // Recalculate bar dimensions
            const numBars = 64;
            visualizationState.barWidth = canvas.width / numBars;
            visualizationState.barSpacing = visualizationState.barWidth * 0.2;
        }
    } catch (error) {
        console.error('Error initializing canvas:', error);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    try {
        initUIElements();
        initAudioContext();
        setTheme('dark');
        updateVisualizationColors();
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}); 