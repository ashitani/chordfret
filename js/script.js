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
        const allPositions = getTabPositions(notes);
        
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
        allPositionsDiv.appendChild(createChordCanvas(chord, allPositions, [0, 22], [1, 6]));
        
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
        const [minFret, maxFret] = fretRange;
        const numStrings = GUITAR_TUNING.length;
        
        // フレット番号の描画（フォントサイズを14pxに）
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = 'black';
        for (let i = minFret; i <= maxFret; i++) {
            const x = (i - minFret) * this.fretWidth + this.margin.left;
            this.ctx.fillText(String(i), 
                x + this.fretWidth/2 - 6,  // 位置調整
                this.margin.top/2 - 8);
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
        const x = (fret * this.fretWidth) + this.margin.left + this.fretWidth/2;
        const y = ((string - 1) * this.stringHeight) + this.margin.top;
        
        // 円の描画（サイズを大きく）
        this.ctx.beginPath();
        this.ctx.arc(x, y, 9, 0, Math.PI * 2);  // 7 → 9
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        // 音名の描画（フォントサイズは小さいまま）
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        const textWidth = this.ctx.measureText(note).width;
        this.ctx.fillText(note, x - textWidth/2, y + 4);
    }
}

function createChordCanvas(chord, positions, fretRange = [0, 22], stringRange = [1, 6]) {
    const canvas = document.createElement('canvas');
    const [minFret, maxFret] = fretRange;
    
    // キャンバスサイズの計算（弦数に応じて高さを調整）
    const margin = { left: 40, right: 20, top: 40, bottom: 20 };
    const fretWidth = 35;
    const stringHeight = 20;
    const totalFrets = maxFret - minFret + 1;
    const width = margin.left + (totalFrets + 1) * fretWidth + margin.right;
    const height = margin.top + (GUITAR_TUNING.length * stringHeight) + margin.bottom;
    
    canvas.width = width;
    canvas.height = height;
    
    const visualizer = new GuitarChordVisualizer(canvas);
    visualizer.drawFretboard(fretRange);
    
    // コードの構成音を音程順に並べ替え
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