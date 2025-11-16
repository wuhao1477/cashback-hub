import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import ActivityCard from '@/components/activity/ActivityCard.vue';
import ActivitySkeleton from '@/components/activity/ActivitySkeleton.vue';
import { fetchActivityList, getPlatformMetas } from '@/services/activityService';
import { useConfigStore } from '@/stores/config';
import { toDisplayMessage } from '@/utils/errors';
const router = useRouter();
const configStore = useConfigStore();
const platformMetas = getPlatformMetas();
const activePlatform = ref(platformMetas[0].code);
const items = ref([]);
const loading = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const page = ref(1);
const errorState = ref(null);
const PAGE_SIZE = 10;
const needConfig = computed(() => !configStore.isFrontendReady);
const securityHint = computed(() => configStore.runtimeMode === 'frontend'
    ? '纯前端模式将使用浏览器中的密钥，请注意设备安全'
    : '当前由后端代理请求，无需在浏览器内保留密钥');
watch(needConfig, (value) => {
    if (!value && !items.value.length) {
        handleRefresh();
    }
});
watch(() => activePlatform.value, () => {
    resetState();
    if (!needConfig.value) {
        handleLoad();
    }
});
onMounted(() => {
    if (!needConfig.value) {
        handleLoad();
    }
});
async function handleLoad() {
    if (loading.value || finished.value)
        return;
    loading.value = true;
    try {
        const result = await fetchActivityList(activePlatform.value, { page: page.value, pageSize: PAGE_SIZE });
        items.value = page.value === 1 ? result.items : [...items.value, ...result.items];
        finished.value = !result.hasMore;
        page.value += 1;
        errorState.value = null;
    }
    catch (error) {
        const info = toDisplayMessage(error);
        errorState.value = info;
        showToast({ type: 'fail', message: info.message });
    }
    finally {
        loading.value = false;
        refreshing.value = false;
    }
}
function handleRefresh() {
    resetState();
    handleLoad();
}
function resetState() {
    page.value = 1;
    items.value = [];
    finished.value = false;
    errorState.value = null;
}
function handleSelect(activity) {
    router.push({ name: 'activity-detail', params: { platform: activity.platform, id: activity.id } });
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
    title: "活动列表",
}));
const __VLS_2 = __VLS_1({
    title: "活动列表",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const __VLS_5 = {}.VanNoticeBar;
/** @type {[typeof __VLS_components.VanNoticeBar, typeof __VLS_components.vanNoticeBar, typeof __VLS_components.VanNoticeBar, typeof __VLS_components.vanNoticeBar, ]} */ ;
// @ts-ignore
VanNoticeBar;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    ...{ class: "page__notice" },
    wrapable: true,
    color: "#16a34a",
    background: "#dcfce7",
}));
const __VLS_7 = __VLS_6({
    ...{ class: "page__notice" },
    wrapable: true,
    color: "#16a34a",
    background: "#dcfce7",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
const { default: __VLS_9 } = __VLS_8.slots;
(__VLS_ctx.securityHint);
// @ts-ignore
[securityHint,];
var __VLS_8;
const __VLS_10 = {}.VanTabs;
/** @type {[typeof __VLS_components.VanTabs, typeof __VLS_components.vanTabs, typeof __VLS_components.VanTabs, typeof __VLS_components.vanTabs, ]} */ ;
// @ts-ignore
VanTabs;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({
    active: (__VLS_ctx.activePlatform),
    type: "card",
}));
const __VLS_12 = __VLS_11({
    active: (__VLS_ctx.activePlatform),
    type: "card",
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
const { default: __VLS_14 } = __VLS_13.slots;
// @ts-ignore
[activePlatform,];
for (const [meta] of __VLS_getVForSourceType((__VLS_ctx.platformMetas))) {
    // @ts-ignore
    [platformMetas,];
    const __VLS_15 = {}.VanTab;
    /** @type {[typeof __VLS_components.VanTab, typeof __VLS_components.vanTab, ]} */ ;
    // @ts-ignore
    VanTab;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
        key: (meta.code),
        title: (meta.name),
        name: (meta.code),
    }));
    const __VLS_17 = __VLS_16({
        key: (meta.code),
        title: (meta.name),
        name: (meta.code),
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
}
var __VLS_13;
if (__VLS_ctx.needConfig) {
    // @ts-ignore
    [needConfig,];
    __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "section-card" },
    });
    const __VLS_20 = {}.VanEmpty;
    /** @type {[typeof __VLS_components.VanEmpty, typeof __VLS_components.vanEmpty, ]} */ ;
    // @ts-ignore
    VanEmpty;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        imageSize: "120",
        description: "请先完成密钥配置",
    }));
    const __VLS_22 = __VLS_21({
        imageSize: "120",
        description: "请先完成密钥配置",
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    const __VLS_25 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    VanButton;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
        ...{ 'onClick': {} },
        block: true,
        type: "primary",
        ...{ style: {} },
    }));
    const __VLS_27 = __VLS_26({
        ...{ 'onClick': {} },
        block: true,
        type: "primary",
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    let __VLS_29;
    let __VLS_30;
    const __VLS_31 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(__VLS_ctx.needConfig))
                    return;
                __VLS_ctx.router.replace('/config');
                // @ts-ignore
                [router,];
            } });
    const { default: __VLS_32 } = __VLS_28.slots;
    var __VLS_28;
}
else {
    const __VLS_33 = {}.VanPullRefresh;
    /** @type {[typeof __VLS_components.VanPullRefresh, typeof __VLS_components.vanPullRefresh, typeof __VLS_components.VanPullRefresh, typeof __VLS_components.vanPullRefresh, ]} */ ;
    // @ts-ignore
    VanPullRefresh;
    // @ts-ignore
    const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
        ...{ 'onRefresh': {} },
        modelValue: (__VLS_ctx.refreshing),
    }));
    const __VLS_35 = __VLS_34({
        ...{ 'onRefresh': {} },
        modelValue: (__VLS_ctx.refreshing),
    }, ...__VLS_functionalComponentArgsRest(__VLS_34));
    let __VLS_37;
    let __VLS_38;
    const __VLS_39 = ({ refresh: {} },
        { onRefresh: (__VLS_ctx.handleRefresh) });
    const { default: __VLS_40 } = __VLS_36.slots;
    // @ts-ignore
    [refreshing, handleRefresh,];
    const __VLS_41 = {}.VanList;
    /** @type {[typeof __VLS_components.VanList, typeof __VLS_components.vanList, typeof __VLS_components.VanList, typeof __VLS_components.vanList, ]} */ ;
    // @ts-ignore
    VanList;
    // @ts-ignore
    const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
        ...{ 'onLoad': {} },
        loading: (__VLS_ctx.loading),
        finished: (__VLS_ctx.finished),
        immediateCheck: (false),
        finishedText: "没有更多了",
    }));
    const __VLS_43 = __VLS_42({
        ...{ 'onLoad': {} },
        loading: (__VLS_ctx.loading),
        finished: (__VLS_ctx.finished),
        immediateCheck: (false),
        finishedText: "没有更多了",
    }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    let __VLS_45;
    let __VLS_46;
    const __VLS_47 = ({ load: {} },
        { onLoad: (__VLS_ctx.handleLoad) });
    const { default: __VLS_48 } = __VLS_44.slots;
    // @ts-ignore
    [loading, finished, handleLoad,];
    if (__VLS_ctx.items.length) {
        // @ts-ignore
        [items,];
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.items))) {
            // @ts-ignore
            [items,];
            __VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "list-gap" },
                key: (item.id),
            });
            /** @type {[typeof ActivityCard, ]} */ ;
            // @ts-ignore
            const __VLS_49 = __VLS_asFunctionalComponent(ActivityCard, new ActivityCard({
                ...{ 'onSelect': {} },
                activity: (item),
            }));
            const __VLS_50 = __VLS_49({
                ...{ 'onSelect': {} },
                activity: (item),
            }, ...__VLS_functionalComponentArgsRest(__VLS_49));
            let __VLS_52;
            let __VLS_53;
            const __VLS_54 = ({ select: {} },
                { onSelect: (__VLS_ctx.handleSelect) });
            // @ts-ignore
            [handleSelect,];
            var __VLS_51;
        }
    }
    else if (__VLS_ctx.loading) {
        // @ts-ignore
        [loading,];
        /** @type {[typeof ActivitySkeleton, ]} */ ;
        // @ts-ignore
        const __VLS_56 = __VLS_asFunctionalComponent(ActivitySkeleton, new ActivitySkeleton({}));
        const __VLS_57 = __VLS_56({}, ...__VLS_functionalComponentArgsRest(__VLS_56));
        /** @type {[typeof ActivitySkeleton, ]} */ ;
        // @ts-ignore
        const __VLS_60 = __VLS_asFunctionalComponent(ActivitySkeleton, new ActivitySkeleton({}));
        const __VLS_61 = __VLS_60({}, ...__VLS_functionalComponentArgsRest(__VLS_60));
    }
    else {
        const __VLS_64 = {}.VanEmpty;
        /** @type {[typeof __VLS_components.VanEmpty, typeof __VLS_components.vanEmpty, ]} */ ;
        // @ts-ignore
        VanEmpty;
        // @ts-ignore
        const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
            description: "暂无活动数据",
        }));
        const __VLS_66 = __VLS_65({
            description: "暂无活动数据",
        }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    }
    var __VLS_44;
    var __VLS_36;
}
if (__VLS_ctx.errorState) {
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
    const __VLS_69 = {}.VanButton;
    /** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
    // @ts-ignore
    VanButton;
    // @ts-ignore
    const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
        ...{ 'onClick': {} },
        plain: true,
        type: "danger",
        size: "small",
    }));
    const __VLS_71 = __VLS_70({
        ...{ 'onClick': {} },
        plain: true,
        type: "danger",
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_70));
    let __VLS_73;
    let __VLS_74;
    const __VLS_75 = ({ click: {} },
        { onClick: (__VLS_ctx.handleRefresh) });
    const { default: __VLS_76 } = __VLS_72.slots;
    // @ts-ignore
    [handleRefresh,];
    var __VLS_72;
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['page__notice']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['list-gap']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['error-card']} */ ;
/** @type {__VLS_StyleScopedClasses['error-card__title']} */ ;
/** @type {__VLS_StyleScopedClasses['error-card__message']} */ ;
/** @type {__VLS_StyleScopedClasses['error-card__trace']} */ ;
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
