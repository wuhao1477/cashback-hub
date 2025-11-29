/**
 * 折淘客供应商能力配置
 * 定义折淘客支持的平台和功能
 */

import type { ProviderCapabilities } from '../../types/provider';

/**
 * 折淘客供应商能力配置
 * 
 * 功能说明:
 * - activityList: 获取活动列表
 * - activityDetail: 获取活动详情
 * - convertLink: 转链(生成返利链接)
 * - qrcode: 二维码生成
 * - deeplink: App唤起链接
 * - miniProgram: 小程序路径
 * 
 * linkType 说明 (美团):
 * - 1: H5长链
 * - 2: H5短链
 * - 3: Deeplink/App唤起
 * - 4: 小程序唤起路径
 * - 5: 团口令
 */
export const ZHETAOKE_CAPABILITIES: ProviderCapabilities = {
    code: 'zhetaoke',
    name: '折淘客',
    description: '专业的外卖/电商返利API服务商，支持美团、饿了么、抖音等平台',
    website: 'https://www.zhetaoke.com',
    credentialFields: [
        {
            key: 'appkey',
            label: 'AppKey',
            placeholder: '请输入折淘客 AppKey',
            required: true,
            type: 'text',
            helpText: '在折淘客控制台 -> 我的应用 中获取',
        },
        {
            key: 'sid',
            label: 'SID',
            placeholder: '请输入推广位 SID',
            required: true,
            type: 'text',
            helpText: '推广位ID，用于佣金结算',
        },
        {
            key: 'customerId',
            label: '客户ID',
            placeholder: '可选，若账号要求可填写',
            required: false,
            type: 'text',
            helpText: '部分高级功能需要',
        },
    ],
    platforms: [
        {
            platform: 'meituan',
            features: ['activityList', 'activityDetail', 'convertLink', 'qrcode', 'deeplink', 'miniProgram'],
            supportedLinkTypes: [1, 2, 3, 4, 5],
            notes: '美团外卖返利，支持H5/App/小程序多种链接类型',
        },
        {
            platform: 'eleme',
            features: ['activityList', 'activityDetail', 'convertLink', 'qrcode'],
            supportedLinkTypes: [1, 2],
            notes: '饿了么外卖返利，支持H5链接和二维码',
        },
        {
            platform: 'douyin',
            features: ['activityList', 'activityDetail', 'convertLink'],
            supportedLinkTypes: [1, 2],
            notes: '抖音本地生活返利',
        },
    ],
};
