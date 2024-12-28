<template>
  <div class="qr-generator">
    <div class="qr-container" :style="containerStyle" ref="qrContainerRef">
      <qrcode-vue
        :value="qrValue"
        :size="previewSize"
        :margin="margin"
        :render-as="renderAs"
        :background="background"
        :foreground="foreground"
      />
      <div v-if="title" class="qr-title" :style="titleStyle">
        {{ title }}
      </div>
    </div>
    <div v-if="qrSize > 300" class="size-tip">
      <el-icon><InfoFilled /></el-icon>
      <span>当前设置尺寸为 {{ qrSize }}px，预览图最大显示 300px</span>
    </div>

    <el-button type="primary" @click="downloadQR" class="download-btn">
      下载二维码
    </el-button>

    <div class="controls">
      <el-form label-position="top">
        <el-form-item :label="`二维码内容 (${qrValue.length} 字符)`">
          <el-input
            v-model="qrValue"
            type="textarea"
            :rows="2"
            placeholder="输入要生成的内容"
          />
        </el-form-item>

        <div class="form-row">
          <el-form-item label="标题" class="title-input">
            <el-input v-model="title" placeholder="输入标题文本" clearable />
          </el-form-item>

          <el-form-item label="标题大小" class="font-size">
            <el-input-number
              v-model="titleSize"
              :min="12"
              :max="24"
              :step="1"
              controls-position="right"
            />
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item label="二维码大小" class="half-width">
            <el-slider
              v-model="qrSize"
              :min="128"
              :max="1000"
              :step="10"
              :show-input="false"
            />
          </el-form-item>

          <el-form-item label="边距" class="half-width">
            <el-slider
              v-model="margin"
              :min="0"
              :max="25"
              :step="1"
              :show-input="false"
            />
          </el-form-item>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import QrcodeVue from "qrcode.vue";
import html2canvas from "html2canvas";
import { InfoFilled } from "@element-plus/icons-vue";
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElSlider,
  ElButton,
  ElMessage,
} from "element-plus";

const qrValue = ref("");
const title = ref("");
const titleSize = ref(16);
const qrSize = ref(300);
const margin = ref(2);
const renderAs = ref("canvas");
const background = ref("#ffffff");
const foreground = ref("#000000");
const qrContainerRef = ref<HTMLElement | null>(null);

const titleStyle = computed(() => ({
  fontSize: `${titleSize.value}px`,
  background: '#ffffff',
}));

const containerStyle = computed(() => ({
  width: `${Math.min(qrSize.value, 300)}px`,
  padding: "10px auto",
}));

const previewSize = computed(() => Math.min(qrSize.value, 300));

const getCurrentTabUrl = async () => {
  try {
    if (chrome?.tabs?.query) {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.url) {
        qrValue.value = tab.url;
      }
    }
  } catch (error) {
    console.error("Failed to get current tab URL:", error);
    ElMessage.error("获取当前标签页 URL 失败");
  }
};

onMounted(async () => {
  await getCurrentTabUrl();
});

const downloadQR = async () => {
  if (!qrContainerRef.value) return;

  try {
    const canvas = await html2canvas(qrContainerRef.value, {
      backgroundColor: background.value,
      scale: qrSize.value > 300 ? qrSize.value / 300 : 1,
      logging: false,
    });

    const link = document.createElement("a");
    link.download = `qrcode-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  } catch (error) {
    console.error("Failed to download QR code:", error);
    ElMessage.error("下载二维码失败");
  }
};
</script>

<style lang="scss" scoped>
.qr-generator {
  .qr-container {
    text-align: center;
    background: #fff;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 10px auto;
    margin-top: 3px;

    :deep(canvas) {
      display: block;
      margin: 0;
    }

    :deep(canvas.rounded) {
      border-radius: 8px;
    }
  }

  .size-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px;
    margin: 0 auto 10px;
    width: 100%;
    background-color: #e6f6ff;
    border: 1px solid #91d5ff;
    border-radius: 4px;
    color: #1890ff;
    font-size: 12px;
    line-height: 1.2;

    .el-icon {
      font-size: 14px;
      flex-shrink: 0;
    }

    span {
      flex: 1;
    }
  }

  .qr-title {
    width: 100%;
    padding: 10px;
    padding-top: 0;
    text-align: center;
    background: #fff;
    line-height: 1;
    word-break: break-all;
  }

  .download-btn {
    width: 100%;
    padding: 10px 0;
  }

  .controls {
    background: #fff;
    border-radius: 8px;
    padding-top: 10px;
    padding-bottom: 0;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

    .section-title {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
      padding-bottom: 16px;
    }

    :deep(.el-form-item) {
      padding-bottom: 0;
    }

    .form-row {
      display: flex;
      gap: 16px;

      .title-input {
        flex: 1;
      }

      .font-size {
        width: 100px;
      }

      .half-width {
        width: calc(50% - 8px);
        flex: 0 0 auto;
      }
    }
  }
}
:deep(.el-form-item) {
  margin-bottom: 5px !important;
}
</style>
