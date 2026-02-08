// Retro Arcade Sprite Library
// Each sprite is defined as a 2D array of hex colors (null = transparent)

export type Sprite = (string | null)[][];

// ============== JOUST SPRITES ==============

export const JOUST_PLAYER: Sprite = [
  [null, null, '#ff0', '#ff0', null, null, null, null, null, null, null, null],
  [null, '#ff0', '#ff0', '#ff0', '#ff0', null, null, null, null, null, null, null],
  [null, '#ff0', '#000', '#ff0', '#ff0', null, null, '#fa0', '#fa0', null, null, null],
  ['#ff0', '#ff0', '#ff0', '#ff0', '#ff0', '#ff0', '#fa0', '#fa0', '#fa0', '#fa0', null, null],
  ['#ff0', '#ff0', '#ff0', '#ff0', '#ff0', '#fa0', '#fff', '#fa0', '#fa0', '#fa0', '#fa0', null],
  [null, '#ff0', '#ff0', '#ff0', '#fa0', '#fa0', '#fa0', '#fa0', '#fa0', '#fa0', '#fa0', null],
  [null, null, '#44f', '#44f', '#fa0', '#fa0', '#fa0', '#fa0', '#fa0', '#fa0', null, null],
  [null, null, '#44f', '#44f', null, '#fa0', '#fa0', '#fa0', null, null, null, null],
  [null, null, '#fa0', '#fa0', null, null, '#888', null, null, null, null, null],
];

export const JOUST_ENEMY: Sprite = [
  [null, null, '#f00', '#f00', null, null, null, null, null, null, null, null],
  [null, '#f00', '#f00', '#f00', '#f00', null, null, null, null, null, null, null],
  [null, '#f00', '#ff0', '#f00', '#f00', null, null, '#555', '#555', null, null, null],
  ['#f00', '#f00', '#f00', '#f00', '#f00', '#555', '#555', '#555', '#555', '#555', null, null],
  ['#f00', '#f00', '#f00', '#f00', '#555', '#555', '#888', '#555', '#555', '#555', '#555', null],
  [null, '#f00', '#f00', '#555', '#555', '#555', '#555', '#555', '#555', '#555', '#555', null],
  [null, null, '#800', '#800', '#555', '#555', '#555', '#555', '#555', '#555', null, null],
  [null, null, '#800', '#800', null, '#555', '#555', '#555', null, null, null, null],
  [null, null, '#555', '#555', null, null, '#444', null, null, null, null, null],
];

export const JOUST_PLATFORM: Sprite = [
  ['#654', '#765', '#654', '#765', '#654', '#765', '#654', '#765'],
  ['#543', '#654', '#543', '#654', '#543', '#654', '#543', '#654'],
  ['#432', '#543', '#432', '#543', '#432', '#543', '#432', '#543'],
];

// ============== DIG DUG SPRITES ==============

export const DIGDUG_PLAYER: Sprite = [
  [null, null, '#fff', '#fff', '#fff', null, null, null],
  [null, '#fff', '#fdb', '#fdb', '#fdb', '#fff', null, null],
  [null, '#fff', '#000', '#fdb', '#000', '#fff', null, null],
  [null, null, '#fdb', '#fdb', '#fdb', null, null, null],
  [null, '#44f', '#fff', '#fff', '#fff', '#44f', null, null],
  ['#44f', '#44f', '#fff', '#fff', '#fff', '#44f', '#44f', null],
  [null, '#44f', '#fff', '#fff', '#fff', '#44f', null, null],
  [null, null, '#44f', null, '#44f', null, null, null],
  [null, null, '#840', null, '#840', null, null, null],
];

export const DIGDUG_POOKA: Sprite = [
  [null, null, '#f80', '#f80', '#f80', '#f80', null, null],
  [null, '#f80', '#f80', '#f80', '#f80', '#f80', '#f80', null],
  ['#f80', '#fff', '#00f', '#f80', '#f80', '#fff', '#00f', '#f80'],
  ['#f80', '#f80', '#f80', '#f80', '#f80', '#f80', '#f80', '#f80'],
  ['#f80', '#f80', '#f80', '#f80', '#f80', '#f80', '#f80', '#f80'],
  [null, '#f80', '#f80', '#f80', '#f80', '#f80', '#f80', null],
  [null, null, '#f80', null, null, '#f80', null, null],
];

export const DIGDUG_POOKA_INFLATED: Sprite = [
  [null, '#faa', '#faa', '#faa', '#faa', '#faa', '#faa', null],
  ['#faa', '#faa', '#faa', '#faa', '#faa', '#faa', '#faa', '#faa'],
  ['#faa', '#fff', '#f00', '#faa', '#faa', '#fff', '#f00', '#faa'],
  ['#faa', '#faa', '#faa', '#faa', '#faa', '#faa', '#faa', '#faa'],
  ['#faa', '#faa', '#faa', '#faa', '#faa', '#faa', '#faa', '#faa'],
  ['#faa', '#faa', '#faa', '#faa', '#faa', '#faa', '#faa', '#faa'],
  [null, '#faa', '#faa', '#faa', '#faa', '#faa', '#faa', null],
];

export const DIGDUG_FYGAR: Sprite = [
  [null, null, '#0a0', '#0a0', '#0a0', null, null, null],
  [null, '#0a0', '#0a0', '#0a0', '#0a0', '#0a0', null, null],
  ['#0a0', '#fff', '#f00', '#0a0', '#fff', '#f00', '#0a0', null],
  ['#0a0', '#0a0', '#0a0', '#0a0', '#0a0', '#0a0', '#0a0', '#0a0'],
  [null, '#0a0', '#0a0', '#0a0', '#0a0', '#0a0', '#0a0', null],
  [null, null, '#0a0', '#0a0', '#0a0', '#0a0', null, null],
  [null, null, '#0a0', null, null, '#0a0', null, null],
];

// ============== PAC-MAN SPRITES ==============

export const PACMAN_RIGHT: Sprite = [
  [null, null, '#ff0', '#ff0', '#ff0', null, null, null],
  [null, '#ff0', '#ff0', '#ff0', '#ff0', '#ff0', null, null],
  ['#ff0', '#ff0', '#ff0', '#ff0', '#ff0', null, null, null],
  ['#ff0', '#ff0', '#ff0', '#ff0', null, null, null, null],
  ['#ff0', '#ff0', '#ff0', '#ff0', null, null, null, null],
  ['#ff0', '#ff0', '#ff0', '#ff0', '#ff0', null, null, null],
  [null, '#ff0', '#ff0', '#ff0', '#ff0', '#ff0', null, null],
  [null, null, '#ff0', '#ff0', '#ff0', null, null, null],
];

export const GHOST_RED: Sprite = [
  [null, null, '#f00', '#f00', '#f00', '#f00', null, null],
  [null, '#f00', '#f00', '#f00', '#f00', '#f00', '#f00', null],
  ['#f00', '#fff', '#fff', '#f00', '#fff', '#fff', '#f00', '#f00'],
  ['#f00', '#fff', '#00f', '#f00', '#fff', '#00f', '#f00', '#f00'],
  ['#f00', '#f00', '#f00', '#f00', '#f00', '#f00', '#f00', '#f00'],
  ['#f00', '#f00', '#f00', '#f00', '#f00', '#f00', '#f00', '#f00'],
  ['#f00', null, '#f00', null, null, '#f00', null, '#f00'],
];

export const GHOST_BLUE: Sprite = GHOST_RED.map(row => 
  row.map(c => c === '#f00' ? '#0af' : c)
);

export const GHOST_SCARED: Sprite = [
  [null, null, '#00f', '#00f', '#00f', '#00f', null, null],
  [null, '#00f', '#00f', '#00f', '#00f', '#00f', '#00f', null],
  ['#00f', '#fdb', '#fdb', '#00f', '#fdb', '#fdb', '#00f', '#00f'],
  ['#00f', '#00f', '#00f', '#00f', '#00f', '#00f', '#00f', '#00f'],
  ['#00f', '#fdb', '#fdb', '#fdb', '#fdb', '#fdb', '#fdb', '#00f'],
  ['#00f', '#00f', '#00f', '#00f', '#00f', '#00f', '#00f', '#00f'],
  ['#00f', null, '#00f', null, null, '#00f', null, '#00f'],
];

// ============== GALAGA SPRITES ==============

export const GALAGA_PLAYER: Sprite = [
  [null, null, null, '#0f0', null, null, null],
  [null, null, '#0f0', '#0f0', '#0f0', null, null],
  [null, null, '#0f0', '#0f0', '#0f0', null, null],
  [null, '#0f0', '#0f0', '#0f0', '#0f0', '#0f0', null],
  ['#0f0', '#0f0', '#0f0', '#0f0', '#0f0', '#0f0', '#0f0'],
  ['#0f0', '#0f0', '#0f0', '#0f0', '#0f0', '#0f0', '#0f0'],
];

export const GALAGA_ENEMY: Sprite = [
  [null, '#f00', null, null, null, '#f00', null],
  ['#f00', '#ff0', '#f00', '#f00', '#f00', '#ff0', '#f00'],
  ['#f00', '#f00', '#f00', '#f00', '#f00', '#f00', '#f00'],
  [null, '#f00', '#f00', '#f00', '#f00', '#f00', null],
  [null, null, '#f00', null, '#f00', null, null],
];

// ============== SPACE INVADERS SPRITES ==============

export const INVADER_1: Sprite = [
  [null, null, '#0f0', null, null, null, '#0f0', null, null],
  [null, null, null, '#0f0', null, '#0f0', null, null, null],
  [null, null, '#0f0', '#0f0', '#0f0', '#0f0', '#0f0', null, null],
  [null, '#0f0', '#0f0', null, '#0f0', null, '#0f0', '#0f0', null],
  ['#0f0', '#0f0', '#0f0', '#0f0', '#0f0', '#0f0', '#0f0', '#0f0', '#0f0'],
  ['#0f0', null, '#0f0', '#0f0', '#0f0', '#0f0', '#0f0', null, '#0f0'],
  ['#0f0', null, '#0f0', null, null, null, '#0f0', null, '#0f0'],
  [null, null, null, '#0f0', null, '#0f0', null, null, null],
];

export const INVADER_2: Sprite = [
  [null, null, null, '#0ff', '#0ff', null, null, null],
  [null, '#0ff', '#0ff', '#0ff', '#0ff', '#0ff', '#0ff', null],
  ['#0ff', '#0ff', '#0ff', '#0ff', '#0ff', '#0ff', '#0ff', '#0ff'],
  ['#0ff', '#0ff', null, '#0ff', '#0ff', null, '#0ff', '#0ff'],
  ['#0ff', '#0ff', '#0ff', '#0ff', '#0ff', '#0ff', '#0ff', '#0ff'],
  [null, null, '#0ff', null, null, '#0ff', null, null],
  [null, '#0ff', null, '#0ff', '#0ff', null, '#0ff', null],
  ['#0ff', null, null, null, null, null, null, '#0ff'],
];

export const PLAYER_SHIP: Sprite = [
  [null, null, null, '#0f0', null, null, null],
  [null, null, '#0f0', '#0f0', '#0f0', null, null],
  ['#0f0', '#0f0', '#0f0', '#0f0', '#0f0', '#0f0', '#0f0'],
  ['#0f0', '#0f0', '#0f0', '#0f0', '#0f0', '#0f0', '#0f0'],
];

// ============== FROGGER SPRITES ==============

export const FROG: Sprite = [
  [null, '#0a0', '#0a0', null, null, '#0a0', '#0a0', null],
  ['#0a0', '#0f0', '#0f0', '#0a0', '#0a0', '#0f0', '#0f0', '#0a0'],
  ['#0a0', '#000', '#0f0', '#0f0', '#0f0', '#0f0', '#000', '#0a0'],
  [null, '#0a0', '#0f0', '#0f0', '#0f0', '#0f0', '#0a0', null],
  [null, null, '#0a0', '#0f0', '#0f0', '#0a0', null, null],
  [null, '#0a0', '#0a0', '#0f0', '#0f0', '#0a0', '#0a0', null],
  ['#0a0', '#0a0', null, '#0a0', '#0a0', null, '#0a0', '#0a0'],
];

export const CAR_RED: Sprite = [
  [null, '#a00', '#a00', '#a00', '#a00', '#a00', '#a00', null],
  ['#f00', '#f00', '#88f', '#f00', '#f00', '#88f', '#f00', '#f00'],
  ['#f00', '#f00', '#f00', '#f00', '#f00', '#f00', '#f00', '#f00'],
  [null, '#444', null, null, null, null, '#444', null],
];

export const LOG: Sprite = [
  ['#840', '#630', '#840', '#630', '#840', '#630', '#840', '#630'],
  ['#630', '#840', '#630', '#840', '#630', '#840', '#630', '#840'],
  ['#840', '#630', '#840', '#630', '#840', '#630', '#840', '#630'],
];

// ============== CENTIPEDE SPRITES ==============

export const CENTIPEDE_HEAD: Sprite = [
  [null, '#f0f', '#f0f', '#f0f', '#f0f', null],
  ['#f0f', '#fff', '#000', '#000', '#fff', '#f0f'],
  ['#f0f', '#f0f', '#f0f', '#f0f', '#f0f', '#f0f'],
  [null, '#f0f', null, null, '#f0f', null],
];

export const CENTIPEDE_BODY: Sprite = [
  [null, '#0f0', '#0f0', '#0f0', '#0f0', null],
  ['#0f0', '#0f0', '#0f0', '#0f0', '#0f0', '#0f0'],
  ['#0f0', '#0f0', '#0f0', '#0f0', '#0f0', '#0f0'],
  [null, '#0f0', null, null, '#0f0', null],
];

export const MUSHROOM: Sprite = [
  [null, '#f00', '#f00', '#f00', '#f00', null],
  ['#f00', '#f00', '#fff', '#fff', '#f00', '#f00'],
  ['#f00', '#f00', '#f00', '#f00', '#f00', '#f00'],
  [null, null, '#fc8', '#fc8', null, null],
  [null, null, '#fc8', '#fc8', null, null],
];

// ============== HELPER FUNCTIONS ==============

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  scale: number = 1,
  flipX: boolean = false
) {
  const height = sprite.length;
  const width = sprite[0].length;
  
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const color = sprite[row][flipX ? width - 1 - col : col];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(
          x + col * scale,
          y + row * scale,
          scale,
          scale
        );
      }
    }
  }
}

export function drawSpriteRotated(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  scale: number = 1,
  rotation: number = 0 // radians
) {
  const height = sprite.length;
  const width = sprite[0].length;
  const centerX = (width * scale) / 2;
  const centerY = (height * scale) / 2;
  
  ctx.save();
  ctx.translate(x + centerX, y + centerY);
  ctx.rotate(rotation);
  ctx.translate(-centerX, -centerY);
  
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const color = sprite[row][col];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(col * scale, row * scale, scale, scale);
      }
    }
  }
  
  ctx.restore();
}

// Get sprite dimensions
export function getSpriteSize(sprite: Sprite, scale: number = 1) {
  return {
    width: sprite[0].length * scale,
    height: sprite.length * scale,
  };
}
