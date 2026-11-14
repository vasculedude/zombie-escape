import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#101010');

        // Game title
        this.add.text(400, 120, 'ZOMBIE ESCAPE', {
            fontSize: '52px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.coinsText = this.add.text(
            780,
            20,
            `Coins: ${this.registry.get('coins') ?? 0}`,
            {
                fontSize: '22px',
                color: '#ffd45c',
                fontStyle: 'bold'
            }
        ).setOrigin(1, 0);

        this.loadCoins();

        // New Game button
        const newGame = this.add.text(400, 250, 'NEW GAME', {
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: {
                x: 30,
                y: 15
            }
        }).setOrigin(0.5);

        newGame.setInteractive({ useHandCursor: true });

        newGame.on('pointerover', () => {
            newGame.setStyle({ color: '#ffff00' });
        });

        newGame.on('pointerout', () => {
            newGame.setStyle({ color: '#ffffff' });
        });

        newGame.on('pointerdown', () => {
            this.scene.start('CharacterScene');
        });

        // Continue button
        const continueButton = this.add.text(400, 330, 'CONTINUE', {
            fontSize: '28px',
            color: '#777777'
        }).setOrigin(0.5);

        const shop = this.add.text(400, 375, 'SHOP', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        shop.setInteractive({ useHandCursor: true });

        shop.on('pointerover', () => {
            shop.setStyle({ color: '#ffff00' });
        });

        shop.on('pointerout', () => {
            shop.setStyle({ color: '#ffffff' });
        });

        shop.on('pointerdown', () => {
            this.scene.start('ShopScene');
        });

        const armory = this.add.text(400, 415, 'ARMORY', {
            fontSize: '25px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#245c24',
            padding: { x: 28, y: 9 }
        }).setOrigin(0.5);

        armory.setInteractive({ useHandCursor: true });
        armory.on('pointerover', () => {
            armory.setStyle({ backgroundColor: '#347c34', color: '#ffffff' });
        });
        armory.on('pointerout', () => armory.setStyle({ color: '#ffffff' }));
        armory.on('pointerdown', () => this.scene.start('ArmoryScene'));

        // Settings button
        const settings = this.add.text(400, 460, 'SETTINGS', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        settings.setInteractive({ useHandCursor: true });

        settings.on('pointerover', () => {
            settings.setStyle({ color: '#ffff00' });
        });

        settings.on('pointerout', () => {
            settings.setStyle({ color: '#ffffff' });
        });

        this.createPromoCodePanel();
    }

    createPromoCodePanel() {
        const promoMarkup = `
            <div style="
                display: flex;
                flex-direction: column;
                gap: 8px;
                width: 260px;
                font-family: Arial, sans-serif;
            ">
                <button id="promo-toggle-button" type="button" aria-expanded="false" style="
                    align-self: flex-start;
                    border: 2px solid #75ff75;
                    border-radius: 6px;
                    background: #168a35;
                    color: #ffffff;
                    font-size: 18px;
                    font-weight: bold;
                    letter-spacing: 1px;
                    padding: 10px 14px;
                    cursor: pointer;
                    box-shadow: 0 3px 0 #0b4d1d;
                ">PROMOCODE</button>
                <div id="promo-code-form" style="
                    display: none;
                    flex-direction: column;
                    gap: 8px;
                    width: 260px;
                    padding: 10px 12px;
                    border-radius: 8px;
                    border: 2px solid #168a35;
                    background: rgba(20, 20, 20, 0.95);
                ">
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input id="promo-code-input" type="text" maxlength="20" placeholder="ENTER CODE" style="
                            flex: 1;
                            min-width: 0;
                            font-size: 14px;
                            padding: 8px 10px;
                            border-radius: 6px;
                            border: 1px solid #666;
                            background: rgba(255, 255, 255, 0.08);
                            color: #ffffff;
                            outline: none;
                        ">
                        <button id="promo-code-button" type="button" style="
                            border: none;
                            border-radius: 6px;
                            background: #168a35;
                            color: #ffffff;
                            font-weight: bold;
                            padding: 8px 10px;
                            cursor: pointer;
                        ">Redeem</button>
                    </div>
                    <div id="promo-code-status" style="font-size: 12px; color: #d4d4d4; min-height: 15px;">Enter a promo code to get rewards.</div>
                </div>
            </div>
        `;

        this.promoPanel = this.add.dom(400, 505).createFromHTML(promoMarkup);
        this.promoPanel.setOrigin(0.5, 0.5);
        this.promoPanel.setDepth(200000);

        this.promoToggleButton = this.promoPanel.getChildByID('promo-toggle-button');
        this.promoForm = this.promoPanel.getChildByID('promo-code-form');
        this.promoInput = this.promoPanel.getChildByID('promo-code-input');
        this.promoButton = this.promoPanel.getChildByID('promo-code-button');
        this.promoStatus = this.promoPanel.getChildByID('promo-code-status');

        this.promoToggleButton.addEventListener('click', () => {
            const isOpen = this.promoForm.style.display !== 'none';
            this.promoForm.style.display = isOpen ? 'none' : 'flex';
            this.promoToggleButton.setAttribute('aria-expanded', String(!isOpen));

            if (!isOpen) {
                this.promoInput.focus();
            }
        });

        this.promoInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.redeemPromoCode();
            }
        });

        this.promoButton.addEventListener('click', () => {
            this.redeemPromoCode();
        });
    }

    setPromoStatus(message, color = '#d4d4d4') {
        if (!this.promoStatus) return;
        this.promoStatus.textContent = message;
        this.promoStatus.style.color = color;
    }

    async redeemPromoCode() {
        const token = this.registry.get('authToken');
        const code = this.promoInput?.value?.trim() || '';

        if (!code) {
            this.setPromoStatus('Enter a promo code first.', '#ffb3b3');
            return;
        }

        if (!token) {
            this.setPromoStatus('Log in first to redeem rewards.', '#ffb3b3');
            return;
        }

        this.setPromoStatus('Checking code...', '#ffcc66');

        const serverUrl = import.meta.env.DEV
            ? 'http://localhost:3001'
            : 'https://zombie-escape-2qlc.onrender.com';

        try {
            const response = await fetch(`${serverUrl}/promo/redeem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ code })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'The promo code could not be used.');
            }

            if (Number.isInteger(result.coins)) {
                this.registry.set('coins', result.coins);
                this.coinsText.setText(`Coins: ${result.coins}`);
            }

            if (Array.isArray(result.ownedWeapons)) {
                this.registry.set('ownedWeapons', result.ownedWeapons);
            }

            this.promoInput.value = '';
            this.setPromoStatus(result.message || 'Promo redeemed!', '#7ef29a');
        } catch (error) {
            this.setPromoStatus(error.message || 'Promo code failed.', '#ffb3b3');
        }
    }

    async loadCoins() {
        const token = this.registry.get('authToken');
        if (!token) return;

        const serverUrl = import.meta.env.DEV
            ? 'http://localhost:3001'
            : 'https://zombie-escape-2qlc.onrender.com';

        try {
            const response = await fetch(`${serverUrl}/coins`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const result = await response.json();

            if (!response.ok || !result.success || !Number.isInteger(result.coins)) {
                throw new Error(result.message || 'Could not load coins.');
            }

            this.registry.set('coins', result.coins);
            this.coinsText.setText(`Coins: ${result.coins}`);
        } catch (error) {
            console.error('Could not load coins on the main screen:', error);
        }
    }
}
