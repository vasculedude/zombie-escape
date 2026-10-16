import Phaser from 'phaser';

export default class LoginScene extends Phaser.Scene {
    constructor() {
        super('LoginScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#101010');

        this.add.text(400, 65, 'ZOMBIE ESCAPE', {
            fontSize: '42px',
            color: '#55ff55',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 115, 'SURVIVOR LOGIN', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(260, 185, 'Username:', {
            fontSize: '20px',
            color: '#ffffff'
        });

        this.username = '';
        this.password = '';
        this.activeField = 'username';
        this.passwordMode = false;

        this.usernameText = this.add.text(260, 220, '', {
            fontSize: '20px',
            color: '#55ff55',
            backgroundColor: '#222222',
            padding: { x: 8, y: 8 }
        });

        this.add.text(260, 285, 'Password:', {
            fontSize: '20px',
            color: '#ffffff'
        });

        this.passwordText = this.add.text(260, 320, '', {
            fontSize: '20px',
            color: '#55ff55',
            backgroundColor: '#222222',
            padding: { x: 8, y: 8 }
        });

        this.add.text(400, 375,
            'Click a field, then type. Backspace deletes.',
            { fontSize: '13px', color: '#aaaaaa' }
        ).setOrigin(0.5);

        this.makeButton(300, 435, 'LOG IN', () => {
            this.submitAccount('/login');
        });

        this.makeButton(510, 435, 'CREATE ACCOUNT', () => {
            this.submitAccount('/register');
        });

        this.statusText = this.add.text(400, 500, '', {
            fontSize: '16px',
            color: '#ffff66',
            align: 'center',
            wordWrap: { width: 700 }
        }).setOrigin(0.5);

        this.add.text(400, 555, 'Use a unique password for this game.', {
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5);

        this.usernameText.setText('Click here to enter username');
        this.passwordText.setText('Click here to enter password');

        this.usernameText.setInteractive({ useHandCursor: true });
        this.passwordText.setInteractive({ useHandCursor: true });

        this.usernameText.on('pointerdown', () => {
            this.activeField = 'username';
            this.statusText.setText('Typing username...');
        });

        this.passwordText.on('pointerdown', () => {
            this.activeField = 'password';
            this.statusText.setText('Typing password...');
        });

        this.input.keyboard.on('keydown', (event) => {
            if (event.key === 'Tab') {
                event.preventDefault();
                this.activeField =
                    this.activeField === 'username' ? 'password' : 'username';
                return;
            }

            if (event.key === 'Backspace') {
                if (this.activeField === 'username') {
                    this.username = this.username.slice(0, -1);
                } else {
                    this.password = this.password.slice(0, -1);
                }
            } else if (event.key === 'Enter') {
                this.submitAccount('/login');
                return;
            } else if (event.key.length === 1 && !event.ctrlKey && !event.altKey) {
                if (this.activeField === 'username' && this.username.length < 16) {
                    this.username += event.key;
                } else if (this.activeField === 'password' && this.password.length < 64) {
                    this.password += event.key;
                }
            }

            this.refreshFields();
        });
    }

    refreshFields() {
        this.usernameText.setText(
            this.activeField === 'username' ? this.username + '_' : this.username
        );

        this.passwordText.setText(
            this.activeField === 'password'
                ? '*'.repeat(this.password.length) + '_'
                : '*'.repeat(this.password.length)
        );
    }

    makeButton(x, y, label, callback) {
        const button = this.add.text(x, y, label, {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#245c24',
            padding: { x: 12, y: 12 }
        }).setOrigin(0.5);

        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => button.setStyle({ color: '#55ff55' }));
        button.on('pointerout', () => button.setStyle({ color: '#ffffff' }));
        button.on('pointerdown', callback);

        return button;
    }

    async submitAccount(endpoint) {
        if (!this.username.trim() || !this.password) {
            this.statusText.setText('Enter a username and password.');
            return;
        }

        this.statusText.setText('Connecting to server...');

        try {
            const SERVER_URL = import.meta.env.DEV
                ? 'http://localhost:3001'
                : 'https://zombie-escape-2qlc.onrender.com';

            const response = await fetch(`${SERVER_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: this.username.trim(),
                    password: this.password
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                this.statusText.setText(result.message || 'Request failed.');
                return;
            }

            if (endpoint === '/register') {
                this.statusText.setText('Account created! Now click LOG IN.');
                return;
            }

            this.registry.set('username', result.username);
            this.statusText.setText(`Welcome, ${result.username}!`);

            this.time.delayedCall(700, () => {
                this.scene.start('MenuScene');
            });
        } catch (error) {
            this.statusText.setText(
                'Cannot reach the server. Is it running on port 3001?'
            );
        }
    }
}
