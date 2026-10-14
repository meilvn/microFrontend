<script setup lang="ts">
import { computed, ref, watch, h } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import GlobalSelector from "../components/GlobalSelector.vue";
import DeviceFormDialog from "../components/DeviceFormDialog.vue";
import { useDeviceStore } from "../composables/useDeviceStore";
import type {
  Device,
  DeviceFormPayload,
  DeviceStatus,
  DeviceType,
} from "../types/device";
import {
  DEVICE_STATUS_LABEL,
  DEVICE_STATUS_OPTIONS,
  DEVICE_STATUS_TAG,
  DEVICE_TYPE_LABEL,
  DEVICE_TYPE_OPTIONS,
  DEVICE_TYPE_TAG,
  LOG_ACTION_LABEL,
  LOG_ACTION_TAG,
} from "../types/device";

const store = useDeviceStore();

/* ---------------- 筛选条件 ---------------- */
const keyword = ref("");
const filterType = ref<string | number | null>(null);
const filterStatus = ref<string | number | null>(null);
const dateRange = ref<[string, string] | null>(null);

/* ---------------- 分页 ---------------- */
const page = ref(1);
const pageSize = ref(5);
const total = ref(0);

/* ---------------- 表格选择 ---------------- */
const selectedRows = ref<Device[]>([]);

/* ---------------- 弹窗状态 ---------------- */
const dialogVisible = ref(false);
const editingDevice = ref<Device | null>(null);
const detailVisible = ref(false);
const detailDevice = ref<Device | null>(null);

/* ---------------- 数据派生 ---------------- */
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return store.devices.value.filter((device) => {
    const matchKw =
      !kw ||
      device.name.toLowerCase().includes(kw) ||
      device.code.toLowerCase().includes(kw);
    const matchType = !filterType.value || device.type === filterType.value;
    const matchStatus =
      !filterStatus.value || device.status === filterStatus.value;
    const matchDate =
      !dateRange.value ||
      (device.installDate >= dateRange.value[0] &&
        device.installDate <= dateRange.value[1]);
    return matchKw && matchType && matchStatus && matchDate;
  });
});

const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filtered.value.slice(start, start + pageSize.value);
});

watch(
  filtered,
  (list) => {
    total.value = list.length;
    const maxPage = Math.max(1, Math.ceil(list.length / pageSize.value));
    if (page.value > maxPage) page.value = maxPage;
  },
  { immediate: true },
);

const statTotal = computed(() => store.devices.value.length);
const statOnline = computed(
  () => store.devices.value.filter((item) => item.status === "online").length,
);
const statOffline = computed(
  () => store.devices.value.filter((item) => item.status === "offline").length,
);
const statAbnormal = computed(
  () =>
    store.devices.value.filter(
      (item) => item.status === "fault" || item.status === "maintenance",
    ).length,
);

/* ---------------- 动作 ---------------- */
function resetFilters(): void {
  keyword.value = "";
  filterType.value = null;
  filterStatus.value = null;
  dateRange.value = null;
}

function openCreate(): void {
  editingDevice.value = null;
  dialogVisible.value = true;
}

function openEdit(row: Device): void {
  editingDevice.value = row;
  dialogVisible.value = true;
}

function openDetail(row: Device): void {
  detailDevice.value = row;
  detailVisible.value = true;
}

function handleSubmit(payload: DeviceFormPayload): void {
  if (editingDevice.value) {
    store.updateDevice(editingDevice.value.id, payload);
    ElMessage.success("设备已更新");
  } else {
    store.addDevice(payload);
    ElMessage.success("设备已新增");
  }
  dialogVisible.value = false;
  editingDevice.value = null;
}

async function handleDelete(row: Device): Promise<void> {
  try {
    await ElMessageBox.confirm(
      h("div", [
        h(
          "span",
          `确定删除设备「${row.name}」（${row.code}）吗？删除后不可恢复。`,
        ),
        h("div", { class: "box-container" }, [
          h("div", { type: "warning", size: "small" }, () => "高危操作"),
          h("span", { style: "margin-left: 8px; color: #999;" }, "请谨慎操作"),
        ]),
      ]),
      "删除确认",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        appendTo: document.getElementsByClassName('vue-sub-app')[0],
      },
    );
    store.removeDevice(row.id);
    ElMessage.success("设备已删除");
  } catch {
    /* 用户取消删除 */
  }
}

async function handleBatchDelete(): Promise<void> {
  if (!selectedRows.value.length) {
    ElMessage.warning("请先勾选要删除的设备");
    return;
  }
  console.log(document.getElementsByClassName('vue-sub-app')[0]);
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedRows.value.length} 台设备吗？删除后不可恢复。`,
      "批量删除确认",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        appendTo: document.getElementsByClassName('vue-sub-app')[0],
      },
    );
    store.batchRemove(selectedRows.value.map((item) => item.id));
    selectedRows.value = [];
    ElMessage.success("批量删除完成");
  } catch {
    /* 用户取消批量删除 */
  }
}

function handleSelectionChange(rows: Device[]): void {
  selectedRows.value = rows;
}
</script>

<template>
  <div class="va-page">
    <!-- 路由层（App.vue 的 router-view transition）统一负责页面切换动画 -->
    <div class="mx-auto flex max-w-[1180px] flex-col gap-4">
      <!-- qiankun 测试说明横幅 -->
      <el-alert type="info" :closable="false" show-icon>
        <template #title>
          子应用测试示例（vue-app）：全局选择器 / 弹窗 / 动画 / @import 样式 /
          Tailwind。 表格数据存于 localStorage（key 前缀
          vue-app:），可验证子应用数据隔离。
        </template>
      </el-alert>

      <!-- 统计卡片（Tailwind utility 布局） -->
      <div class="grid grid-cols-4 gap-4">
        <div
          class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-transform duration-300 hover:-translate-y-[3px] hover:shadow-md"
        >
          <div class="text-[26px] font-bold leading-tight text-blue-600">
            {{ statTotal }}
          </div>
          <div class="mt-1 text-xs text-gray-500">设备总数</div>
        </div>
        <div
          class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-transform duration-300 hover:-translate-y-[3px] hover:shadow-md"
        >
          <div class="text-[26px] font-bold leading-tight text-green-600">
            {{ statOnline }}
          </div>
          <div class="mt-1 text-xs text-gray-500">在线设备</div>
        </div>
        <div
          class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-transform duration-300 hover:-translate-y-[3px] hover:shadow-md"
        >
          <div class="text-[26px] font-bold leading-tight text-gray-500">
            {{ statOffline }}
          </div>
          <div class="mt-1 text-xs text-gray-500">离线设备</div>
        </div>
        <div
          class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-transform duration-300 hover:-translate-y-[3px] hover:shadow-md"
        >
          <div class="text-[26px] font-bold leading-tight text-red-600">
            {{ statAbnormal }}
          </div>
          <div class="mt-1 text-xs text-gray-500">故障 / 维护中</div>
        </div>
      </div>

      <!-- 筛选区：全局选择器 + 日期范围 -->
      <el-card shadow="never">
        <div class="flex flex-wrap items-center gap-3">
          <el-input
            v-model="keyword"
            placeholder="名称 / 编号关键字"
            clearable
            style="width: 220px"
            @keyup.enter="page = 1"
          />
          <GlobalSelector
            v-model="filterType"
            :options="DEVICE_TYPE_OPTIONS"
            placeholder="全部类型"
            width="150px"
          />
          <GlobalSelector
            v-model="filterStatus"
            :options="DEVICE_STATUS_OPTIONS"
            placeholder="全部状态"
            width="150px"
          />
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            start-placeholder="安装起始"
            end-placeholder="安装结束"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
          <el-button type="primary" @click="page = 1">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </el-card>

      <!-- 表格区 -->
      <el-card shadow="never">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <el-button type="primary" @click="openCreate">新增设备</el-button>
            <el-button
              type="danger"
              plain
              :disabled="!selectedRows.length"
              @click="handleBatchDelete"
            >
              批量删除{{
                selectedRows.length ? `（${selectedRows.length}）` : ""
              }}
            </el-button>
          </div>
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[5, 10, 20]"
            layout="total, sizes, prev, pager, next"
          />
        </div>

        <el-table
          :data="paged"
          border
          stripe
          row-key="id"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="46" />
          <el-table-column
            prop="name"
            label="设备名称"
            min-width="150"
            show-overflow-tooltip
          />
          <el-table-column prop="code" label="设备编号" width="120" />
          <el-table-column label="类型" width="96">
            <template #default="{ row }">
              <el-tag
                :type="DEVICE_TYPE_TAG[row.type as DeviceType]"
                size="small"
              >
                {{ DEVICE_TYPE_LABEL[row.type as DeviceType] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="104">
            <template #default="{ row }">
              <span class="va-status">
                <span class="status-dot" :class="`status-dot--${row.status}`" />
                <el-tag
                  :type="DEVICE_STATUS_TAG[row.status as DeviceStatus]"
                  size="small"
                >
                  {{ DEVICE_STATUS_LABEL[row.status as DeviceStatus] }}
                </el-tag>
              </span>
            </template>
          </el-table-column>
          <el-table-column
            prop="location"
            label="安装位置"
            min-width="150"
            show-overflow-tooltip
          />
          <el-table-column prop="owner" label="负责人" width="90" />
          <el-table-column prop="installDate" label="安装日期" width="112" />
          <el-table-column label="操作" width="168" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)"
                >详情</el-button
              >
              <el-button link type="primary" @click="openEdit(row)"
                >编辑</el-button
              >
              <el-button link type="danger" @click="handleDelete(row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="没有符合条件的设备" :image-size="80" />
          </template>
        </el-table>
      </el-card>

      <!-- 操作日志：TransitionGroup 列表动画 -->
      <el-card shadow="never">
        <template #header>
          <span>操作日志（TransitionGroup 动画示例）</span>
        </template>
        <transition-group name="log" tag="ul" class="va-log-list">
          <li v-for="log in store.logs.value" :key="log.id" class="va-log-item">
            <el-tag :type="LOG_ACTION_TAG[log.action]" size="small">
              {{ LOG_ACTION_LABEL[log.action] }}
            </el-tag>
            <span class="va-log-item__name">{{ log.deviceName }}</span>
            <span class="va-log-item__time">{{ log.time }}</span>
          </li>
        </transition-group>
        <el-empty
          v-if="!store.logs.value.length"
          description="暂无操作记录"
          :image-size="60"
        />
      </el-card>
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <DeviceFormDialog
      v-model="dialogVisible"
      :device="editingDevice"
      @submit="handleSubmit"
    />

    <!-- 详情抽屉（el-drawer：另一种 teleport 弹层形态） -->
    <el-drawer
      v-model="detailVisible"
      title="设备详情"
      size="400px"
      append-to-body
    >
      <template v-if="detailDevice">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="设备名称">{{
            detailDevice.name
          }}</el-descriptions-item>
          <el-descriptions-item label="设备编号">{{
            detailDevice.code
          }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">
            {{ DEVICE_TYPE_LABEL[detailDevice.type] }}
          </el-descriptions-item>
          <el-descriptions-item label="设备状态">
            <el-tag :type="DEVICE_STATUS_TAG[detailDevice.status]" size="small">
              {{ DEVICE_STATUS_LABEL[detailDevice.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="安装位置">{{
            detailDevice.location
          }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{
            detailDevice.owner
          }}</el-descriptions-item>
          <el-descriptions-item label="安装日期">{{
            detailDevice.installDate
          }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="detailDevice.remark" class="va-detail-remark">
          备注：{{ detailDevice.remark }}
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style>
.box-container {
  padding: 20px;
  background: red;
}
</style>
