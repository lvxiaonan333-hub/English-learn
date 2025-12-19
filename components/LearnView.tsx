
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { WORD_PACKS } from '../constants';
import { generateDisneyImage, generatePronunciation, decodeAudioBuffer, getAudioCtx, playUISound } from '../geminiService';
import { Word } from '../types';

interface LearnViewProps {
  category: string;
  onBack: () => void;
  onMastered: (id: string) => void;
  onComplete: () => void;
}

const LearnView: React.FC<LearnViewProps> = ({ category, onBack, onMastered, onComplete }) => {
  const pack = WORD_PACKS.find(p => p.name === category) || WORD_PACKS[0];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState<Record<string, string>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  
  const currentWord = pack.words[currentIndex];

  // Helper to load a specific word's image
  const loadImage = useCallback(async (word: Word) => {
    if (images[word.id] || loadingIds.has(word.id)) return;
    
    setLoadingIds(prev => new Set(prev).add(word.id));
    try {
      const imgUrl = await generateDisneyImage(word.en);
      if (imgUrl) {
        setImages(prev => ({ ...prev, [word.id]: imgUrl }));
      }
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(word.id);
        return next;
      });
    }
  }, [images, loadingIds]);

  const playAudio = useCallback(async () => {
    const ctx = getAudioCtx();
    const audioData = await generatePronunciation(currentWord.en);
    if (audioData) {
      const buffer = await decodeAudioBuffer(audioData, ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    }
  }, [currentWord]);

  // Load current word and pre-fetch next
  useEffect(() => {
    loadImage(currentWord);
    
    // Auto-play pronunciation when card is shown
    const timer = setTimeout(() => {
      playAudio();
    }, 500);

    // Pre-fetch next word if available
    if (currentIndex < pack.words.length - 1) {
      const nextWord = pack.words[currentIndex + 1];
      loadImage(nextWord);
    }

    return () => clearTimeout(timer);
  }, [currentIndex, currentWord, pack.words, loadImage, playAudio]);

  const handleNext = () => {
    playUISound('magic');
    if (navigator.vibrate) navigator.vibrate(10);
    onMastered(currentWord.id);
    if (currentIndex < pack.words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    playUISound('pop');
    onBack();
  };

  const isImageLoading = loadingIds.has(currentWord.id);
  const currentImageUrl = images[currentWord.id];

  return (
    <div className="max-w-md mx-auto px-5 py-4 flex flex-col items-center gap-4 h-[calc(100svh-100px)] justify-center safe-pt">
      <div className="w-full flex justify-between items-center px-2">
        <button onClick={handleBack} className="text-slate-400 p-2 flex items-center gap-1 font-black text-sm">
          <ChevronLeft size={20} /> 返回
        </button>
        <div className="bg-purple-50 px-3 py-1 rounded-full text-purple-500 font-black text-[10px] tracking-widest">
          {currentIndex + 1} / {pack.words.length}
        </div>
      </div>

      <div className="w-full flex-1 bg-white rounded-[2rem] p-4 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col border-4 border-purple-50">
        <div className="flex-1 flex flex-col">
          {/* Image Area with Optimized Loading */}
          <div className="relative flex-1 aspect-square w-full rounded-[1.5rem] overflow-hidden bg-slate-50 group">
            {currentImageUrl ? (
              <img 
                key={currentWord.id}
                src={currentImageUrl} 
                alt={currentWord.en} 
                className="w-full h-full object-cover animate-in fade-in duration-700"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-purple-100 bg-gradient-to-br from-slate-50 to-purple-50">
                <div className="relative">
                  <Sparkles size={64} className={isImageLoading ? "animate-pulse text-purple-200" : "text-slate-200"} />
                  {isImageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="animate-spin text-purple-400" size={24} />
                    </div>
                  )}
                </div>
                {isImageLoading && (
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-purple-300 animate-pulse">
                    正在施展变色魔法...
                  </p>
                )}
              </div>
            )}
            
            <button 
              onClick={() => { playUISound('magic'); playAudio(); }}
              className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-4 shadow-xl text-purple-600 active:scale-90 transition-transform z-10 hover:bg-white"
            >
              <Volume2 size={32} />
            </button>
          </div>

          {/* Text Content - Now Always Visible */}
          <div className="py-6 text-center animate-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight">{currentWord.en}</h2>
            <p className="text-xl sm:text-2xl text-purple-400 font-bold mt-1">{currentWord.cn}</p>
          </div>
        </div>
      </div>

      <div className="w-full flex gap-3 px-2">
        <button 
          onClick={() => { playUISound('pop'); setCurrentIndex(prev => Math.max(0, prev - 1)); }}
          className="flex-1 py-4 bg-slate-100 rounded-[1.2rem] font-black text-slate-400 active:bg-slate-200 disabled:opacity-50"
          disabled={currentIndex === 0}
        >
          上一个
        </button>
        <button 
          onClick={handleNext}
          className="flex-[2] py-4 bg-purple-600 text-white rounded-[1.2rem] font-black text-lg hover:bg-purple-700 shadow-xl shadow-purple-100 flex items-center justify-center gap-2"
        >
          {currentIndex === pack.words.length - 1 ? '完成学习' : '我记住了'} <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default LearnView;
