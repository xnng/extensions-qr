<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" class="demo-tabs">
      <el-tab-pane label="Generate QR Code" name="generator">
        <QrGenerator />
      </el-tab-pane>
      <el-tab-pane label="Scan QR Code" name="scanner">
        <QrScanner />
      </el-tab-pane>
      <template #extra>
        <el-button link size="small" @click="sendFeedback">
          <el-icon><Message /></el-icon>
          Feedback
        </el-button>
      </template>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Message } from "@element-plus/icons-vue";
import QrGenerator from "./components/QrGenerator.vue";
import QrScanner from "./components/QrScanner.vue";
import { ElTabs, ElTabPane } from "element-plus";

onMounted(() => {
  console.log('onMounted')
})

const activeTab = ref("generator");

const sendFeedback = () => {
  window.location.href = "mailto:xnng77@gmail.com?subject=QR Code Tool Feedback";
};
</script>

<style lang="scss">
.app-container {
  width: 400px;
  padding: 10px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .demo-tabs {
    width: 100%;
  }

  :deep(.el-tabs__header) {
    margin-bottom: 10px;
  }

  :deep(.el-tabs__extra) {
    margin-right: 16px;
  }
}
</style>
