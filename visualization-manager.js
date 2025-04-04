// Visualization state
const visualizationState = {
    dataArray: null,
    waveformData: null,
    isInitialized: false,
    animationFrameId: null,
    lastFrameTime: 0,
    targetFrameRate: 60,
    barWidth: 0,
    barSpacing: 0,
    barHeights: [],
    barTargetHeights: [],
    barVelocities: [],
    smoothingFactor: 0.3,
    style: 'bars', // bars, circles, particles, lines, wave3d
    particles: [],
    rotation: 0,
    hueRotation: 0
};

// Visualization mode and theme
let visualizationMode = 'spectrum';
let visualizationTheme = 'default';
let previewTheme = 'dark';

// Initialize visualization
function initVisualization() {
    try {
        if (!analyserNode) {
            console.error('Analyser node not initialized');
            return;
        }
        
        // Use smaller FFT size for better performance
        analyserNode.fftSize = 1024;
        
        // Initialize data arrays
        visualizationState.dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        visualizationState.waveformData = new Uint8Array(analyserNode.fftSize);
        
        // Initialize bar arrays with 64 bars
        const numBars = 64;
        visualizationState.barHeights = new Array(numBars).fill(0);
        visualizationState.barTargetHeights = new Array(numBars).fill(0);
        visualizationState.barVelocities = new Array(numBars).fill(0);
        
        // Calculate bar dimensions
        const canvas = uiElements.visualizationCanvas;
        visualizationState.barWidth = canvas.width / numBars;
        visualizationState.barSpacing = visualizationState.barWidth * 0.2;
        
        // Set initialized flag
        visualizationState.isInitialized = true;
        
        console.log('Visualization initialized successfully');
    } catch (error) {
        console.error('Error initializing visualization:', error);
    }
}

// Start visualization
function startVisualization() {
    try {
        if (!visualizationState.isInitialized) {
            initVisualization();
        }
        
        // Stop any existing animation
        if (visualizationState.animationFrameId) {
            cancelAnimationFrame(visualizationState.animationFrameId);
        }
        
        // Animation loop
        function animate(timestamp) {
            // Control frame rate
            if (!visualizationState.lastFrameTime || 
                timestamp - visualizationState.lastFrameTime >= 1000 / visualizationState.targetFrameRate) {
                drawVisualization();
                visualizationState.lastFrameTime = timestamp;
            }
            
            visualizationState.animationFrameId = requestAnimationFrame(animate);
        }
        
        animate();
    } catch (error) {
        console.error('Error starting visualization:', error);
    }
}

// Stop visualization
function stopVisualization() {
    try {
        if (visualizationState.animationFrameId) {
            cancelAnimationFrame(visualizationState.animationFrameId);
            visualizationState.animationFrameId = null;
        }
        
        // Clear canvas
        const canvas = uiElements.visualizationCanvas;
        const ctx = uiElements.visualizationContext;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } catch (error) {
        console.error('Error stopping visualization:', error);
    }
}

// Draw visualization
function drawVisualization() {
    try {
        const canvas = uiElements.visualizationCanvas;
        const ctx = uiElements.visualizationContext;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (visualizationMode === 'spectrum') {
            switch (visualizationState.style) {
                case 'circles':
                    drawCircleSpectrum();
                    break;
                case 'particles':
                    drawParticleSpectrum();
                    break;
                case 'lines':
                    drawLineSpectrum();
                    break;
                default:
                    drawBarSpectrum();
            }
        } else {
            drawWaveform();
        }
    } catch (error) {
        console.error('Error drawing visualization:', error);
    }
}

// Draw bar spectrum visualization
function drawBarSpectrum() {
    try {
        const canvas = uiElements.visualizationCanvas;
        const ctx = uiElements.visualizationContext;
        
        // Get frequency data
        analyserNode.getByteFrequencyData(visualizationState.dataArray);
        
        // Sample fewer points for better performance
        const step = Math.ceil(visualizationState.dataArray.length / visualizationState.barHeights.length);
        
        // Update target heights with bass emphasis
        for (let i = 0; i < visualizationState.barHeights.length; i++) {
            let sum = 0;
            for (let j = 0; j < step; j++) {
                const value = visualizationState.dataArray[i * step + j] || 0;
                // Apply bass emphasis to lower frequencies
                const emphasis = i < 8 ? 1.5 : 1;
                sum += value * emphasis;
            }
            const value = sum / step;
            visualizationState.barTargetHeights[i] = (value / 255) * canvas.height * 0.8;
        }
        
        // Animate bars with spring physics
        const springStrength = 0.3;
        const damping = 0.7;
        
        for (let i = 0; i < visualizationState.barHeights.length; i++) {
            const targetHeight = visualizationState.barTargetHeights[i];
            const currentHeight = visualizationState.barHeights[i];
            const velocity = visualizationState.barVelocities[i];
            
            // Spring physics
            const force = (targetHeight - currentHeight) * springStrength;
            visualizationState.barVelocities[i] = velocity * damping + force;
            visualizationState.barHeights[i] += visualizationState.barVelocities[i];
            
            // Draw bar with enhanced styling
            const x = i * visualizationState.barWidth;
            const y = canvas.height - visualizationState.barHeights[i];
            const width = visualizationState.barWidth - visualizationState.barSpacing;
            const height = visualizationState.barHeights[i];
            
            // Create gradient
            const gradient = ctx.createLinearGradient(x, y, x, canvas.height);
            const color = getVisualizationColor(height / canvas.height);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            // Draw bar
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, width, height);
        }
    } catch (error) {
        console.error('Error drawing bar spectrum:', error);
    }
}

// Draw circle spectrum visualization
function drawCircleSpectrum() {
    try {
        const canvas = uiElements.visualizationCanvas;
        const ctx = uiElements.visualizationContext;
        
        analyserNode.getByteFrequencyData(visualizationState.dataArray);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8;
        
        for (let i = 0; i < visualizationState.barHeights.length; i++) {
            const angle = (i / visualizationState.barHeights.length) * Math.PI * 2;
            const value = visualizationState.dataArray[i * 2] / 255;
            
            const x = centerX + Math.cos(angle) * radius * value;
            const y = centerY + Math.sin(angle) * radius * value;
            
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = getVisualizationColor(value);
            ctx.fill();
            
            if (i > 0) {
                ctx.beginPath();
                ctx.moveTo(prevX, prevY);
                ctx.lineTo(x, y);
                ctx.strokeStyle = getVisualizationColor(value * 0.5);
                ctx.stroke();
            }
            
            const prevX = x;
            const prevY = y;
        }
    } catch (error) {
        console.error('Error drawing circle spectrum:', error);
    }
}

// Draw particle spectrum visualization
function drawParticleSpectrum() {
    try {
        const canvas = uiElements.visualizationCanvas;
        const ctx = uiElements.visualizationContext;
        
        analyserNode.getByteFrequencyData(visualizationState.dataArray);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Update rotation
        visualizationState.rotation += 0.01;
        visualizationState.hueRotation = (visualizationState.hueRotation + 0.5) % 360;
        
        // Clear with fade effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < visualizationState.barHeights.length; i++) {
            const value = visualizationState.dataArray[i * 2] / 255;
            const angle = (i / visualizationState.barHeights.length) * Math.PI * 2 + visualizationState.rotation;
            const distance = value * Math.min(canvas.width, canvas.height) * 0.4;
            
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            const size = value * 20;
            
            // Create particle trail effect
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            const baseColor = getVisualizationColor(value);
            const hue = (visualizationState.hueRotation + i * 360 / visualizationState.barHeights.length) % 360;
            const color = `hsla(${hue}, 100%, 50%, ${value})`;
            
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.5, baseColor);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Add connecting lines
            if (i > 0) {
                const prevAngle = ((i - 1) / visualizationState.barHeights.length) * Math.PI * 2 + visualizationState.rotation;
                const prevDistance = (visualizationState.dataArray[(i - 1) * 2] / 255) * Math.min(canvas.width, canvas.height) * 0.4;
                const prevX = centerX + Math.cos(prevAngle) * prevDistance;
                const prevY = centerY + Math.sin(prevAngle) * prevDistance;
                
                ctx.beginPath();
                ctx.moveTo(prevX, prevY);
                ctx.lineTo(x, y);
                ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.3)`;
                ctx.lineWidth = value * 3;
                ctx.stroke();
            }
        }
    } catch (error) {
        console.error('Error drawing particle spectrum:', error);
    }
}

// Draw line spectrum visualization
function drawLineSpectrum() {
    try {
        const canvas = uiElements.visualizationCanvas;
        const ctx = uiElements.visualizationContext;
        
        analyserNode.getByteFrequencyData(visualizationState.dataArray);
        
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        
        for (let i = 0; i < visualizationState.barHeights.length; i++) {
            const x = (i / visualizationState.barHeights.length) * canvas.width;
            const value = visualizationState.dataArray[i * 2] / 255;
            const y = canvas.height - (value * canvas.height * 0.8);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.lineTo(canvas.width, canvas.height);
        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, getVisualizationColor(1));
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.strokeStyle = getVisualizationColor(1);
        ctx.lineWidth = 2;
        ctx.stroke();
    } catch (error) {
        console.error('Error drawing line spectrum:', error);
    }
}

// Draw waveform visualization
function drawWaveform() {
    try {
        const canvas = uiElements.visualizationCanvas;
        const ctx = uiElements.visualizationContext;
        
        // Get time domain data
        analyserNode.getByteTimeDomainData(visualizationState.waveformData);
        
        // Draw waveform
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = getVisualizationColor(1);
        
        // Create gradient for waveform
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, getVisualizationColor(0.2));
        gradient.addColorStop(0.5, getVisualizationColor(1));
        gradient.addColorStop(1, getVisualizationColor(0.2));
        
        ctx.strokeStyle = gradient;
        
        for (let i = 0; i < visualizationState.waveformData.length; i++) {
            const value = visualizationState.waveformData[i] / 255;
            const x = (i / visualizationState.waveformData.length) * canvas.width;
            const y = value * canvas.height;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = getVisualizationColor(1);
        ctx.stroke();
        ctx.shadowBlur = 0;
    } catch (error) {
        console.error('Error drawing waveform:', error);
    }
}

// Update progress bar
function updateProgress() {
    try {
        if (!audioBuffer || !isPlaying) return;
        
        const currentTime = audioContext.currentTime - startTime;
        const progress = (currentTime / audioBuffer.duration) * 100;
        
        if (progress <= 100) {
            uiElements.progressBar.value = progress;
            uiElements.timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(audioBuffer.duration)}`;
            requestAnimationFrame(updateProgress);
        } else {
            stopAudio();
        }
    } catch (error) {
        console.error('Error updating progress:', error);
    }
}

// Toggle visualization mode
function toggleVisualizationMode() {
    try {
        visualizationMode = visualizationMode === 'spectrum' ? 'waveform' : 'spectrum';
        uiElements.toggleVisualization.textContent = `Switch to ${visualizationMode === 'spectrum' ? 'Waveform' : 'Spectrum'}`;
        
        if (isPlaying) {
            startVisualization();
        }
    } catch (error) {
        console.error('Error toggling visualization mode:', error);
    }
}

// Handle progress bar click
function handleProgressClick(e) {
    try {
        if (!audioBuffer) return;
        
        const rect = uiElements.progressBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const time = audioBuffer.duration * percentage;
        
        if (audioSource) {
            audioSource.stop();
            audioSource = null;
        }
        
        if (isPlaying) {
            audioSource = audioContext.createBufferSource();
            audioSource.buffer = audioBuffer;
            audioSource.connect(bassFilter);
            audioSource.start(0, time);
            startTime = audioContext.currentTime - time;
        } else {
            pausedTime = time;
        }
        
        uiElements.progressBar.value = percentage * 100;
        uiElements.timeDisplay.textContent = `${formatTime(time)} / ${formatTime(audioBuffer.duration)}`;
    } catch (error) {
        console.error('Error handling progress click:', error);
    }
}

// Get visualization color based on theme and value
function getVisualizationColor(value) {
    try {
        const theme = document.body.getAttribute('data-theme') || 'dark';
        
        switch (theme) {
            case 'light':
                return `hsla(210, 100%, 50%, ${value})`;
            case 'ocean':
                return `hsla(200, 100%, 50%, ${value})`;
            case 'sunset':
                return `hsla(0, 100%, 60%, ${value})`;
            case 'forest':
                return `hsla(120, 100%, 40%, ${value})`;
            default: // dark theme
                return `hsla(195, 100%, 50%, ${value})`;
        }
    } catch (error) {
        console.error('Error getting visualization color:', error);
        return `rgba(0, 168, 255, ${value})`; // fallback color
    }
}

// Update visualization colors
function updateVisualizationColors() {
    if (isPlaying) {
        // Force a redraw of the visualization
        drawVisualization();
    }
}

// Show theme preview
function showThemePreview(theme) {
    try {
        previewTheme = theme;
        uiElements.themePreviewBody.setAttribute('data-theme', theme);
        uiElements.themePreview.classList.add('show');
    } catch (error) {
        console.error('Error showing theme preview:', error);
    }
}

// Toggle visualization style
function toggleVisualizationStyle() {
    try {
        const styles = ['bars', 'circles', 'particles', 'lines'];
        const currentIndex = styles.indexOf(visualizationState.style);
        const nextIndex = (currentIndex + 1) % styles.length;
        visualizationState.style = styles[nextIndex];
        
        // Update button text
        uiElements.toggleStyle.innerHTML = `
            <span class="icon">🎨</span>
            Style: ${visualizationState.style}
        `;
        
        // Reinitialize visualization if needed
        if (isPlaying) {
            startVisualization();
        }
    } catch (error) {
        console.error('Error toggling visualization style:', error);
    }
} 