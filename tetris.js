const shapeType = ['T', 'Z', 'J', 'I', 'O'];
const shapeTypeMap = {
  'empty': [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ],
  'T': [
    [0, 1, 0],
    [1, 1, 1],
  ],
  'Z': [
    [1, 1, 0],
    [0, 1, 1],
  ],
  'J': [
    [0, 1],
    [0, 1],
    [1, 1],
  ],
  'I': [
    [1],
    [1],
    [1],
    [1],
  ],
  'O': [
    [1, 1],
    [1, 1],
  ]
}

class Block {
  constructor(type) {
    this.type = type;
    this.posX = 3;
    this.posY = 0;

    this.d = shapeTypeMap[this.type];
  }

  rotate() {
    const result = [];

    for (let i = 0; i < this.d[0].length; i++) {
      result[i] = [];
      for (let j = 0; j < this.d.length; j++) {
        result[i][j] = this.d[j][i];
      }
    }

    this.d = result;

    return result;
  }

  getHeightSize () {
    return this.d.length;
  }

  getWidthSize () {
    return this.d[0].length;
  }
}

class Map {
  constructor(target, width = 10, height = 20) {
    this.target = document.getElementById(target);
    this.width = width;
    this.height = height;

    this.d = [];
    this.emptyRow = [
      new Block('empty'), new Block('empty'),
      new Block('empty'), new Block('empty'),
      new Block('empty'), new Block('empty'),
      new Block('empty'), new Block('empty'),
      new Block('empty'), new Block('empty'),
    ];

    for (let i = 0; i < this.height; ++i) {
      this.d.push([]);
      for (let j = 0 ; j < this.width ; ++j) {
        this.d[i].push(new Block('empty'));
      }
    }
  }

  // 맵 렌더링
  // 움직이는 블록 렌더링
  render() {
    this.mapRender();
    this.movingBlockRender();
  }

  mapRender() {
    let temp = '';
    let rowIdx = 0;
    let columnIdx = 0;
    for (let row of this.d) {
      temp += `
      <li class="row">
        <ul>
      `;
      for (let column of row) {
        temp += `
          <li class="column ${column.type}"></li>
        `;
        columnIdx++;
      }

      temp += `
        </ul>
      </li>
      `;
      rowIdx++;
      columnIdx = 0;
    }
    this.target.innerHTML = temp;
  }

  movingBlockRender() {
    const posX = this.movingBlock.posX;
    const posY = this.movingBlock.posY;

    for (let blockRowIdx in this.movingBlock.d) {
      for (let blockColumnIdx in this.movingBlock.d[blockRowIdx]) {

        const a = this.target.querySelectorAll('.row')[posY + parseInt(blockRowIdx)].querySelectorAll('.column')[posX + parseInt(blockColumnIdx)];
        if (this.movingBlock.d[blockRowIdx][blockColumnIdx]) {
          a.className = `column ${this.movingBlock.type}`
        }
      }
    }
  }

  update(movingBlock, prevBlockPos) {
    this.movingBlock = movingBlock;
    try {
      this.render();
    } catch (e) {
      this.movingBlock.posX = prevBlockPos.prevPosX;
      this.movingBlock.posY = prevBlockPos.prevPosY;
      this.movingBlock.d = prevBlockPos.prevD;
      this.render();
    }
  }

  collision() {
    const boundaryPos = [];
    for (let i in this.movingBlock.d[0]) {
      boundaryPos.push(0);
    }
    for (let rowIdx in this.movingBlock.d) {
      for (let columnIdx in this.movingBlock.d[rowIdx]) {
        if (this.movingBlock.d[rowIdx][columnIdx] === 1) {
          boundaryPos[columnIdx] = parseInt(rowIdx) + 1;
        }
      }
    }

    for (let i in boundaryPos) {
      const x = parseInt(this.movingBlock.posX) + parseInt(i);
      const y = parseInt(this.movingBlock.posY) + boundaryPos[parseInt(i)];
      if (y === 0) continue;

      try {
        if (this.d[y][x].type !== 'empty') return true;
      } catch {
        return true;
      }
      
    }
    
    return false;
  }

  seeding() {
    for (let rowIdx in this.movingBlock.d) {
      for (let columnIdx in this.movingBlock.d[rowIdx]) {
        const x = parseInt(this.movingBlock.posX) + parseInt(columnIdx);
        const y = parseInt(this.movingBlock.posY) + parseInt(rowIdx);

        if (this.movingBlock.d[rowIdx][columnIdx] === 1) {
          this.d[y][x] = new Block(this.movingBlock.type);
        }
      }
    }
  }

  removeLineFull() {
    let count = 0;

    for(let rowIdx = 0 ; rowIdx < this.d.length ; ++rowIdx) {
      let isRemoveLine = this.d[rowIdx].every(column => column.type !== 'empty');

      if (isRemoveLine) {
        count++;
        const front = this.d.slice(0, rowIdx);
        const back = this.d.slice(rowIdx + 1, this.d.length);
        
        const temp = []
        for (let j = 0 ; j < this.width ; ++j) {
          temp.push(new Block('empty'));
        }
        this.d = []
        this.d.push(temp)
        for (const a of front) {
          this.d.push(a)
        }
        for (const a of back) {
          this.d.push(a)
        }
      }
    }

    return count;
  }

  isTopSeek() {
    return this.d[0].some(column => column.type !== 'empty');
  }

  isLeftSeek() {
    // 게임 범위 밖
    if (this.movingBlock.posX < 1) return true;

    // 블록 충돌 검사
    for (let rowIdx in this.movingBlock.d) {
      let c = this.movingBlock.d[rowIdx].findIndex(c => c === 1);
      if (c === -1) c = 0;
      if (this.d[parseInt(this.movingBlock.posY + parseInt(rowIdx))][this.movingBlock.posX - 1 + c].type !== 'empty') return true;
    }
  }

  isRightSeek() {
    if (this.movingBlock.posX > (9 - this.movingBlock.getWidthSize())) return true;

    for (let rowIdx in this.movingBlock.d) {
      let c = this.movingBlock.d[rowIdx].findLastIndex(c => c === 1);
      if (c === -1) c = 0;
      if (this.d[parseInt(this.movingBlock.posY + parseInt(rowIdx))][this.movingBlock.posX + 1 + c].type !== 'empty') return true;
    }
  }
}

const levelSpeed = [1_300, 1000, 800, 600, 500, 300]

class Game {
  constructor(id) {
    this.map = new Map(id)
    this.movingBlock = this.generateBlock();
    this.nextMovingBlock = this.generateBlock();
    this.timerId = null;
    this.count = 1;
    this.level = 0;
    this.isEnd = false;
    this.isPause = false;
    this.speedMode = false;
    this.score = 0;
  }

  start() {
    this.isEnd = false;
    this.map.update(this.movingBlock);
    this.moveEvent();
    this.autoDown();
    this.nextBlockRender();
  }

  autoDown() {
    this.timerClear()
    let speed = this.speedMode ? 30 : levelSpeed[this.level] || 300;
    this.timerId = setInterval(() => {
      if (this.isPause || this.isEnd) return ;
      
      this.count++;

      if (this.count % 5 === 0 ) {
        this.level++;
        
        this.autoDown();
      }
      
      this.downMove();
      this.endGame();

      this.scoreRender();
      this.levelRender();
      this.nextBlockRender();
    }, speed);
  }

  endGame() {
    if (this.map.isTopSeek()) {
      this.pause();
      this.isEnd = true;
      alert("게임종료");
      return;
    }
  }

  timerClear() {
    clearTimeout(this.timerId);
    this.timerId = null;
  }

  moveEvent() {
    window.addEventListener('keydown', this.moveEventHandler.bind(this));
    window.addEventListener('keyup', this.speedModeEventHandler.bind(this));
  }

  inActiveEvent() {
    window.removeEventListener('keydown', this.moveEventHandler.bind(this));
    window.removeEventListener('keyup', this.speedModeEventHandler.bind(this));
  }

  moveEventHandler(e) {
    if (this.isPause || this.isEnd) return ;
    const prevPosX = this.movingBlock.posX;
    const prevPosY = this.movingBlock.posY;
    const prevD = this.movingBlock.d;

    if (e.key === 'ArrowLeft') {
      this.leftMove()
    } else if (e.key === 'ArrowDown') {
      this.downMove();
    } else if (e.key === 'ArrowRight') {
      this.rightMove();
    } else if (e.key === 'ArrowUp') {
      // 회전
      this.rotate()
    } else if (e.code === 'Space') {
      this.speedModeActive();
    }
    
    this.map.update(this.movingBlock, {
      prevPosX,
      prevPosY,
      prevD
    });

    this.scoreRender();
    this.levelRender();
    this.nextBlockRender();
  }

  speedModeEventHandler(e) {
    if (e.code === 'Space') {
      this.speedModeInActive();
    }
  }

  speedModeActive() {
    this.speedMode = true;
    this.autoDown();
  }
  speedModeInActive() {
    this.speedMode = false;
    this.autoDown();
  }

  rightMove() {
    if(this.map.isRightSeek()) {
      return;
    }
    this.movingBlock.posX += 1;
  }

  leftMove() {
    if (this.map.isLeftSeek()) {
      return;
    }
    this.movingBlock.posX -= 1;
  }

  downMove() {
    const prevPosX = this.movingBlock.posX;
    const prevPosY = this.movingBlock.posY;
    const prevD = this.movingBlock.d;

    const isCollision = this.map.collision();
    if (!isCollision) {
      this.movingBlock.posY += this.movingBlock.posY < (20 - this.movingBlock.getHeightSize()) ? 1 : 0;
    } else {
      this.map.seeding(); // 화면에 고정
      this.score += this.map.removeLineFull(); // 라인제거
      delete this.movingBlock; // 기존 블럭 객체 제거
      this.movingBlock = this.generateBlock(); // 새로운 블럭 생성
      
      if (this.speedMode) {
        this.speedModeInActive();
      }
    }
    
    this.map.update(this.movingBlock, {
      prevPosX,
      prevPosY,
      prevD
    });
  }

  rotate() {
    const isCollision = this.map.collision();
    if (!isCollision) {
      this.movingBlock.rotate();
    }
  }

  generateBlock() {
    const newBlock = new Block(shapeType[ Math.floor(Math.random() * shapeType.length) + 0]);
    const movingBlock = this.nextMovingBlock || newBlock;
    this.nextMovingBlock = new Block(shapeType[ Math.floor(Math.random() * shapeType.length) + 0]);
    return movingBlock;
  }

  scoreRender() {
    document.querySelector('.info.score').innerHTML = `점수: ${this.score}`;

  }

  levelRender() {
    document.querySelector('.info.level').innerHTML = `레벨: ${this.level + 1}`;
  }

  nextBlockRender() {
    const a = document.getElementById('preview'); //.querySelectorAll('.row')[blockRowIdx].querySelectorAll('.column')[blockColumnIdx];

    let temp = '';
    
    for (let blockRowIdx in this.nextMovingBlock.d) {
      temp += `
        <li class="row">
          <ul>
      `;
      for (let blockColumnIdx in this.nextMovingBlock.d[blockRowIdx]) {
        const column = this.nextMovingBlock.d[blockRowIdx][blockColumnIdx]

        if (column) {
          temp += `
            <li class="column ${this.nextMovingBlock.type}"></li>
          `;
        } else {
          temp += `
            <li class="column empty"></li>
          `;
        }
      
      }
      temp += `
          </ul>
        </li>
      `;
    }

    a.innerHTML = temp;
  }

  pause() {
    this.isPause = true;
  }

  continue() {
    this.isPause = false;
  }

  end() {
    this.timerClear();
    this.inActiveEvent();
  }
}

const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn')

let game = null;

restartBtn.addEventListener('click', () => {
  if (game) {
    game.end();
  }
  game = new Game("game");
  game.start();
  restartBtn.innerText = '다시시작';
})

pauseBtn.addEventListener('click', () => {
  if (game.isPause) {
    game.continue();
    pauseBtn.innerText = '일시정지'
  } else {
    game.pause();
    pauseBtn.innerText = '이어하기'
  }
})

