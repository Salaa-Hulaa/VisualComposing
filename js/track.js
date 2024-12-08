// 导入所需的依赖
import { initAudioContext, synths } from './synth.js';
import { noteToFreq, getClosestNote } from './notes.js';
import { sampleCurvePoints, playCurvePoints } from './curve.js';

// 音乐设置
export const musicSettings = {
    bpm: 120,
    timeSignature: {
        numerator: 4,    // 每小节的拍数
        denominator: 4    // 以几分音符为一拍
    },
    quantize: '8',       // 量化单位（8表示八分音符）
    measureCount: 4      // 显示的小节数
};

// 首先声明所有要导出的变量和函数
export let tracks = [{
    id: 1,
    name: '音轨 1',
    notes: [],
    curves: [],
    instrument: 'guzheng'
}];

// 导出更新音乐设置的函数
export function updateMusicSettings(newSettings) {
    Object.assign(musicSettings, newSettings);
    updateTracksDisplay();
}

// 导出所有需要的函数
export function getCurrentTrackId() {
    const selector = document.getElementById('currentTrackSelector');
    return selector ? parseInt(selector.value) || 1 : 1;
}

export function addTrack() {
    const newTrack = {
        id: tracks.length + 1,
        name: `音轨 ${tracks.length + 1}`,
        notes: [],
        curves: [],
        instrument: 'dizi'
    };
    tracks.push(newTrack);
    updateTracksDisplay();
    updateTrackSelector();
}

// 更新音轨选择器
export function updateTrackSelector() {
    const selector = document.getElementById('currentTrackSelector');
    if (!selector) return;
    
    selector.innerHTML = tracks.map(track => `
        <option value="${track.id}" ${track.id === getCurrentTrackId() ? 'selected' : ''}>
            ${track.name}
        </option>
    `).join('');
}

export function updateTracksDisplay() {
    const container = document.getElementById('tracks-container');
    if (!container) return;
    
    container.innerHTML = tracks.map(track => `
        <div class="track" data-track-id="${track.id}">
            <div class="track-header">
                <span class="track-title">${track.name}</span>
                <div class="track-controls">
                    <select id="instrument-select-${track.id}">
                        <option value="guzheng" ${track.instrument === 'guzheng' ? 'selected' : ''}>古筝</option>
                        <option value="dizi" ${track.instrument === 'dizi' ? 'selected' : ''}>笛子</option>
                    </select>
                    <button id="play-track-${track.id}">播放</button>
                    <button id="clear-track-${track.id}">清除</button>
                    ${track.id > 1 ? `<button id="remove-track-${track.id}">删除</button>` : ''}
                </div>
            </div>
            <div class="track-notes" id="track-notes-${track.id}">
                ${renderTrackNotes(track)}
            </div>
        </div>
    `).join('');

    // 添加事件监听器
    tracks.forEach(track => {
        // 乐器选择
        const instrumentSelect = document.getElementById(`instrument-select-${track.id}`);
        if (instrumentSelect) {
            instrumentSelect.addEventListener('change', (e) => changeTrackInstrument(track.id, e.target.value));
        }
        
        // 播放按钮
        const playButton = document.getElementById(`play-track-${track.id}`);
        if (playButton) {
            playButton.addEventListener('click', () => playTrack(track.id));
        }
        
        // 清除按钮
        const clearButton = document.getElementById(`clear-track-${track.id}`);
        if (clearButton) {
            clearButton.addEventListener('click', () => clearTrack(track.id));
        }
        
        // 删除按钮
        const removeButton = document.getElementById(`remove-track-${track.id}`);
        if (removeButton) {
            removeButton.addEventListener('click', () => removeTrack(track.id));
        }
    });
}

export function clearAllTracks() {
    tracks.forEach(track => {
        track.notes = [];
        track.curves = [];
    });
    updateTracksDisplay();
}

export function switchCurrentTrack(trackId) {
    const selector = document.getElementById('currentTrackSelector');
    if (selector) {
        selector.value = trackId;
    }
    updateTracksDisplay();
}

// 其他函数保持不变，但需要添加 export
export function playTrack(trackId) {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    
    initAudioContext().then(() => {
        const now = Tone.now();
        
        // 播放音符
        track.notes.forEach(note => {
            synths[track.instrument].triggerAttackRelease(
                note.note,
                note.duration,
                now + note.time
            );
        });
        
        // 播放曲线
        track.curves.forEach(curve => {
            if (curve.points && curve.points.length > 0) {
                const sampledPoints = sampleCurvePoints(curve.points);
                playCurvePoints(sampledPoints, track.instrument, now);
            }
        });
    });
}

export function clearTrack(trackId) {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
        track.notes = [];
        track.curves = [];
        updateTracksDisplay();
    }
}

export function removeTrack(trackId) {
    const index = tracks.findIndex(t => t.id === trackId);
    if (index > 0) { // 不允许删除第一个音轨
        tracks.splice(index, 1);
        updateTracksDisplay();
        updateTrackSelector();
    }
}

export function changeTrackInstrument(trackId, instrument) {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
        track.instrument = instrument;
        updateTracksDisplay();
    }
}

// 其他辅助函数（不需要导出的）保持不变
function renderTrackNotes(track) {
    let notesHtml = '';
    
    // 添加音符编辑区域
    notesHtml += `
        <div class="note-editor-area">
            <div class="note-timeline">
                ${generateTimelineMarkers(track)}
            </div>
            <div class="note-grid">
                ${generateNoteGrid(track)}
            </div>
            <div class="note-sequence">
                ${track.notes.map((note, index) => `
                    <div class="note-block" 
                         style="left: ${note.time * 100}px; 
                                width: ${note.duration * 100}px;
                                top: ${getNotePosition(note.note)}px;"
                         data-note-index="${index}"
                         draggable="true"
                         onmousedown="startNoteDrag(event, ${track.id}, ${index})"
                         onclick="editNote(${track.id}, ${index})">
                        <div class="note-handle left" onmousedown="startNoteResize(event, ${track.id}, ${index}, 'start')"></div>
                        <div class="note-info">
                            <span class="note-pitch">${note.note}</span>
                            <span class="note-time">${(note.time * (musicSettings.bpm / 60)).toFixed(2)}拍</span>
                        </div>
                        <div class="note-handle right" onmousedown="startNoteResize(event, ${track.id}, ${index}, 'end')"></div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="note-controls">
            <button onclick="addNote(${track.id})">添加音符</button>
            <button onclick="updateCurveFromNotes(${track.id})">更新曲线</button>
        </div>
    `;
    
    // 渲染曲线信息
    if (track.curves.length > 0) {
        notesHtml += renderTrackCurves(track);
    }
    
    return notesHtml;
}

// 添加时间轴生成函数
function generateTimelineMarkers(track) {
    const beatDuration = 60 / musicSettings.bpm;
    const measureDuration = beatDuration * musicSettings.timeSignature.numerator;
    const totalDuration = measureDuration * musicSettings.measureCount;
    
    let markers = '';
    
    // 添加小节标记
    for (let i = 0; i <= musicSettings.measureCount; i++) {
        const time = i * measureDuration;
        const left = time * 100; // 100px 每秒
        markers += `
            <div class="timeline-marker measure" style="left: ${left}px;">
                ${i + 1}
            </div>
        `;
        
        // 添加拍子标记
        if (i < musicSettings.measureCount) {
            for (let beat = 1; beat < musicSettings.timeSignature.numerator; beat++) {
                const beatTime = time + beat * beatDuration;
                const beatLeft = beatTime * 100;
                markers += `
                    <div class="timeline-marker beat" style="left: ${beatLeft}px;"></div>
                `;
            }
        }
    }
    
    return markers;
}

// 添加音符网格生成函数
function generateNoteGrid(track) {
    const notes = Object.keys(noteToFreq).reverse();
    let grid = '';
    
    notes.forEach((note, index) => {
        const top = index * 20; // 20px 每音符高度
        grid += `
            <div class="note-grid-line" style="top: ${top}px;">
                <span class="note-label">${note}</span>
            </div>
        `;
    });
    
    return grid;
}

// 添加音符位置计算函数
function getNotePosition(noteName) {
    const notes = Object.keys(noteToFreq).reverse();
    const index = notes.indexOf(noteName);
    return index * 20; // 20px 每音符高度
}

// 添加音符编辑函数
function editNote(trackId, noteIndex) {
    const track = tracks.find(t => t.id === trackId);
    if (!track || !track.notes[noteIndex]) return;
    
    const note = track.notes[noteIndex];
    showNoteEditPanel(trackId, noteIndex, note);
}

// 添加音符编辑面板显示函数
function showNoteEditPanel(trackId, noteIndex, note) {
    const panel = document.createElement('div');
    panel.className = 'note-edit-panel';
    panel.innerHTML = `
        <h4>编辑音符</h4>
        <div class="note-properties">
            <div class="control-group">
                <label>音高：</label>
                <select class="note-pitch" onchange="updateNote(${trackId}, ${noteIndex}, 'note', this.value)">
                    ${Object.keys(noteToFreq).map(noteName => 
                        `<option value="${noteName}" ${noteName === note.note ? 'selected' : ''}>
                            ${noteName}
                        </option>`
                    ).join('')}
                </select>
            </div>
            <div class="control-group">
                <label>时间(拍)：</label>
                <input type="number" 
                       step="0.25" 
                       value="${note.time * (musicSettings.bpm / 60)}"
                       onchange="updateNote(${trackId}, ${noteIndex}, 'time', this.value * 60 / musicSettings.bpm)">
            </div>
            <div class="control-group">
                <label>持续时间(拍)：</label>
                <input type="number" 
                       step="0.25" 
                       value="${note.duration * (musicSettings.bpm / 60)}"
                       onchange="updateNote(${trackId}, ${noteIndex}, 'duration', this.value * 60 / musicSettings.bpm)">
            </div>
            <div class="control-group">
                <label>力度：</label>
                <input type="range" 
                       min="0" max="127" 
                       value="${note.velocity}"
                       onchange="updateNote(${trackId}, ${noteIndex}, 'velocity', this.value)">
            </div>
        </div>
        <div class="note-controls">
            <button onclick="previewNote(${trackId}, ${noteIndex})">预览</button>
            <button onclick="deleteNote(${trackId}, ${noteIndex})">删除</button>
            <button onclick="closeNoteEditPanel()">关闭</button>
        </div>
    `;
    
    document.body.appendChild(panel);
}

// 添加关闭音符编辑面板函数
function closeNoteEditPanel() {
    const panel = document.querySelector('.note-edit-panel');
    if (panel) {
        panel.remove();
    }
}

// 添加音符更新函数
function updateNote(trackId, noteIndex, property, value) {
    const track = tracks.find(t => t.id === trackId);
    if (!track || !track.notes[noteIndex]) return;
    
    track.notes[noteIndex][property] = property === 'note' ? value : parseFloat(value);
    
    // 更新显示
    updateTracksDisplay();
}

// 添加音符预览函数
function previewNote(trackId, noteIndex) {
    const track = tracks.find(t => t.id === trackId);
    if (!track || !track.notes[noteIndex]) return;
    
    const note = track.notes[noteIndex];
    initAudioContext().then(() => {
        synths[track.instrument].triggerAttackRelease(
            note.note,
            note.duration,
            Tone.now()
        );
    });
}

// 添加曲线渲染函数
function renderTrackCurves(track) {
    let curvesHtml = '';
    
    if (track.curves.length > 0) {
        curvesHtml += '<div class="track-curves">';
        track.curves.forEach((curve, index) => {
            const noteCount = curve.points ? curve.points.length : 0;
            curvesHtml += `
                <div class="curve-info">
                    曲线 ${index + 1} 
                    <span class="curve-details">
                        (${noteCount}个点)
                        <button onclick="playCurvePart(${track.id}, ${index})">播放</button>
                        <button onclick="editCurve(${track.id}, ${index})">编辑</button>
                        <button onclick="deleteCurve(${track.id}, ${index})">删除</button>
                    </span>
                </div>
            `;
        });
        curvesHtml += '</div>';
    }
    
    return curvesHtml;
}

// 添加音符拖拽相关状态
let noteDragState = {
    isDragging: false,
    trackId: null,
    noteIndex: null,
    startX: 0,
    startY: 0,
    originalTime: 0,
    originalNote: null,
    isResizing: false,
    resizeType: null // 'start' 或 'end'
};

// 添加音符拖拽开始函数
function startNoteDrag(e, trackId, noteIndex) {
    if (e.target.classList.contains('note-handle')) return; // 如果点击到调整手柄则不开始拖拽
    
    const track = tracks.find(t => t.id === trackId);
    if (!track || !track.notes[noteIndex]) return;
    
    e.stopPropagation();
    const noteBlock = e.currentTarget;
    const rect = noteBlock.getBoundingClientRect();
    
    noteDragState = {
        isDragging: true,
        trackId: trackId,
        noteIndex: noteIndex,
        startX: e.clientX,
        startY: e.clientY,
        originalTime: track.notes[noteIndex].time,
        originalNote: track.notes[noteIndex].note,
        isResizing: false
    };
    
    // 添加临时事件监听器
    document.addEventListener('mousemove', handleNoteDrag);
    document.addEventListener('mouseup', stopNoteDrag);
}

// 添���音符大小调整开始函数
function startNoteResize(e, trackId, noteIndex, type) {
    e.stopPropagation();
    
    const track = tracks.find(t => t.id === trackId);
    if (!track || !track.notes[noteIndex]) return;
    
    noteDragState = {
        isDragging: true,
        trackId: trackId,
        noteIndex: noteIndex,
        startX: e.clientX,
        originalTime: track.notes[noteIndex].time,
        originalDuration: track.notes[noteIndex].duration,
        isResizing: true,
        resizeType: type
    };
    
    // 添加临时事件监听器
    document.addEventListener('mousemove', handleNoteResize);
    document.addEventListener('mouseup', stopNoteResize);
}

// 添加音符拖拽处理函数
function handleNoteDrag(e) {
    if (!noteDragState.isDragging || noteDragState.isResizing) return;
    
    const track = tracks.find(t => t.id === noteDragState.trackId);
    if (!track) return;
    
    const note = track.notes[noteDragState.noteIndex];
    const dx = e.clientX - noteDragState.startX;
    const dy = e.clientY - noteDragState.startY;
    
    // 计算新的时间和音高
    const timeChange = dx / 100; // 100px 每秒
    const newTime = Math.max(0, noteDragState.originalTime + timeChange);
    
    // 计算新的音高
    const noteHeight = 20; // 每个音符的高度
    const noteChange = Math.round(dy / noteHeight);
    const notes = Object.keys(noteToFreq).reverse();
    const originalIndex = notes.indexOf(noteDragState.originalNote);
    const newIndex = Math.max(0, Math.min(notes.length - 1, originalIndex + noteChange));
    
    // 更新音符
    note.time = quantizeTime(newTime);
    note.note = notes[newIndex];
    
    // 更新显示
    updateTracksDisplay();
}

// 添加音符大小调整处理函数
function handleNoteResize(e) {
    if (!noteDragState.isDragging || !noteDragState.isResizing) return;
    
    const track = tracks.find(t => t.id === noteDragState.trackId);
    if (!track) return;
    
    const note = track.notes[noteDragState.noteIndex];
    const dx = e.clientX - noteDragState.startX;
    const timeChange = dx / 100; // 100px 每秒
    
    if (noteDragState.resizeType === 'start') {
        // 调整开始时间
        const newTime = Math.max(0, noteDragState.originalTime + timeChange);
        const newDuration = noteDragState.originalDuration - (newTime - noteDragState.originalTime);
        if (newDuration > 0) {
            note.time = quantizeTime(newTime);
            note.duration = quantizeTime(newDuration);
        }
    } else {
        // 调整持续时间
        const newDuration = Math.max(60 / (musicSettings.bpm * 4), // 最小为十六分音符
            noteDragState.originalDuration + timeChange);
        note.duration = quantizeTime(newDuration);
    }
    
    // 更新显示
    updateTracksDisplay();
}

// 添加停止拖拽函数
function stopNoteDrag() {
    noteDragState.isDragging = false;
    document.removeEventListener('mousemove', handleNoteDrag);
    document.removeEventListener('mouseup', stopNoteDrag);
}

// 添加停止调整大小函数
function stopNoteResize() {
    noteDragState.isDragging = false;
    document.removeEventListener('mousemove', handleNoteResize);
    document.removeEventListener('mouseup', stopNoteResize);
}

// 添加播放所有音轨的函数
export function playAllTracks() {
    initAudioContext().then(() => {
        const now = Tone.now();
        
        tracks.forEach(track => {
            // 播放音符
            track.notes.forEach(note => {
                synths[track.instrument].triggerAttackRelease(
                    note.note,
                    note.duration,
                    now + note.time
                );
            });
            
            // 播放曲线
            track.curves.forEach(curve => {
                if (curve.points && curve.points.length > 0) {
                    const sampledPoints = sampleCurvePoints(curve.points);
                    playCurvePoints(sampledPoints, track.instrument, now);
                }
            });
        });
    });
}