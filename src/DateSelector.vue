<template>
  <v-date-input
    v-model="internalDate"
    v-bind="$attrs"
    prepend-inner-icon="mdi-calendar"
    :prepend-icon="null"
    variant="outlined"
  />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'

const date = defineModel<Date | null>();

function getDefaultDate(): Date {
    const today = new Date();
    return new Date(Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    ));
}

const internalDate = computed<Date>({
  get() {
    if (date.value === null || date.value === undefined) {
        return new Date();
    }
    // Javascript Date objects always have local timezone.
    // For a date such as 2026-02-02, the stored date value is 2026-02-01T16:00:00 GMT-0800.
    // If used directly, it will be shown as 2026-02-01 in local time.
    // In order to show as 2026-02-02, we have to take its UTC date components
    // to create a new Date object, so its value is 2026-02-02T00:00:00 GMT-0800.
    // Then it would be displayed correctly as 2026-02-02.
    return new Date(
        date.value.getUTCFullYear(),
        date.value.getUTCMonth(),
        date.value.getUTCDate());
  },
  set(val: Date) {
    // When new date is selected, such as 2026-02-02, the stored value is 2026-02-05T00:00:00 GMT-0800.
    // We want to store it in UTC timezone, so we have to take is date components,
    // create UTC epoch time and construct a new Date object from it.
    // The new stored date would be 2026-02-01T16:00:00 GMT-0800.
    const utcDate = new Date(Date.UTC(
        val.getFullYear(),
        val.getMonth(),
        val.getDate(),
        ));
    if (!date.value || +utcDate !== +date.value) {
        date.value = utcDate;
    }
  }
});

onMounted(() => {
    if (date.value === null || date.value === undefined) {
        date.value = getDefaultDate();
    }
});

</script>
