import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from 'vant';
import { fetchActivityDetail } from '@/services/activityService';
import { toDisplayMessage } from '@/utils/errors';
const router = useRouter();
const route = useRoute();
const detail = ref();
const loading = ref(true);
const errorState = ref(null);
onMounted(() => {
    loadDetail();
});
async function loadDetail() {
    loading.value = true;
    try {
        const platform = route.params.platform;
        const id = route.params.id;
        detail.value = await fetchActivityDetail(platform, id);
        errorState.value = null;
    }
    catch (error) {
        const info = toDisplayMessage(error);
        errorState.value = info;
        showToast({ type: 'fail', message: info.message });
    }
    finally {
        loading.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "page" },
});
const __VLS_0 = {}.VanNavBar;
/** @type {[typeof __VLS_components.VanNavBar, typeof __VLS_components.vanNavBar, ]} */ ;
// @ts-ignore
VanNavBar;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClickLeft': {} },
    title: "活动详情",
    leftArrow: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClickLeft': {} },
    title: "活动详情",
    leftArrow: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
const __VLS_6 = ({ clickLeft: {} },
    { onClickLeft: (__VLS_ctx.router.back) });
// @ts-ignore
[router,];
var __VLS_3;
if (__VLS_ctx.loading) {
    // @ts-ignore
    [loading,];
    __VLS_asFunctionalElement(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "section-card" },
    });
    const __VLS_8 = {}.VanSkeleton;
    /** @type {[typeof __VLS_components.VanSkeleton, typeof __VLS_components.vanSkeleton, ]} */ ;
    // @ts-ignore
    VanSkeleton;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        title: true,
        row: "4",
        loading: (true),
        avatar: true,
        avatarShape: "square",
    }));
    const __VLS_10 = __VLS_9({
        title: true,
        row: "4",
        loading: (true),
        avatar: true,
        avatarShape: "square",
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
}
else if (__VLS_ctx.errorState) {
    // @ts-ignore
    [errorState,];
    __VLS_asFunctionalElement(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "section-card error-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "error-card__title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "error-card__message" },
    });
    (__VLS_ctx.errorState.message);
    // @ts-ignore
    [errorState,];
    if (__VLS_ctx.errorState.traceId) {
        // @ts-ignore
        [errorState,];
        __VLS_asFunctionalElement(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "error-card__trace" },
        });
        (__VLS_ctx.errorState.traceId);
        // @ts-ignore
        [errorState,];
    }
    const __VLS_13 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    VanButton;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
        ...{ 'onClick': {} },
        size: "small",
        type: "primary",
    }));
    const __VLS_15 = __VLS_14({
        ...{ 'onClick': {} },
        size: "small",
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    let __VLS_17;
    let __VLS_18;
    const __VLS_19 = ({ click: {} },
        { onClick: (__VLS_ctx.loadDetail) });
    const { default: __VLS_20 } = __VLS_16.slots;
    // @ts-ignore
    [loadDetail,];
    var __VLS_16;
}
else if (__VLS_ctx.detail) {
    // @ts-ignore
    [detail,];
    __VLS_asFunctionalElement(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "section-card detail-hero" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-hero__info" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "detail-hero__title" },
    });
    (__VLS_ctx.detail.title);
    // @ts-ignore
    [detail,];
    __VLS_asFunctionalElement(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "detail-hero__deadline" },
    });
    (__VLS_ctx.detail.deadlineText);
    // @ts-ignore
    [detail,];
    const __VLS_21 = {}.VanTag;
    /** @type {[typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, ]} */ ;
    // @ts-ignore
    VanTag;
    // @ts-ignore
    const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
        type: "primary",
    }));
    const __VLS_23 = __VLS_22({
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    const { default: __VLS_25 } = __VLS_24.slots;
    (__VLS_ctx.detail.commissionText);
    // @ts-ignore
    [detail,];
    var __VLS_24;
    if (__VLS_ctx.detail.cached) {
        // @ts-ignore
        [detail,];
        const __VLS_26 = {}.VanTag;
        /** @type {[typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, typeof __VLS_components.VanTag, typeof __VLS_components.vanTag, ]} */ ;
        // @ts-ignore
        VanTag;
        // @ts-ignore
        const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
            type: "success",
        }));
        const __VLS_28 = __VLS_27({
            type: "success",
        }, ...__VLS_functionalComponentArgsRest(__VLS_27));
        const { default: __VLS_30 } = __VLS_29.slots;
        var __VLS_29;
    }
    if (__VLS_ctx.detail.cover) {
        // @ts-ignore
        [detail,];
        __VLS_asFunctionalElement(__VLS_intrinsics.img)({
            ...{ class: "detail-hero__thumb" },
            src: (__VLS_ctx.detail.cover),
            alt: "活动封面",
        });
        // @ts-ignore
        [detail,];
    }
    __VLS_asFunctionalElement(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "section-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "section-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "detail-description" },
    });
    (__VLS_ctx.detail.description);
    // @ts-ignore
    [detail,];
    if (__VLS_ctx.detail.link) {
        // @ts-ignore
        [detail,];
        const __VLS_31 = {}.VanButton;
        /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
        // @ts-ignore
        VanButton;
        // @ts-ignore
        const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
            block: true,
            type: "primary",
            icon: "link-o",
            href: (__VLS_ctx.detail.link),
            target: "_blank",
        }));
        const __VLS_33 = __VLS_32({
            block: true,
            type: "primary",
            icon: "link-o",
            href: (__VLS_ctx.detail.link),
            target: "_blank",
        }, ...__VLS_functionalComponentArgsRest(__VLS_32));
        const { default: __VLS_35 } = __VLS_34.slots;
        // @ts-ignore
        [detail,];
        var __VLS_34;
    }
    __VLS_asFunctionalElement(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "section-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
        ...{ class: "section-title" },
    });
    const __VLS_36 = {}.VanCellGroup;
    /** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
    // @ts-ignore
    VanCellGroup;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        inset: true,
    }));
    const __VLS_38 = __VLS_37({
        inset: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    const { default: __VLS_40 } = __VLS_39.slots;
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.detail.extra))) {
        // @ts-ignore
        [detail,];
        const __VLS_41 = {}.VanCell;
        /** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
        // @ts-ignore
        VanCell;
        // @ts-ignore
        const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
            key: (item.label),
            title: (item.label),
            value: (item.value),
        }));
        const __VLS_43 = __VLS_42({
            key: (item.label),
            title: (item.label),
            value: (item.value),
        }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    }
    var __VLS_39;
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['error-card']} */ ;
/** @type {__VLS_StyleScopedClasses['error-card__title']} */ ;
/** @type {__VLS_StyleScopedClasses['error-card__message']} */ ;
/** @type {__VLS_StyleScopedClasses['error-card__trace']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-hero']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-hero__info']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-hero__title']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-hero__deadline']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-hero__thumb']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-description']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
