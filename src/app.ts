/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import {Color3, Color4, User} from '@microsoft/mixed-reality-extension-sdk';
import * as https from 'https';

/**
 * The main class of this app. All the logic goes here.
 */
export default class PollManager {
	private adminPollDevice: MRE.Actor = null;
	private assets: MRE.AssetContainer;
	private pollRunning = false;
	private pollResults: string[] = [];

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

	private moderators(): User[] {
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
				console.log('Stopping poll');
				console.log(this.pollResults);
				this.pollResults = [];
			} else {
				this.pollRunning = true
				pollButtonMaterial.color = Color4.FromColor3(red);
				console.log('Starting poll');
				this.context.users.forEach((u) => this.attachPollDevice(u))
			}

			//console.log(this.moderators().map(u => u.name))
		});
	}

	private attachPollDevice(user: User) {
		// TODO fabian add buttons

	}
}
