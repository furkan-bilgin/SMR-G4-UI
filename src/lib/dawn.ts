import * as THREE from 'three';

// Helper to create text sprites for 3D markers
function createTextSprite(
	message: string,
	fontface: string = 'Times-Roman',
	fontsize: number = 12,
	textColor: string = '#ffffff',
	backgroundColor = 'rgba(0,0,0,0)'
) {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	if (!context) {
		throw new Error('Failed to get canvas context');
	}

	context.font = `${fontsize}pt ${fontface}`;
	const metrics = context.measureText(message);
	const textWidth = metrics.width;
	const textHeight = fontsize;

	const padding = 10;
	canvas.width = textWidth + padding * 2;
	canvas.height = textHeight + padding * 2;

	context.font = `${fontsize}pt ${fontface}`;
	context.fillStyle = backgroundColor;
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = textColor;
	context.textAlign = 'left';
	context.textBaseline = 'top';
	context.fillText(message, padding, padding);

	const texture = new THREE.CanvasTexture(canvas);
	texture.minFilter = THREE.LinearFilter;
	texture.needsUpdate = true;

	const spriteMaterial = new THREE.SpriteMaterial({
		map: texture,
		transparent: true,
		opacity: 0.8
	});
	const sprite = new THREE.Sprite(spriteMaterial);
	sprite.scale.set(canvas.width * 0.1, canvas.height * 0.1, 1);
	return sprite;
}

export interface TwoDText {
	x: number; // X position in mm
	y: number; // Y position in mm
	size: number; // Font size in points
	text: string; // Text content
	color: string; // Text color
	font: string; // Font name
}

export interface DawnFileData {
	scene: THREE.Scene;
	twoDTexts: any[];
}

export function parseAndRenderDawnfile(fileContent: string) {
	const lines = fileContent.split('\n');
	const newScene = new THREE.Scene();
	newScene.background = new THREE.Color(0x0);

	newScene.add(new THREE.AmbientLight(0x505050));
	const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(10, 10, 10);
	newScene.add(directionalLight);

	const defaultOpacity = 0.8;
	const highlightOpacity = 1;
	let currentColor = new THREE.Color(0xffffff);
	let currentOrigin = new THREE.Vector3(0, 0, 0);
	let baseMatrix = new THREE.Matrix4();
	let forceWireframe = false; // All 3D things transparent
	let currentFontName = 'Times-Roman';
	let currentNdiv = 24;

	let isParsingPolyline = false;
	let polylinePoints: THREE.Vector3[] = [];

	let isParsingPolyhedron = false;
	let polyhedronVertices: THREE.Vector3[] = [];
	let polyhedronFacets: number[][] = [];
	let vertexCounter = 0;
	let skipUntilNextPVName = false;
	let currentPVName: string | null = null;

	const tempTwoDTexts: TwoDText[] = [];

	const getOpacity = () => {
		if (currentPVName === 'ControlRod' || currentPVName === 'FuelPin') {
			return highlightOpacity;
		}
		return defaultOpacity;
	};

	lines.forEach((line) => {
		const trimmedLine = line.trim();
		if (
			(trimmedLine.startsWith('#') && !trimmedLine.startsWith('#/PVName')) ||
			trimmedLine === '' ||
			trimmedLine.startsWith('##G4.PRIM-FORMAT')
		)
			return;

		const parts = trimmedLine.split(/\s+/);
		const command = parts[0];
		if (command.startsWith('#/PVName')) {
			const pvName = parts[1].split(':')[0].trim();
			if (pvName === 'World') {
				skipUntilNextPVName = true;
			} else {
				skipUntilNextPVName = false;
			}
			currentPVName = pvName;
		}
		if (skipUntilNextPVName) {
			return;
		}
		forceWireframe = !['ControlRod', 'FuelPin'].includes(currentPVName);
		if (isParsingPolyline) {
			if (command === '/EndPolyline') {
				if (polylinePoints.length > 0) {
					const transformedPoints = polylinePoints.map((p) =>
						p.clone().applyMatrix4(baseMatrix).add(currentOrigin)
					);
					const geometry = new THREE.BufferGeometry().setFromPoints(transformedPoints);
					const material = new THREE.LineBasicMaterial({
						color: currentColor,
						transparent: true,
						opacity: getOpacity()
					});
					const lineSegment = new THREE.Line(geometry, material);
					newScene.add(lineSegment);
				}
				isParsingPolyline = false;
				polylinePoints = [];
			} else if (command === '/PLVertex') {
				const x = parseFloat(parts[1]);
				const y = parseFloat(parts[2]);
				const z = parseFloat(parts[3]);
				if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
					polylinePoints.push(new THREE.Vector3(x, y, z));
				}
			}
			return;
		}

		if (isParsingPolyhedron) {
			if (command === '/EndPolyhedron') {
				if (polyhedronVertices.length > 0 && polyhedronFacets.length > 0) {
					const geometry = new THREE.BufferGeometry();
					const positions: number[] = [];
					const indices: number[] = [];

					polyhedronFacets.forEach((facet) => {
						if (facet.length >= 3) {
							for (let i = 0; i < facet.length - 2; i++) {
								const v1_idx = Math.abs(facet[0]) - 1;
								const v2_idx = Math.abs(facet[i + 1]) - 1;
								const v3_idx = Math.abs(facet[i + 2]) - 1;

								if (
									polyhedronVertices[v1_idx] &&
									polyhedronVertices[v2_idx] &&
									polyhedronVertices[v3_idx]
								) {
									const p1 = polyhedronVertices[v1_idx]
										.clone()
										.applyMatrix4(baseMatrix)
										.add(currentOrigin);
									const p2 = polyhedronVertices[v2_idx]
										.clone()
										.applyMatrix4(baseMatrix)
										.add(currentOrigin);
									const p3 = polyhedronVertices[v3_idx]
										.clone()
										.applyMatrix4(baseMatrix)
										.add(currentOrigin);

									positions.push(p1.x, p1.y, p1.z);
									positions.push(p2.x, p2.y, p2.z);
									positions.push(p3.x, p3.y, p3.z);

									indices.push(
										positions.length / 3 - 3,
										positions.length / 3 - 2,
										positions.length / 3 - 1
									);
								}
							}
						}
					});

					if (positions.length > 0) {
						geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
						geometry.setIndex(indices);
						geometry.computeVertexNormals();

						const material = new THREE.MeshStandardMaterial({
							color: currentColor,
							wireframe: forceWireframe,
							metalness: 0.1,
							roughness: 0.6,
							transparent: true,
							opacity: getOpacity()
						});
						const polyhedron = new THREE.Mesh(geometry, material);
						newScene.add(polyhedron);
					}
				}
				isParsingPolyhedron = false;
				polyhedronVertices = [];
				polyhedronFacets = [];
				vertexCounter = 0;
			} else if (command === '/Vertex') {
				const x = parseFloat(parts[1]);
				const y = parseFloat(parts[2]);
				const z = parseFloat(parts[3]);
				if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
					polyhedronVertices.push(new THREE.Vector3(x, y, z));
					vertexCounter++;
				}
			} else if (command === '/Facet') {
				const facetVertices = parts
					.slice(1)
					.map((v) => parseInt(v, 10))
					.filter((v) => !isNaN(v));
				if (facetVertices.length >= 3) {
					polyhedronFacets.push(facetVertices);
				}
			}
			return;
		}

		switch (command) {
			case '/ForceWireframe': {
				const value = parseInt(parts[1], 10);
				if (!isNaN(value)) {
					// forceWireframe = value === 1;
				}
				break;
			}
			case '/BaseVector': {
				const [x1, y1, z1, x2, y2, z2] = parts.slice(1).map((p) => parseFloat(p));
				if ([x1, y1, z1, x2, y2, z2].every((v) => !isNaN(v))) {
					const newX = new THREE.Vector3(x1, y1, z1).normalize();
					const newY = new THREE.Vector3(x2, y2, z2).normalize();
					const newZ = new THREE.Vector3().crossVectors(newX, newY).normalize();
					baseMatrix.makeBasis(newX, newY, newZ);
				}
				break;
			}
			case '/MarkCircle2D': {
				const [x, y, z, radius] = parts.slice(1).map((p) => parseFloat(p));
				if (!isNaN(x) && !isNaN(y) && !isNaN(z) && !isNaN(radius) && radius > 0) {
					const geometry = new THREE.CircleGeometry(radius, 32);
					const material = new THREE.MeshBasicMaterial({
						color: currentColor,
						side: THREE.DoubleSide,
						transparent: true,
						opacity: getOpacity()
					});
					const circleMarker = new THREE.Mesh(geometry, material);
					circleMarker.position.set(x, y, z).applyMatrix4(baseMatrix).add(currentOrigin);
					newScene.add(circleMarker);
				}
				break;
			}
			case '/MarkCircle2DS': {
				const [x, y, z, radius] = parts.slice(1).map((p) => parseFloat(p));
				if (!isNaN(x) && !isNaN(y) && !isNaN(z) && !isNaN(radius) && radius > 0) {
					const spriteMap = new THREE.CanvasTexture(
						(() => {
							const canvas = document.createElement('canvas');
							const context = canvas.getContext('2d');
							if (!context) {
								throw new Error('Failed to get canvas context');
							}
							const diam = radius * 2 + 2;
							canvas.width = diam;
							canvas.height = diam;
							context.beginPath();
							context.arc(radius + 1, radius + 1, radius, 0, Math.PI * 2, true);
							context.closePath();
							context.fillStyle = currentColor.getStyle();
							context.fill();
							return canvas;
						})()
					);
					spriteMap.minFilter = THREE.LinearFilter;
					const spriteMaterial = new THREE.SpriteMaterial({
						map: spriteMap,
						transparent: true,
						opacity: getOpacity()
					});
					const circleMarker = new THREE.Sprite(spriteMaterial);
					circleMarker.position.set(x, y, z).applyMatrix4(baseMatrix).add(currentOrigin);
					circleMarker.scale.set(radius * 2, radius * 2, 1);
					newScene.add(circleMarker);
				}
				break;
			}
			case '/MarkSquare2D': {
				const [x, y, z, dx] = parts.slice(1).map((p) => parseFloat(p));
				if (!isNaN(x) && !isNaN(y) && !isNaN(z) && !isNaN(dx) && dx > 0) {
					const geometry = new THREE.PlaneGeometry(dx * 2, dx * 2);
					const material = new THREE.MeshBasicMaterial({
						color: currentColor,
						side: THREE.DoubleSide,
						transparent: true,
						opacity: getOpacity()
					});
					const squareMarker = new THREE.Mesh(geometry, material);
					squareMarker.position.set(x, y, z).applyMatrix4(baseMatrix).add(currentOrigin);
					newScene.add(squareMarker);
				}
				break;
			}
			case '/MarkSquare2DS': {
				const [x, y, z, dx] = parts.slice(1).map((p) => parseFloat(p));
				if (!isNaN(x) && !isNaN(y) && !isNaN(z) && !isNaN(dx) && dx > 0) {
					const spriteMap = new THREE.CanvasTexture(
						(() => {
							const canvas = document.createElement('canvas');
							const side = dx * 2 + 2;
							canvas.width = side;
							canvas.height = side;
							const context = canvas.getContext('2d');
							if (!context) {
								throw new Error('Failed to get canvas context');
							}
							context.fillStyle = currentColor.getStyle();
							context.fillRect(0, 0, side, side);
							return canvas;
						})()
					);
					spriteMap.minFilter = THREE.LinearFilter;
					const spriteMaterial = new THREE.SpriteMaterial({
						map: spriteMap,
						transparent: true,
						opacity: getOpacity()
					});
					const squareMarker = new THREE.Sprite(spriteMaterial);
					squareMarker.position.set(x, y, z).applyMatrix4(baseMatrix).add(currentOrigin);
					squareMarker.scale.set(dx * 2, dx * 2, 1);
					newScene.add(squareMarker);
				}
				break;
			}
			case '/MarkText2D':
			case '/MarkText2DS': {
				const x = parseFloat(parts[1]);
				const y = parseFloat(parts[2]);
				const z = parseFloat(parts[3]);
				const size = parseFloat(parts[4]);
				const xOffset = parseFloat(parts[5]);
				const yOffset = parseFloat(parts[6]);
				const textString = parts.slice(7).join(' ');

				if (
					!isNaN(x) &&
					!isNaN(y) &&
					!isNaN(z) &&
					!isNaN(size) &&
					size > 0 &&
					!isNaN(xOffset) &&
					!isNaN(yOffset) &&
					textString
				) {
					const sprite = createTextSprite(
						textString,
						currentFontName,
						size,
						currentColor.getStyle()
					);
					const basePos = new THREE.Vector3(x, y, z).applyMatrix4(baseMatrix).add(currentOrigin);
					sprite.position.set(basePos.x + xOffset, basePos.y + yOffset, basePos.z);
					newScene.add(sprite);
				}
				break;
			}
			case '/Origin': {
				const [x, y, z] = parts.slice(1).map((p) => parseFloat(p));
				if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
					currentOrigin = new THREE.Vector3(x, y, z);
				}
				break;
			}
			case '/ColorRGB': {
				const [r, g, b] = parts.slice(1).map((p) => parseFloat(p));
				if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
					currentColor = new THREE.Color(r, g, b);
				}
				break;
			}
			case '/FontName': {
				const fontName = parts.slice(1).join(' ');
				if (fontName) {
					currentFontName = fontName;
				}
				break;
			}
			case '/Ndiv': {
				const n = parseInt(parts[1], 10);
				if (!isNaN(n) && n >= 3) {
					currentNdiv = n;
				}
				break;
			}
			case '/Box': {
				const [x, y, z] = parts.slice(1).map((p) => parseFloat(p));
				if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
					const geometry = new THREE.BoxGeometry(x * 2, y * 2, z * 2);
					const material = new THREE.MeshStandardMaterial({
						color: currentColor,
						wireframe: forceWireframe,
						metalness: 0.1,
						roughness: 0.6,
						transparent: true,
						opacity: getOpacity()
					});
					const box = new THREE.Mesh(geometry, material);
					box.quaternion.setFromRotationMatrix(baseMatrix);
					box.position.copy(currentOrigin);
					newScene.add(box);
				}
				break;
			}
			case '/Sphere': {
				const radius = parseFloat(parts[1]);
				if (!isNaN(radius) && radius > 0) {
					const geometry = new THREE.SphereGeometry(radius, currentNdiv, currentNdiv / 2);
					const material = new THREE.MeshStandardMaterial({
						color: currentColor,
						wireframe: forceWireframe,
						metalness: 0.1,
						roughness: 0.6,
						transparent: true,
						opacity: getOpacity()
					});
					const sphere = new THREE.Mesh(geometry, material);
					sphere.quaternion.setFromRotationMatrix(baseMatrix);
					sphere.position.copy(currentOrigin);
					newScene.add(sphere);
				}
				break;
			}
			case '/Column': {
				const r = parseFloat(parts[1]);
				const dz = parseFloat(parts[2]);
				if (!isNaN(r) && !isNaN(dz) && r >= 0 && dz >= 0) {
					const height = 2 * dz;
					const geometry = new THREE.CylinderGeometry(
						r,
						r,
						height,
						currentNdiv,
						1,
						false,
						0,
						Math.PI * 2
					);
					const material = new THREE.MeshStandardMaterial({
						color: currentColor,
						wireframe: forceWireframe,
						metalness: 0.1,
						roughness: 0.6,
						transparent: true,
						opacity: getOpacity()
					});
					const cylinder = new THREE.Mesh(geometry, material);
					cylinder.rotation.x = Math.PI / 2;
					cylinder.quaternion.setFromRotationMatrix(baseMatrix);
					cylinder.position.copy(currentOrigin);
					newScene.add(cylinder);
				}
				break;
			}
			case '/Cons': {
				let [rmin1, rmax1, rmin2, rmax2, dz, sphi, dphi] = parts.slice(1).map((p) => parseFloat(p));

				if ([rmin1, rmax1, rmin2, rmax2, dz, sphi, dphi].every((v) => !isNaN(v)) && dz >= 0) {
					rmin1 = Math.max(0, rmin1);
					rmax1 = Math.max(rmin1, rmax1);
					rmin2 = Math.max(0, rmin2);
					rmax2 = Math.max(rmin2, rmax2);

					const height = 2 * dz;
					const thetaStart = sphi;
					const thetaLength = dphi;

					const consGroup = new THREE.Group();
					const material = new THREE.MeshStandardMaterial({
						color: currentColor,
						wireframe: forceWireframe,
						metalness: 0.1,
						roughness: 0.6,
						transparent: true,
						opacity: getOpacity()
					});
					const alignYToZAxis = new THREE.Matrix4().makeRotationX(Math.PI / 2);

					const outerGeometry = new THREE.CylinderGeometry(
						rmax2,
						rmax1,
						height,
						currentNdiv,
						1,
						true,
						thetaStart,
						thetaLength
					);
					const outerMesh = new THREE.Mesh(outerGeometry, material.clone());
					outerMesh.applyMatrix4(alignYToZAxis);
					consGroup.add(outerMesh);

					if (rmin1 > 0 || rmin2 > 0) {
						const innerGeometry = new THREE.CylinderGeometry(
							rmin2,
							rmin1,
							height,
							currentNdiv,
							1,
							true,
							thetaStart,
							thetaLength
						);
						const innerMaterial = material.clone();
						innerMaterial.side = THREE.BackSide;
						innerMaterial.transparent = true;
						innerMaterial.opacity = 0.5;
						const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
						innerMesh.applyMatrix4(alignYToZAxis);
						consGroup.add(innerMesh);
					}

					const topCapGeometry = new THREE.RingGeometry(
						rmin2,
						rmax2,
						currentNdiv,
						1,
						thetaStart,
						thetaLength
					);
					const topCap = new THREE.Mesh(topCapGeometry, material.clone());
					topCap.position.set(0, dz, 0);
					topCap.rotation.x = Math.PI / 2;
					topCap.applyMatrix4(alignYToZAxis);
					consGroup.add(topCap);

					const bottomCapGeometry = new THREE.RingGeometry(
						rmin1,
						rmax1,
						currentNdiv,
						1,
						thetaStart,
						thetaLength
					);
					const bottomCap = new THREE.Mesh(bottomCapGeometry, material.clone());
					bottomCap.position.set(0, -dz, 0);
					bottomCap.rotation.x = Math.PI / 2;
					bottomCap.applyMatrix4(alignYToZAxis);
					consGroup.add(bottomCap);

					consGroup.quaternion.setFromRotationMatrix(baseMatrix);
					consGroup.position.copy(currentOrigin);
					newScene.add(consGroup);
				}
				break;
			}
			case '/Torus': {
				let [rmin, rmax, rtor, sphi, dphi] = parts.slice(1).map((p) => parseFloat(p));

				if (
					[rmin, rmax, rtor, sphi, dphi].every((v) => !isNaN(v)) &&
					rmin >= 0 &&
					rmax >= 0 &&
					rtor >= 0
				) {
					rmin = Math.max(0, rmin);
					rmax = Math.max(rmin, rmax);

					const radius = rtor + (rmax + rmin) / 2;
					const tubeRadius = (rmax - rmin) / 2;

					const geometry = new THREE.TorusGeometry(
						radius,
						tubeRadius,
						currentNdiv / 2,
						currentNdiv,
						dphi
					);
					const material = new THREE.MeshStandardMaterial({
						color: currentColor,
						wireframe: forceWireframe,
						metalness: 0.1,
						roughness: 0.6,
						transparent: true,
						opacity: getOpacity()
					});
					const torus = new THREE.Mesh(geometry, material);

					torus.rotation.y = sphi;
					torus.quaternion.setFromRotationMatrix(baseMatrix);
					torus.position.copy(currentOrigin);
					newScene.add(torus);
				}
				break;
			}
			case '/Polyline':
				isParsingPolyline = true;
				polylinePoints = [];
				break;
			case '/Polyhedron':
				isParsingPolyhedron = true;
				polyhedronVertices = [];
				polyhedronFacets = [];
				vertexCounter = 0;
				break;
			case '/BoundingBox': {
				const [minX, minY, minZ, maxX, maxY, maxZ] = parts.slice(1).map((p) => parseFloat(p));
				if ([minX, minY, minZ, maxX, maxY, maxZ].every((v) => !isNaN(v))) {
					// BoundingBox data parsed but not directly used for rendering
				}
				break;
			}
			case '/Tubs': {
				let [rmin, rmax, dz, sphi, dphi] = parts.slice(1).map((p) => parseFloat(p));

				if ([rmin, rmax, dz, sphi, dphi].every((v) => !isNaN(v)) && rmax >= 0 && dz >= 0) {
					rmin = Math.max(0, rmin);
					rmax = Math.max(rmin, rmax);

					const height = 2 * dz;
					const thetaStart = sphi;
					const thetaLength = dphi;

					const tubeGroup = new THREE.Group();
					const material = new THREE.MeshStandardMaterial({
						color: currentColor,
						wireframe: forceWireframe,
						metalness: 0.1,
						roughness: 0.6,
						transparent: true,
						depthWrite: false,
						opacity: getOpacity()
					});
					const alignYToZAxis = new THREE.Matrix4().makeRotationX(Math.PI / 2);

					if (rmin === 0) {
						const geometry = new THREE.CylinderGeometry(
							rmax,
							rmax,
							height,
							currentNdiv,
							1,
							false,
							thetaStart,
							thetaLength
						);
						const solidCylinder = new THREE.Mesh(geometry, material);
						solidCylinder.applyMatrix4(alignYToZAxis);
						tubeGroup.add(solidCylinder);
					} else {
						const outerGeometry = new THREE.CylinderGeometry(
							rmax,
							rmax,
							height,
							currentNdiv,
							1,
							true,
							thetaStart,
							thetaLength
						);
						const outerMesh = new THREE.Mesh(outerGeometry, material.clone());
						outerMesh.applyMatrix4(alignYToZAxis);
						tubeGroup.add(outerMesh);

						const innerGeometry = new THREE.CylinderGeometry(
							rmin,
							rmin,
							height,
							currentNdiv,
							1,
							true,
							thetaStart,
							thetaLength
						);
						const innerMaterial = material.clone();
						innerMaterial.side = THREE.BackSide;
						innerMaterial.transparent = true;
						innerMaterial.opacity = 0.5;
						const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
						innerMesh.applyMatrix4(alignYToZAxis);
						tubeGroup.add(innerMesh);

						const topCapGeometry = new THREE.RingGeometry(
							rmin,
							rmax,
							currentNdiv,
							1,
							thetaStart,
							thetaLength
						);
						const topCap = new THREE.Mesh(topCapGeometry, material.clone());
						topCap.position.set(0, dz, 0);
						topCap.rotation.x = Math.PI / 2;
						topCap.applyMatrix4(alignYToZAxis);
						tubeGroup.add(topCap);

						const bottomCapGeometry = new THREE.RingGeometry(
							rmin,
							rmax,
							currentNdiv,
							1,
							thetaStart,
							thetaLength
						);
						const bottomCap = new THREE.Mesh(bottomCapGeometry, material.clone());
						bottomCap.position.set(0, -dz, 0);
						bottomCap.rotation.x = Math.PI / 2;
						bottomCap.applyMatrix4(alignYToZAxis);
						tubeGroup.add(bottomCap);
					}

					tubeGroup.quaternion.setFromRotationMatrix(baseMatrix);
					tubeGroup.position.copy(currentOrigin);
					newScene.add(tubeGroup);
				}
				break;
			}
			case '/Text2DS': {
				const [x_mm, y_mm, size_pt] = parts.slice(1, 4).map((p) => parseFloat(p));
				const textString = parts.slice(4).join(' ');

				if (!isNaN(x_mm) && !isNaN(y_mm) && !isNaN(size_pt) && size_pt > 0 && textString) {
					tempTwoDTexts.push({
						x: x_mm,
						y: y_mm,
						size: size_pt,
						text: textString,
						color: currentColor.getStyle(),
						font: currentFontName
					});
				}
				break;
			}
			case '/Parallelepiped':
			case '/PolyCone':
			case '/PolyGon':
			case '/SphereSeg':
			case '/Trap':
			case '/Trd':
			case '!SetCamera':
			case '!OpenDevice':
			case '!DrawAll':
			case '!CloseDevice':
			case '!BeginModeling':
			case '!EndModeling':
				// console.log(`Command parsed but not fully implemented: ${command}`);
				break;
			default:
				// console.log(`Unsupported command: ${command}`);
				break;
		}
	});

	// Update Svelte reactive states
	return {
		scene: newScene,
		twoDTexts: tempTwoDTexts
	};
}
