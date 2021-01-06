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
	private text: MRE.Actor = null;
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

		// Create a new actor with no mesh, but some text.
		this.text = MRE.Actor.Create(this.context, {
			actor: {
				name: 'Text',
				transform: {
					app: { position: { x: 0, y: 0.5, z: 0 } }
				},
				text: {
					contents: "Calling Redmine…",
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: Color3.FromHexString('#27d79d'),
					height: 0.3
				},
				collider: {
					geometry: {
						shape: MRE.ColliderType.Sphere,
						radius: 0.6
					}
				},
				
			}
		});

		// Set up cursor interaction. We add the input behavior ButtonBehavior to the text.
		// Button behaviors have two pairs of events: hover start/stop, and click start/stop.
		const buttonBehavior = this.text.setBehavior(MRE.ButtonBehavior);

		// Trigger the grow/shrink animations on hover.
		buttonBehavior.onHover('enter', () => {
			// use the convenience function "AnimateTo" instead of creating the animation data in advance
			MRE.Animation.AnimateTo(this.context, this.text, {
				destination: { transform: {
					local: { scale: { x: 1.3, y: 1.3, z: 1.3 } }
				} },
				duration: 0.3,
				easing: MRE.AnimationEaseCurves.EaseOutSine
			});
		});
		buttonBehavior.onHover('exit', () => {
			MRE.Animation.AnimateTo(this.context, this.text, {
				destination: { transform: {
					local: { scale: { x: 1, y: 1, z: 1 } }
				} },
				duration: 0.3,
				easing: MRE.AnimationEaseCurves.EaseOutSine
			});
		});

		const options: https.RequestOptions = {
			hostname: 'redmine.renuo.ch',
			port: 443,
			path: '/issues.json?cf_8=!1&project.cf_6=!0&status_id=13',
			headers: {
				'X-Redmine-API-Key': process.env.REDMINE_API_KEY
			}
		};

		https.get(options, (res) => {
			let body = "";
	
			res.on("data", (chunk) => {
				body += chunk;
			});
	
			res.on("end", () => {
				try {
					const json = JSON.parse(body);
					this.text.text.contents = `${json.total_count} tickets to estimate`;
				} catch (error) {
					console.error(error.message)
				}
			});
		}).on("error", (error) => {
			console.error(error.message);
		});
	}
}
