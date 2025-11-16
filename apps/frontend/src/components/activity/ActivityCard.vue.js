import { computed } from 'vue';
import { PLATFORM_META } from '@/constants/platforms';
const props = defineProps();
const emit = defineEmits();
const platformMeta = computed(() => PLATFORM_META[props.activity.platform]);
const coverBackground = computed(() => props.activity.cover
    ? `url(${props.activity.cover})`
    : 'linear-gradient(135deg, #c7d2fe, #6366f1)');
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('select', __VLS_ctx.activity);
            // @ts-ignore
            [emit, activity,];
        } },
    ...{ class: "activity-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "activity-card__thumb" },
    ...{ style: ({ backgroundImage: __VLS_ctx.coverBackground }) },
});
// @ts-ignore
[coverBackground,];
const __VLS_0 = {}.VanTag;
/** @type {[typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, ]} */ ;
// @ts-ignore
VanTag;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    color: (__VLS_ctx.platformMeta.color),
}));
const __VLS_2 = __VLS_1({
    color: (__VLS_ctx.platformMeta.color),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_4 } = __VLS_3.slots;
// @ts-ignore
[platformMeta,];
(__VLS_ctx.platformMeta.name);
// @ts-ignore
[platformMeta,];
var __VLS_3;
if (__VLS_ctx.activity.cached) {
    // @ts-ignore
    [activity,];
    const __VLS_5 = {}.VanTag;
    /** @type {[typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, ]} */ ;
    // @ts-ignore
    VanTag;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
        type: "success",
    }));
    const __VLS_7 = __VLS_6({
        type: "success",
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    const { default: __VLS_9 } = __VLS_8.slots;
    var __VLS_8;
}
if (__VLS_ctx.activity.status === 'offline') {
    // @ts-ignore
    [activity,];
    const __VLS_10 = {}.VanTag;
    /** @type {[typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, ]} */ ;
    // @ts-ignore
    VanTag;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({
        type: "danger",
    }));
    const __VLS_12 = __VLS_11({
        type: "danger",
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    const { default: __VLS_14 } = __VLS_13.slots;
    var __VLS_13;
}
__VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "activity-card__body" },
});
__VLS_asFunctionalElement(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "activity-card__title" },
});
(__VLS_ctx.activity.title);
// @ts-ignore
[activity,];
__VLS_asFunctionalElement(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "activity-card__deadline" },
});
(__VLS_ctx.activity.deadlineText);
// @ts-ignore
[activity,];
__VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "activity-card__footer" },
});
__VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "activity-card__label" },
});
__VLS_asFunctionalElement(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "activity-card__value" },
});
(__VLS_ctx.activity.commissionText);
// @ts-ignore
[activity,];
__VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "activity-card__tags" },
});
for (const [tag] of __VLS_getVForSourceType((__VLS_ctx.activity.tags))) {
    // @ts-ignore
    [activity,];
    __VLS_asFunctionalElement(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        key: (tag),
        ...{ class: "activity-card__tag" },
    });
    (tag);
}
/** @type {__VLS_StyleScopedClasses['activity-card']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-card__thumb']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-card__body']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-card__title']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-card__deadline']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-card__footer']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-card__label']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-card__value']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-card__tags']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-card__tag']} */ ;
const __VLS_export = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
