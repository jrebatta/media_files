// App State
class AppState {
  constructor() {
    this.selectedFiles = [];
    this.currentPhotos = [];
    this.currentPhotoIndex = 0;
    this.photoToDelete = null;
    this.selectedItems = [];
    this.currentTab = 'images';
    this.allFiles = [];
    this.isSelectionMode = false;
    this.longPressTimer = null;
    this.longPressDelay = 500;
  }
}

// DOM Cache
const DOM = {
  get fileInput() { return document.getElementById('fileInput'); },
  get uploadArea() { return document.getElementById('uploadArea'); },
  get preview() { return document.getElementById('preview'); },
  get message() { return document.getElementById('message'); },
  get uploadBtn() { return document.getElementById('uploadBtn'); },
  get mainMenu() { return document.getElementById('mainMenu'); },
  get uploadSection() { return document.getElementById('uploadSection'); },
  get gallerySection() { return document.getElementById('gallerySection'); },
  get imageGallery() { return document.getElementById('imageGallery'); },
  get videoGallery() { return document.getElementById('videoGallery'); },
  get allGallery() { return document.getElementById('allGallery'); },
  get photoModal() { return document.getElementById('photoModal'); },
  get modalImage() { return document.getElementById('modalImage'); },
  get modalInfo() { return document.getElementById('modalInfo'); },
  get confirmModal() { return document.getElementById('confirmModal'); },
  get confirmMessage() { return document.getElementById('confirmMessage'); },
  get selectionControls() { return document.querySelector('.selection-controls'); },
  get selectionCount() { return document.querySelector('.selection-count'); },
  photoItems() { return document.querySelectorAll('.photo-item'); },
  tabBtns() { return document.querySelectorAll('.tab-btn'); }
};

// Initialize app state
const state = new AppState();

// Utility Functions
const utils = {
  isVideo: (filename) => /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(filename),
  isImage: (filename) => /\.(jpg|jpeg|png|gif|webp)$/i.test(filename),
  
  showSection: (show, hide = []) => {
    show.style.display = 'block';
    hide.forEach(el => el.style.display = 'none');
  },
  
  createPreviewGrid: () => {
    const container = document.createElement('div');
    container.className = 'preview-grid';
    return container;
  },
  
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// Navigation Module
const Navigation = {
  showMainMenu() {
    utils.showSection(DOM.mainMenu, [DOM.uploadSection, DOM.gallerySection]);
  },
  
  showUploadSection() {
    utils.showSection(DOM.uploadSection, [DOM.mainMenu, DOM.gallerySection]);
  },
  
  showGallerySection() {
    utils.showSection(DOM.gallerySection, [DOM.mainMenu, DOM.uploadSection]);
    Gallery.load();
  }
};

// Tab Module
const TabManager = {
  show(tab) {
    state.currentTab = tab;
    
    // Update active tab
    DOM.tabBtns().forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show correct gallery
    this.hideAllGalleries();
    this.showGallery(tab);
    
    // Reset selection pero mantener modo si estaba activo
    Selection.clear();
    
    // Only render current tab
    Gallery.renderCurrent();
  },
  
  hideAllGalleries() {
    DOM.imageGallery.style.display = 'none';
    DOM.videoGallery.style.display = 'none';
    DOM.allGallery.style.display = 'none';
  },
  
  showGallery(tab) {
    const galleries = {
      'images': DOM.imageGallery,
      'videos': DOM.videoGallery,
      'all': DOM.allGallery
    };
    galleries[tab].style.display = 'grid';
  }
};

// Selection Module
const Selection = {
  toggle(filename, element) {
    // Evitar propagación solo cuando necesario
    if (event) event.stopPropagation();
    
    console.log('Selection.toggle called for:', filename, 'isSelectionMode:', state.isSelectionMode);
    
    const index = state.selectedItems.indexOf(filename);
    const isSelected = index > -1;
    
    if (isSelected) {
      state.selectedItems.splice(index, 1);
      element.classList.remove('selected');
      console.log('Deselected:', filename);
    } else {
      state.selectedItems.push(filename);
      element.classList.add('selected');
      console.log('Selected:', filename);
    }
    
    console.log('Current selected items:', state.selectedItems.length);
    
    // Actualizar inmediatamente
    Selection.updateControls();
  },

  toggleSelectionMode() {
    state.isSelectionMode = !state.isSelectionMode;
    console.log('Selection mode toggled to:', state.isSelectionMode);
    
    if (!state.isSelectionMode) {
      // Salir del modo selección - limpiar todo
      console.log('Exiting selection mode, clearing selections');
      state.selectedItems = [];
      DOM.photoItems().forEach(item => {
        item.classList.remove('selected');
      });
    }
    
    Selection.updateControls();
    Selection.updateSelectionModeUI();
  },

  updateSelectionModeUI() {
    const selectionBtn = document.querySelector('.selection-btn');
    const selectAllBtn = document.querySelector('.select-all-btn');
    const downloadBtn = document.querySelector('.download-btn-main');
    const deleteBtn = document.querySelector('.delete-btn-main');
    
    if (state.isSelectionMode) {
      selectionBtn.classList.add('active');
      selectionBtn.querySelector('.control-text').textContent = 'Cancelar';
      selectionBtn.querySelector('.control-icon').textContent = '✕';
      
      // Mostrar otros botones
      selectAllBtn.style.display = 'flex';
      downloadBtn.style.display = 'flex';
      deleteBtn.style.display = 'flex';
      
    } else {
      selectionBtn.classList.remove('active');
      selectionBtn.querySelector('.control-text').textContent = 'Seleccionar';
      selectionBtn.querySelector('.control-icon').textContent = '✓';
      
      // Ocultar otros botones
      selectAllBtn.style.display = 'none';
      downloadBtn.style.display = 'none';
      deleteBtn.style.display = 'none';
    }
  },
  
  selectAll() {
    console.log('Ejecutando selectAll...');
    console.log('Tab actual:', state.currentTab);
    console.log('Archivos disponibles:', state.allFiles);
    
    // Calcular archivos de la vista actual
    let filesToSelect = [];
    switch (state.currentTab) {
      case 'images':
        filesToSelect = state.allFiles.filter(utils.isImage);
        break;
      case 'videos':
        filesToSelect = state.allFiles.filter(utils.isVideo);
        break;
      case 'all':
      default:
        filesToSelect = [...state.allFiles];
        break;
    }
    
    console.log('Archivos a seleccionar:', filesToSelect);
    
    // Seleccionar todos los archivos de la vista actual
    state.selectedItems = [...filesToSelect];
    state.currentPhotos = [...filesToSelect];
    
    // Actualizar visualmente todos los elementos
    DOM.photoItems().forEach(item => {
      const filename = item.dataset.filename;
      if (filename && filesToSelect.includes(filename)) {
        item.classList.add('selected');
      }
    });
    
    console.log('Items seleccionados:', state.selectedItems);
    Selection.updateControls();
  },
  
  clear() {
    try {
      console.log('Limpiando selecciones...');
      
      state.selectedItems = [];
      
      // Limpiar todas las selecciones visuales
      DOM.photoItems().forEach(item => {
        try {
          item.classList.remove('selected');
        } catch (error) {
          console.warn('Error al limpiar elemento:', error);
        }
      });
      
      Selection.updateControls();
      console.log('Selecciones limpiadas exitosamente');
      
    } catch (error) {
      console.error('Error al limpiar selecciones:', error);
    }
  },

  exitSelectionMode() {
    state.isSelectionMode = false;
    Selection.clear();
    Selection.updateSelectionModeUI();
  },
  
  
  updateControls() {
    const hasSelections = state.selectedItems.length > 0;
    const count = state.selectedItems.length;
    
    // Actualizar contadores en los botones
    const downloadCount = document.getElementById('downloadCount');
    const deleteCount = document.getElementById('deleteCount');
    
    if (downloadCount) downloadCount.textContent = count;
    if (deleteCount) deleteCount.textContent = count;
    
    // Actualizar estado de los botones
    const downloadBtn = document.querySelector('.download-btn-main');
    const deleteBtn = document.querySelector('.delete-btn-main');
    
    if (downloadBtn) {
      downloadBtn.disabled = !hasSelections;
      downloadBtn.style.opacity = hasSelections ? '1' : '0.5';
    }
    
    if (deleteBtn) {
      deleteBtn.disabled = !hasSelections;
      deleteBtn.style.opacity = hasSelections ? '1' : '0.5';
    }
    
    // Los círculos de selección ya no existen, solo actualizar los controles
  },
  
  updateVisualSelections() {
    // Actualizar todas las selecciones visuales después de un render
    DOM.photoItems().forEach(item => {
      const filename = item.dataset.filename;
      if (filename) {
        const isSelected = state.selectedItems.includes(filename);
        if (isSelected) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      }
    });
  },
  
};

// Upload Module
const Upload = {
  handleFiles(files) {
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (validFiles.length === 0) {
      UI.showMessage('Selecciona archivos de imagen o video válidos', 'error');
      return;
    }
    
    if (validFiles.length !== files.length) {
      UI.showMessage(
        `${validFiles.length} de ${files.length} archivos válidos`,
        'error'
      );
    }
    
    state.selectedFiles = validFiles;
    this.showPreview(validFiles);
    this.showUploadButton(validFiles.length);
  },
  
  showPreview(files) {
    DOM.preview.innerHTML = '';
    const container = utils.createPreviewGrid();
    
    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = this.createPreviewItem(file, e.target.result, index);
        container.appendChild(preview);
      };
      reader.readAsDataURL(file);
    });
    
    DOM.preview.appendChild(container);
  },
  
  createPreviewItem(file, src, index) {
    const container = document.createElement('div');
    container.className = 'preview-item';
    
    const isVideo = file.type.startsWith('video/');
    
    if (isVideo) {
      const { canvas, video } = this.createVideoThumbnail(src);
      container.appendChild(canvas);
      document.body.appendChild(video);
      setTimeout(() => video.remove(), 2000);
    } else {
      const img = Object.assign(document.createElement('img'), {
        src, alt: `Preview ${index + 1}`,
        style: 'width:100%; height:60px; object-fit:cover; border-radius:6px;'
      });
      container.appendChild(img);
    }
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'preview-name';
    nameDiv.textContent = `${isVideo ? '🎥 ' : ''}${file.name}`;
    container.appendChild(nameDiv);
    
    return container;
  },
  
  createVideoThumbnail(src) {
    const video = Object.assign(document.createElement('video'), {
      src, muted: true, style: 'display:none;'
    });
    
    const canvas = Object.assign(document.createElement('canvas'), {
      width: 120, height: 80,
      style: 'width:100%; height:60px; object-fit:cover; border-radius:6px; background:var(--bg-secondary);'
    });
    
    const ctx = canvas.getContext('2d');
    
    // Placeholder icon
    ctx.fillStyle = '#666';
    ctx.fillRect(0, 0, 120, 80);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎥', 60, 45);
    
    video.onloadeddata = () => video.currentTime = 1;
    video.onseeked = () => ctx.drawImage(video, 0, 0, 120, 80);
    
    return { canvas, video };
  },
  
  showUploadButton(count) {
    DOM.uploadBtn.style.display = 'block';
    DOM.uploadBtn.textContent = `Subir ${count} archivo${count > 1 ? 's' : ''}`;
  },
  
  async upload() {
    if (state.selectedFiles.length === 0) return;
    
    this.setUploading(true);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Detectar si es móvil para ajustar la estrategia de subida
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const batchSize = isMobile ? 2 : 3; // Subir menos archivos a la vez en móviles
    
    // Procesar archivos en lotes para evitar sobrecargar en móviles
    for (let i = 0; i < state.selectedFiles.length; i += batchSize) {
      const batch = state.selectedFiles.slice(i, i + batchSize);
      
      // Procesar lote actual
      const promises = batch.map(async (file, batchIndex) => {
        const fileIndex = i + batchIndex + 1;
        this.updateProgress(file, fileIndex, state.selectedFiles.length);
        
        try {
          const result = await this.uploadFile(file);
          if (result.error) {
            errorCount++;
            console.error('Error subiendo archivo:', file.name, result.error);
          } else {
            successCount++;
            if (result.converted) {
              console.log(`🔄 Video convertido: ${result.originalFormat} → MP4`);
            }
          }
        } catch (error) {
          errorCount++;
          console.error('Error en subida:', file.name, error);
        }
      });
      
      // Esperar a que termine el lote actual
      await Promise.all(promises);
      
      // Pequeña pausa entre lotes en móviles para mejor rendimiento
      if (isMobile && i + batchSize < state.selectedFiles.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    this.showUploadResult(successCount, errorCount);
    this.cleanup();
  },
  
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    });
    
    return response.json();
  },
  
  updateProgress(file, current, total) {
    const isVideo = file.type.startsWith('video/');
    const isNotMp4 = isVideo && !file.name.toLowerCase().endsWith('.mp4');
    
    DOM.uploadBtn.textContent = isNotMp4 
      ? `Convirtiendo video ${current}/${total}...`
      : `Subiendo... ${current}/${total}`;
  },
  
  showUploadResult(successCount, errorCount) {
    if (successCount > 0 && errorCount === 0) {
      UI.showMessage(
        `${successCount} archivo${successCount > 1 ? 's' : ''} subido${successCount > 1 ? 's' : ''} exitosamente`,
        'success'
      );
    } else if (successCount > 0 && errorCount > 0) {
      UI.showMessage(`${successCount} archivos subidos, ${errorCount} errores`, 'error');
    } else {
      UI.showMessage('Error al subir los archivos', 'error');
    }
  },
  
  setUploading(uploading) {
    DOM.uploadBtn.disabled = uploading;
    DOM.uploadBtn.textContent = uploading ? 'Subiendo...' : 'Subir Archivos';
  },
  
  cleanup() {
    DOM.preview.innerHTML = '';
    state.selectedFiles = [];
    if (DOM.fileInput) DOM.fileInput.value = '';
    DOM.uploadBtn.style.display = 'none';
    this.setUploading(false);
  }
};

// Gallery Module
const Gallery = {
  async load(showLoadingMessage = false) {
    if (showLoadingMessage) {
      UI.showMessage('Actualizando galería...', 'success', 2000);
    }
    
    try {
      const response = await fetch('/fotos');
      const data = await response.json();
      
      if (data.fotos && data.fotos.length > 0) {
        state.allFiles = data.fotos;
        this.renderCurrent();
        console.log(`Galería cargada: ${data.fotos.length} archivos`);
      } else {
        this.showEmptyState();
        console.log('Galería vacía');
      }
    } catch (error) {
      console.error('Error al cargar archivos:', error);
      UI.showMessage('Error al cargar la galería', 'error');
      this.showErrorState();
    }
  },
  
  
  renderCurrent() {
    try {
      console.log('Renderizando galería, archivos disponibles:', state.allFiles.length);
      console.log('Tab actual:', state.currentTab);
      
      if (state.allFiles.length === 0) {
        this.showEmptyState();
        return;
      }
      
      const filesByType = {
        'images': state.allFiles.filter(utils.isImage),
        'videos': state.allFiles.filter(utils.isVideo),
        'all': state.allFiles
      };
      
      const galleryIds = { 'images': 'imageGallery', 'videos': 'videoGallery', 'all': 'allGallery' };
      const files = filesByType[state.currentTab];
      const galleryId = galleryIds[state.currentTab];
      
      console.log(`Renderizando ${files.length} archivos en ${state.currentTab}`);
      
      this.render(galleryId, files);
      this.updateCurrentPhotos();
      
      // Reestablecer selecciones visuales después del render
      setTimeout(() => {
        Selection.updateVisualSelections();
        Selection.updateSelectionModeUI();
      }, 150);
      
    } catch (error) {
      console.error('Error al renderizar galería:', error);
      UI.showMessage('Error al mostrar la galería', 'error');
    }
  },
  
  render(galleryId, files) {
    try {
      const gallery = document.getElementById(galleryId);
      
      if (!gallery) {
        console.error(`No se encontró el elemento galería: ${galleryId}`);
        return;
      }
      
      if (files.length === 0) {
        gallery.innerHTML = '<div class="no-photos">No hay archivos de este tipo</div>';
        return;
      }
      
      // Limpiar galería antes de renderizar
      gallery.innerHTML = '';
      
      // Usar fragmento de documento para mejor rendimiento
      const fragment = document.createDocumentFragment();
      
      // Renderizar elementos por lotes para evitar bloquear la UI en móviles
      const batchSize = 10;
      let currentIndex = 0;
      
      const renderBatch = () => {
        const batch = files.slice(currentIndex, currentIndex + batchSize);
        
        batch.forEach((file, index) => {
          try {
            const element = document.createElement('div');
            element.innerHTML = this.createGalleryItem(file, currentIndex + index, galleryId);
            fragment.appendChild(element.firstElementChild);
          } catch (error) {
            console.error(`Error al crear elemento para ${file}:`, error);
          }
        });
        
        currentIndex += batchSize;
        
        if (currentIndex < files.length) {
          // Usar requestAnimationFrame para no bloquear la UI
          requestAnimationFrame(renderBatch);
        } else {
          // Añadir todos los elementos al DOM de una vez
          gallery.appendChild(fragment);
          console.log(`Galería renderizada: ${files.length} elementos`);
        }
      };
      
      // Iniciar renderizado por lotes
      renderBatch();
      
    } catch (error) {
      console.error('Error en render de galería:', error);
      UI.showMessage('Error al renderizar la galería', 'error');
    }
  },
  
  createGalleryItem(file, index, galleryId) {
    const isVideo = utils.isVideo(file);
    const isSelected = state.selectedItems.includes(file);
    const mediaPath = isVideo ? `/uploads/videos/${file}` : `/uploads/fotos/${file}`;
    const escapedFile = file.replace(/'/g, "\\'");
    
    const mediaElement = isVideo
      ? `<video src="${mediaPath}" muted></video>`
      : `<img src="${mediaPath}" alt="${file}">`;
    
    return `
      <div class="photo-item ${isSelected ? 'selected' : ''}" 
           data-filename="${escapedFile}"
           onmousedown="InteractionHandler.startLongPress('${escapedFile}', this)" 
           onmouseup="InteractionHandler.cancelLongPress()" 
           onmouseleave="InteractionHandler.cancelLongPress()"
           ontouchstart="InteractionHandler.startLongPress('${escapedFile}', this)" 
           ontouchmove="InteractionHandler.handleTouchMove()"
           ontouchend="InteractionHandler.cancelLongPress()" 
           ontouchcancel="InteractionHandler.cancelLongPress()"
           onclick="InteractionHandler.handleItemClick('${escapedFile}', this, ${index}, '${galleryId}')"
           style="touch-action: manipulation;">
        <button class="download-btn" onclick="event.stopPropagation(); Download.single('${escapedFile}')" title="Descargar">⬇</button>
        <button class="delete-btn" onclick="event.stopPropagation(); Delete.showConfirm('${escapedFile}')">&times;</button>
        ${mediaElement}
        <div class="photo-info">${isVideo ? '🎥 ' : '📷 '}${file}</div>
      </div>
    `;
  },
  
  updateCurrentPhotos() {
    const filesByType = {
      'images': state.allFiles.filter(utils.isImage),
      'videos': state.allFiles.filter(utils.isVideo),
      'all': state.allFiles
    };
    state.currentPhotos = filesByType[state.currentTab];
  },
  
  showState(message) {
    const galleryIds = { 'images': 'imageGallery', 'videos': 'videoGallery', 'all': 'allGallery' };
    const currentGalleryId = galleryIds[state.currentTab] || 'imageGallery';
    document.getElementById(currentGalleryId).innerHTML = `<div class="no-photos">${message}</div>`;
  },
  
  showEmptyState() { this.showState('No hay archivos subidos'); },
  showErrorState() { this.showState('Error al cargar archivos'); }
};

// Interaction Handler
const InteractionHandler = {
  touchStartTime: 0,
  touchMoved: false,
  longPressThreshold: 400, // Reducido para mejor UX en móviles

  startLongPress(filename, element) {
    // Solo si NO está en modo selección, permitir long press para activarlo
    if (!state.isSelectionMode) {
      this.cancelLongPress();
      this.touchStartTime = Date.now();
      this.touchMoved = false;
      
      // Detectar si es móvil para ajustar comportamiento
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const delay = isMobile ? 300 : this.longPressThreshold; // Menos tiempo en móviles
      
      state.longPressTimer = setTimeout(() => {
        if (!this.touchMoved) {
          console.log('Long press activado - entrando modo selección');
          Selection.toggleSelectionMode();
          Selection.toggle(filename, element);
          
          // Feedback táctil en móviles compatibles
          if (navigator.vibrate && isMobile) {
            navigator.vibrate([30, 10, 30]); // Patrón de vibración
          }
          
          // Feedback visual adicional
          element.style.transform = 'scale(0.95)';
          setTimeout(() => {
            element.style.transform = '';
          }, 150);
        }
      }, delay);
    }
  },
  
  cancelLongPress() {
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }
  },

  handleTouchMove() {
    this.touchMoved = true;
    this.cancelLongPress();
  },
  
  handleItemClick(filename, element, index, galleryId) {
    // Detectar si es móvil para mejor manejo
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Prevenir la ejecución si fue un long press
    const touchDuration = Date.now() - this.touchStartTime;
    const wasLongPress = touchDuration >= (isMobile ? 300 : 500);
    
    if (wasLongPress && !state.isSelectionMode) {
      return; // Fue un long press, no hacer nada
    }

    this.cancelLongPress();
    
    if (state.isSelectionMode) {
      // En modo selección: cualquier toque selecciona/deselecciona
      console.log('Mobile: Toggling selection for', filename);
      Selection.toggle(filename, element);
    } else {
      // Modo normal: abre la foto en modal
      Modal.open(index, galleryId);
    }
  },
  
};

// Modal Module
const Modal = {
  open(index, galleryId) {
    const fileList = this.getFileList(galleryId);
    state.currentPhotos = fileList;
    state.currentPhotoIndex = index;
    
    this.updateContent();
    DOM.photoModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  },
  
  close() {
    DOM.photoModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  },
  
  getFileList(galleryId) {
    const filesByGallery = {
      'imageGallery': state.allFiles.filter(utils.isImage),
      'videoGallery': state.allFiles.filter(utils.isVideo)
    };
    return filesByGallery[galleryId] || state.allFiles;
  },
  
  updateContent() {
    const currentFile = state.currentPhotos[state.currentPhotoIndex];
    const isVideo = utils.isVideo(currentFile);
    const src = isVideo ? `/uploads/videos/${currentFile}` : `/uploads/fotos/${currentFile}`;
    
    if (isVideo) {
      DOM.modalImage.outerHTML = `<video id="modalImage" src="${src}" controls></video>`;
    } else {
      if (DOM.modalImage.tagName === 'VIDEO') {
        DOM.modalImage.outerHTML = `<img id="modalImage" src="${src}" alt="${currentFile}">`;
      } else {
        DOM.modalImage.src = src;
      }
    }
    
    DOM.modalInfo.textContent = `${state.currentPhotoIndex + 1} / ${state.currentPhotos.length} - ${currentFile}`;
  },
  
  prev() {
    if (state.currentPhotoIndex > 0) {
      state.currentPhotoIndex--;
      this.updateContent();
    }
  },
  
  next() {
    if (state.currentPhotoIndex < state.currentPhotos.length - 1) {
      state.currentPhotoIndex++;
      this.updateContent();
    }
  }
};

// Download Module
const Download = {
  async single(filename) {
    try {
      console.log(`Iniciando descarga: ${filename}`);
      UI.showMessage('Preparando descarga...', 'success', 1500);
      
      // Verificar que el archivo existe antes de intentar descargarlo
      const checkResponse = await fetch(`/uploads/${filename.includes('video') || utils.isVideo(filename) ? 'videos' : 'fotos'}/${filename}`, {
        method: 'HEAD'
      });
      
      if (!checkResponse.ok) {
        throw new Error('Archivo no encontrado en el servidor');
      }
      
      // Usar el endpoint de descarga del servidor
      const downloadUrl = `/download/${encodeURIComponent(filename)}`;
      
      // Detectar si es móvil para mejor manejo
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // En móviles, abrir en nueva ventana es más confiable
        const downloadWindow = window.open(downloadUrl, '_blank');
        
        // Fallback si popup fue bloqueado
        setTimeout(() => {
          if (!downloadWindow || downloadWindow.closed) {
            // Crear enlace invisible para forzar descarga
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => document.body.removeChild(a), 100);
          }
        }, 1000);
        
        UI.showMessage('Descarga iniciada', 'success', 2000);
        return Promise.resolve();
      } else {
        // En desktop, usar el método tradicional con timeout mejorado
        return new Promise((resolve, reject) => {
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = filename;
          a.style.display = 'none';
          
          // Timeout más conservador para evitar falsas alarmas
          const timeout = setTimeout(() => {
            if (document.body.contains(a)) {
              document.body.removeChild(a);
            }
            // No rechazar por timeout, solo advertir
            console.warn(`Timeout en descarga de ${filename}, pero puede haberse iniciado`);
            resolve(); // Resolver en lugar de rechazar
          }, 10000); // 10 segundos
          
          // Limpiar en caso de éxito
          const cleanup = () => {
            clearTimeout(timeout);
            if (document.body.contains(a)) {
              document.body.removeChild(a);
            }
          };
          
          // Detectar inicio de descarga
          a.addEventListener('click', () => {
            setTimeout(() => {
              cleanup();
              resolve();
            }, 500);
          });
          
          document.body.appendChild(a);
          a.click();
          
          console.log(`Descarga iniciada: ${filename}`);
        });
      }
      
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      UI.showMessage(`Error al descargar: ${error.message}`, 'error');
      throw error;
    }
  },

  async selected() {
    if (state.selectedItems.length === 0) {
      UI.showMessage('No hay archivos seleccionados', 'error');
      return;
    }
    
    const totalFiles = state.selectedItems.length;
    UI.showMessage(`Iniciando descarga de ${totalFiles} archivo${totalFiles > 1 ? 's' : ''}...`, 'success');
    
    try {
      console.log('Descargando archivos seleccionados:', state.selectedItems);
      
      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      
      // Limitar descargas concurrentes para evitar problemas en móviles
      const maxConcurrent = navigator.userAgent.includes('Mobile') ? 2 : 3;
      
      for (let i = 0; i < state.selectedItems.length; i += maxConcurrent) {
        const batch = state.selectedItems.slice(i, i + maxConcurrent);
        
        // Procesar lote actual
        const promises = batch.map(async (filename) => {
          try {
            await Download.single(filename);
            successCount++;
            console.log(`✅ Descarga exitosa: ${filename}`);
          } catch (error) {
            errorCount++;
            errors.push(filename);
            console.error(`❌ Error descargando ${filename}:`, error);
          }
        });
        
        await Promise.allSettled(promises);
        
        // Pausa entre lotes para evitar saturar el navegador
        if (i + maxConcurrent < state.selectedItems.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Actualizar progreso
          const progress = Math.round(((i + maxConcurrent) / state.selectedItems.length) * 100);
          UI.showMessage(`Descargando... ${progress}% completado`, 'success', 1000);
        }
      }
      
      // Mostrar resultado final
      setTimeout(() => {
        if (successCount > 0 && errorCount === 0) {
          UI.showMessage(`✅ ${successCount} archivo${successCount > 1 ? 's' : ''} descargado${successCount > 1 ? 's' : ''} exitosamente`, 'success');
        } else if (successCount > 0 && errorCount > 0) {
          UI.showMessage(`⚠️ ${successCount} exitoso${successCount > 1 ? 's' : ''}, ${errorCount} con errores`, 'warning');
          console.log('Archivos con errores:', errors);
        } else {
          UI.showMessage('❌ Error al descargar los archivos', 'error');
        }
        
        // Limpiar selección después de mostrar resultado
        setTimeout(() => {
          Selection.clear();
        }, 1000);
      }, 500);
      
    } catch (error) {
      console.error('Error en descarga múltiple:', error);
      UI.showMessage('Error en descarga múltiple', 'error');
    }
  }
};

// Delete Module
const Delete = {
  showConfirm(filename) {
    state.photoToDelete = filename;
    const isVideo = utils.isVideo(filename);
    const fileType = isVideo ? 'video' : 'imagen';
    DOM.confirmMessage.textContent = `¿Eliminar esta ${fileType}? Esta acción no se puede deshacer.`;
    DOM.confirmModal.style.display = 'block';
  },
  
  cancel() {
    state.photoToDelete = null;
    DOM.confirmModal.style.display = 'none';
  },
  
  async confirm() {
    if (!state.photoToDelete) return;
    
    const isVideo = utils.isVideo(state.photoToDelete);
    const fileType = isVideo ? 'video' : 'imagen';
    
    UI.showMessage(`Eliminando ${fileType}...`, 'success');
    
    try {
      const response = await fetch(`/fotos/${state.photoToDelete}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        UI.showMessage(`${fileType.charAt(0).toUpperCase() + fileType.slice(1)} eliminada exitosamente`, 'success');
        this.closeModalIfCurrent();
        await this.refreshGallery();
      } else {
        const data = await response.json().catch(() => ({ error: 'Error desconocido' }));
        UI.showMessage(`Error al eliminar ${fileType}: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error eliminando archivo:', state.photoToDelete, error);
      UI.showMessage(`Error de conexión al eliminar ${fileType}`, 'error');
    }
    
    this.cancel();
  },
  
  closeModalIfCurrent() {
    if (DOM.photoModal.style.display === 'block' && 
        state.currentPhotos[state.currentPhotoIndex] === state.photoToDelete) {
      Modal.close();
    }
  },
  
  async selected() {
    if (state.selectedItems.length === 0) {
      UI.showMessage('No hay archivos seleccionados para eliminar', 'error');
      return;
    }
    
    const count = state.selectedItems.length;
    const itemText = count === 1 ? 'archivo' : 'archivos';
    
    if (!confirm(`¿Eliminar ${count} ${itemText} seleccionados?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }
    
    UI.showMessage(`Eliminando ${count} ${itemText}...`, 'success');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const filename of state.selectedItems) {
      try {
        console.log('Eliminando archivo:', filename);
        const response = await fetch(`/fotos/${filename}`, { method: 'DELETE' });
        
        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
          const data = await response.json().catch(() => ({ error: 'Error desconocido' }));
          errors.push(`${filename}: ${data.error}`);
        }
      } catch (error) {
        console.error('Error eliminando archivo:', filename, error);
        errorCount++;
        errors.push(`${filename}: Error de conexión`);
      }
    }
    
    // Mostrar resultados
    this.showDeletionResults(successCount, errorCount, errors);
    
    // Actualizar galería si hubo eliminaciones exitosas
    if (successCount > 0) {
      await this.refreshGallery();
    }
  },
  
  showDeletionResults(successCount, errorCount, errors) {
    if (successCount > 0 && errorCount === 0) {
      const itemText = successCount === 1 ? 'archivo' : 'archivos';
      UI.showMessage(`✅ ${successCount} ${itemText} eliminados exitosamente`, 'success');
    } else if (successCount > 0 && errorCount > 0) {
      UI.showMessage(`⚠️ ${successCount} archivos eliminados, ${errorCount} con errores`, 'error');
      console.warn('Errores en eliminación:', errors);
    } else {
      UI.showMessage(`❌ No se pudieron eliminar los archivos`, 'error');
      console.error('Errores en eliminación:', errors);
    }
  },
  
  async refreshGallery() {
    try {
      console.log('Actualizando galería después de eliminar...');
      console.log('Tab actual antes de actualizar:', state.currentTab);
      
      // Limpiar selecciones primero
      Selection.clear();
      
      // Recargar la galería
      await Gallery.load(true);
      
      console.log('Galería actualizada exitosamente');
      
    } catch (error) {
      console.error('Error al actualizar galería:', error);
      UI.showMessage('Error al actualizar la galería', 'error');
    }
  }
};

// UI Module
const UI = {
  showMessage(text, type, duration = 4000) {
    if (!DOM.message) return;
    
    // Limpiar mensaje anterior
    DOM.message.innerHTML = '';
    
    // Crear nuevo mensaje
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = text;
    
    DOM.message.appendChild(messageElement);
    
    // Auto-ocultar después del tiempo especificado
    setTimeout(() => {
      if (DOM.message && messageElement.parentNode) {
        DOM.message.removeChild(messageElement);
      }
    }, duration);
    
    // Log para debug
    console.log(`[${type.toUpperCase()}] ${text}`);
  },
  
  showPersistentMessage(text, type) {
    // Mensaje que no se auto-oculta (para operaciones largas)
    this.showMessage(text, type, 10000);
  },
  
  clearMessages() {
    if (DOM.message) {
      DOM.message.innerHTML = '';
    }
  }
};

// Event Listeners
const setupEventListeners = () => {
  // Upload events
  if (DOM.uploadArea) {
    DOM.uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      DOM.uploadArea.classList.add('dragover');
    });
    
    DOM.uploadArea.addEventListener('dragleave', () => {
      DOM.uploadArea.classList.remove('dragover');
    });
    
    DOM.uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      DOM.uploadArea.classList.remove('dragover');
      Upload.handleFiles(Array.from(e.dataTransfer.files));
    });
  }
  
  if (DOM.fileInput) {
    DOM.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        Upload.handleFiles(Array.from(e.target.files));
      }
    });
  }
  
  if (DOM.uploadBtn) {
    DOM.uploadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      Upload.upload();
    });
  }
  
  // Modal touch events
  if (DOM.photoModal) {
    let startX = 0, startY = 0;
    
    DOM.photoModal.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });
    
    DOM.photoModal.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;
      const diffY = startY - e.changedTouches[0].clientY;
      
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        diffX > 0 ? Modal.next() : Modal.prev();
      }
    });
    
    DOM.photoModal.addEventListener('click', (e) => {
      if (e.target.id === 'photoModal' || e.target.classList.contains('modal-content')) {
        Modal.close();
      }
    });
  }
  
  // Keyboard events
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.confirmModal.style.display === 'block') {
        Delete.cancel();
      } else {
        Modal.close();
      }
    } else if (e.key === 'ArrowLeft') {
      Modal.prev();
    } else if (e.key === 'ArrowRight') {
      Modal.next();
    }
  });
};

// Global Functions (for HTML onclick handlers)
window.showMainMenu = Navigation.showMainMenu;
window.showUploadSection = Navigation.showUploadSection;
window.showGallerySection = Navigation.showGallerySection;
window.showTab = TabManager.show.bind(TabManager);
window.selectAll = Selection.selectAll;
window.toggleSelectionMode = Selection.toggleSelectionMode.bind(Selection);
window.exitSelectionMode = Selection.clear;
window.downloadSelected = Download.selected;
window.deleteSelected = Delete.selected;
window.closeModal = Modal.close;
window.prevPhoto = Modal.prev;
window.nextPhoto = Modal.next;
window.showDeleteConfirm = Delete.showConfirm;
window.cancelDelete = Delete.cancel;
window.confirmDelete = Delete.confirm;
window.Selection = Selection;
window.InteractionHandler = InteractionHandler;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  Navigation.showMainMenu();
});