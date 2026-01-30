import React, { useState, useEffect } from 'react';

const CATEGORIES = [
    { id: 'TEXT', label: '纯文本 (TEXT)' },
    { id: 'LINK', label: '链接 (LINK)' },
    { id: 'CODE', label: '代码 (CODE)' },
    { id: 'EMAIL', label: '邮件 (EMAIL)' }
];

export default function PromptManager() {
    const [prompts, setPrompts] = useState([]);
    const [editingPrompt, setEditingPrompt] = useState(null); // Form state
    const [activeCategory, setActiveCategory] = useState('ALL');

    // Load Prompts
    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.getPrompts();
            window.electronAPI.onPromptsUpdate(setPrompts);
            return () => window.electronAPI.removePromptsListener();
        }
    }, []);

    const handleSave = (e) => {
        e.preventDefault();
        if (window.electronAPI && editingPrompt) {
            const promptToSave = {
                ...editingPrompt,
                id: editingPrompt.id || Date.now().toString()
            };
            window.electronAPI.savePrompt(promptToSave);
            setEditingPrompt(null);
        }
    };

    const handleDelete = (id) => {
        if (window.electronAPI && confirm('确定要删除这个指令吗？')) {
            window.electronAPI.deletePrompt(id);
        }
    };

    const filteredPrompts = activeCategory === 'ALL'
        ? prompts
        : prompts.filter(p => p.type === activeCategory);

    return (
        <div className="w-full h-screen flex flex-col overflow-hidden bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl"
            style={{
                WebkitAppRegion: 'drag',
                color: '#FFFFFF',
                textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                fontSmoothing: 'antialiased'
            }}>

            {/* Header */}
            <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-white/5 shrink-0">
                <div className="font-bold text-lg flex items-center gap-2">
                    🦁 AI 指令管理 (Prompt Manager)
                </div>
                <div className="flex gap-2 no-drag" style={{ WebkitAppRegion: 'no-drag' }}>
                    <button
                        onClick={() => window.close()}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-xs text-gray-400 hover:text-red-300"
                    >
                        关闭 (Close)
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">

                {/* Sidebar: Categories */}
                <div className="w-48 border-r border-white/10 p-2 flex flex-col gap-1 bg-black/20" style={{ WebkitAppRegion: 'no-drag' }}>
                    <button
                        onClick={() => setActiveCategory('ALL')}
                        className={`text-left px-3 py-2 rounded-lg text-xs font-bold ${activeCategory === 'ALL' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        全部 (ALL)
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`text-left px-3 py-2 rounded-lg text-xs font-bold ${activeCategory === cat.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                        >
                            {cat.label}
                        </button>
                    ))}

                    <div className="mt-auto pt-4 border-t border-white/10">
                        <button
                            onClick={() => setEditingPrompt({ id: '', type: 'TEXT', label: '新指令', content: '' })}
                            className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold shadow-lg transition-all active:scale-95"
                        >
                            + 新增指令 (Add New)
                        </button>
                    </div>
                </div>

                {/* Main Content: List or Editor */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white/5 relative" style={{ WebkitAppRegion: 'no-drag' }}>

                    {/* EDIT MODAL OVERLAY */}
                    {editingPrompt && (
                        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-8">
                            <form onSubmit={handleSave} className="w-full max-w-lg bg-[#2a2a2a] border border-white/20 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
                                <h3 className="text-xl font-bold text-white mb-2">
                                    {editingPrompt.id ? '编辑指令' : '新增指令'}
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs text-gray-400 font-bold">类型 (Category)</span>
                                        <select
                                            value={editingPrompt.type}
                                            onChange={e => setEditingPrompt({ ...editingPrompt, type: e.target.value })}
                                            className="bg-black/40 border border-white/10 rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
                                        >
                                            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                        </select>
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs text-gray-400 font-bold">显示名称 (Label)</span>
                                        <input
                                            type="text"
                                            value={editingPrompt.label}
                                            onChange={e => setEditingPrompt({ ...editingPrompt, label: e.target.value })}
                                            className="bg-black/40 border border-white/10 rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
                                            placeholder="例如: 翻译成中文"
                                            required
                                        />
                                    </label>
                                </div>

                                <label className="flex flex-col gap-1">
                                    <span className="text-xs text-gray-400 font-bold">触发条件 (Condition - 可选)</span>
                                    <input
                                        type="text"
                                        value={editingPrompt.condition || ''}
                                        onChange={e => setEditingPrompt({ ...editingPrompt, condition: e.target.value })}
                                        className="bg-black/40 border border-white/10 rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
                                        placeholder="例如: github.com (仅当链接包含此词时显示)"
                                    />
                                    <span className="text-[10px] text-gray-500">留空则在该分类下始终显示</span>
                                </label>

                                <label className="flex flex-col gap-1 flex-1">
                                    <span className="text-xs text-gray-400 font-bold">提示词模版 (Prompt Template)</span>
                                    <textarea
                                        value={editingPrompt.content}
                                        onChange={e => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
                                        className="bg-black/40 border border-white/10 rounded p-3 text-white text-sm font-mono h-32 focus:border-blue-500 outline-none resize-none"
                                        placeholder="输入提示词前缀..."
                                        required
                                    />
                                </label>

                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingPrompt(null)}
                                        className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                                    >
                                        保存
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* LIST */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {filteredPrompts.length === 0 && (
                            <div className="text-center text-gray-500 mt-10 text-xs">暂无指令</div>
                        )}
                        {filteredPrompts.map(prompt => (
                            <div key={prompt.id} className="group flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all">
                                <div className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 ${prompt.type === 'CODE' ? 'bg-blue-900/40 text-blue-300' :
                                    prompt.type === 'LINK' ? 'bg-green-900/40 text-green-300' :
                                        prompt.type === 'EMAIL' ? 'bg-yellow-900/40 text-yellow-300' :
                                            'bg-gray-700/50 text-gray-300'
                                    }`}>
                                    {prompt.type}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-sm text-white">{prompt.label}</span>
                                        {prompt.condition && (
                                            <span className="text-[10px] text-orange-300 bg-orange-900/20 px-1 rounded border border-orange-500/20">
                                                if '{prompt.condition}'
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 font-mono truncate opacity-70">
                                        {prompt.content}
                                    </div>
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setEditingPrompt(prompt)}
                                        className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(prompt.id)}
                                        className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded"
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
}
