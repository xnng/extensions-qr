<template>
  <div class="qr-scanner">
    <div class="scan-controls">
      <input
        type="file"
        ref="fileInput"
        accept="image/*"
        @change="handleFileSelect"
        style="display: none"
      />
      <el-button type="primary" @click="triggerFileInput" class="select-btn">
        <el-icon><Upload /></el-icon>
        Select Image from Local
      </el-button>

    </div>

    <div v-if="scanResult" class="scan-result">
      <el-alert
        :title="scanResult"
        type="success"
        :closable="false"
        description="Scan Result"
      >
        <template #default>
          <el-button
            type="primary"
            link
            size="small"
            @click="copyResult"
            class="copy-btn"
          >
            <el-icon><CopyDocument /></el-icon>
            Copy
          </el-button>
        </template>
      </el-alert>
    </div>

    <div v-if="scanHistory.length > 0" class="history-section">
      <div class="section-header">
        <h3>Scan History</h3>
        <el-button type="danger" link @click="clearHistory">
          Clear History
        </el-button>
      </div>

      <el-timeline>
        <el-timeline-item
          v-for="(item, index) in scanHistory"
          :key="index"
          :timestamp="item.time"
          placement="top"
        >
          <el-card>
            <div class="history-item">
              <p>{{ item.text }}</p>
            </div>
          </el-card>
          <div class="item-actions">
            <el-button
              type="primary"
              link
              size="small"
              @click="copyHistoryItem(item.text)"
            >
              <el-icon><CopyDocument /></el-icon>
              Copy
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click="deleteHistoryItem(index)"
            >
              <el-icon><Delete /></el-icon>
              Delete
            </el-button>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import jsQR from "jsqr";
import { ElMessage } from "element-plus";
import { CopyDocument, Delete, Upload } from "@element-plus/icons-vue";

interface HistoryItem {
  text: string;
  time: string;
}

const fileInput = ref<HTMLInputElement | null>(null);
const scanResult = ref("");
const scanHistory = ref<HistoryItem[]>([]);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        scanResult.value = code.data;
        addToHistory(code.data);
        ElMessage.success("QR code recognized successfully");
      } else {
        scanResult.value = "";
        ElMessage.error("Could not recognize QR code");
      }
    };
    img.src = e.target?.result as string;
  };

  reader.readAsDataURL(file);
};

const addToHistory = (content: string) => {
  const now = new Date();
  const timeString = now.toLocaleString();

  const newItem: HistoryItem = {
    text: content,
    time: timeString,
  };
  scanHistory.value = [newItem, ...scanHistory.value];

  try {
    if (chrome?.storage?.local) {
      chrome.storage.local.set({ qrScanHistory: scanHistory.value });
    }
  } catch (error) {
    console.error("Failed to save scan history:", error);
  }

  if (scanHistory.value.length > 10) {
    scanHistory.value = scanHistory.value.slice(0, 10);
  }
};

const clearHistory = async () => {
  try {
    await chrome.storage.local.remove("qrScanHistory");
    scanHistory.value = [];
    ElMessage.success("Cleared successfully");
  } catch (error) {
    console.error("Error clearing history:", error);
    ElMessage.error("Failed to clear");
  }
};

const copyResult = () => {
  navigator.clipboard
    .writeText(scanResult.value)
    .then(() => {
      ElMessage.success("Copied successfully");
    })
    .catch(() => {
      ElMessage.error("Failed to copy");
    });
};

const copyHistoryItem = (content: string) => {
  navigator.clipboard
    .writeText(content)
    .then(() => {
      ElMessage.success("Copied successfully");
    })
    .catch(() => {
      ElMessage.error("Failed to copy");
    });
};

const deleteHistoryItem = (index: number) => {
  scanHistory.value.splice(index, 1);
  if (chrome?.storage?.local) {
    chrome.storage.local.set({ qrScanHistory: scanHistory.value });
    ElMessage.success("Deleted successfully");
  }
};



onMounted(async () => {
  console.log('onMounted2')
  try {
    const result = await chrome.storage.local.get(['qrScanHistory']);
    console.log('Loading history:', result.qrScanHistory);
    if (result.qrScanHistory && Array.isArray(result.qrScanHistory)) {
      scanHistory.value = result.qrScanHistory;
    }
  } catch (error) {
    console.error('Error loading history:', error);
  }
});
</script>

<style lang="scss" scoped>
.qr-scanner {
  // height: 600px;
  display: flex;
  flex-direction: column;

  .scan-controls {
    flex-shrink: 0;
  }

  .scan-result {
    margin: 16px 0;
    flex-shrink: 0;

    :deep(.el-alert) {
      .el-alert__content {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }

      .el-alert__title {
        word-break: break-all;
        white-space: pre-wrap;
      }

      .copy-btn {
        flex-shrink: 0;
      }
    }
  }

  .history-section {
    margin-top: 20px;
    flex: 1;
    // overflow: auto;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h3 {
        margin: 0;
      }
    }

    :deep(.el-card__body) {
      padding: 12px;
    }

    :deep(.el-timeline-item__content) {
      position: relative;
    }

    .item-actions {
      position: absolute;
      right: 0;
      top: -24px;
      display: flex;
      gap: 4px;
    }

    .history-item {
      p {
        margin: 0;
        word-break: break-all;
        white-space: pre-wrap;
      }
    }
  }
}

.container {
  width: 360px;
  min-height: 200px;
  padding: 16px;
}

.scan-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.empty {
  text-align: center;
  color: #909399;
  margin-top: 32px;
}

.records {
  margin: 0 -16px;
}

.record-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .record-text {
    font-size: 14px;
    line-height: 1.4;
    word-break: break-all;
    color: #606266;
  }

  .record-footer {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .record-time {
    font-size: 12px;
    color: #909399;
  }
}
</style>
