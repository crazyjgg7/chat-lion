import React, { useState, useEffect } from 'react';

export default function Brain() {
    const [clipboardContent, setClipboardContent] = useState('');
    const [analysisType, setAnalysisType] = useState('TEXT'); // TEXT, CODE, LINK, EMAIL
    const [feedback, setFeedback] = useState(null);
    const [prompts, setPrompts] = useState([]); // Dynamic Prompts from Backend

    // 1. Listen for Clipboard Updates & Load Prompts
    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.getHistory();
            window.electronAPI.getPrompts(); // Initial fetch

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

            // Listen for Prompt Updates (Add/Edit/Delete)
            window.electronAPI.onPromptsUpdate((updatedPrompts) => {
                setPrompts(updatedPrompts);
            });

            return () => {
                window.electronAPI.removeClipboardListener();
                window.electronAPI.removePromptsListener(); // Need to implement this in preload if not already
            };
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
    const handleGeneratePrompt = (prompt) => {
        const finalPrompt = prompt.content + clipboardContent;

        // Copy Result
        if (window.electronAPI) {
            window.electronAPI.writeClipboard(finalPrompt);
        }

        // Show Feedback
        setFeedback({ id: prompt.id, text: '✅ 指令已复制!' });
        setTimeout(() => setFeedback(null), 1500);
    };

    // 4. Get Actions (Filter Dynamic Prompts)
    const getActions = () => {
        if (!prompts || prompts.length === 0) return [];

        let typePrompts = prompts.filter(p => p.type === analysisType);

        // Special Condition Handling (e.g., github.com)
        if (analysisType === 'LINK' && clipboardContent.includes('github.com')) {
            const githubPrompts = prompts.filter(p => p.type === 'LINK' && p.condition && clipboardContent.includes(p.condition));
            if (githubPrompts.length > 0) {
                return [...githubPrompts, ...typePrompts.filter(p => !p.condition)];
            }
        }

        // Filter out conditional prompts that don't match
        return typePrompts.filter(p => !p.condition || clipboardContent.includes(p.condition));
    };

    const currentActions = getActions();

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
                        {currentActions.length > 0 ? currentActions.map((action, i) => {
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
                        }) : (
                            <div className="text-center p-4 text-xs text-gray-500 italic">
                                没有可用的指令。请右键狮子 -&gt; "管理 AI 指令" 添加。
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
