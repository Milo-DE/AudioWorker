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
        uiElements.uploadButton.addEventListener('click', handleUploadClick);
        uiElements.uploadButton.addEventListener('touchend', handleUploadClick);
        uiElements.fileInput.addEventListener('change', handleFileSelect);
        uiElements.uploadSection.addEventListener('dragover', handleDragOver);
        uiElements.uploadSection.addEventListener('drop', handleDrop);
        
        // Add touch events for mobile
        uiElements.uploadSection.addEventListener('touchstart', handleTouchStart);
        uiElements.uploadSection.addEventListener('touchend', handleTouchEnd);
        
        // Playback control events with touch handling
        addTouchEventListener(uiElements.playButton, playAudio);
        addTouchEventListener(uiElements.pauseButton, pauseAudio);
        addTouchEventListener(uiElements.stopButton, stopAudio);
        addTouchEventListener(uiElements.downloadButton, downloadAudio);
        
        // Slider events with touch handling
        addSliderTouchEvents(uiElements.bassSlider);
        addSliderTouchEvents(uiElements.extremeBassSlider);
        addSliderTouchEvents(uiElements.midSlider);
        addSliderTouchEvents(uiElements.trebleSlider);
        addSliderTouchEvents(uiElements.playbackSpeed);
        addSliderTouchEvents(uiElements.progressBar);
        
        // Visualization events
        addTouchEventListener(uiElements.toggleVisualization, toggleVisualizationMode);
        addTouchEventListener(uiElements.toggleStyle, toggleVisualizationStyle);
        
        // Theme events
        uiElements.themeSelector.addEventListener('change', handleThemeChange);
        addTouchEventListener(uiElements.themePreviewButton, applyTheme);
        
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

// Helper function to add touch event listeners
function addTouchEventListener(element, handler) {
    if (!element) return;
    
    element.addEventListener('touchstart', (e) => {
        e.preventDefault();
        element.classList.add('active');
    });
    
    element.addEventListener('touchend', (e) => {
        e.preventDefault();
        element.classList.remove('active');
        handler(e);
    });
    
    // Keep click for desktop
    element.addEventListener('click', handler);
}

// Add touch events for sliders
function addSliderTouchEvents(slider) {
    if (!slider) return;
    
    // Add input event listener for both touch and mouse
    slider.addEventListener('input', updateSliderValue);
    
    let touchStartY;
    let startValue;
    
    slider.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        touchStartY = e.touches[0].clientY;
        startValue = parseFloat(slider.value);
        // Update display immediately on touch start
        updateSliderValue({ target: slider });
    });
    
    slider.addEventListener('touchmove', (e) => {
        e.stopPropagation();
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        const range = slider.max - slider.min;
        const step = parseFloat(slider.step) || 1;
        
        // Adjust sensitivity based on range
        const sensitivity = range / 200;
        const newValue = startValue + (deltaY * sensitivity);
        
        // Clamp value to min/max
        const clampedValue = Math.max(slider.min, Math.min(slider.max, newValue));
        // Round to nearest step
        slider.value = Math.round(clampedValue / step) * step;
        
        // Update display and audio
        updateSliderValue({ target: slider });
    });
}

// Handle upload button click
function handleUploadClick(e) {
    e.preventDefault();
    e.stopPropagation();
    uiElements.fileInput.click();
}

// Handle file selection
function handleFileSelect(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('audio/')) {
            handleFileUpload(file);
        } else {
            showToast('Please select an audio file');
        }
    }
}

// Handle touch start for upload section
function handleTouchStart(e) {
    e.preventDefault();
    e.stopPropagation();
    uiElements.uploadSection.classList.add('dragover');
}

// Handle touch end for upload section
function handleTouchEnd(e) {
    e.preventDefault();
    e.stopPropagation();
    uiElements.uploadSection.classList.remove('dragover');
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
    
    // Update display value with proper formatting
    if (displayElement) {
        if (type === 'playbackspeed') {
            displayElement.textContent = `${value}x`;
        } else {
            // Show + sign for positive values
            const sign = value > 0 ? '+' : '';
            displayElement.textContent = `${sign}${value} dB`;
        }
    }

    // Update audio based on slider type
    if (type === 'playbackspeed') {
        if (audioSource) {
            audioSource.playbackRate.value = value;
        }
    } else {
        // Call the audio manager's update function directly
        if (typeof window.updateAudioFilters === 'function') {
            window.updateAudioFilters(type, value);
        } else {
            console.error('Audio filter update function not found');
        }
    }

    // Add visual feedback for the slider
    const percent = ((value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.setProperty('--slider-percent', `${percent}%`);
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