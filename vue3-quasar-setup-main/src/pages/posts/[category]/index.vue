<template>
  <div>
    <q-card>
      <q-card-section>
        <!-- table -->
        <BaseTable
          :rows="rows"
          :columns
          rowKey="seq"
          label="등록된 게시글이 없습니다."
        />
      </q-card-section>
      <!-- pagenation -->
      <q-card-section>
        <BasePagination v-if="rows.length" v-model="page" />
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
const initializePageValue = (option) => {
  return {
    min: 1,
    current: 1,
    max: 1,
    ...option,
  };
};
</script>
<script setup>
import { columns } from '../../posts/options.js';

const route = useRoute();

const page = ref(initializePageValue(route.params));
// table row
const rows = ref([]);

const { execute: executeSelectByPaging } = useAsyncState(
  () => selectByPaging(page.value),
  null,
  {
    immediate: true,
    throwError: true,
    onSuccess: ({ data }) => {
      page.value = {
        ...data.page,
        ...route.params,
      };
      rows.value = data.list;
    },
  },
);
</script>
