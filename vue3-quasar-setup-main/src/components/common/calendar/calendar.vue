<template>
  <div>
    <q-card>
      <q-card-section class="flex">
        <q-select
          v-model="day.author"
          :options="[
            { label: '전체일정', value: '' },
            { label: '개인일정', value: user.seq },
          ]"
          label="일정구분"
          outlined
          dense
          emit-value
          map-options
          options-dense
          style="width: 30%"
        />
        <q-space />
        <q-btn
          @click="(isDialog = true), (viewMode = 'form')"
          outline
          color="teal"
          flat
          label="일정등록"
          dense
          :ripple="false"
          class="text-bold"
        />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <FullCalendar :options />
      </q-card-section>
    </q-card>

    <CalencatDialog
      v-model:isDialog="isDialog"
      v-model:form="form"
      v-model:viewMode="viewMode"
      @update:model-value="closeDialog"
    />
  </div>
</template>
<script>
const intlzCalendarForm = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return {
    id: '',
    title: '', // 제목
    content: '', // 내용
    start: '', // 시작날짜 + 시작시간
    dayStart: `${year}-${month}-${day}`, // 시작날짜
    timeStart: '09:00', // 시작시간
    end: '', // 종료날짜
    dayEnd: `${year}-${month}-${day}`, // 종료날짜
    timeEnd: '21:00', // 종료시간
    display: 'block', // 일정, 메모 여부
    color: '#3788d8', // 배경색상
    textColor: 'white',
  };
};
</script>

<script setup>
import { useAuthStore } from 'src/stores/authStore';
import { storeToRefs } from 'pinia';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import CalencatDialog from 'src/components/common/calendar/CalendarDialog.vue';
import dayjs from 'dayjs';

const authStore = useAuthStore();
const { user, isAuthState } = storeToRefs(authStore);

const isDialog = ref(false);
const form = ref(intlzCalendarForm());
const viewMode = ref('form');

// daygrid에서는 시간 미표시, listGrid에서는 시간 표시
const displayEventTime = ref(false);

// calendar의 날짜를 받는 객체
const day = ref({
  start: '',
  end: '',
  author: '',
});
// calendar에 바인딩 될 이벤트 객체
const events = ref([]);

const closeDialog = (state = false) => {
  form.value = intlzCalendarForm();
  isDialog.value = false;
  if (state) executeScheduleList(day.value);
};
// ------------------------------------------------------------------------------
// 일정목록 가져오기
const { isLoading, execute: executeScheduleList } = useAsyncState(
  () => getScheduleList(day.value),
  null,
  {
    immediate: false,
    throwError: true,
    onSuccess: ({ status, data }) => {
      if (status == '200') {
        console.log(data.response.events);
        events.value = data.response.events;
      }
    },
  },
);
// ------------------------------------------------------------------------------
// 클릭한 스케줄 상세조회
const { execute: executSchedule } = useAsyncState(getSchedule, null, {
  immediate: false,
  throwError: true,
  onSuccess: ({ data }) => {
    form.value = data.response.event;
  },
});
// ------------------------------------------------------------------------------
// 깊은 감시를 통해 day의 값이 바뀔 때 (prev, next click) 데이터 요청
watch(
  () => day,
  () => executeScheduleList(day.value),
  { deep: true },
);
// ------------------------------------------------------------------------------
// calander
const options = ref({
  plugins: [dayGridPlugin, listPlugin, interactionPlugin],
  locale: 'ko', // 한국시간
  firstDay: 0, // 한 주의 시작을 일요일부터 (0 : 일요일, 1 : 월요일 ....)
  weekends: true, // 달력에 주말 포함여부
  nextDayThreshold: '00:00:00', // 해당 시간이 넘으면 다음 날짜로
  displayEventTime, // 달력에 시간포함 여부
  // editable: true, // false로 변경 시 draggable 작동 x
  initialView: 'dayGridMonth',
  dayMaxEvents: 4, // 하나의 cell에 표시될 이벤트 개수
  views: {
    dayGridMonth: { buttonText: '월' },
    listWeek: { buttonText: '주' },
    listDay: { buttonText: '일' },
  },
  headerToolbar: {
    start: 'prev,next today',
    center: 'title',
    end: 'dayGridMonth,listWeek,listDay',
  },
  // list-view에 events가 없을 경우
  noEventsContent: () => '등록된 일정이 없습니다.',
  // 이벤트 객체 바인딩 **
  events,
  // 날짜 셀 클릭 시 발생하는 이벤트
  dateClick: (arg) => {
    isDialog.value = true;
    // day_start를 오늘날짜로 변경
    form.value.dayStart = arg.dateStr;
    viewMode.value = 'form';
  },
  // calendar의 이벤트 요소를 클릭하면 실행되는 메서드
  eventClick: async ({ event }) => {
    try {
      const eventDate = event.startStr.slice(0, event.startStr.indexOf('T'));
      // popover
      const popover = document.querySelector(`div[data-date="${eventDate}"]`);
      if (popover != null) popover.style.display = 'none';

      isDialog.value = true;
      viewMode.value = 'detail';

      await executSchedule(0, event);
    } catch (err) {
      console.log('err' + err);
    }
  },
  // calendar의 날짜가 변경되면 실행되는 메서드
  datesSet: function ({ startStr, endStr }) {
    day.value.start = startStr;
    day.value.end = dayjs(endStr).subtract(1, 'days').format();
  },
  // calendar의 grid가 변경되면 실행되는 메서드
  viewDidMount: function ({ view }) {
    displayEventTime.value = view.type == 'dayGridMonth' ? false : true;
  },
}); // options end
// ------------------------------------------------------------------------------
</script>

<style>
/* 일요일 날짜 빨간색 */
.fc-day-sun div a {
  color: red;
  text-decoration: none;
}

/* 토요일 날짜 파란색 */
.fc-day-sat div a {
  color: #3788d8;
  text-decoration: none;
}
</style>

<!--
https://velog.io/@chloeun/FullCalendar 참고

# install

  -  npm i --save @fullcalendar/list
  -  npm i --save @fullcalendar/core
  -  npm i --save @fullcalendar/daygrid
  -  npm i --save @fullcalendar/interaction
  -  npm i --save @fullcalendar/vue3
  -  npm i dayjs
-->
