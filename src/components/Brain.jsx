import React, { useState, useEffect } from 'react';

export default function Brain() {
    const [clipboardContent, setClipboardContent] = useState('');
    const [analysisType, setAnalysisType] = useState('TEXT'); // TEXT, CODE, LINK, EMAIL
    const [feedback, setFeedback] = useState(null); // { id: 'translate', text: '指令已复制!' }

    // 1. Listen for Clipboard Updates
    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.getHistory();
            window.electronAPI.onClipboardUpdate((newItem) => {
                let text = '';
                if (Array.isArray(newItem) && newItem.length > 0) {
                    text = newItem[0].content || '';
                } else if (newItem && newItem.content) {
                    text = newItem.content;
                }

                if (text) {
                    setClipboardContent(text);
                    analyzeContent(text);
                }
            });
            return () => window.electronAPI.removeClipboardListener();
        }
    }, []);

    // 2. Simple Heuristics for Content Type
    const analyzeContent = (text) => {
        const trimmed = text.trim();
        if (trimmed.match(/^https?:\/\//) || trimmed.match(/^www\./)) {
            setAnalysisType('LINK');
        } else if (trimmed.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setAnalysisType('EMAIL');
        } else if (trimmed.includes('function') || trimmed.includes('const ') || trimmed.includes('import ') || trimmed.includes('class ') || (trimmed.includes('{') && trimmed.includes('}'))) {
            setAnalysisType('CODE');
        } else {
            setAnalysisType('TEXT');
        }
    };

    // 3. Prompt Generation Handler
    const handleGeneratePrompt = (action) => {
        let promptPrefix = "";

        switch (action.id) {
            // TEXT
            case 'translate': promptPrefix = "请将以下内容翻译成地道、自然的英文（口语化风格）：\n\n"; break;
            case 'translate_cn': promptPrefix = "请将以下内容翻译成流畅、准确的中文：\n\n"; break; // NEW
            case 'summarize_text': promptPrefix = "请简要总结以下文本的主要内容，列出核心要点：\n\n"; break;
            case 'todo': promptPrefix = "请阅读以下内容，并整理出一个清晰的待办事项清单 (To-Do List)：\n\n"; break;

            // LINK
            case 'summarize_page': promptPrefix = "请访问这个链接，并总结其核心内容和关键结论：\n\n"; break;
            case 'explain_page': promptPrefix = "请通俗易懂地解释这个网页讲了什么（假设我是新手）：\n\n"; break;
            case 'extract_data': promptPrefix = "请从这个网页中提取出所有关键数据、日期和结论：\n\n"; break;

            // NEW: GitHub Special
            case 'deploy_github': promptPrefix = "请详细阅读这个 GitHub 仓库的文档，并一步步教我如何部署它：\n\n"; break; // NEW
            case 'analyze_repo': promptPrefix = "请分析这个 GitHub 项目的架构、主要功能和技术栈：\n\n"; break; // NEW

            // CODE
            case 'explain_code': promptPrefix = "请详细解释这段代码的逻辑和功能，逐行分析：\n\n"; break;
            case 'refactor': promptPrefix = "请作为资深工程师，优化这段代码的性能和可读性，并给出修改后的代码：\n\n"; break;
            case 'find_bugs': promptPrefix = "请帮我找出这段代码中潜在的 Bug 或安全隐患，并提供修复建议：\n\n"; break;

            // EMAIL
            case 'reply_polite': promptPrefix = "请帮我起草一封礼貌、专业的回复邮件，回应以下内容：\n\n"; break;
            case 'reply_refusal': promptPrefix = "请帮我写一封语气坚定但得体的拒绝邮件给对方：\n\n"; break;

            default: promptPrefix = "请分析以下内容：\n\n";
        }

        const finalPrompt = promptPrefix + clipboardContent;

        // Copy Result
        if (window.electronAPI) {
            window.electronAPI.writeClipboard(finalPrompt);
        }

        // Show Feedback
        setFeedback({ id: action.id, text: '✅ 指令已复制!' });
        setTimeout(() => setFeedback(null), 1500);
    };

    // 4. Actions Config
    const getActions = () => {
        switch (analysisType) {
            case 'LINK':
                // Check for GitHub
                if (clipboardContent.includes('github.com')) {
                    return [
                        { id: 'deploy_github', label: '🚀 部署帮助', desc: '生成部署 Prompt' }, // NEW
                        { id: 'analyze_repo', label: '📊 项目分析', desc: '生成项目分析 Prompt' }, // NEW
                        { id: 'summarize_page', label: '📄 网页总结', desc: '生成总结 Prompt' }
                    ];
                }
                return [
                    { id: 'summarize_page', label: '📄 网页总结', desc: '生成总结 Prompt' },
                    { id: 'explain_page', label: '👶 小白解释', desc: '生成通俗解释 Prompt' },
                    { id: 'extract_data', label: '🔍 提取数据', desc: '生成数据提取 Prompt' }
                ];
            case 'CODE':
                return [
                    { id: 'explain_code', label: '🧐 代码解释', desc: '生成代码分析 Prompt' },
                    { id: 'refactor', label: '⚡️ 优化重构', desc: '生成重构 Prompt' },
                    { id: 'find_bugs', label: '🐛 查找 Bug', desc: '生成 Debug Prompt' }
                ];
            case 'EMAIL':
                return [
                    { id: 'reply_polite', label: '✉️ 礼貌回复', desc: '生成回复 Prompt' },
                    { id: 'reply_refusal', label: '😡 委婉拒绝', desc: '生成拒绝 Prompt' }
                ];
            default: // TEXT
                return [
                    { id: 'translate', label: '🔤 翻译成英文', desc: '生成英译 Prompt' },
                    { id: 'translate_cn', label: '🀄️ 翻译成中文', desc: '生成中译 Prompt' }, // NEW
                    { id: 'summarize_text', label: '📝 总结内容', desc: '生成摘要 Prompt' },
                    { id: 'todo', label: '✅ 待办提取', desc: '生成 To-Do List Prompt' }
                ];
        }
    };

    return (
        <div className="absolute inset-0 flex flex-col w-full h-full font-sans bg-transparent">
            {/* Header */}
            <div className="h-8 px-4 flex items-center justify-between shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-80"
                    style={{ color: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                    AI 指令生成器
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10 ${analysisType === 'CODE' ? 'bg-blue-900/40 text-blue-200' :
                    analysisType === 'LINK' ? 'bg-green-900/40 text-green-200' :
                        analysisType === 'EMAIL' ? 'bg-yellow-900/40 text-yellow-200' :
                            'bg-gray-700/50 text-gray-200'
                    }`} style={{ textShadow: 'none' }}>
                    {analysisType === 'TEXT' ? '纯文本' :
                        analysisType === 'CODE' ? '代码片段' :
                            analysisType === 'LINK' ? '链接地址' : '邮件内容'}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 custom-scrollbar pt-3">

                {/* 1. Preview Area */}
                <div className="p-3 rounded-xl border border-white/10 relative overflow-hidden group"
                    style={{ backgroundColor: 'rgba(30,30,30,0.75)' }}>

                    <div className="text-[9px] mb-2 uppercase tracking-wide font-semibold opacity-60"
                        style={{ color: '#CCCCCC' }}>
                        当前剪贴板 (已识别)
                    </div>

                    <div className="text-xs font-mono break-all leading-relaxed whitespace-pre-wrap max-h-24 overflow-hidden mask-linear-fade"
                        style={{ color: '#FFFFFF', textShadow: '0 1px 1px rgba(0,0,0,0.8)', minHeight: '1.2em' }}>
                        {clipboardContent || <span className="opacity-50 italic">等待复制...</span>}
                    </div>
                </div>

                {/* 2. Prompt Actions */}
                <div>
                    <div className="text-[9px] mb-2 px-1 uppercase tracking-wide font-semibold opacity-60"
                        style={{ color: '#CCCCCC' }}>
                        选择 AI 指令 (点击复制)
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {getActions().map((action, i) => {
                            const isFeedback = feedback?.id === action.id;
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleGeneratePrompt(action)}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-lg border transition-all group text-left active:scale-95 ${isFeedback ? 'border-green-400/50 bg-green-900/30' : 'border-white/5 hover:border-blue-400/30 bg-[#2a2a2a]/80'
                                        }`}
                                >
                                    <div className="flex-1">
                                        <div className="text-sm font-bold transition-colors"
                                            style={{ color: isFeedback ? '#4ade80' : '#FFFFFF', textShadow: '0 1px 1px rgba(0,0,0,0.8)' }}>
                                            {isFeedback ? feedback.text : action.label}
                                        </div>
                                    </div>
                                    <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ color: '#FFFFFF' }}>
                                        ➜
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
