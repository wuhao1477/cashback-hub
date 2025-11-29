/**
 * 聚推客供应商能力配置（占位）
 * 定义聚推客支持的平台和功能
 */

import type { ProviderCapabilities } from '../../types/provider';

/**
 * 聚推客供应商能力配置
 * 
 * 注意：这是一个占位配置，实际接入时需要根据聚推客API文档完善
 */
export const JUTUIKE_CAPABILITIES: ProviderCapabilities = {
    code: 'jutuike',
    name: '聚推客',
    description: '聚推客返利API服务商（即将支持）',
    website: 'https://www.jutuike.com',
    credentialFields: [
        {
            key: 'apiKey',
            label: 'API Key',
            placeholder: '请输入聚推客 API Key',
            required: true,
            type: 'text',
            helpText: '在聚推客控制台获取',
        },
        {
            key: 'secretKey',
            label: 'Secret Key',
            placeholder: '请输入 Secret Key',
            required: true,
            type: 'password',
            helpText: '用于接口签名',
        },
        {
            key: 'channelId',
            label: '渠道ID',
            placeholder: '请输入渠道ID',
            required: true,
            type: 'text',
            helpText: '推广渠道标识',
        },
    ],
    platforms: [
        // 占位：实际接入时根据聚推客支持的平台添加
        // {
        //     platform: 'meituan',
        //     features: ['activityList', 'activityDetail'],
        //     notes: '聚推客美团支持（待实现）',
        // },
    ],
};
