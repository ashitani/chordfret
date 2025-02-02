document.addEventListener('DOMContentLoaded', function() {
    // 初期値を設定（6弦ギター）
    document.getElementById('tuning-input').value = 'E,B,G,D,A,E';
    document.getElementById('chord-input').value = 'Dm7,G7,Cmaj7';
    generateChordProgression();

    // チューニング変更時のイベントリスナー
    document.getElementById('tuning-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tuning = e.target.value.split(',').map(n => n.trim());
            if (tuning.every(note => NOTES.includes(note))) {
                GUITAR_TUNING.splice(0, GUITAR_TUNING.length, ...tuning);
                generateChordProgression();
            } else {
                alert('Invalid tuning format. Please enter valid notes separated by commas.');
            }
        }
    });

    // コード進行変更時のイベントリスナー
    document.getElementById('chord-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            generateChordProgression();
        }
    });
});

// 音階の定義
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// コードタイプの定義
const CHORD_TYPES = {
    "": [0, 4, 7],           // メジャー
    "m": [0, 3, 7],          // マイナー
    "7": [0, 4, 7, 10],      // ドミナント7
    "maj7": [0, 4, 7, 11],   // メジャー7
    "m7": [0, 3, 7, 10],     // マイナー7
    "dim": [0, 3, 6],        // ディミニッシュ
    "dim7": [0, 3, 6, 9],    // ディミニッシュ7
    "m7b5": [0, 3, 6, 10],   // ハーフディミニッシュ
    "aug": [0, 4, 8],        // オーギュメント
    "aug7": [0, 4, 8, 10],   // オーギュメント7
    "6": [0, 4, 7, 9],       // 6th
    "m6": [0, 3, 7, 9],      // マイナー6th
    "sus4": [0, 5, 7],       // サスペンド4
    "sus2": [0, 2, 7],       // サスペンド2
    "7sus4": [0, 5, 7, 10],  // 7サスペンド4
    "9": [0, 4, 7, 10, 14],  // 9th
    "m9": [0, 3, 7, 10, 14], // マイナー9th
    "maj9": [0, 4, 7, 11, 14], // メジャー9th
    "add9": [0, 4, 7, 14],   // アド9
    "madd9": [0, 3, 7, 14],  // マイナーアド9
    "7b9": [0, 4, 7, 10, 13], // 7フラット9
    "7#9": [0, 4, 7, 10, 15], // 7シャープ9
    "13": [0, 4, 7, 10, 14, 21], // 13th
    "maj13": [0, 4, 7, 11, 14, 21], // メジャー13th
    "m13": [0, 3, 7, 10, 14, 21],   // マイナー13th
    "5": [0, 7],             // パワーコード
};

// ギターの初期チューニング（高い弦から）
const GUITAR_TUNING = ['E', 'B', 'G', 'D', 'A', 'E'];

// フラットからシャープへの変換マップ
const FLAT_TO_SHARP = {
    'Db': 'C#',
    'Eb': 'D#',
    'Gb': 'F#',
    'Ab': 'G#',
    'Bb': 'A#'
};

// コード名から構成音を計算する関数
function chord2notes(chordName) {
    let root, chordType;
    
    // フラットをシャープに変換
    if (chordName.startsWith('Db') || 
        chordName.startsWith('Eb') || 
        chordName.startsWith('Gb') || 
        chordName.startsWith('Ab') || 
        chordName.startsWith('Bb')) {
        const flatRoot = chordName.slice(0, 2);
        chordType = chordName.slice(2);
        root = FLAT_TO_SHARP[flatRoot];
    } else if (chordName.length > 1 && (chordName[1] === '#' || chordName[1] === 'b')) {
        root = chordName.slice(0, 2);
        chordType = chordName.slice(2);
    } else {
        root = chordName[0];
        chordType = chordName.slice(1);
    }
    
    if (!(chordType in CHORD_TYPES)) {
        throw new Error(`Unsupported chord type: ${chordType}`);
    }
    
    const rootIdx = NOTES.indexOf(root);
    return CHORD_TYPES[chordType].map(interval => 
        NOTES[(rootIdx + interval) % 12]
    );
}

// 指定された音のリストに対して、それぞれの音を出せる全ての位置を返す
function getTabPositions(targetNotes, fretRange = [0, 22]) {
    const [minFret, maxFret] = fretRange;
    const positions = {};
    
    targetNotes.forEach(note => {
        positions[note] = [];
        GUITAR_TUNING.forEach((openNote, stringIdx) => {
            const openNoteIdx = NOTES.indexOf(openNote);
            for (let fret = minFret; fret <= maxFret; fret++) {
                const currentNoteIdx = (openNoteIdx + fret) % 12;
                if (NOTES[currentNoteIdx] === note) {
                    positions[note].push([stringIdx + 1, fret]);
                }
            }
        });
    });
    
    return positions;
}

// コード進行の処理とUIの更新
function generateChordProgression() {
    const input = document.getElementById('chord-input').value;
    const chords = input.split(',').map(c => c.trim());
    const minFret = parseInt(document.getElementById('min-fret').value) || 0;
    const maxFret = parseInt(document.getElementById('max-fret').value) || 22;
    
    const container = document.getElementById('chord-container');
    container.innerHTML = '';
    
    chords.forEach((chord, index) => {
        // フラットをシャープに変換しつつ表示用のコード名は元のまま保持
        const displayChord = chord;  // 表示用
        if (chord.startsWith('Db') || 
            chord.startsWith('Eb') || 
            chord.startsWith('Gb') || 
            chord.startsWith('Ab') || 
            chord.startsWith('Bb')) {
            const flatRoot = chord.slice(0, 2);
            const chordType = chord.slice(2);
            chord = FLAT_TO_SHARP[flatRoot] + chordType;  // 内部処理用
        }

        const notes = chord2notes(chord);
        const allPositions = getTabPositions(notes, [minFret, maxFret]);
        
        const chordRow = document.createElement('div');
        chordRow.className = 'chord-row';
        
        const chordInfo = `
            <div class="chord-info">
                <div class="chord-name" style="font-size: 20px">${displayChord}</div>
            </div>
        `;
        
        const displayContainer = document.createElement('div');
        displayContainer.className = 'chord-display';
        
        const allPositionsDiv = document.createElement('div');
        allPositionsDiv.className = 'all-positions';
        allPositionsDiv.style.display = 'block';
        allPositionsDiv.appendChild(createChordCanvas(chord, allPositions, [minFret, maxFret], [1, 6]));
        
        displayContainer.appendChild(allPositionsDiv);
        chordRow.innerHTML = chordInfo;
        chordRow.appendChild(displayContainer);
        container.appendChild(chordRow);
    });
}

// キャンバスの生成と描画
class GuitarChordVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.fretRange = [0, 22];  // デフォルト値
        this.setupCanvas();
        
        this.margin = {
            top: 40,
            left: 40,
            right: 20,
            bottom: 20
        };
        this.fretWidth = 35;
        this.stringHeight = 20;
    }

    setupCanvas() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawFretboard(fretRange = [0, 22]) {
        this.fretRange = fretRange;
        const [minFret, maxFret] = fretRange;
        const numStrings = GUITAR_TUNING.length;
        
        // フレット番号の描画
        this.ctx.fillStyle = 'black';
        for (let i = minFret; i <= maxFret; i++) {
            const x = (i - minFret) * this.fretWidth + this.margin.left;
            this.ctx.font = '14px Arial';
            
            const text = String(i);
            const metrics = this.ctx.measureText(text);
            const textWidth = metrics.width;
            
            // フレットマーカー位置の場合は丸を描画
            if (FRET_MARKERS.includes(i)) {
                this.ctx.fillStyle = '#666666';
                
                // 12フレットと24フレットは2つの丸
                if (i === 12 || i === 24) {
                    // 左の丸
                    this.ctx.beginPath();
                    this.ctx.arc(
                        x + this.fretWidth/2 - 4,  // 中心から左に4px
                        this.margin.top/2,  // -2 → 0 （2ピクセル下に）
                        1.5,  // 半径1.5px
                        0, Math.PI * 2
                    );
                    this.ctx.fill();
                    
                    // 右の丸
                    this.ctx.beginPath();
                    this.ctx.arc(
                        x + this.fretWidth/2 + 4,  // 中心から右に4px
                        this.margin.top/2,  // -2 → 0 （2ピクセル下に）
                        1.5,  // 半径1.5px
                        0, Math.PI * 2
                    );
                    this.ctx.fill();
                } else {
                    // その他は1つの丸
                    this.ctx.beginPath();
                    this.ctx.arc(
                        x + this.fretWidth/2,
                        this.margin.top/2,  // -2 → 0 （2ピクセル下に）
                        1.5,  // 半径1.5px
                        0, Math.PI * 2
                    );
                    this.ctx.fill();
                }
            }
            
            // 数字を描画
            this.ctx.fillText(text,
                x + this.fretWidth/2 - textWidth/2,
                this.margin.top/2 - 6);
        }
        
        // 横線（弦）の描画
        for (let i = 0; i < numStrings; i++) {
            const y = i * this.stringHeight + this.margin.top;
            this.ctx.beginPath();
            this.ctx.moveTo(this.margin.left, y);
            this.ctx.lineTo(this.margin.left + (maxFret - minFret + 1) * this.fretWidth, y);
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
        
        // 縦線（フレット）の描画
        const stringEndY = this.margin.top + (numStrings - 1) * this.stringHeight;
        for (let i = minFret; i <= maxFret + 1; i++) {
            const x = (i - minFret) * this.fretWidth + this.margin.left;
            if (i > minFret || minFret > 0) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, this.margin.top);
                this.ctx.lineTo(x, stringEndY);
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = (i === 1 && minFret === 0) ? 4 : 2;
                this.ctx.stroke();
            }
        }
    }

    drawNote(string, fret, note, color = '#FF0000') {
        const [minFret, maxFret] = this.fretRange;
        const x = ((fret - minFret) * this.fretWidth) + this.margin.left + this.fretWidth/2;
        const y = ((string - 1) * this.stringHeight) + this.margin.top;
        
        // コードノートの円を描画（サイズを調整）
        this.ctx.beginPath();
        this.ctx.arc(x, y, 9.5, 0, Math.PI * 2);  // 11 → 9.5
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        // 音名を描画
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        const textWidth = this.ctx.measureText(note).width;
        this.ctx.fillText(note, x - textWidth/2, y + 4);
    }

    drawScaleNote(string, fret, note) {
        const [minFret, maxFret] = this.fretRange;
        const x = ((fret - minFret) * this.fretWidth) + this.margin.left + this.fretWidth/2;
        const y = ((string - 1) * this.stringHeight) + this.margin.top;
        
        // 薄い色で塗りつぶし
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fill();
        this.ctx.strokeStyle = '#aaaaaa';  // #888888 → #aaaaaa （さらに薄いグレー）
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // 音名を薄い色で描画
        this.ctx.fillStyle = '#aaaaaa';  // #888888 → #aaaaaa （さらに薄いグレー）
        this.ctx.font = '11px Arial';
        const textWidth = this.ctx.measureText(note).width;
        this.ctx.fillText(note, x - textWidth/2, y + 4);
    }
}

function createChordCanvas(chord, positions, fretRange = [0, 22], stringRange = [1, 6]) {
    const canvas = document.createElement('canvas');
    const [minFret, maxFret] = fretRange;
    
    // キャンバスサイズの計算
    const margin = { 
        left: 40, 
        right: 20, 
        top: 45,  // 40 → 45 （上部マージンを増やす）
        bottom: 20 
    };
    const fretWidth = 35;
    const stringHeight = 20;
    const totalFrets = maxFret - minFret + 1;
    const width = margin.left + (totalFrets + 1) * fretWidth + margin.right;
    const height = margin.top + (GUITAR_TUNING.length * stringHeight) + margin.bottom;
    
    canvas.width = width;
    canvas.height = height;
    
    const visualizer = new GuitarChordVisualizer(canvas);
    visualizer.drawFretboard(fretRange);
    
    // スケールノートの描画（コードノートの前に描画）
    const scaleRoot = document.getElementById('scale-root').value;
    const scaleType = document.getElementById('scale-type').value;
    if (scaleRoot && scaleType) {
        const scaleNotes = getScaleNotes(scaleRoot, scaleType);
        GUITAR_TUNING.forEach((stringNote, stringIndex) => {
            for (let fret = minFret; fret <= maxFret; fret++) {
                const noteIdx = (NOTES.indexOf(stringNote) + fret) % 12;
                const note = NOTES[noteIdx];
                if (scaleNotes.includes(noteIdx)) {
                    // スケールノートを青い円で描画
                    visualizer.drawScaleNote(stringIndex + 1, fret, note);
                }
            }
        });
    }

    // コードノートの描画（既存のコード）
    const root = chord.length > 1 && (chord[1] === '#' || chord[1] === 'b') ? 
        chord.slice(0, 2) : chord[0];
    const rootIdx = NOTES.indexOf(root);
    
    // 音程ごとの色を定義
    const intervalColors = [
        '#FF0000',  // ルート (赤)
        '#4B0082',  // 3度 (インディゴ)
        '#006400',  // 5度 (深緑)
        '#0000FF',  // 7度 (青)
        '#800080',  // 9度 (紫)
        '#8B4513'   // 11度/13度 (茶)
    ];
    
    // 各音に色を割り当て
    const noteColors = {};
    Object.entries(positions).forEach(([note, _]) => {
        const noteIdx = NOTES.indexOf(note);
        const interval = (noteIdx - rootIdx + 12) % 12;
        
        let colorIndex;
        switch (interval) {
            case 0:  // ルート
                colorIndex = 0;
                break;
            case 3:  // マイナー3度
            case 4:  // メジャー3度
                colorIndex = 1;
                break;
            case 7:  // 5度
                colorIndex = 2;
                break;
            case 10: // マイナー7度
            case 11: // メジャー7度
                colorIndex = 3;
                break;
            case 2:  // 9度
            case 14: // 9度
                colorIndex = 4;
                break;
            default: // その他（11度、13度など）
                colorIndex = 5;
        }
        noteColors[note] = intervalColors[colorIndex];
    });
    
    // フレットボード上の音符の描画
    Object.entries(positions).forEach(([note, posList]) => {
        if (note === 'x') return;
        posList.forEach(([string, fret]) => {
            if (string <= GUITAR_TUNING.length) {  // 現在の弦数を超える位置は描画しない
                visualizer.drawNote(string, fret, note, noteColors[note]);
            }
        });
    });
    
    return canvas;
}

function toggleView(chordIndex) {
    const allPos = document.getElementById(`all-positions-${chordIndex}`);
    const candidates = document.getElementById(`candidates-${chordIndex}`);
    const viewSelect = document.getElementById(`view-select-${chordIndex}`);
    
    if (viewSelect.value === 'all') {
        allPos.style.display = 'block';
        candidates.style.display = 'none';
    } else {
        allPos.style.display = 'none';
        candidates.style.display = 'flex';
    }
}

// スケール定義を追加
const SCALES = {
    minor_pentatonic: [0, 3, 5, 7, 10],
    major_pentatonic: [0, 2, 4, 7, 9],
    minor: [0, 2, 3, 5, 7, 8, 10],
    major: [0, 2, 4, 5, 7, 9, 11]
};

// フレットマーカーの位置
const FRET_MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21];

// スケールノートを計算する関数
function getScaleNotes(root, scaleType) {
    if (!root || !scaleType || !SCALES[scaleType]) return [];
    const rootIndex = NOTES.indexOf(root);
    return SCALES[scaleType].map(interval => (rootIndex + interval) % 12);
}

// updateChordDisplay関数を追加
function updateChordDisplay() {
    generateChordProgression();
}

// イベントリスナーを追加
document.getElementById('scale-root').addEventListener('change', updateChordDisplay);
document.getElementById('scale-type').addEventListener('change', updateChordDisplay);
document.getElementById('min-fret').addEventListener('change', function(e) {
    const minFret = parseInt(e.target.value);
    const maxFret = parseInt(document.getElementById('max-fret').value);
    if (minFret >= maxFret) {
        e.target.value = maxFret - 1;
    }
    updateChordDisplay();
});

document.getElementById('max-fret').addEventListener('change', function(e) {
    const maxFret = parseInt(e.target.value);
    const minFret = parseInt(document.getElementById('min-fret').value);
    if (maxFret <= minFret) {
        e.target.value = minFret + 1;
    }
    updateChordDisplay();
}); 