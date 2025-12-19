
import React from 'react';
import { 
  ChevronLeft, 
  Calendar, 
  BookMarked, 
  Bell, 
  Trash2, 
  FileEdit,
  TrendingUp,
  PieChart,
  Volume2
} from 'lucide-react';
import { UserStats } from '../types';
import { WORD_PACKS } from '../constants';

interface ParentDashboardProps {
  stats: UserStats;
  wrongWords: string[];
  onBack: () => void;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ stats, wrongWords, onBack }) => {
  const allWords = WORD_PACKS.flatMap(p => p.words);
  const missedWordsList = allWords.filter(w => wrongWords.includes(w.id));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12 pb-24">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-slate-400 flex items-center gap-2 hover:text-slate-600 transition-colors">
          <ChevronLeft /> 返回乐园
        </button>
        <h2 className="text-2xl font-bold text-slate-800">家长中心</h2>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: '已学单词', value: stats.wordsMastered, color: 'blue', icon: <BookMarked /> },
          { label: '连续学习', value: `${stats.streak} 天`, color: 'orange', icon: <TrendingUp /> },
          { label: '本周时长', value: '1.2 小时', color: 'purple', icon: <Calendar /> },
          { label: '正确率', value: '88%', color: 'green', icon: <PieChart /> },
        ].map((item) => (
          <div key={item.label} className={`bg-${item.color}-50 p-6 rounded-3xl border border-${item.color}-100`}>
             <div className={`text-${item.color}-500 mb-2`}>{item.icon}</div>
             <div className="text-2xl font-black text-slate-800">{item.value}</div>
             <div className={`text-xs font-bold text-${item.color}-400 uppercase`}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wrong Words List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="text-xl font-bold">错题本</h3>
             <button className="text-sm text-purple-600 font-bold hover:underline">导出为复习卡</button>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            {missedWordsList.length > 0 ? (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">单词</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">含义</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">所属分类</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {missedWordsList.map(word => (
                    <tr key={word.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700">{word.en}</td>
                      <td className="px-6 py-4 text-slate-500">{word.cn}</td>
                      <td className="px-6 py-4">
                        <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-lg text-xs font-bold">{word.category}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-300 hover:text-red-400"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-slate-400 italic">
                错题本是空的！蜜蜜表现得太棒了！
              </div>
            )}
          </div>
        </div>

        {/* Parental Controls */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold">设置</h3>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="text-slate-400" />
                <span className="font-bold text-slate-700">单次限时</span>
              </div>
              <select className="bg-slate-50 border-0 rounded-xl px-4 py-2 text-sm font-bold text-purple-600 focus:ring-2 focus:ring-purple-200">
                <option>15 分钟</option>
                <option>30 分钟</option>
                <option>45 分钟</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="text-slate-400" />
                <span className="font-bold text-slate-700">发音口音</span>
              </div>
              <select className="bg-slate-50 border-0 rounded-xl px-4 py-2 text-sm font-bold text-purple-600 focus:ring-2 focus:ring-purple-200">
                <option>美式英语</option>
                <option>英式英语</option>
              </select>
            </div>

            <div className="pt-6 border-t border-slate-50">
               <button className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                 <FileEdit size={18} /> 管理孩子档案
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
