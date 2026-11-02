<template>
    <v-container class="container">
        <v-label class="label text-body-small">
            {{ label }}
        </v-label>
        <img
            v-if="model"
            :src="formatImageSrc(model)"
            :alt="label"
            class="image"
        />
        <div class="actions d-flex flex-column align-right">
            <v-btn
                color="primary"
                variant="elevated"
                size="small"
                prepend-icon="mdi-camera"
                class="mb-3"
                @click="openCamera()"
            >
                Take Photo
            </v-btn>
            <v-btn
                color="primary"
                variant="elevated"
                size="small"
                prepend-icon="mdi-upload"
                @click="triggerFileInput"
            >
                Upload Photo
            </v-btn>
        </div>

        <input
            ref="fileInputElement"
            type="file"
            accept="image/*"
            style="display: none;"
            @change="onFileSelected"
        />

        <v-dialog v-model="showCameraDialog" max-width="640" persistent>
            <v-card>
                <v-card-text>
                    <div>{{ prompt }}</div>
                    <v-alert v-if="cameraError" type="error" variant="tonal" density="compact" class="mb-3">
                        {{ cameraError }}
                    </v-alert>
                    <div v-show="!cameraError" class="video-container">
                        <video
                        ref="videoElement"
                        autoplay
                        playsinline
                        muted
                        class="video-preview"
                        ></video>
                    </div>

                </v-card-text>

                <v-card-actions class="justify-end px-4 pb-4">
                    <v-btn variant="text" @click="closeCamera">Cancel</v-btn>
                    <v-btn
                        v-if="!cameraError"
                        color="primary"
                        variant="flat"
                        prepend-icon="mdi-camera"
                        @click="capturePhoto"
                    >
                        Capture
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </v-container>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, ref } from 'vue';

const model = defineModel<string>();
const props = defineProps<{
  label: string,
  prompt: string
}>();

const MAX_WIDTH = 1280;
const MAX_HEIGHT = 960;
const JPEG_QUALITY = 0.85;

const showCameraDialog = ref(false);
const cameraError = ref('');
const videoElement = ref<HTMLVideoElement | null>(null);
const fileInputElement = ref<HTMLInputElement | null>(null);
let mediaStream: MediaStream | null = null;

function formatImageSrc(imageStr: string): string {
  if (!imageStr) return '';
  if (imageStr.startsWith('data:image/')) return imageStr;
  return `data:image/jpeg;base64,${imageStr}`;
}

async function openCamera() {
  cameraError.value = '';
  showCameraDialog.value = true;

  await nextTick();

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access is not supported by your browser.');
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    if (videoElement.value) {
      videoElement.value.srcObject = mediaStream;
      await videoElement.value.play();
    }
  } catch (err) {
    cameraError.value =
      err instanceof Error ? err.message : 'Unable to access camera. Please allow camera permissions.';
  }
}

// Scales the source down to fit within MAX_WIDTH x MAX_HEIGHT (never up) and returns a JPEG data URL.
function downsize(source: CanvasImageSource, srcWidth: number, srcHeight: number): string {
  const scale = Math.min(1, MAX_WIDTH / srcWidth, MAX_HEIGHT / srcHeight);
  const width = Math.max(1, Math.round(srcWidth * scale));
  const height = Math.max(1, Math.round(srcHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to process image.');
  ctx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

function capturePhoto() {
  const video = videoElement.value;
  if (!video) return;

  model.value = downsize(video, video.videoWidth || 640, video.videoHeight || 480);
  closeCamera();
}

function triggerFileInput() {
  fileInputElement.value?.click();
}

async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    // Applies EXIF orientation so rotated phone photos stay upright.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    try {
      model.value = downsize(bitmap, bitmap.width, bitmap.height);
    } finally {
      bitmap.close();
    }
  } catch (err) {
    console.error('Failed to read selected image', err);
  } finally {
    // Allow selecting the same file again.
    target.value = '';
  }
}

function closeCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  if (videoElement.value) {
    videoElement.value.srcObject = null;
  }
  if (fileInputElement.value) {
    fileInputElement.value.value = '';
  }
  showCameraDialog.value = false;
  cameraError.value = '';
}

onBeforeUnmount(() => {
  closeCamera();
});

</script>
<style scoped>

.container {
    position: relative;
    width: 100%;
    aspect-ratio: 3 / 2;
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0.03);
    margin-top: 10px;
    padding: 0;
}

.label {
    position: absolute;
    left: 10px;
    top: 0px;
    transform: translateY(-50%);
    color: var(--v-theme-on-surface-variant);
}

.image {
  padding: 10px;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.actions {
    position: absolute;
    right: 10px;
    bottom: 10px;
}

.video-container {
  width: 100%;
  max-height: 400px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-preview {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
}
</style>