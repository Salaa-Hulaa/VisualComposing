// 首先声明所有要导出的变量和函数
let audioContext = null;
let synths = {
    guzheng: null,
    dizi: null
};

// 音色预设
const presets = {
    lead: {
        pentatonic: [
            'C2', 'D2', 'E2', 'G2', 'A2',
            'C3', 'D3', 'E3', 'G3', 'A3',
            'C4', 'D4', 'E4', 'G4', 'A4',
            'C5', 'D5'
        ],
        traditional: [
            'C2', 'D2', 'E2', 'G2', 'A2',
            'C3', 'D3', 'E3', 'G3', 'A3',
            'C4', 'D4', 'E4', 'G4', 'A4',
            'C5', 'D5'
        ],
        minor: [
            'C2', 'D2', 'F2', 'G2', 'A2',
            'C3', 'D3', 'F3', 'G3', 'A3',
            'C4', 'D4', 'F4', 'G4', 'A4'
        ]
    }
};

// 声明所有要导出的函数
async function initAudioContext() {
    try {
        await Tone.start();
        
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (!synths.guzheng) {
            await initSynths();
        }
        
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        return true;
    } catch (error) {
        console.error('AudioContext initialization error:', error);
        return false;
    }
}

function setSynthPreset(instrument, presetName) {
    if (presets[instrument] && presets[instrument][presetName]) {
        return presets[instrument][presetName];
    }
    return presets[instrument].pentatonic;
}

function checkAudioStatus() {
    if (!synths.guzheng) {
        console.warn('乐器未正确初始化');
        return false;
    }
    return true;
}

// 在文件顶部导出所有需要的内容
export {
    initAudioContext,
    synths,
    presets,
    setSynthPreset,
    checkAudioStatus
};

/**
 * 采样来源信息：
 * 古筝采样: [来源URL]
 * 许可证: [许可证类型]
 * 作者: [作者名称]
 */

// 初始化音频上下文和合成器
async function initSynths() {
    // 古筝音色
    if (!synths.guzheng) {
        synths.guzheng = new Tone.Synth({
            oscillator: {
                type: "triangle",
                partials: [1, 0.5, 0.3, 0.2]
            },
            envelope: {
                attack: 0.02,
                decay: 1.2,
                sustain: 0.3,
                release: 1.8
            },
            portamento: 0.02,
            volume: -8
        }).toDestination();
    }

    // 笛子音色
    if (!synths.dizi) {
        synths.dizi = new Tone.Synth({
            oscillator: {
                type: "sine",
                partials: [1, 0.3, 0.2],
                phase: 0
            },
            envelope: {
                attack: 0.1,
                decay: 0.2,
                sustain: 0.4,
                release: 1.4
            },
            volume: -10
        }).toDestination();
    }

    // 效果器设置
    const reverb = new Tone.Reverb({
        decay: 2.2,
        preDelay: 0.1,
        wet: 0.3
    });

    const chorus = new Tone.Chorus({
        frequency: 1.2,
        delayTime: 2.8,
        depth: 0.4,
        wet: 0.15
    });

    // 创建效果器链
    Tone.Destination.chain(chorus, reverb);
    synths.guzheng.connect(chorus);
    synths.dizi.connect(chorus);

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, 100);
    });
} 