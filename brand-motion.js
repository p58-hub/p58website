// Load Three.js only when a reader opens the brand story.
let brandThreeModule;
window.startBrandMotion = function (host, src) {
  let disposed = false;
  let renderer, texture, geometry, material, observer, cleanupPointer;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    reduced.removeEventListener('change', onMotionChange);
    observer?.disconnect();
    cleanupPointer?.();
    if (renderer) {
      renderer.setAnimationLoop(null);
      renderer.domElement.remove();
    }
    geometry?.dispose();
    material?.dispose();
    texture?.dispose();
    renderer?.dispose();
    host.classList.remove('motion-ready');
  };
  const onMotionChange = () => { if (reduced.matches) cleanup(); };
  if (reduced.matches || !src) return cleanup;
  reduced.addEventListener('change', onMotionChange);
  brandThreeModule ||= import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js').catch(error => {
    brandThreeModule = null;
    throw error;
  });
  brandThreeModule.then(async THREE => {
    if (disposed) return;
    const loaded = await new THREE.TextureLoader().loadAsync(src);
    if (disposed) { loaded.dispose(); return; }
    texture = loaded;
    texture.colorSpace = THREE.SRGBColorSpace;
    renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 10);
    camera.position.z = 3;
    geometry = new THREE.PlaneGeometry(1, 1);
    material = new THREE.MeshBasicMaterial({map:texture, transparent:true, opacity:0});
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);
    let targetX = 0, targetY = 0, rotationX = 0, rotationY = 0;
    const started = performance.now();
    let previous = started;
    const render = now => {
      if (disposed) return;
      const progress = Math.min(1, (now - started) / 1100);
      const ease = 1 - Math.pow(1 - progress, 3);
      const blend = 1 - Math.exp(-Math.min(now - previous, 80) / 110);
      previous = now;
      rotationX += (targetX - rotationX) * blend;
      rotationY += (targetY - rotationY) * blend;
      plane.rotation.set(rotationX + (1 - ease) * .12, rotationY - (1 - ease) * .22, 0);
      plane.position.z = -.22 * (1 - ease);
      material.opacity = ease;
      renderer.render(scene, camera);
      host.classList.add('motion-ready');
      if (progress === 1 && Math.abs(targetX - rotationX) + Math.abs(targetY - rotationY) < .0001) renderer.setAnimationLoop(null);
    };
    const wake = () => { previous = performance.now(); renderer.setAnimationLoop(render); };
    const resize = () => {
      const {width, height} = host.getBoundingClientRect();
      if (!width || !height || disposed) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(20)) * 3;
      plane.scale.set(visibleHeight * camera.aspect * 1.06, visibleHeight * 1.06, 1);
      const imageAspect = texture.image.width / texture.image.height;
      texture.repeat.set(Math.min(1, camera.aspect / imageAspect), Math.min(1, imageAspect / camera.aspect));
      texture.offset.set((1 - texture.repeat.x) / 2, (1 - texture.repeat.y) / 2);
      wake();
    };
    const move = event => {
      if (event.pointerType === 'touch') return;
      const rect = host.getBoundingClientRect();
      targetY = ((event.clientX - rect.left) / rect.width - .5) * .055;
      targetX = -((event.clientY - rect.top) / rect.height - .5) * .04;
      wake();
    };
    const leave = () => { targetX = targetY = 0; wake(); };
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', leave);
    renderer.domElement.addEventListener('webglcontextlost', cleanup, {once:true});
    cleanupPointer = () => {
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
    };
    observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
  }).catch(() => cleanup()); // The original image remains visible without WebGL/network.
  return cleanup;
};
