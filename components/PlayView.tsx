
import React, { useState, useEffect } from 'react';
import { Trophy, ChevronLeft, Star, Heart, Sparkles } from 'lucide-react';
import { WORD_PACKS } from '../constants';
import { Word } from '../types';

interface PlayViewProps {
  onBack: () => void;
  onWin: (stars: number) => void;
}

const PlayView: React.FC<PlayViewProps> = ({ onBack, onWin }) => {
  const [gameWords, setGameWords] = useState<Word[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [clickedOption, setClickedOption] = useState<string | null>(null);

  useEffect(() => {
    const allWords = WORD_PACKS.flatMap(p => p.words);
    const shuffled = [...allWords].sort(() => Math.random() - 0.5).slice(0, 5);
    setGameWords(shuffled);
    prepareQuestion(shuffled[0], allWords);
  }, []);

  const prepareQuestion = (correctWord: Word, allWords: Word[]) => {
    const distractors = allWords
      .filter(w => w.en !== correctWord.en)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.en);
    
    setOptions([...distractors, correctWord.en].sort(() => Math.random() - 0.5));
    setFeedback(null);
    setClickedOption(null);
  };

  const handleChoice = (choice: string) => {
    if (gameOver || feedback !== null) return;

    setClickedOption(choice);
    const isCorrect = choice === gameWords[currentIndex].en;

    if (isCorrect) {
      if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
      setScore(s => s + 1);
      setFeedback('correct');
      setTimeout(() => {
        if (currentIndex < gameWords.length - 1) {
          setCurrentIndex(i => i + 1);
          prepareQuestion(gameWords[currentIndex + 1], WORD_PACKS.flatMap(p => p.words));
        } else {
          setGameOver(true);
          onWin(score + 10);
        }
      }, 1200);
    } else {
      if (navigator.vibrate) navigator.vibrate(100);
      setLives(l => l - 1);
      setFeedback('wrong');
      if (lives <= 1) {
        setTimeout(() => setGameOver(true), 800);
      } else {
        setTimeout(() => {
          setFeedback(null);
          setClickedOption(null);
        }, 1200);
      }
    }
  };

  if (gameOver) {
    return (
      <div className="max-w-md mx-auto px-6 py-6 text-center space-y-8 h-[90svh] flex flex-col justify-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-float relative">
          <Trophy size={48} className="text-pink-500" />
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-pink-700">魔法挑战完成</h2>
          <p className="text-pink-400 font-bold italic">“蜜蜜表现得太棒啦！”</p>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border-4 border-pink-50 flex justify-around">
          <div className="text-center">
            <div className="text-[10px] font-black text-pink-300 uppercase mb-1">得分率</div>
            <div className="text-2xl font-black text-pink-600">{Math.round((score/5)*100)}%</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-black text-pink-300 uppercase mb-1">获得奖励</div>
            <div className="text-2xl font-black text-yellow-500 flex items-center justify-center gap-1">
              <Star fill="currentColor" size={20} /> {score * 5 + 10}
            </div>
          </div>
        </div>
        <button 
          onClick={onBack}
          className="w-full py-5 bg-pink-500 text-white rounded-[1.2rem] font-black text-xl shadow-lg active:translate-y-1 transition-all"
        >
          收下礼物返回
        </button>
      </div>
    );
  }

  const currentWord = gameWords[currentIndex];

  return (
    <div className="max-w-md mx-auto px-5 py-4 flex flex-col h-[calc(100svh-100px)] justify-center safe-pt">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-pink-300 p-2 font-black flex items-center gap-1 text-sm">
          <ChevronLeft size={18} /> 退出
        </button>
        <div className="flex gap-1.5 bg-white/50 px-3 py-1.5 rounded-full border border-pink-50">
          {[...Array(3)].map((_, i) => (
            <Heart 
              key={i} 
              size={18} 
              className={`transition-all duration-500 ${i < lives ? 'text-rose-500 fill-rose-500 scale-110' : 'text-slate-200 opacity-30'}`} 
            />
          ))}
        </div>
      </div>

      <div className="text-center space-y-4 mb-6">
        <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest">
          第 {currentIndex + 1} / {gameWords.length} 关
        </div>
        <div className="bg-white/70 backdrop-blur-lg p-8 rounded-[2.5rem] shadow-xl border-4 border-pink-50 flex items-center justify-center min-h-[160px] animate-float">
          <h3 className="text-4xl sm:text-5xl font-black text-pink-700">{currentWord?.cn}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {options.map((option, idx) => {
          const isCorrect = option === currentWord.en;
          const isClicked = option === clickedOption;
          
          let btnStyle = "bg-white text-pink-700 border-2 border-white shadow-md active:bg-pink-50";
          
          if (feedback === 'correct') {
            if (isCorrect) btnStyle = "bg-pink-500 text-white scale-105 shadow-pink-100 animate-pop border-pink-500";
            else btnStyle = "opacity-30";
          } else if (feedback === 'wrong') {
            if (isClicked) btnStyle = "bg-rose-400 text-white animate-shake border-rose-400";
            else if (isCorrect) btnStyle = "border-pink-300 border-dashed text-pink-400 opacity-80";
            else btnStyle = "opacity-30";
          }

          return (
            <button
              key={idx}
              onClick={() => handleChoice(option)}
              disabled={feedback !== null}
              className={`
                py-4.5 px-6 rounded-[1.2rem] text-xl font-black transition-all transform
                ${btnStyle}
              `}
            >
              {option}
            </button>
          );
        })}
      </div>

      {feedback === 'correct' && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[100]">
           <div className="sparkle-effect text-pink-400/40">
             <Sparkles size={160} fill="currentColor" />
           </div>
        </div>
      )}
    </div>
  );
};

export default PlayView;
