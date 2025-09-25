class AnniversaryApp {
    constructor() {
        this.photos = [];
        this.currentSlideIndex = 0;
        this.isAutoPlay = false;
        this.autoPlayInterval = null;
        this.isSelectMode = false;
        this.selectedPhotos = [];
        
        this.initializeApp();
        this.bindEvents();
        this.loadPhotos();
    }

    initializeApp() {
        // Load sample photos if none exist
        const savedPhotos = localStorage.getItem('anniversaryPhotos');
        if (!savedPhotos) {
            this.photos = [
                {
                    id: '1',
                    title: 'Beach Day',
                    description: 'Our beautiful day at the beach.',
                    date: '2023-07-15',
                    url: 'https://picsum.photos/id/1015/800/600',
                    uploadedAt: new Date().toISOString()
                },
                {
                    id: '2',
                    title: 'Anniversary Dinner',
                    description: 'Celebrating our anniversary together.',
                    date: '2024-09-25',
                    url: 'https://picsum.photos/id/1016/800/600',
                    uploadedAt: new Date().toISOString()
                },
                {
                    id: '3',
                    title: 'Mountain Trip',
                    description: 'Hiking in the mountains.',
                    date: '2024-05-10',
                    url: 'https://picsum.photos/id/1018/800/600',
                    uploadedAt: new Date().toISOString()
                }
            ];
            this.savePhotos();
        }
    }


    bindEvents() {
        // View memories button
        document.getElementById('viewMemoriesBtn').addEventListener('click', () => this.openSlideshow());
        
        // Upload form events
        document.getElementById('showUploadBtn').addEventListener('click', () => this.showUploadForm());
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideUploadForm());
        document.getElementById('addMemoryBtn').addEventListener('click', () => this.addPhoto());
        
        // File input events
        const fileInput = document.getElementById('fileInput');
        const fileUploadArea = document.getElementById('fileUploadArea');
        
        fileUploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        fileUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        fileUploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        
        // Slideshow events
        document.getElementById('closeBtn').addEventListener('click', () => this.closeSlideshow());
        document.getElementById('prevBtn').addEventListener('click', () => this.previousSlide());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextSlide());
        document.getElementById('autoPlayBtn').addEventListener('click', () => this.toggleAutoPlay());
        document.getElementById('editPhotoBtn').addEventListener('click', () => this.openEditModal());
        document.getElementById('deletePhotoBtn').addEventListener('click', () => this.openDeleteModal());
        
        // Keyboard events for slideshow
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Form validation
        const titleInput = document.getElementById('titleInput');
        const fileInput2 = document.getElementById('fileInput');
        
        [titleInput, fileInput2].forEach(input => {
            input.addEventListener('input', () => this.validateForm());
        });

        // Delete modal events
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.deletePhoto());

        // Edit modal events
        document.getElementById('cancelEditBtn').addEventListener('click', () => this.closeEditModal());
        document.getElementById('saveEditBtn').addEventListener('click', () => this.savePhoto());

        // Selection mode events
        document.getElementById('selectModeBtn').addEventListener('click', () => this.toggleSelectMode());
        document.getElementById('cancelSelectionBtn').addEventListener('click', () => this.toggleSelectMode());
        document.getElementById('deleteSelectedBtn').addEventListener('click', () => this.deleteSelectedPhotos());
    }

    loadPhotos() {
        const savedPhotos = localStorage.getItem('anniversaryPhotos');
        if (savedPhotos) {
            this.photos = JSON.parse(savedPhotos);
        }
        this.updatePhotoCounter();
        this.renderPhotoGrid();
        this.updateEmptyState();
    }

    savePhotos() {
        localStorage.setItem('anniversaryPhotos', JSON.stringify(this.photos));
        this.updatePhotoCounter();
        this.renderPhotoGrid();
        this.updateEmptyState();
    }

    updatePhotoCounter() {
        document.getElementById('photoCount').textContent = this.photos.length;
    }

    updateEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const photoGrid = document.getElementById('photoGrid');
        const viewMemoriesBtn = document.getElementById('viewMemoriesBtn');
        
        if (this.photos.length === 0) {
            emptyState.classList.remove('hidden');
            photoGrid.classList.add('hidden');
            viewMemoriesBtn.disabled = true;
        } else {
            emptyState.classList.add('hidden');
            photoGrid.classList.remove('hidden');
            viewMemoriesBtn.disabled = false;
        }
    }

    renderPhotoGrid() {
        const container = document.getElementById('photoGridContainer');
        container.innerHTML = '';
        
        this.photos.forEach((photo, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.dataset.id = photo.id;
            photoItem.innerHTML = `<img src="${photo.url}" alt="${photo.title}" loading="lazy">`;
            
            if (this.isSelectMode) {
                photoItem.addEventListener('click', () => this.togglePhotoSelection(photo.id));
                if (this.selectedPhotos.includes(photo.id)) {
                    photoItem.classList.add('selected');
                }
            } else {
                photoItem.addEventListener('click', () => this.openSlideshow(index));
            }
            
            container.appendChild(photoItem);
        });
    }

    showUploadForm() {
        document.getElementById('addPhotoSection').classList.add('hidden');
        document.getElementById('uploadForm').classList.remove('hidden');
    }

    hideUploadForm() {
        document.getElementById('addPhotoSection').classList.remove('hidden');
        document.getElementById('uploadForm').classList.add('hidden');
        this.resetUploadForm();
    }

    resetUploadForm() {
        document.getElementById('fileInput').value = '';
        document.getElementById('titleInput').value = '';
        document.getElementById('dateInput').value = '';
        document.getElementById('descriptionInput').value = '';
        document.getElementById('previewImage').classList.add('hidden');
        document.querySelector('.upload-placeholder').style.display = 'flex';
        this.validateForm();
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                this.processFile(file);
            } else {
                this.showToast('Please select an image file', 'error');
            }
        }
    }

    processFile(file) {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            this.showToast('File too large. Please select a file smaller than 10MB.', 'error');
            return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.showToast('Please select a JPEG, PNG, GIF, or WebP image.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const previewImage = document.getElementById('previewImage');
            previewImage.src = e.target.result;
            previewImage.classList.remove('hidden');
            document.querySelector('.upload-placeholder').style.display = 'none';
            this.validateForm();
        };
        reader.readAsDataURL(file);
    }

    validateForm() {
        const hasFile = document.getElementById('fileInput').files.length > 0;
        const hasTitle = document.getElementById('titleInput').value.trim().length > 0;
        
        const addBtn = document.getElementById('addMemoryBtn');
        addBtn.disabled = !hasFile;
    }

    addPhoto() {
        const fileInput = document.getElementById('fileInput');
        const titleInput = document.getElementById('titleInput');
        const dateInput = document.getElementById('dateInput');
        const descriptionInput = document.getElementById('descriptionInput');

        if (fileInput.files.length === 0) {
            this.showToast('Please select a photo to upload.', 'error');
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const newPhoto = {
                id: Date.now().toString(),
                title: titleInput.value.trim() || 'Untitled Memory',
                description: descriptionInput.value.trim() || '',
                date: dateInput.value || new Date().toISOString().split('T')[0],
                url: e.target.result,
                uploadedAt: new Date().toISOString()
            };

            this.photos.unshift(newPhoto); // Add to beginning
            this.savePhotos();
            this.showToast('Photo Added! 💕 Your beautiful memory has been saved to our collection.');
            this.hideUploadForm();
        };
        
        reader.readAsDataURL(file);
    }

    openSlideshow(startIndex = 0) {
        if (this.photos.length === 0) return;
        
        this.currentSlideIndex = startIndex;
        document.getElementById('slideshowModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        this.renderSlideshow();
        this.updateNavigationDots();
    }

    closeSlideshow() {
        document.getElementById('slideshowModal').classList.add('hidden');
        document.body.style.overflow = '';
        this.stopAutoPlay();
    }

    renderSlideshow() {
        if (this.photos.length === 0) {
            this.closeSlideshow();
            return;
        };
        
        const photo = this.photos[this.currentSlideIndex];
        document.getElementById('currentPhoto').src = photo.url;
        document.getElementById('photoTitle').textContent = photo.title;
        document.getElementById('photoDate').textContent = photo.date || '';
        document.getElementById('photoDescription').textContent = photo.description || '';
        
        document.getElementById('currentPhotoIndex').textContent = this.currentSlideIndex + 1;
        document.getElementById('totalPhotos').textContent = this.photos.length;
        
        // Show/hide navigation buttons
        const showNav = this.photos.length > 1;
        document.getElementById('prevBtn').style.display = showNav ? 'flex' : 'none';
        document.getElementById('nextBtn').style.display = showNav ? 'flex' : 'none';
    }

    updateNavigationDots() {
        const container = document.getElementById('navigationDots');
        container.innerHTML = '';
        
        if (this.photos.length <= 1) return;
        
        this.photos.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = `nav-dot ${index === this.currentSlideIndex ? 'active' : ''}`;
            dot.addEventListener('click', () => this.goToSlide(index));
            container.appendChild(dot);
        });
    }

    previousSlide() {
        if (this.photos.length <= 1) return;
        this.currentSlideIndex = this.currentSlideIndex === 0 ? this.photos.length - 1 : this.currentSlideIndex - 1;
        this.renderSlideshow();
        this.updateNavigationDots();
    }

    nextSlide() {
        if (this.photos.length <= 1) return;
        this.currentSlideIndex = (this.currentSlideIndex + 1) % this.photos.length;
        this.renderSlideshow();
        this.updateNavigationDots();
    }

    goToSlide(index) {
        this.currentSlideIndex = index;
        this.renderSlideshow();
        this.updateNavigationDots();
    }

    toggleAutoPlay() {
        if (this.isAutoPlay) {
            this.stopAutoPlay();
        } else {
            this.startAutoPlay();
        }
    }

    startAutoPlay() {
        if (this.photos.length <= 1) return;
        
        this.isAutoPlay = true;
        document.getElementById('autoPlayBtn').textContent = 'Pause';
        
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, 3000);
    }

    stopAutoPlay() {
        this.isAutoPlay = false;
        document.getElementById('autoPlayBtn').textContent = 'Auto Play';
        
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    handleKeyboard(e) {
        if (!document.getElementById('slideshowModal').classList.contains('hidden')) {
            switch (e.key) {
                case 'Escape':
                    this.closeSlideshow();
                    break;
                case 'ArrowLeft':
                    this.previousSlide();
                    break;
                case 'ArrowRight':
                    this.nextSlide();
                    break;
            }
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    openDeleteModal() {
        const photo = this.photos[this.currentSlideIndex];
        document.getElementById('deletePhotoPreview').src = photo.url;
        document.getElementById('deletePhotoTitle').textContent = photo.title;
        document.getElementById('deletePhotoDate').textContent = photo.date;
        document.getElementById('deleteModal').classList.remove('hidden');
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.add('hidden');
    }

    deletePhoto() {
        this.photos.splice(this.currentSlideIndex, 1);
        this.savePhotos();
        this.closeDeleteModal();
        if (this.photos.length === 0) {
            this.closeSlideshow();
        } else {
            this.currentSlideIndex = Math.max(0, this.currentSlideIndex - 1);
            this.renderSlideshow();
            this.updateNavigationDots();
        }
    }

    openEditModal() {
        const photo = this.photos[this.currentSlideIndex];
        document.getElementById('editPhotoPreview').src = photo.url;
        document.getElementById('editTitleInput').value = photo.title;
        document.getElementById('editDateInput').value = photo.date;
        document.getElementById('editDescriptionInput').value = photo.description;
        document.getElementById('editModal').classList.remove('hidden');
    }

    closeEditModal() {
        document.getElementById('editModal').classList.add('hidden');
    }

    savePhoto() {
        const photo = this.photos[this.currentSlideIndex];
        photo.title = document.getElementById('editTitleInput').value;
        photo.date = document.getElementById('editDateInput').value;
        photo.description = document.getElementById('editDescriptionInput').value;
        this.savePhotos();
        this.closeEditModal();
        this.renderSlideshow();
    }

    toggleSelectMode() {
        this.isSelectMode = !this.isSelectMode;
        this.selectedPhotos = [];
        document.getElementById('selectionActions').classList.toggle('hidden');
        document.getElementById('selectModeBtn').classList.toggle('hidden');
        this.renderPhotoGrid();
    }

    togglePhotoSelection(photoId) {
        const index = this.selectedPhotos.indexOf(photoId);
        if (index > -1) {
            this.selectedPhotos.splice(index, 1);
        } else {
            this.selectedPhotos.push(photoId);
        }
        this.renderPhotoGrid();
    }

    deleteSelectedPhotos() {
        this.photos = this.photos.filter(photo => !this.selectedPhotos.includes(photo.id));
        this.savePhotos();
        this.toggleSelectMode();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AnniversaryApp();
});
