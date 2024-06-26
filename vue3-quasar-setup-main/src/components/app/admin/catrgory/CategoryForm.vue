<template>
  <q-card flat class="q-pa-md border">
    <form @submit.prevent="handleSubmit" class="q-gutter-y-sm">
      <div class="row q-col-gutter-y-sm items-center">
        <label class="col-12 col-md-3 text-subtitle2 q-mb-sm">상위타입</label>
        <q-select
          :options="category.tree"
          @update:model-value="changeSeqHanlder"
          v-model="form.upperSeq"
          dense
          options-dense
          emit-value
          map-options
          bottom-slots
          outlined
          class="col-12 col-md-9"
        >
          <template v-slot:after>
            <q-btn
              @click="$emit('update:formValue', false)"
              dense
              outline
              color="grey-6"
              icon="refresh"
              :ripple="false"
              size="17px"
            >
              <q-tooltip> 초기화 </q-tooltip>
            </q-btn>
          </template>
        </q-select>
      </div>

      <div class="row q-col-gutter-y-sm items-center">
        <label class="col-12 col-md-3 text-subtitle2">카테고리명</label>
        <q-input v-model="form.name" outlined dense class="col-12 col-md-9" />
      </div>

      <div class="row q-col-gutter-y-sm q-py-md items-center">
        <label class="col-12 col-md-3 text-subtitle2">URL</label>
        <q-input
          v-model="form.url"
          :readonly="form.postYn == 'Y'"
          outlined
          dense
          class="col-12 col-md-9"
        />
      </div>

      <div class="row q-col-gutter-y-sm items-center">
        <label class="col-12 col-md-3 text-subtitle2">정렬</label>
        <q-input v-model="form.sort" outlined dense class="col-12 col-md-9" />
      </div>

      <q-separator class="q-my-lg" />

      <div class="row items-center">
        <label class="col-12 col-sm-3 text-subtitle2">게시판</label>
        <div class="col-12 col-sm-9">
          <q-radio
            v-model="form.postYn"
            size="sm"
            val="Y"
            label="사용"
            class="q-mr-lg"
          />
          <q-radio v-model="form.postYn" size="sm" val="N" label="미사용" />
        </div>
      </div>
      <div class="row items-center">
        <label for="" class="col-12 col-sm-3 text-subtitle2">공개여부</label>
        <div class="col-12 col-sm-9">
          <q-radio
            v-model="form.useYn"
            size="sm"
            val="Y"
            label="공개"
            class="q-mr-lg"
          />
          <q-radio v-model="form.useYn" size="sm" val="N" label="비공개" />
        </div>
      </div>

      <q-separator class="q-my-lg" />

      <q-markup-table>
        <thead>
          <tr>
            <th class="text-center">사용자</th>
            <th class="text-center">접근권한</th>
            <th class="text-center">등록</th>
            <th class="text-center">수정</th>
            <th class="text-center">삭제</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) of form.permission" :key="i">
            <td class="text-center">{{ item.idntfNm }}</td>
            <td class="text-center">
              <q-checkbox
                v-model="form.permission[i].access"
                size="sm"
                true-value="Y"
                :false-value="'N' || 'null'"
              />
            </td>
            <td class="text-center">
              <q-checkbox
                v-model="form.permission[i].add"
                size="sm"
                true-value="Y"
                false-value="N"
                :disable="form.depth != 2"
              />
            </td>
            <td class="text-center">
              <q-checkbox
                v-model="form.permission[i].update"
                size="sm"
                true-value="Y"
                false-value="N"
                :disable="form.depth != 2"
              />
            </td>
            <td class="text-center">
              <q-checkbox
                v-model="form.permission[i].delete"
                size="sm"
                true-value="Y"
                false-value="N"
                :disable="form.depth != 2"
              />
            </td>
          </tr>
        </tbody>
      </q-markup-table>

      <div class="flex">
        <q-space />
        <q-btn
          v-if="form.seq"
          @click="handleDelete"
          color="red"
          label="삭제"
          outline
          class="q-mr-md"
          :ripple="false"
          :loading="deleteLoading"
        />
        <q-btn
          @click="handleSubmit"
          color="teal"
          label="저장"
          outline
          :ripple="false"
          :loading="saveLoading"
        />
      </div>
    </form>
  </q-card>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useSystemStore } from 'src/stores/systemStore';

const systemStore = useSystemStore();
const { category, permission } = storeToRefs(systemStore);

const emit = defineEmits(['update:formValue']);

const form = defineModel();

// --------------------------------------------------------------------------
// 카테고리 등록 및 수정
const { isLoading: saveLoading, execute: save } = useAsyncState(
  saveCategory,
  null,
  {
    immediate: false,
    throwError: true,
    onSuccess: ({ data }) => {
      if (data.status == 'OK') {
        baseNotify('저장에 성공하였습니다.');
        emit('update:formValue', true);
      }
    },
  },
);

const handleSubmit = async () => {
  await save(0, form.value);
};
// --------------------------------------------------------------------------
// 카테고리 삭제
const { isLoading: deleteLoading, execute } = useAsyncState(
  deleteCategory,
  null,
  {
    immediate: false,
    throwError: true,
    onSuccess: (res) => {
      if (res?.status == 200) {
        baseNotify('삭제가 완료되었습니다.');
        emit('update:formValue');
      }
    },
  },
);

const handleDelete = () => {
  const message =
    form.value.depth < 2
      ? '상위항목 삭제 시 하위항목도 삭제됩니다. 삭제하시겠습니까?'
      : '카테고리를 삭제하시겠습니까?';
  baseNotify(
    message,
    { timeout: 5000 },
    () => {
      execute(0, form.value);
    },
    true,
  );
};
// --------------------------------------------------------------------------
const changeSeqHanlder = (value) => {
  const selectedOption = category.value.tree.find(
    (data) => data.value == value,
  );

  // root 선택시 depth : 0, 상위메뉴 선택 시  depth : 1
  form.value.depth = selectedOption?.depth + 1;

  for (let item of form.value.permission) {
    if (form.value.depth < 2) {
      item.add = null;
      item.update = null;
      item.delete = null;
    } else {
      item.add = item.add || 'Y';
      item.update = item.add || 'Y';
      item.delete = item.delete || 'Y';
    }
  }
};
</script>
