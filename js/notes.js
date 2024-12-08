// 导出音符频率映射
export const noteToFreq = {
    'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00,
    'A2': 110.00, 'B2': 123.47,
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00,
    'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00,
    'A4': 440.00, 'B4': 493.88,
    'C5': 523.25
};

// 导出音符到画布Y坐标的转换函数
export function noteToCanvasY(note, canvas) {
    const notes = Object.keys(noteToFreq);
    const index = notes.indexOf(note);
    if (index === -1) return 0;
    return (index / notes.length) * canvas.height;
}

// 导出获取最接近音符的函数
export function getClosestNote(frequency) {
    let closestNote = Object.keys(noteToFreq)[0];
    let minDiff = Math.abs(frequency - noteToFreq[closestNote]);
    
    for (let note in noteToFreq) {
        const diff = Math.abs(frequency - noteToFreq[note]);
        if (diff < minDiff) {
            minDiff = diff;
            closestNote = note;
        }
    }
    
    return closestNote;
}