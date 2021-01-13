/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { Color3 } from '@microsoft/mixed-reality-extension-sdk';
import * as https from 'https';

/**
 * The main class of this app. All the logic goes here.
 */
export default class RedmineSprint {
	private handheld: MRE.Actor = null;
	private assets: MRE.AssetContainer;

	constructor(private context: MRE.Context) {
		this.context.onStarted(() => this.started());
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private started() {
		// set up somewhere to store loaded assets (meshes, textures, animations, gltfs, etc.)
		this.assets = new MRE.AssetContainer(this.context);
		this.handheld = MRE.Actor.Create(this.context, {});

		const red = Color3.FromHexString('#FF0000');
		const buttonAMesh = this.assets.createCylinderMesh('buttonAMesh', 0.01, 0.3, 'z');
		const buttonAMaterial = this.assets.createMaterial('buttonAMaterial', { color: red });

		const buttonA = MRE.Actor.Create(this.context, {
			actor: {
				parentId: this.handheld.id,
				name: 'buttonA',
				appearance: {
					meshId: buttonAMesh.id,
					materialId: buttonAMaterial.id,
				},
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: { position: { x: 0, y: 0, z: 0 } }
				}
			}
		});

		const buttonBehavior = buttonA.setBehavior(MRE.ButtonBehavior);

		buttonBehavior.onHover('enter', () => {
			MRE.Animation.AnimateTo(this.context, buttonA, {
				destination: { transform: { local: { scale: { x: 1.3, y: 1.3, z: 1.3 } } } },
				duration: 0.3,
				easing: MRE.AnimationEaseCurves.EaseOutSine
			});
		});
		buttonBehavior.onHover('exit', () => {
			MRE.Animation.AnimateTo(this.context, buttonA, {
				destination: { transform: { local: { scale: { x: 1, y: 1, z: 1 } } } },
				duration: 0.3,
				easing: MRE.AnimationEaseCurves.EaseOutSine
			});
		});
		buttonBehavior.onClick(() => {
			console.log('vote A')
		});
	}
}
