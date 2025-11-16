import dayjs from 'dayjs';
import { reactive, ref, computed, watch } from 'vue';
import { showToast } from 'vant';
import { useConfigStore } from '@/stores/config';
const configStore = useConfigStore();
const form = reactive({ ...configStore.credentials });
const runtimeMode = ref(configStore.runtimeMode);
const saving = ref(false);
const lastSyncedLabel = computed(() => {
    if (!configStore.lastSyncedAt)
        return '尚未同步';
    return dayjs(configStore.lastSyncedAt).format('YYYY/MM/DD HH:mm:ss');
});
const modeHint = computed(() => runtimeMode.value === 'frontend' ? '浏览器直接请求折淘客接口' : '后端代为加密与代理');
watch(() => ({ ...configStore.credentials }), (value) => {
    Object.assign(form, value);
});
function handleSubmit() {
    saving.value = true;
    setTimeout(() => {
        if (runtimeMode.value === 'frontend') {
            configStore.updateCredentials({ ...form });
        }
        configStore.updateRuntimeMode(runtimeMode.value);
        saving.value = false;
        showToast({ type: 'success', message: '配置已更新' });
    }, 250);
}
function handleReset() {
    configStore.resetCredentials();
    Object.assign(form, configStore.credentials);
    showToast({ type: 'success', message: '已清空本地缓存' });
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
    title: "密钥配置",
}));
const __VLS_2 = __VLS_1({
    title: "密钥配置",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const __VLS_5 = {}.VanNoticeBar;
/** @type {[typeof __VLS_components.VanNoticeBar, typeof __VLS_components.vanNoticeBar, ]} */ ;
// @ts-ignore
VanNoticeBar;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    ...{ class: "page__notice" },
    wrapable: true,
    color: "#f97316",
    background: "#fff7ed",
    text: "密钥仅保存在本地浏览器中，请勿在公共设备上启用纯前端模式",
}));
const __VLS_7 = __VLS_6({
    ...{ class: "page__notice" },
    wrapable: true,
    color: "#f97316",
    background: "#fff7ed",
    text: "密钥仅保存在本地浏览器中，请勿在公共设备上启用纯前端模式",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
__VLS_asFunctionalElement(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "section-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
    ...{ class: "section-title" },
});
const __VLS_10 = {}.VanCellGroup;
/** @type {[typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, typeof __VLS_components.VanCellGroup, typeof __VLS_components.vanCellGroup, ]} */ ;
// @ts-ignore
VanCellGroup;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({
    inset: true,
}));
const __VLS_12 = __VLS_11({
    inset: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
const { default: __VLS_14 } = __VLS_13.slots;
const __VLS_15 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
VanField;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
    label: "运行模式",
}));
const __VLS_17 = __VLS_16({
    label: "运行模式",
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
const { default: __VLS_19 } = __VLS_18.slots;
{
    const { input: __VLS_20 } = __VLS_18.slots;
    const __VLS_21 = {}.VanRadioGroup;
    /** @type {[typeof __VLS_components.VanRadioGroup, typeof __VLS_components.vanRadioGroup, typeof __VLS_components.VanRadioGroup, typeof __VLS_components.vanRadioGroup, ]} */ ;
    // @ts-ignore
    VanRadioGroup;
    // @ts-ignore
    const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
        modelValue: (__VLS_ctx.runtimeMode),
        direction: "horizontal",
    }));
    const __VLS_23 = __VLS_22({
        modelValue: (__VLS_ctx.runtimeMode),
        direction: "horizontal",
    }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    const { default: __VLS_25 } = __VLS_24.slots;
    // @ts-ignore
    [runtimeMode,];
    const __VLS_26 = {}.VanRadio;
    /** @type {[typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, ]} */ ;
    // @ts-ignore
    VanRadio;
    // @ts-ignore
    const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
        name: "frontend",
    }));
    const __VLS_28 = __VLS_27({
        name: "frontend",
    }, ...__VLS_functionalComponentArgsRest(__VLS_27));
    const { default: __VLS_30 } = __VLS_29.slots;
    var __VLS_29;
    const __VLS_31 = {}.VanRadio;
    /** @type {[typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, typeof __VLS_components.VanRadio, typeof __VLS_components.vanRadio, ]} */ ;
    // @ts-ignore
    VanRadio;
    // @ts-ignore
    const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
        name: "backend",
    }));
    const __VLS_33 = __VLS_32({
        name: "backend",
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
    const { default: __VLS_35 } = __VLS_34.slots;
    var __VLS_34;
    var __VLS_24;
}
var __VLS_18;
const __VLS_36 = {}.VanCell;
/** @type {[typeof __VLS_components.VanCell, typeof __VLS_components.vanCell, ]} */ ;
// @ts-ignore
VanCell;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    title: "当前状态",
    value: (__VLS_ctx.modeHint),
}));
const __VLS_38 = __VLS_37({
    title: "当前状态",
    value: (__VLS_ctx.modeHint),
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
// @ts-ignore
[modeHint,];
var __VLS_13;
__VLS_asFunctionalElement(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "section-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
    ...{ class: "section-title" },
});
const __VLS_41 = {}.VanForm;
/** @type {[typeof __VLS_components.VanForm, typeof __VLS_components.vanForm, typeof __VLS_components.VanForm, typeof __VLS_components.vanForm, ]} */ ;
// @ts-ignore
VanForm;
// @ts-ignore
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
    ...{ 'onSubmit': {} },
}));
const __VLS_43 = __VLS_42({
    ...{ 'onSubmit': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
let __VLS_45;
let __VLS_46;
const __VLS_47 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.handleSubmit) });
const { default: __VLS_48 } = __VLS_44.slots;
// @ts-ignore
[handleSubmit,];
const __VLS_49 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
VanField;
// @ts-ignore
const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
    modelValue: (__VLS_ctx.form.appkey),
    name: "appkey",
    label: "AppKey",
    placeholder: "请输入折淘客 AppKey",
    disabled: (__VLS_ctx.runtimeMode === 'backend'),
    required: true,
}));
const __VLS_51 = __VLS_50({
    modelValue: (__VLS_ctx.form.appkey),
    name: "appkey",
    label: "AppKey",
    placeholder: "请输入折淘客 AppKey",
    disabled: (__VLS_ctx.runtimeMode === 'backend'),
    required: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_50));
// @ts-ignore
[runtimeMode, form,];
const __VLS_54 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
VanField;
// @ts-ignore
const __VLS_55 = __VLS_asFunctionalComponent(__VLS_54, new __VLS_54({
    modelValue: (__VLS_ctx.form.sid),
    name: "sid",
    label: "SID",
    placeholder: "请输入 SID",
    disabled: (__VLS_ctx.runtimeMode === 'backend'),
    required: true,
}));
const __VLS_56 = __VLS_55({
    modelValue: (__VLS_ctx.form.sid),
    name: "sid",
    label: "SID",
    placeholder: "请输入 SID",
    disabled: (__VLS_ctx.runtimeMode === 'backend'),
    required: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_55));
// @ts-ignore
[runtimeMode, form,];
const __VLS_59 = {}.VanField;
/** @type {[typeof __VLS_components.VanField, typeof __VLS_components.vanField, ]} */ ;
// @ts-ignore
VanField;
// @ts-ignore
const __VLS_60 = __VLS_asFunctionalComponent(__VLS_59, new __VLS_59({
    modelValue: (__VLS_ctx.form.customerId),
    name: "customerId",
    label: "客户 ID",
    placeholder: "请输入客户 ID",
    disabled: (__VLS_ctx.runtimeMode === 'backend'),
    required: true,
}));
const __VLS_61 = __VLS_60({
    modelValue: (__VLS_ctx.form.customerId),
    name: "customerId",
    label: "客户 ID",
    placeholder: "请输入客户 ID",
    disabled: (__VLS_ctx.runtimeMode === 'backend'),
    required: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_60));
// @ts-ignore
[runtimeMode, form,];
__VLS_asFunctionalElement(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-actions" },
});
const __VLS_64 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
VanButton;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    round: true,
    block: true,
    type: "primary",
    nativeType: "submit",
    loading: (__VLS_ctx.saving),
}));
const __VLS_66 = __VLS_65({
    round: true,
    block: true,
    type: "primary",
    nativeType: "submit",
    loading: (__VLS_ctx.saving),
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
const { default: __VLS_68 } = __VLS_67.slots;
// @ts-ignore
[saving,];
var __VLS_67;
const __VLS_69 = {}.VanButton;
/** @type {[typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, typeof __VLS_components.VanButton, typeof __VLS_components.vanButton, ]} */ ;
// @ts-ignore
VanButton;
// @ts-ignore
const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
    ...{ 'onClick': {} },
    round: true,
    block: true,
    type: "default",
}));
const __VLS_71 = __VLS_70({
    ...{ 'onClick': {} },
    round: true,
    block: true,
    type: "default",
}, ...__VLS_functionalComponentArgsRest(__VLS_70));
let __VLS_73;
let __VLS_74;
const __VLS_75 = ({ click: {} },
    { onClick: (__VLS_ctx.handleReset) });
const { default: __VLS_76 } = __VLS_72.slots;
// @ts-ignore
[handleReset,];
var __VLS_72;
var __VLS_44;
__VLS_asFunctionalElement(__VLS_intrinsics.p, __VLS_intrinsics.p)({
    ...{ class: "config-meta" },
});
(__VLS_ctx.lastSyncedLabel);
// @ts-ignore
[lastSyncedLabel,];
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['page__notice']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['form-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['config-meta']} */ ;
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
