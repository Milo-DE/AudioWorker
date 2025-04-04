// Audio context and nodes
let audioContext;
let audioSource;
let gainNode;
let analyserNode;
let bassFilter;
let extremeBassFilter;
let midFilter;
let trebleFilter;
let compressor;

// Audio state
let audioBuffer;
let isPlaying = false;
let startTime = 0;
let pausedTime = 0;

// Initialize audio context
function initAudioContext() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create audio nodes
        gainNode = audioContext.createGain();
        analyserNode = audioContext.createAnalyser();
        bassFilter = audioContext.createBiquadFilter();
        extremeBassFilter = audioContext.createBiquadFilter();
        midFilter = audioContext.createBiquadFilter();
        trebleFilter = audioContext.createBiquadFilter();
        compressor = audioContext.createDynamicsCompressor();
        
        // Configure analyser
        analyserNode.fftSize = 2048;
        analyserNode.smoothingTimeConstant = 0.85;
        
        // Configure filters
        bassFilter.type = 'lowshelf';
        bassFilter.frequency.value = 100;
        
        extremeBassFilter.type = 'lowshelf';
        extremeBassFilter.frequency.value = 60;
        
        midFilter.type = 'peaking';
        midFilter.frequency.value = 1000;
        midFilter.Q.value = 1;
        
        trebleFilter.type = 'highshelf';
        trebleFilter.frequency.value = 3000;
        
        // Configure compressor
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        
        // Connect nodes
        gainNode.connect(bassFilter);
        bassFilter.connect(extremeBassFilter);
        extremeBassFilter.connect(midFilter);
        midFilter.connect(trebleFilter);
        trebleFilter.connect(compressor);
        compressor.connect(analyserNode);
        analyserNode.connect(audioContext.destination);
        
        console.log('Audio context initialized successfully');
    } catch (error) {
        console.error('Error initializing audio context:', error);
        showToast('Error initializing audio: ' + error.message);
    }
}

// Handle file upload
function handleFileUpload(file) {
    try {
        showLoading(true);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                // Decode audio data
                const arrayBuffer = e.target.result;
                audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                // Reset audio state
                if (audioSource) {
                    audioSource.stop();
                }
                isPlaying = false;
                startTime = 0;
                pausedTime = 0;
                
                // Initialize audio nodes
                initAudioNodes();
                
                // Update UI
                uiElements.fileInfo.textContent = `File: ${file.name}`;
                uiElements.playButton.disabled = false;
                uiElements.downloadButton.disabled = false;
                uiElements.timeDisplay.textContent = `0:00 / ${formatTime(audioBuffer.duration)}`;
                
                showLoading(false);
                showToast('File loaded successfully!');
            } catch (error) {
                console.error('Error decoding audio data:', error);
                showToast('Error loading audio file: ' + error.message);
                showLoading(false);
            }
        };
        
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            showToast('Error reading file: ' + error.message);
            showLoading(false);
        };
        
        reader.readAsArrayBuffer(file);
    } catch (error) {
        console.error('Error handling file upload:', error);
        showToast('Error handling file: ' + error.message);
        showLoading(false);
    }
}

// Initialize audio nodes
function initAudioNodes() {
    try {
        // Create and configure filters if they don't exist
        if (!bassFilter) {
            bassFilter = audioContext.createBiquadFilter();
            bassFilter.type = 'lowshelf';
            bassFilter.frequency.value = 100;
        }
        
        if (!extremeBassFilter) {
            extremeBassFilter = audioContext.createBiquadFilter();
            extremeBassFilter.type = 'lowshelf';
            extremeBassFilter.frequency.value = 60;
        }
        
        if (!midFilter) {
            midFilter = audioContext.createBiquadFilter();
            midFilter.type = 'peaking';
            midFilter.frequency.value = 1000;
            midFilter.Q.value = 1;
        }
        
        if (!trebleFilter) {
            trebleFilter = audioContext.createBiquadFilter();
            trebleFilter.type = 'highshelf';
            trebleFilter.frequency.value = 3000;
        }
        
        if (!compressor) {
            compressor = audioContext.createDynamicsCompressor();
            compressor.threshold.value = -24;
            compressor.knee.value = 30;
            compressor.ratio.value = 12;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.25;
        }
        
        // Apply current slider values
        const bassValue = parseFloat(uiElements.bassSlider.value);
        const extremeBassValue = parseFloat(uiElements.extremeBassSlider.value);
        const midValue = parseFloat(uiElements.midSlider.value);
        const trebleValue = parseFloat(uiElements.trebleSlider.value);
        
        bassFilter.gain.value = bassValue * 2;
        extremeBassFilter.gain.value = extremeBassValue * 2;
        midFilter.gain.value = midValue;
        trebleFilter.gain.value = trebleValue;
        
        // Adjust compressor based on bass level
        if (bassValue > 20) {
            compressor.threshold.value = -30;
            compressor.ratio.value = 16;
        } else if (bassValue > 10) {
            compressor.threshold.value = -24;
            compressor.ratio.value = 12;
        } else {
            compressor.threshold.value = -20;
            compressor.ratio.value = 8;
        }
        
        console.log('Audio nodes initialized successfully');
    } catch (error) {
        console.error('Error initializing audio nodes:', error);
    }
}

// Play audio
function playAudio() {
    try {
        if (!audioBuffer) return;
        
        if (!isPlaying) {
            if (audioSource) {
                audioSource.stop();
            }
            
            audioSource = audioContext.createBufferSource();
            audioSource.buffer = audioBuffer;
            audioSource.connect(gainNode);
            
            if (pausedTime > 0) {
                audioSource.start(0, pausedTime);
                startTime = audioContext.currentTime - pausedTime;
            } else {
                audioSource.start(0);
                startTime = audioContext.currentTime;
            }
            
            isPlaying = true;
            uiElements.playButton.disabled = true;
            uiElements.pauseButton.disabled = false;
            uiElements.stopButton.disabled = false;
            
            startVisualization();
            updateProgress();
        }
    } catch (error) {
        console.error('Error playing audio:', error);
        showToast('Error playing audio: ' + error.message);
    }
}

// Pause audio
function pauseAudio() {
    try {
        if (isPlaying && audioSource) {
            audioSource.stop();
            pausedTime = audioContext.currentTime - startTime;
            isPlaying = false;
            
            uiElements.playButton.disabled = false;
            uiElements.pauseButton.disabled = true;
            
            stopVisualization();
        }
    } catch (error) {
        console.error('Error pausing audio:', error);
        showToast('Error pausing audio: ' + error.message);
    }
}

// Stop audio
function stopAudio() {
    try {
        if (audioSource) {
            audioSource.stop();
        }
        
        isPlaying = false;
        startTime = 0;
        pausedTime = 0;
        
        uiElements.playButton.disabled = false;
        uiElements.pauseButton.disabled = true;
        uiElements.stopButton.disabled = true;
        uiElements.progressBar.value = 0;
        uiElements.timeDisplay.textContent = '0:00 / 0:00';
        
        stopVisualization();
    } catch (error) {
        console.error('Error stopping audio:', error);
        showToast('Error stopping audio: ' + error.message);
    }
}

// Download audio
function downloadAudio() {
    try {
        if (!audioBuffer) return;
        
        showLoading(true);
        
        // Create offline audio context
        const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
        );
        
        // Create source and nodes
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        
        const offlineGain = offlineContext.createGain();
        const offlineBass = offlineContext.createBiquadFilter();
        const offlineExtremeBass = offlineContext.createBiquadFilter();
        const offlineMid = offlineContext.createBiquadFilter();
        const offlineTreble = offlineContext.createBiquadFilter();
        const offlineCompressor = offlineContext.createDynamicsCompressor();
        
        // Configure filters
        offlineBass.type = 'lowshelf';
        offlineBass.frequency.value = bassFilter.frequency.value;
        offlineBass.gain.value = bassFilter.gain.value;
        
        offlineExtremeBass.type = 'lowshelf';
        offlineExtremeBass.frequency.value = extremeBassFilter.frequency.value;
        offlineExtremeBass.gain.value = extremeBassFilter.gain.value;
        
        offlineMid.type = 'peaking';
        offlineMid.frequency.value = midFilter.frequency.value;
        offlineMid.Q.value = midFilter.Q.value;
        offlineMid.gain.value = midFilter.gain.value;
        
        offlineTreble.type = 'highshelf';
        offlineTreble.frequency.value = trebleFilter.frequency.value;
        offlineTreble.gain.value = trebleFilter.gain.value;
        
        // Configure compressor
        offlineCompressor.threshold.value = compressor.threshold.value;
        offlineCompressor.knee.value = compressor.knee.value;
        offlineCompressor.ratio.value = compressor.ratio.value;
        offlineCompressor.attack.value = compressor.attack.value;
        offlineCompressor.release.value = compressor.release.value;
        
        // Connect nodes
        source.connect(offlineGain);
        offlineGain.connect(offlineBass);
        offlineBass.connect(offlineExtremeBass);
        offlineExtremeBass.connect(offlineMid);
        offlineMid.connect(offlineTreble);
        offlineTreble.connect(offlineCompressor);
        offlineCompressor.connect(offlineContext.destination);
        
        // Render audio
        source.start(0);
        offlineContext.startRendering().then(renderedBuffer => {
            // Convert to WAV
            const wav = audioBufferToWav(renderedBuffer);
            
            // Create download link
            const blob = new Blob([wav], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'processed_audio.wav';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showLoading(false);
            showToast('Audio downloaded successfully');
        }).catch(error => {
            console.error('Error rendering audio:', error);
            showToast('Error downloading audio: ' + error.message);
            showLoading(false);
        });
    } catch (error) {
        console.error('Error downloading audio:', error);
        showToast('Error downloading audio: ' + error.message);
        showLoading(false);
    }
}

// Update audio filters
window.updateAudioFilters = function(type, value) {
    try {
        if (!audioContext || audioContext.state !== 'running') {
            console.warn('Audio context not ready');
            return;
        }

        const now = audioContext.currentTime;

        switch (type) {
            case 'bass':
                if (bassFilter) {
                    bassFilter.gain.setValueAtTime(value, now);
                }
                break;
            case 'extremebass':
                if (extremeBassFilter) {
                    extremeBassFilter.gain.setValueAtTime(value, now);
                }
                break;
            case 'mid':
                if (midFilter) {
                    midFilter.gain.setValueAtTime(value, now);
                }
                break;
            case 'treble':
                if (trebleFilter) {
                    trebleFilter.gain.setValueAtTime(value, now);
                }
                break;
        }

        // Update compressor based on bass levels
        if (compressor && (type === 'bass' || type === 'extremebass')) {
            const bassValue = parseFloat(document.getElementById('bassSlider').value);
            const extremeBassValue = parseFloat(document.getElementById('extremeBassSlider').value);
            const totalBass = bassValue + extremeBassValue;

            if (totalBass > 30) {
                compressor.threshold.setValueAtTime(-36, now);
                compressor.ratio.setValueAtTime(20, now);
                compressor.knee.setValueAtTime(40, now);
            } else if (totalBass > 15) {
                compressor.threshold.setValueAtTime(-30, now);
                compressor.ratio.setValueAtTime(16, now);
                compressor.knee.setValueAtTime(30, now);
            } else {
                compressor.threshold.setValueAtTime(-24, now);
                compressor.ratio.setValueAtTime(12, now);
                compressor.knee.setValueAtTime(20, now);
            }
        }

        console.log(`Updated ${type} filter to ${value}dB`);
    } catch (error) {
        console.error('Error updating audio filters:', error);
    }
};

// Utility functions
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function showLoading(show) {
    uiElements.loading.style.display = show ? 'flex' : 'none';
}

function showToast(message) {
    const toast = uiElements.toast;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Convert audio buffer to WAV
function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const wav = new ArrayBuffer(44 + buffer.length * blockAlign);
    const view = new DataView(wav);
    
    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + buffer.length * blockAlign, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, buffer.length * blockAlign, true);
    
    // Write audio data
    const offset = 44;
    const channelData = new Float32Array(buffer.length);
    const volume = 1;
    
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        buffer.copyFromChannel(channelData, i, 0);
        for (let j = 0; j < channelData.length; j++) {
            const sample = channelData[j] * volume;
            const index = offset + (j * blockAlign) + (i * bytesPerSample);
            view.setInt16(index, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        }
    }
    
    return wav;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
} 