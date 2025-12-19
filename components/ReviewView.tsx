
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Volume2, Sparkles, Trophy, Star, CheckCircle2, RotateCcw } from 'lucide-react';
import { Word, ReviewEntry } from '../types';
import { WORD_PACKS } from '../constants';
import { generateDisneyImage, generatePronunciation, decodeAudioBuffer } from '../geminiService';

interface ReviewViewProps {
  dueWords: ReviewEntry[];
  onBack: () => void;
  onResult: (wordId: string, success: boolean) => void;
  onComplete: () => void;
}

const ReviewView: React.FC<ReviewViewProps> = ({ dueWords, onBack, onResult, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const allWords = useMemo(() => WORD_PACKS.flatMap(p => p.words), []);
  
  const currentEntry = dueWords[currentIndex];
  const currentWord = useMemo(() => 
    allWords.find(w => w.id === currentEntry?.wordId), 
    [currentEntry, allWords]
  );

  useEffect(() => {
    if (currentWord) {
      prepareQuestion();
      loadImage();
    }
  }, [currentWord]);

  const loadImage = async () => {
    setImageUrl(null);
    const url = await generateDisneyImage(currentWord!.en);
    setImageUrl(url);
  };

  const prepareQuestion = () => {
    const distractors = allWords
      .filter(w => w.en !== currentWord!.en)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.en);
    setOptions([...distractors, currentWord!.en].sort(() => Math.random() - 0.5));
    setSelectedOption(null);
    setFeedback(null);
  };

  const handleChoice = (choice: string) => {
    if (selectedOption) return;
    
    const isCorrect = choice === currentWord!.en;
    setSelectedOption(choice);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    onResult(currentWord!.id, isCorrect);

    setTimeout(() => {
      if (currentIndex < dueWords.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  const playAudio = async () => {
    const audioData = await generatePronunciation(currentWord!.en);
    if (audioData) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await decodeAudioBuffer(audioData, ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    }
  };

  if (dueWords.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center space-y-8 animate-in zoom-in duration-500 min-h-[80vh] flex flex-col justify-center">
        <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600">
          <CheckCircle2 size={64} />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-slate-800">暂无待复习单词</h2>
          <p className="text-slate-500 leading-relaxed">
            蜜蜜太棒了！所有的单词都在记忆城堡里乖乖待着呢。<br/>
            休息一下，或者去开启新的学习单元吧！
          </p>
        </div>
        <button onClick={onBack} className="bg-indigo-600 text-white py-4 px-8 rounded-2xl font-bold shadow-xl shadow-indigo-100">
          返回乐园
        </button>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto text-yellow-600 animate-bounce">
          <Trophy size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl font-black">复习魔法完成！</h2>
          <p className="text-slate-500">你成功巩固了 {dueWords.length} 个魔法单词</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border-2 border-yellow-50 flex items-center justify-between">
           <div className="text-left">
             <div className="text-xs font-bold text-slate-400 uppercase mb-1">获得奖励</div>
             <div className="text-3xl font-black text-yellow-500 flex items-center gap-1">
               <Star fill="currentColor" size={24} /> {dueWords.length * 2}
             </div>
           </div>
           <RotateCcw className="text-yellow-200" size={48} />
        </div>
        <button onClick={onComplete} className="w-full bg-purple-600 text-white py-5 rounded-2xl font-bold text-xl shadow-2xl">
          收下奖励并返回
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 flex flex-col min-h-[90vh]">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="text-slate-400 flex items-center gap-1 hover:text-slate-600">
          <ChevronLeft /> 离开城堡
        </button>
        <div className="bg-indigo-50 px-4 py-1.5 rounded-full text-indigo-600 text-xs font-black uppercase tracking-wider">
          复习中: {currentIndex + 1} / {dueWords.length}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-8 justify-center">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-4 border-indigo-50 relative overflow-hidden flex flex-col min-h-[400px]">
          <div className="relative aspect-square w-full bg-slate-50 rounded-2xl overflow-hidden mb-6">
            {imageUrl ? (
              <img src={imageUrl} alt="Review" className="w-full h-full object-cover animate-in fade-in zoom-in duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-200 animate-pulse">
                <Sparkles size={64} />
              </div>
            )}
            <button 
              onClick={playAudio}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full p-3 shadow-lg hover:scale-110 transition-transform text-indigo-600"
            >
              <Volume2 size={32} />
            </button>
          </div>
          
          <div className="text-center">
            <h3 className="text-4xl font-black text-slate-800">{currentWord?.cn}</h3>
            <p className="text-slate-400 mt-2 font-medium">请选出对应的英语单词</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleChoice(opt)}
              disabled={!!selectedOption}
              className={`
                p-6 rounded-2xl font-bold text-xl transition-all border-2
                ${selectedOption === opt 
                  ? (opt === currentWord?.en ? 'bg-green-500 border-green-500 text-white scale-105 shadow-xl shadow-green-100' : 'bg-red-500 border-red-500 text-white') 
                  : 'bg-white border-slate-100 hover:border-indigo-200 hover:text-indigo-600 text-slate-700'}
                ${feedback && opt === currentWord?.en ? 'bg-green-500 border-green-500 text-white' : ''}
              `}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewView;
