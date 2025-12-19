
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Settings, 
  Trophy, 
  ChevronRight, 
  Star,
  ShieldCheck,
  User,
  RotateCcw,
  Castle,
  Zap,
  Gamepad2,
  Heart,
  Loader2
} from 'lucide-react';
import { View, AppState, UserStats, WordPack, Word, ReviewEntry } from './types';
import { WORD_PACKS } from './constants';
import LearnView from './components/LearnView';
import PlayView from './components/PlayView';
import TestView from './components/TestView';
import ParentDashboard from './components/ParentDashboard';
import ReviewView from './components/ReviewView';
import { generateCharacterIcon, getCachedIcon, cacheIcon } from './geminiService';

const STORAGE_KEY = 'disney_paradise_v3';
const DAILY_GOAL = 15;

const REVIEW_INTERVALS = [
  1 * 60 * 60 * 1000,        // 1 hour
  24 * 60 * 60 * 1000,       // 1 day
  3 * 24 * 60 * 60 * 1000,   // 3 days
  7 * 24 * 60 * 60 * 1000,   // 1 week
  14 * 24 * 60 * 60 * 1000,  // 2 weeks
  30 * 24 * 60 * 60 * 1000,  // 1 month
];

const INITIAL_STATS: UserStats = {
  stars: 5,
  wordsMastered: 0,
  studyMinutes: 0,
  streak: 1,
  lastActive: new Date().toISOString(),
  wordsLearnedToday: 0,
  dailyGoal: DAILY_GOAL
};

const CharacterIcon: React.FC<{ pack: WordPack }> = ({ pack }) => {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIcon = async () => {
      const cacheKey = `icon_${pack.character}`;
      const savedIcon = await getCachedIcon(cacheKey);
      
      if (savedIcon) {
        setIconUrl(savedIcon);
        setLoading(false);
        return;
      }

      const url = await generateCharacterIcon(pack.characterPrompt);
      if (url) {
        setIconUrl(url);
        await cacheIcon(cacheKey, url);
      }
      setLoading(false);
    };
    fetchIcon();
  }, [pack]);

  return (
    <div className={`w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-[1.5rem] sm:rounded-[2.5rem] ${pack.color} flex items-center justify-center shadow-lg shadow-pink-100 group-hover:rotate-12 transition-transform overflow-hidden relative`}>
      {loading ? (
        <Loader2 className="text-pink-300 animate-spin" size={20} />
      ) : iconUrl ? (
        <img src={iconUrl} alt={pack.character} className="w-full h-full object-cover scale-110" />
      ) : (
        <span className="text-3xl sm:text-5xl">{pack.icon}</span>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const todayStr = new Date().toDateString();
    
    if (saved) {
      const parsed = JSON.parse(saved);
      const lastActiveDate = new Date(parsed.stats.lastActive).toDateString();
      
      if (lastActiveDate !== todayStr) {
        parsed.stats.wordsLearnedToday = 0;
        parsed.stats.lastActive = new Date().toISOString();
      }
      
      return {
        view: View.HOME,
        stats: { ...INITIAL_STATS, ...parsed.stats },
        currentCategory: parsed.currentCategory || 'Unit 1 学科王国',
        wrongWords: parsed.wrongWords || [],
        reviewData: parsed.reviewData || {}
      };
    }
    return {
      view: View.HOME,
      stats: INITIAL_STATS,
      currentCategory: 'Unit 1 学科王国',
      wrongWords: [],
      reviewData: {}
    };
  });

  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setShowWarning(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dueReviewWords = useMemo(() => {
    const now = Date.now();
    return Object.values(state.reviewData).filter((entry: ReviewEntry) => {
      if (entry.stage >= REVIEW_INTERVALS.length) return false;
      const interval = REVIEW_INTERVALS[entry.stage];
      return now - entry.lastReviewTime >= interval;
    });
  }, [state.reviewData]);

  const markWordMastered = (wordId: string) => {
    setState(prev => {
      const isNew = !prev.reviewData[wordId];
      return {
        ...prev,
        stats: { 
          ...prev.stats, 
          wordsMastered: isNew ? prev.stats.wordsMastered + 1 : prev.stats.wordsMastered,
          wordsLearnedToday: isNew ? prev.stats.wordsLearnedToday + 1 : prev.stats.wordsLearnedToday,
          lastActive: new Date().toISOString()
        },
        reviewData: {
          ...prev.reviewData,
          [wordId]: {
            wordId,
            lastReviewTime: Date.now(),
            stage: 0
          }
        }
      };
    });
  };

  const updateReviewResult = (wordId: string, success: boolean) => {
    setState(prev => {
      const entry = prev.reviewData[wordId];
      if (!entry) return prev;
      
      return {
        ...prev,
        reviewData: {
          ...prev.reviewData,
          [wordId]: {
            ...entry,
            lastReviewTime: Date.now(),
            stage: success ? entry.stage + 1 : 0
          }
        }
      };
    });
  };

  const renderHome = () => {
    const progressPercent = Math.min((state.stats.wordsLearnedToday / state.stats.dailyGoal) * 100, 100);
    const goalReached = state.stats.wordsLearnedToday >= state.stats.dailyGoal;

    return (
      <div className="max-w-4xl mx-auto px-5 py-4 sm:p-6 space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
        <div className="space-y-4">
          <section className="relative h-48 sm:h-80 rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden shadow-2xl bouncy-hover">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff9a9e] via-[#fad0c4] to-[#fad0c4] opacity-90"></div>
            
            <div className="relative h-full z-10 flex flex-col justify-center px-6 sm:px-16 text-[#5d4037]">
              <div className="flex items-center gap-2 mb-2 bg-white/40 w-fit px-3 py-1 rounded-full backdrop-blur-md border border-white/20">
                <Heart size={10} className="text-pink-500 fill-pink-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-pink-600">蜜蜜的梦幻乐园</span>
              </div>
              <h2 className="text-3xl sm:text-6xl font-black mb-1 drop-shadow-sm text-pink-700">你好，蜜蜜!</h2>
              <p className="text-sm sm:text-xl opacity-80 font-bold max-w-[200px] sm:max-w-md">探索今天第 {state.stats.wordsLearnedToday + 1} 个魔法单词！</p>
              
              <button 
                onClick={() => setState(s => ({ ...s, view: View.LEARN }))}
                className="mt-4 sm:mt-8 w-fit bg-pink-500 text-white px-6 sm:px-12 py-2.5 sm:py-4 rounded-[1.2rem] sm:rounded-[2rem] font-black text-base sm:text-xl hover:bg-pink-400 transition-all shadow-[0_4px_0_rgb(190,24,93)] active:translate-y-1 active:shadow-none flex items-center gap-2"
              >
                开始冒险 <ChevronRight size={18} />
              </button>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 sm:gap-8">
            <div className="pixar-card p-4 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] flex flex-col justify-between h-32 sm:h-auto">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="p-2 sm:p-4 bg-pink-50 rounded-[0.8rem] sm:rounded-[1.5rem] text-pink-500">
                      <BookOpen size={20} />
                    </div>
                    <div className="hidden sm:block">
                      <h4 className="font-black text-slate-800 text-lg">今日进度</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-4xl font-black text-pink-500">{state.stats.wordsLearnedToday}</div>
                  </div>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] sm:text-xs text-pink-400 font-black uppercase">今日目标 {state.stats.dailyGoal}</p>
                  <div className="relative h-2 sm:h-4 bg-pink-50 rounded-full overflow-hidden p-0.5 shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${goalReached ? 'bg-gradient-to-r from-yellow-300 to-pink-500' : 'bg-gradient-to-r from-pink-300 to-rose-400'}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
               </div>
            </div>

            <button 
              onClick={() => setState(s => ({ ...s, view: View.REVIEW }))}
              className="pixar-card p-4 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] flex items-center justify-between group relative overflow-hidden h-32 sm:h-auto"
            >
               <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-6 relative z-10 w-full">
                  <div className="w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-pink-50 rounded-[1.2rem] sm:rounded-[2rem] flex items-center justify-center text-pink-400">
                    <Castle size={24} />
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="font-black text-slate-800 text-sm sm:text-xl">记忆城堡</h4>
                    {dueReviewWords.length > 0 && (
                      <span className="text-[10px] sm:text-sm text-pink-400 font-bold">{dueReviewWords.length} 个待复习</span>
                    )}
                  </div>
               </div>
               {dueReviewWords.length > 0 && (
                 <div className="absolute top-2 right-2 sm:static bg-rose-500 text-white w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-base animate-bounce border-2 sm:border-4 border-white shadow-lg">
                    {dueReviewWords.length}
                 </div>
               )}
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xl sm:text-3xl font-black mb-4 sm:mb-8 flex items-center gap-2 text-slate-800">
            <div className="w-1 h-6 sm:w-1.5 sm:h-8 bg-pink-400 rounded-full"></div>
            魔法主题岛屿
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-8">
            {WORD_PACKS.map((pack) => (
              <button
                key={pack.name}
                onClick={() => {
                  setState(s => ({ ...s, currentCategory: pack.name, view: View.LEARN }));
                }}
                className="group p-4 sm:p-10 rounded-[1.8rem] sm:rounded-[3rem] pixar-card hover:border-pink-200 transition-all text-center space-y-3 sm:space-y-4"
              >
                <CharacterIcon pack={pack} />
                <div>
                  <p className="font-black text-slate-700 text-sm sm:text-xl leading-tight">{pack.name.split(' ')[1]}</p>
                  <div className="mt-1 text-[8px] sm:text-[10px] font-black text-pink-300 uppercase tracking-widest">{pack.words.length} WORDS</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[100svh] flex flex-col bg-fixed relative">
      {state.view === View.HOME && (
        <header className="bg-white/40 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/50 px-5 sm:px-10 py-3 sm:py-6 flex items-center justify-between safe-pt">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg rotate-6">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-pink-600">单词乐园</h1>
              <p className="text-[8px] text-pink-300 font-black tracking-widest uppercase">Disney Edition</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-pink-500 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg">
              <Star className="text-white fill-white" size={14} />
              <span className="font-black text-white text-sm sm:text-base">{state.stats.stars}</span>
            </div>
            <button onClick={() => setState(s => ({ ...s, view: View.PARENT }))} className="p-2 sm:p-3 bg-white/50 rounded-xl text-pink-400">
              <Settings size={20} />
            </button>
          </div>
        </header>
      )}
      
      <main className="flex-1 overflow-y-auto pb-28">
        {state.view === View.HOME && renderHome()}
        {state.view === View.LEARN && (
          <LearnView 
            category={state.currentCategory} 
            onBack={() => setState(s => ({ ...s, view: View.HOME }))}
            onMastered={(id) => markWordMastered(id)}
            onComplete={() => setState(s => ({ ...s, view: View.TEST }))}
          />
        )}
        {state.view === View.REVIEW && (
          <ReviewView 
            dueWords={dueReviewWords}
            onBack={() => setState(s => ({ ...s, view: View.HOME }))}
            onResult={updateReviewResult}
            onComplete={() => {
              setState(s => ({ ...s, view: View.HOME }));
              const reward = dueReviewWords.length * 2;
              setState(prev => ({...prev, stats: {...prev.stats, stars: prev.stats.stars + reward}}));
            }}
          />
        )}
        {state.view === View.PLAY && (
          <PlayView onBack={() => setState(s => ({ ...s, view: View.HOME }))} onWin={(stars) => {
            setState(prev => ({...prev, stats: {...prev.stats, stars: prev.stats.stars + stars}}));
          }} />
        )}
        {state.view === View.TEST && (
          <TestView onBack={() => setState(s => ({ ...s, view: View.HOME }))} onResult={(score) => {
            setState(prev => ({...prev, stats: {...prev.stats, stars: prev.stats.stars + score}}));
          }} />
        )}
        {state.view === View.PARENT && (
          <ParentDashboard 
            stats={state.stats}
            wrongWords={state.wrongWords}
            onBack={() => setState(s => ({ ...s, view: View.HOME }))}
          />
        )}
      </main>

      {/* Optimized Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-white/80 backdrop-blur-3xl border border-white/50 flex items-center justify-around p-2.5 z-50 rounded-[2rem] shadow-2xl safe-pb">
        {[
          { icon: <BookOpen />, label: '学习', view: View.LEARN },
          { icon: <RotateCcw />, label: '复习', view: View.REVIEW },
          { icon: <Gamepad2 />, label: '游乐场', view: View.PLAY },
          { icon: <User />, label: '家长', view: View.PARENT },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => {
               if (navigator.vibrate) navigator.vibrate(10);
               setState(s => ({ ...s, view: item.view }));
            }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              state.view === item.view 
                ? 'text-pink-600' 
                : 'text-pink-200'
            }`}
          >
            {React.cloneElement(item.icon as React.ReactElement, { size: 22 })}
            <span className="text-[9px] font-black">{item.label}</span>
          </button>
        ))}
      </nav>

      {showWarning && (
        <div className="fixed inset-0 bg-pink-900/40 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-xs w-full text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-pink-700">该休息啦！</h3>
              <p className="text-slate-500 font-bold text-sm">
                蜜蜜已经学习很久了，休息一下眼睛吧！
              </p>
            </div>
            <button 
              onClick={() => { setShowWarning(false); setTimeLeft(15 * 60); }}
              className="w-full bg-pink-500 text-white py-4 rounded-[1.5rem] font-black text-lg shadow-lg"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
