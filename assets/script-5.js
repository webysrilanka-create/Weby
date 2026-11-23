
(async () => {
  const gallery = document.querySelector('.preview-gallery');
  let canvas = gallery.querySelector('canvas');
  const images = [...document.querySelectorAll('.preview-sources img')];
  if(!document.querySelector('.laptop-collection').classList.contains('is-ready')){
    await new Promise(resolve=>{
      let observer;
      const done=()=>{observer?.disconnect();window.removeEventListener('message',onReady);resolve();};
      const onReady=event=>{
        if(event.source===document.querySelector('.laptop-collection').contentWindow && event.data?.type==='weby-hero-ready')done();
      };
      window.addEventListener('message',onReady);
      observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting)done();},{rootMargin:'600px'});
      observer.observe(gallery);
    });
  }
  images.forEach(image=>{if(image.dataset.src)image.src=image.dataset.src;});
  const frames = (await Promise.all(images.map(async image => {
    try { await image.decode(); } catch { return null; }
    const texture = document.createElement('canvas');
    texture.width = image.naturalWidth;
    texture.height = image.naturalHeight;
    const brush = texture.getContext('2d');
    brush.beginPath();
    brush.roundRect(0, 0, texture.width, texture.height, texture.height * .055);
    brush.clip();
    brush.drawImage(image, 0, 0);
    return texture;
  }))).filter(Boolean);
  if (!frames.length) return;
  // Upload each photo once. A shared curved mesh replaces hundreds of tiny
  // canvas draws per photo, while multisampling smooths the moving silhouette.
  function meshRenderer(surface) {
    const gl = surface.getContext('webgl', { alpha: true, antialias: true, depth: false, stencil: false });
    if (!gl) return null;
    const program = gl.createProgram();
    const shaders = [
      [gl.VERTEX_SHADER, `
        attribute vec2 corner;
        uniform vec4 layout;
        uniform vec2 card;
        varying mediump vec2 uv;
        void main() {
          float angle = clamp(card.x + (corner.x - 0.5) * card.y, -0.75, 0.75);
          float scale = 1.0 / (1.0 - 0.94 * (1.0 - cos(angle)));
          gl_Position = vec4(layout.z * sin(angle) * scale / layout.x,
            (1.0 - 2.0 * corner.y) * layout.w * scale / layout.y, 0.0, 1.0);
          uv = corner;
        }`],
      [gl.FRAGMENT_SHADER, `
        precision mediump float;
        varying vec2 uv;
        uniform sampler2D photo;
        void main() { gl_FragColor = texture2D(photo, uv); }`]
    ];
    for (const [type, source] of shaders) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
      gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);
    const vertices = [];
    for (let i = 0; i <= 48; i++) vertices.push(i / 48, 0, i / 48, 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(program, 'corner');
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    const textures = frames.map(frame => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return texture;
    });
    const layout = gl.getUniformLocation(program, 'layout');
    const card = gl.getUniformLocation(program, 'card');
    return {
      begin() {
        gl.viewport(0, 0, surface.width, surface.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform4f(layout, width / 2, height / 2, radius, halfHeight);
      },
      photo(index, center, span) {
        gl.bindTexture(gl.TEXTURE_2D, textures[index]);
        gl.uniform2f(card, center, span);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length / 2);
      }
    };
  }
  let mesh = meshRenderer(canvas);
  let ctx;
  if (!mesh) {
    const fallback = canvas.cloneNode(false);
    canvas.replaceWith(fallback);
    canvas = fallback;
    ctx = canvas.getContext('2d');
    if (!ctx) return;
  }
  gallery.hidden = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let pointer = null, lastX = 0, direction = 1;
  const cruiseSpeed = 1 / 4200; // Previews per millisecond.
  const glideTime = 480;
  let speed = cruiseSpeed, dragSpeed = 0, lastMoveTime = 0;
  let visible = false, position = 0, previousTime = 0, request = 0;
  let width, height, spacing, radius, halfHeight;
  const entranceDuration = 1450;
  let entranceTime = reduced.matches ? entranceDuration : 0;
  const limit = .69;
  const magnification = angle => 1 / (1 - .94 * (1 - Math.cos(angle)));
  const horizontal = angle => width / 2 + radius * Math.sin(angle) * magnification(angle);

  function draw() {
    if (mesh) mesh.begin();
    else ctx.clearRect(0, 0, width, height);
    const reach = Math.ceil(limit / spacing + .5);
    const remaining = 1 - entranceTime / entranceDuration;
    const phase = position - 2 * reach * remaining ** 3;
    const first = Math.max(remaining > 0 ? -reach : -Infinity, Math.floor(phase - limit / spacing) - 1);
    const last = Math.ceil(phase + limit / spacing) + 1;
    for (let index = first; index <= last; index++) {
      const frameIndex = ((index % frames.length) + frames.length) % frames.length;
      const center = (index - phase) * spacing;
      const span = spacing * .966;
      const start = center - span / 2;
      const leftAngle = Math.max(-limit, start);
      const rightAngle = Math.min(limit, start + span);
      if (rightAngle <= leftAngle) continue;
      if (mesh) {
        mesh.photo(frameIndex, center, span);
        continue;
      }
      const texture = frames[frameIndex];

      // Give the entire photo one antialiased outline. The image strips bleed
      // past this curve so their individual rectangular ends never show.
      const segments = Math.max(2, Math.ceil((horizontal(rightAngle) - horizontal(leftAngle)) / 12));
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const angle = leftAngle + (rightAngle - leftAngle) * i / segments;
        ctx.lineTo(horizontal(angle), height / 2 - halfHeight * magnification(angle));
      }
      for (let i = segments; i >= 0; i--) {
        const angle = leftAngle + (rightAngle - leftAngle) * i / segments;
        ctx.lineTo(horizontal(angle), height / 2 + halfHeight * magnification(angle));
      }
      ctx.closePath();
      ctx.clip();
      // Project narrow vertical strips of the image onto the inside of a cylinder.
      // The same projection bends the top and bottom edges as the image travels.
      const strips = Math.max(16, Math.ceil(radius * span / 12));
      for (let strip = 0; strip < strips; strip++) {
        const angle = start + span * strip / strips;
        if (Math.abs(angle) > limit + .02) continue;
        const x = horizontal(angle);
        const next = horizontal(angle + span / strips);
        if (next < 0 || x >= width) continue;
        const h = halfHeight * Math.max(magnification(angle), magnification(angle + span / strips)) + 1;
        ctx.drawImage(texture, texture.width * strip / strips, 0, texture.width / strips, texture.height,
          x, height / 2 - h, next - x + .45, 2 * h);
      }
      ctx.restore();
    }
  }
  function tick(time) {
    request = 0;
    const elapsed = previousTime ? Math.min(time - previousTime, 64) : 0;
    const targetSpeed = direction * cruiseSpeed;
    const excess = speed - targetSpeed;
    const decay = Math.exp(-elapsed / glideTime);
    position = (position + targetSpeed * elapsed + excess * glideTime * (1 - decay)) % frames.length;
    speed = targetSpeed + excess * decay;
    entranceTime = Math.min(entranceDuration, entranceTime + elapsed);
    previousTime = time;
    draw();
    request = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(request);
    previousTime = 0;
    if (visible && pointer === null && !reduced.matches && !document.hidden) request = requestAnimationFrame(tick);
  }
  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    if (ctx) ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    radius = width / (2 * Math.sin(limit) * magnification(limit));
    spacing = Math.min(.9, Math.max(.36, 380 / width));
    halfHeight = Math.min(height * .394, radius * spacing * .30);
    draw();
  }
  resize();
  canvas.addEventListener('webglcontextlost', event => event.preventDefault());
  canvas.addEventListener('webglcontextrestored', () => {
    mesh = meshRenderer(canvas);
    if (mesh) draw();
  });
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(canvas);
  function moveBy(amount) {
    if (entranceTime < entranceDuration) {
      const reach = Math.ceil(limit / spacing + .5);
      position -= 2 * reach * (1 - entranceTime / entranceDuration) ** 3;
      entranceTime = entranceDuration;
    }
    position = (position + amount) % frames.length;
    direction = Math.sign(amount);
    draw();
  }
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    pointer = event.pointerId;
    lastX = event.clientX;
    lastMoveTime = event.timeStamp;
    dragSpeed = 0;
    canvas.setPointerCapture(pointer);
    canvas.classList.add('dragging');
    sync();
  });
  canvas.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer || event.clientX === lastX) return;
    const distance = (lastX - event.clientX) / (radius * spacing);
    const elapsed = Math.max(1, event.timeStamp - lastMoveTime);
    const measuredSpeed = Math.max(-.008, Math.min(.008, distance / elapsed));
    if (Math.sign(distance) !== Math.sign(dragSpeed)) dragSpeed = 0;
    dragSpeed += (measuredSpeed - dragSpeed) * (1 - Math.exp(-elapsed / 38));
    moveBy(distance);
    lastMoveTime = event.timeStamp;
    lastX = event.clientX;
  });
  canvas.addEventListener('lostpointercapture', event => {
    if (event.pointerId !== pointer) return;
    // A held wheel releases from rest; a flick keeps its recent velocity.
    speed = dragSpeed * Math.exp(-Math.max(0, event.timeStamp - lastMoveTime) / 80);
    pointer = null;
    canvas.classList.remove('dragging');
    sync();
  });
  canvas.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    moveBy(event.key === 'ArrowLeft' ? -1 : 1);
    speed = direction * cruiseSpeed;
  });
  reduced.addEventListener('change', () => {
    speed = direction * cruiseSpeed;
    entranceTime = entranceDuration;
    draw();
    sync();
  });
  document.addEventListener('visibilitychange', sync);
  sync();
})();
