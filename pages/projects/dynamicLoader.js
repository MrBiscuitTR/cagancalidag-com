// load the corresponding project page based on url
// if the url is empty, redirect to the first project page
// if the url is not empty but not found, redirect to 404 page

// image slider. buttons on the right and left of the slider (both sides of the page), and the images are in the middle. images dont fit the screen -> scroll with buttons or with mouse/hand. images will have a modal window to show the full image.
var scrollY = 100;
var scrolledAt = 0;
let previousBodyPaddingRight = '';
let previousBodyOverflow = '';
const modal = document.querySelector('.modal');
let modalImage = null;
let modalScale = 1;
let modalTranslateX = 0;
let modalTranslateY = 0;
let modalPointerDown = false;
let modalPointerId = null;
let modalLastPointerX = 0;
let modalLastPointerY = 0;
let modalSuppressClick = false;
const MODAL_ZOOM_SCALE = 2.2;
const MODAL_DRAG_THRESHOLD = 3;
let modalMap = null;
let modalMapImage = null;
let modalMapViewport = null;
let modalMapPointerDown = false;
let modalMapPointerId = null;
let modalHint = null;

function isDesktopPointerEnv() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function applyModalTransform() {
    if (!modalImage) return;
    modalImage.style.setProperty('--modal-scale', modalScale);
    modalImage.style.setProperty('--modal-tx', `${modalTranslateX}px`);
    modalImage.style.setProperty('--modal-ty', `${modalTranslateY}px`);
    updateModalMapViewport();
}

function getModalPanLimits() {
    if (!modalImage) {
        return { maxX: 0, maxY: 0 };
    }

    const baseWidth = modalImage.clientWidth;
    const baseHeight = modalImage.clientHeight;
    const maxX = Math.max(0, (baseWidth * modalScale - baseWidth) / 2);
    const maxY = Math.max(0, (baseHeight * modalScale - baseHeight) / 2);

    return { maxX, maxY };
}

function clampModalPan() {
    const limits = getModalPanLimits();
    modalTranslateX = Math.max(-limits.maxX, Math.min(limits.maxX, modalTranslateX));
    modalTranslateY = Math.max(-limits.maxY, Math.min(limits.maxY, modalTranslateY));
}

function resetModalZoom() {
    modalScale = 1;
    modalTranslateX = 0;
    modalTranslateY = 0;
    modalPointerDown = false;
    modalPointerId = null;
    modalSuppressClick = false;

    if (modalImage) {
        modalImage.classList.remove('zoomed');
        modalImage.classList.remove('dragging');
    }

    applyModalTransform();
    updateModalMapVisibility();
}

function setModalPanFromImagePoint(x, y) {
    if (!modalImage || modalScale <= 1) return;
    const centerX = modalImage.clientWidth / 2;
    const centerY = modalImage.clientHeight / 2;
    modalTranslateX = (centerX - x) * modalScale;
    modalTranslateY = (centerY - y) * modalScale;
    clampModalPan();
}

function toggleModalZoom(clientX, clientY) {
    if (!modalImage) return;

    if (modalScale === 1) {
        modalScale = MODAL_ZOOM_SCALE;
        modalImage.classList.add('zoomed');
        if (typeof clientX === 'number' && typeof clientY === 'number') {
            const rect = modalImage.getBoundingClientRect();
            const clickX = clientX - rect.left;
            const clickY = clientY - rect.top;
            setModalPanFromImagePoint(clickX, clickY);
        }
    } else {
        modalScale = 1;
        modalTranslateX = 0;
        modalTranslateY = 0;
        modalImage.classList.remove('zoomed');
        modalImage.classList.remove('dragging');
    }

    clampModalPan();
    applyModalTransform();
    updateModalMapVisibility();
}

function onModalImagePointerDown(e) {
    if (!e.isPrimary || modalScale <= 1 || !modalImage) return;
    e.preventDefault();

    modalPointerDown = true;
    modalPointerId = e.pointerId;
    modalLastPointerX = e.clientX;
    modalLastPointerY = e.clientY;
    modalImage.classList.add('dragging');
    modalImage.setPointerCapture(e.pointerId);
}

function onModalImagePointerMove(e) {
    if (!modalPointerDown || modalScale <= 1 || !modalImage || e.pointerId !== modalPointerId) return;
    e.preventDefault();

    const dx = e.clientX - modalLastPointerX;
    const dy = e.clientY - modalLastPointerY;

    if (Math.abs(dx) > MODAL_DRAG_THRESHOLD || Math.abs(dy) > MODAL_DRAG_THRESHOLD) {
        modalSuppressClick = true;
    }

    modalTranslateX += dx;
    modalTranslateY += dy;
    modalLastPointerX = e.clientX;
    modalLastPointerY = e.clientY;

    clampModalPan();
    applyModalTransform();
}

function endModalImagePointer(e) {
    if (!modalImage || e.pointerId !== modalPointerId) return;

    modalPointerDown = false;
    modalPointerId = null;
    modalImage.classList.remove('dragging');

    // Clear drag suppression shortly after pointer release.
    setTimeout(function() {
        modalSuppressClick = false;
    }, 80);
}

function bindModalImageHandlers(img) {
    img.addEventListener('click', function(e) {
        e.stopPropagation();
        if (modalSuppressClick) return;
        toggleModalZoom(e.clientX, e.clientY);
    });

    // Avoid browser-native image dragging interfering with pan logic on desktop.
    img.setAttribute('draggable', 'false');
    img.addEventListener('dragstart', function(e) {
        e.preventDefault();
    });

    img.addEventListener('pointerdown', onModalImagePointerDown);
    img.addEventListener('pointermove', onModalImagePointerMove);
    img.addEventListener('pointerup', endModalImagePointer);
    img.addEventListener('pointercancel', endModalImagePointer);
}

function createModalMap(src) {
    if (!modal) return;
    const map = document.createElement('div');
    map.className = 'modal-zoom-map';

    const mapImg = document.createElement('img');
    mapImg.className = 'modal-zoom-map-image';
    mapImg.src = src;
    mapImg.alt = 'Zoom navigation preview';
    mapImg.setAttribute('draggable', 'false');

    const mapViewport = document.createElement('div');
    mapViewport.className = 'modal-zoom-map-viewport';

    map.appendChild(mapImg);
    map.appendChild(mapViewport);
    modal.appendChild(map);

    modalMap = map;
    modalMapImage = mapImg;
    modalMapViewport = mapViewport;

    bindModalMapHandlers();
    updateModalMapVisibility();
    updateModalMapViewport();
}

function clearModalMap() {
    if (modalMap && modalMap.parentNode) {
        modalMap.parentNode.removeChild(modalMap);
    }
    modalMap = null;
    modalMapImage = null;
    modalMapViewport = null;
    modalMapPointerDown = false;
    modalMapPointerId = null;
}

function createModalHint() {
    if (!modal || !isDesktopPointerEnv()) return;
    const hint = document.createElement('div');
    hint.className = 'modal-hint';
    hint.textContent = 'Click image to zoom • Drag to pan • Click outside to close';
    modal.appendChild(hint);
    modalHint = hint;
}

function clearModalHint() {
    if (modalHint && modalHint.parentNode) {
        modalHint.parentNode.removeChild(modalHint);
    }
    modalHint = null;
}

function updateModalMapVisibility() {
    if (!modalMap) return;
    const shouldShow = isDesktopPointerEnv() && modalScale > 1;
    modalMap.classList.toggle('visible', shouldShow);
}

function updateModalMapViewport() {
    if (!modalMap || !modalMapViewport || !modalImage || modalScale <= 1) return;

    const mapRect = modalMap.getBoundingClientRect();
    const mapW = mapRect.width;
    const mapH = mapRect.height;
    const imgW = modalImage.clientWidth;
    const imgH = modalImage.clientHeight;
    if (!mapW || !mapH || !imgW || !imgH) return;

    const viewW = imgW / modalScale;
    const viewH = imgH / modalScale;
    const centerX = (imgW / 2) - (modalTranslateX / modalScale);
    const centerY = (imgH / 2) - (modalTranslateY / modalScale);

    const left = ((centerX - (viewW / 2)) / imgW) * mapW;
    const top = ((centerY - (viewH / 2)) / imgH) * mapH;
    const width = (viewW / imgW) * mapW;
    const height = (viewH / imgH) * mapH;

    modalMapViewport.style.left = `${Math.max(0, Math.min(mapW - width, left))}px`;
    modalMapViewport.style.top = `${Math.max(0, Math.min(mapH - height, top))}px`;
    modalMapViewport.style.width = `${Math.max(18, width)}px`;
    modalMapViewport.style.height = `${Math.max(18, height)}px`;
}

function setPanFromMapClientPoint(clientX, clientY) {
    if (!modalMap || !modalImage || modalScale <= 1) return;
    const mapRect = modalMap.getBoundingClientRect();
    const imgW = modalImage.clientWidth;
    const imgH = modalImage.clientHeight;
    if (!mapRect.width || !mapRect.height || !imgW || !imgH) return;

    const relX = Math.max(0, Math.min(1, (clientX - mapRect.left) / mapRect.width));
    const relY = Math.max(0, Math.min(1, (clientY - mapRect.top) / mapRect.height));
    const targetX = relX * imgW;
    const targetY = relY * imgH;

    setModalPanFromImagePoint(targetX, targetY);
    applyModalTransform();
}

function onModalMapPointerDown(e) {
    if (!e.isPrimary || modalScale <= 1) return;
    e.preventDefault();
    e.stopPropagation();

    modalMapPointerDown = true;
    modalMapPointerId = e.pointerId;
    modalMap.setPointerCapture(e.pointerId);
    setPanFromMapClientPoint(e.clientX, e.clientY);
}

function onModalMapPointerMove(e) {
    if (!modalMapPointerDown || e.pointerId !== modalMapPointerId || modalScale <= 1) return;
    e.preventDefault();
    setPanFromMapClientPoint(e.clientX, e.clientY);
}

function onModalMapPointerUp(e) {
    if (!modalMap || e.pointerId !== modalMapPointerId) return;
    modalMapPointerDown = false;
    modalMapPointerId = null;
}

function bindModalMapHandlers() {
    if (!modalMap) return;
    modalMap.addEventListener('pointerdown', onModalMapPointerDown);
    modalMap.addEventListener('pointermove', onModalMapPointerMove);
    modalMap.addEventListener('pointerup', onModalMapPointerUp);
    modalMap.addEventListener('pointercancel', onModalMapPointerUp);
    modalMap.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

function openModal(src) {
    // creates a modal window with the image that was clicked
    const img = document.createElement('img');
    img.src = src;
    modal.innerHTML = '';
    modal.appendChild(img);
    modalImage = img;
    bindModalImageHandlers(modalImage);
    createModalMap(src);
    createModalHint();
    resetModalZoom();
    modal.style.display = 'flex';
    modal.classList.add('modal');

    // Lock background scroll without shifting desktop layout when scrollbar disappears.
    previousBodyPaddingRight = document.body.style.paddingRight;
    previousBodyOverflow = document.body.style.overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0 && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    resetModalZoom();
    modal.style.display = 'none';
    modal.innerHTML = '';
    modalImage = null;
    clearModalMap();
    clearModalHint();

    document.body.style.overflow = previousBodyOverflow;
    document.body.style.paddingRight = previousBodyPaddingRight;
    window.scrollTo(0, scrolledAt);

}

window.addEventListener('resize', function() {
    if (!modalImage || modal.style.display !== 'flex') return;
    clampModalPan();
    applyModalTransform();
    updateModalMapVisibility();
});

// END MODAL
// START SLIDER

var screenshotSlider = document.querySelector('.screenshots');
function scrollSlider(direction) {
    if (!screenshotSlider) return;
    const slider = screenshotSlider;
    const scrollAmount = 250;
    // add animation to the scroll make it smooth
    if (direction === 'left') {
        slider.style.scrollBehavior = 'smooth';
        slider.scrollLeft -= scrollAmount;
        requestAnimationFrame(function() {
            slider.style.scrollBehavior = 'auto';
        });
    } else if (direction === 'right') {
        slider.style.scrollBehavior = 'smooth';
        slider.scrollLeft += scrollAmount;
        requestAnimationFrame(function() {
            slider.style.scrollBehavior = 'auto';
        });
    }
}
// Pointer-based drag logic to support mouse/touch while preventing accidental click-to-open after scrolling.
let isPointerDown = false;
let pointerStartX = 0;
let pointerStartY = 0;
let sliderLastX = 0;
let isDraggingSlider = false;
let suppressImageClickUntil = 0;
let lastPointerDownTarget = null;
let lastPointerDownX = 0;
let lastPointerDownY = 0;
let sliderVelocity = 0;
let sliderLastMoveTs = 0;
let sliderMomentumRaf = 0;

function stopSliderMomentum() {
    if (sliderMomentumRaf) {
        cancelAnimationFrame(sliderMomentumRaf);
        sliderMomentumRaf = 0;
    }
}

function runSliderMomentum() {
    if (!screenshotSlider) return;
    const friction = 0.92;
    const minVelocity = 0.12;

    const step = function() {
        screenshotSlider.scrollLeft -= sliderVelocity;
        sliderVelocity *= friction;

        if (Math.abs(sliderVelocity) > minVelocity) {
            sliderMomentumRaf = requestAnimationFrame(step);
        } else {
            sliderMomentumRaf = 0;
        }
    };

    sliderMomentumRaf = requestAnimationFrame(step);
}

if (screenshotSlider) {
    screenshotSlider.addEventListener('pointerdown', function(e) {
        if (!e.isPrimary) return;
        stopSliderMomentum();
        sliderVelocity = 0;
        isPointerDown = true;
        isDraggingSlider = false;
        pointerStartX = e.clientX;
        pointerStartY = e.clientY;
        sliderLastX = e.clientX;
        sliderLastMoveTs = performance.now();
    });

    screenshotSlider.addEventListener('pointermove', function(e) {
        if (!isPointerDown || !e.isPrimary) return;
        const dx = e.clientX - pointerStartX;
        const dy = e.clientY - pointerStartY;

        // Start horizontal drag only after a small threshold, keeping vertical gestures unaffected.
        if (!isDraggingSlider && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
            isDraggingSlider = true;
            screenshotSlider.classList.add('is-dragging');
        }

        if (isDraggingSlider) {
            e.preventDefault();
            const stepX = e.clientX - sliderLastX;
            screenshotSlider.scrollLeft -= stepX;

            const now = performance.now();
            const dt = Math.max(1, now - sliderLastMoveTs);
            const normalizedDelta = stepX * (16 / dt);
            sliderVelocity = (sliderVelocity * 0.72) + (normalizedDelta * 0.28);
            sliderLastMoveTs = now;
        }

        sliderLastX = e.clientX;
    });

    const endPointerInteraction = function() {
        if (isDraggingSlider) {
            suppressImageClickUntil = Date.now() + 250;
            if (isDesktopPointerEnv() && Math.abs(sliderVelocity) > 0.2) {
                runSliderMomentum();
            }
        }
        screenshotSlider.classList.remove('is-dragging');
        isPointerDown = false;
        isDraggingSlider = false;
    };

    screenshotSlider.addEventListener('pointerup', endPointerInteraction);
    screenshotSlider.addEventListener('pointercancel', endPointerInteraction);
    screenshotSlider.addEventListener('pointerleave', endPointerInteraction);
}

var screenshots = document.querySelectorAll('.screenshot');
var current = 0;

screenshots.forEach(function(img) {
    img.setAttribute('draggable', 'false');
    img.addEventListener('dragstart', function(e) {
        e.preventDefault();
    });
    img.addEventListener('pointerdown', function(e) {
        if (!e.isPrimary) return;
        lastPointerDownTarget = e.currentTarget;
        lastPointerDownX = e.clientX;
        lastPointerDownY = e.clientY;
    });

    img.addEventListener('click', function(e) {
        const movedFromPressPoint = Math.abs(e.clientX - lastPointerDownX) > 5 || Math.abs(e.clientY - lastPointerDownY) > 5;
        const notDirectClick = e.currentTarget !== lastPointerDownTarget;
        if (Date.now() < suppressImageClickUntil || movedFromPressPoint || notDirectClick) {
            return;
        }
        e.preventDefault();
        scrolledAt = window.pageYOffset;
        openModal(e.currentTarget.src);
    });
});

function showScreenshot(index) {
    screenshots[current].classList.remove('active');
    screenshots[index].classList.add('active');
    current = index;
}


document.addEventListener('click', function(e) {
    if (e.target.classList.contains('prev')) {
        scrollSlider('left');
    } else if (e.target.classList.contains('next')) {
        scrollSlider('right');
    } else if (e.target.classList.contains('modal')) {
        closeModal();
    } 
});
    


const projectFromURL = window.location.pathname.split('/').pop();
const project = projectFromURL ? projectFromURL : 'pages/projects/index.html';
const projectPath = `pages/projects/${project}/index.html`;

// collapsibles

var coll = document.getElementsByClassName("collapsible");
var i;
console.log(coll);
for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("expanded");
    var content = this.nextElementSibling;
    if (content.style.maxHeight){
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    } 
  });
}

