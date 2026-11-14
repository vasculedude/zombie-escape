import Phaser from 'phaser';
import { getSurvivalItemById } from '../utils/survivalItemCatalog.js';

const ITEM_COLORS = {
    medkit: 0xc83d3d,
    bandages: 0xe7d9b6,
    armour_vest: 0x6a9c59,
    energy_drink: 0x43b9e8
};

const ITEM_LABELS = {
    medkit: 'M',
    bandages: 'B',
    armour_vest: 'AV',
    energy_drink: 'E'
};

export default class SurvivalItemPickup extends Phaser.GameObjects.Container {
    constructor(scene, x, y, itemId) {
        super(scene, x, y);

        const item = getSurvivalItemById(itemId);
        if (!item || item.effect === 'backpack') {
            throw new RangeError(`Unknown spawnable survival item: ${itemId}`);
        }

        this.itemId = itemId;
        this.item = item;
        this.setDepth(9);

        const shadow = scene.add.ellipse(0, 17, 38, 10, 0x000000, 0.3);
        const background = scene.add.rectangle(
            0,
            0,
            34,
            34,
            ITEM_COLORS[itemId]
        ).setStrokeStyle(3, 0xffffff);
        const label = scene.add.text(0, 0, ITEM_LABELS[itemId], {
            fontSize: itemId === 'armour_vest' ? '11px' : '17px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.add([shadow, background, label]);
        scene.add.existing(this);
    }
}
