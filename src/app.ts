/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import {Actor, Color3, Color4, User} from '@microsoft/mixed-reality-extension-sdk';
import * as https from 'https';

/**
 * The main class of this app. All the logic goes here.
 */
export default class PollManager {
	private adminPollDevice: MRE.Actor = null;
	private assets: MRE.AssetContainer;
	private pollRunning = false;
	private pollResults: string[] = [];
	private voteButtons: MRE.Actor[] = [];

	constructor(private context: MRE.Context) {
		this.context.onStarted(() => this.started());
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private started() {
		// set up somewhere to store loaded assets (meshes, textures, animations, gltfs, etc.)
		this.assets = new MRE.AssetContainer(this.context);
		this.createAdminPollDevice();
	}

	private get moderators(): User[] {
		return this.context.users.filter((u) => u.properties['altspacevr-roles'].includes('moderator'));
	}

	private createAdminPollDevice() {
		this.adminPollDevice = MRE.Actor.Create(this.context, {});

		const red = Color3.FromHexString('#FF0000');
		const green = Color3.FromHexString('#00FF00');
		const pollButtonMesh = this.assets.createCylinderMesh('pollButtonMesh', 0.01, 0.3, 'z');
		const pollButtonMaterial = this.assets.createMaterial('pollButtonMaterial', { color: green });

		const pollButton = MRE.Actor.Create(this.context, {
			actor: {
				parentId: this.adminPollDevice.id,
				name: 'pollButton',
				appearance: {
					meshId: pollButtonMesh.id,
					materialId: pollButtonMaterial.id,
				},
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: { position: { x: 0, y: 0, z: 0 } }
				}
			}
		});
		const pollText = MRE.Actor.Create(this.context, {
			actor: {
				parentId: pollButton.id,
				transform: {local: {position: {x: 0, y: 0, z: -0.0051}}},
				text: {
					contents: 'Start poll',
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					height: 0.1
				}
			}
		})

		const buttonBehavior = pollButton.setBehavior(MRE.ButtonBehavior);

		buttonBehavior.onHover('enter', () => {
			MRE.Animation.AnimateTo(this.context, pollButton, {
				destination: { transform: { local: { scale: { x: 1.3, y: 1.3, z: 1.3 } } } },
				duration: 0.3,
				easing: MRE.AnimationEaseCurves.EaseOutSine
			});
		});
		buttonBehavior.onHover('exit', () => {
			MRE.Animation.AnimateTo(this.context, pollButton, {
				destination: { transform: { local: { scale: { x: 1, y: 1, z: 1 } } } },
				duration: 0.3,
				easing: MRE.AnimationEaseCurves.EaseOutSine
			});
		});
		buttonBehavior.onClick(() => {
			if (this.pollRunning) {
				this.pollRunning = false
				pollButtonMaterial.color = Color4.FromColor3(green);
				pollText.text.contents = 'Poll again'
				this.removePollDevices();
				console.log('Stopping poll');
				console.log(this.pollResults);
				this.moderators.forEach(user => user.prompt(`Poll results: ${this.pollResults}`));
				this.pollResults = [];
			} else {
				this.pollRunning = true
				pollButtonMaterial.color = Color4.FromColor3(red);
				pollText.text.contents = 'End poll'
				console.log('Starting poll');
				this.attachPollDevices();
			}
		});
	}

	private removePollDevices() {
		this.voteButtons.forEach(button => button.destroy());
	}

	private attachPollDevices() {
		const thankyou = this.assets.createSound('thankyou', {
			uri: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/En-us-thanks.ogg'
		});

		this.context.users.forEach((user) => {
			const baseCylinder = this.assets.createCylinderMesh('cylinder', 0.01, 0.09, 'z');
			const red = Color3.FromHexString('#FF0000');
			const green = Color3.FromHexString('#00FF00');
			const blue = Color3.FromHexString('#0000FF');
			const yellow = Color3.FromHexString('#FFFF00');
			const materials = [
				this.assets.createMaterial('redMaterial', { color: red }),
				this.assets.createMaterial('greenMaterial', { color: green }),
				this.assets.createMaterial('blueMaterial', { color: blue }),
				this.assets.createMaterial('yellowButtonMaterial', { color: yellow }),
			]
			const buttonTexts = ['A', 'B', 'C', 'D'];

			const voteButtons = materials.map((material, index) => {
				const column = index % 2;
				const row = Math.round((index + 1) / 2) - 1;
				const buttonText = buttonTexts[index];

				const voteButton = MRE.Actor.Create(this.context, {
					actor: {
						transform: {local: {position: {x: -0.1 + column * 0.2, y: 0.1 - row * 0.2, z: 0.5}}},
						appearance: {
							meshId: baseCylinder.id,
							materialId: material.id
						},
						collider: {geometry: {shape: MRE.ColliderType.Auto}},
						exclusiveToUser: user.id,
						attachment: {
							attachPoint: 'center-eye',
							userId: user.id
						}
					}
				});

				MRE.Actor.Create(this.context, {
					actor: {
						parentId: voteButton.id,
						transform: {local: {position: {x: 0, y: 0, z: -0.0051}}},
						text: {
							contents: buttonText,
							anchor: MRE.TextAnchorLocation.MiddleCenter,
							height: 0.1
						}
					}
				})

				const buttonBehavior = voteButton.setBehavior(MRE.ButtonBehavior);
				buttonBehavior.onClick(() => {
					//voteButton.startSound(thankyou.id, {time: 0});
					this.pollResults.push(buttonText);
					voteButtons.forEach(b => b.destroy());
				});
				buttonBehavior.onHover('enter', () => {
					MRE.Animation.AnimateTo(this.context, voteButton, {
						destination: { transform: { local: { scale: { x: 1.3, y: 1.3, z: 1.3 } } } },
						duration: 0.3,
						easing: MRE.AnimationEaseCurves.EaseOutSine
					});
				});
				buttonBehavior.onHover('exit', () => {
					MRE.Animation.AnimateTo(this.context, voteButton, {
						destination: { transform: { local: { scale: { x: 1, y: 1, z: 1 } } } },
						duration: 0.3,
						easing: MRE.AnimationEaseCurves.EaseOutSine
					});
				});

				return voteButton;
			})

			voteButtons.forEach(b => this.voteButtons.push(b))
		})

	}
}
